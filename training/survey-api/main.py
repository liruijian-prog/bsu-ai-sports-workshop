import csv
import io
import json
import os
import sys
import base64
from datetime import datetime

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine, get_db
import models
import schemas


ADMIN_PASSWORD = os.environ.get("WORKSHOP_SURVEY_ADMIN_PASSWORD", "体育中外人文交流研究院")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "WORKSHOP_SURVEY_ALLOWED_ORIGINS",
        "https://liruijian.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3022,http://127.0.0.1:3022",
    ).split(",")
    if origin.strip()
]


def ensure_schema():
    Base.metadata.create_all(bind=engine)
    table_columns: dict[str, dict[str, str]] = {
        "registrations": {
            "sports_role": "TEXT",
            "sports_specialty": "TEXT",
            "experience_years": "TEXT",
            "ai_confidence": "TEXT",
            "work_scenes": "TEXT",
            "current_solution": "TEXT",
            "target_audience": "TEXT",
            "preferred_track": "TEXT",
            "scenario_choices": "TEXT",
            "primary_scenario": "TEXT",
            "custom_scenario": "TEXT",
            "want_to_build": "TEXT",
            "goal_after_camp": "TEXT",
            "showcase_willingness": "TEXT",
            "followup_interest": "TEXT",
            "decision_power": "TEXT",
            "laptop_system": "TEXT",
            "photography_consent": "TEXT",
        },
        "feedback": {
            "created_project_name": "TEXT",
            "created_project_summary": "TEXT",
            "created_project_link": "TEXT",
            "biggest_takeaway": "TEXT",
            "next_two_weeks_plan": "TEXT",
            "need_support": "TEXT",
            "willing_case_interview": "TEXT",
            "next_topic": "TEXT",
            "overall_comments": "TEXT",
        },
    }
    with engine.begin() as conn:
        for table_name, columns in table_columns.items():
            existing = {
                row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table_name})").fetchall()
            }
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    conn.exec_driver_sql(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                    )


ensure_schema()

app = FastAPI(title="体育+AI训练营 信息收集系统", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_basic_password(authorization: str | None) -> str | None:
    if not authorization or not authorization.lower().startswith("basic "):
        return None
    try:
        encoded = authorization.split(" ", 1)[1]
        decoded = base64.b64decode(encoded).decode("utf-8")
        _, password = decoded.split(":", 1)
        return password
    except Exception:
        return None


def check_admin(
    authorization: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
):
    password = extract_basic_password(authorization) or x_admin_password
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="密码错误")


def dump_json(value):
    return json.dumps(value or [], ensure_ascii=False)


def csv_response(filename: str, rows: list[list[object]], headers: list[str]):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)
    content = "\ufeff" + output.getvalue()
    return StreamingResponse(
        iter([content.encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}


@app.get("/api/stats", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    return {
        "registration_count": db.query(models.Registration).count(),
        "precamp_count": db.query(models.PrecampSubmission).count(),
        "feedback_count": db.query(models.Feedback).count(),
    }


@app.post("/api/register", response_model=schemas.RegistrationOut)
def create_registration(data: schemas.RegistrationCreate, db: Session = Depends(get_db)):
    reg = models.Registration(
        submitted_at=datetime.now(),
        name=data.name,
        department=data.department,
        title_or_grade=data.title_or_grade,
        phone=data.phone,
        wechat=data.wechat,
        identity=data.identity,
        sports_role=data.sports_role,
        sports_specialty=data.sports_specialty,
        experience_years=data.experience_years,
        ai_tools=dump_json(data.ai_tools),
        ai_frequency=data.ai_frequency,
        ai_confidence=data.ai_confidence,
        ai_use_cases=dump_json(data.ai_use_cases),
        ai_biggest_problem=data.ai_biggest_problem,
        work_scenes=dump_json(data.work_scenes),
        biggest_pain=data.biggest_pain,
        current_solution=data.current_solution,
        target_audience=data.target_audience,
        preferred_track=data.preferred_track,
        scenario_choices=dump_json(data.scenario_choices),
        primary_scenario=data.primary_scenario,
        custom_scenario=data.custom_scenario,
        want_to_build=data.want_to_build,
        goal_after_camp=data.goal_after_camp,
        has_project=data.has_project,
        project_description=data.project_description,
        showcase_willingness=data.showcase_willingness,
        followup_interest=data.followup_interest,
        decision_power=data.decision_power,
        weekly_hours=data.weekly_hours,
        bring_laptop=data.bring_laptop,
        laptop_system=data.laptop_system,
        dietary_restrictions=data.dietary_restrictions,
        photography_consent=data.photography_consent,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@app.get("/api/registrations", response_model=list[schemas.RegistrationOut])
def list_registrations(db: Session = Depends(get_db), _=Depends(check_admin)):
    return db.query(models.Registration).order_by(models.Registration.submitted_at.desc()).all()


@app.get("/api/registrations/export/csv")
def export_registrations_csv(db: Session = Depends(get_db), _=Depends(check_admin)):
    regs = db.query(models.Registration).order_by(models.Registration.submitted_at.asc()).all()
    headers = [
        "ID",
        "提交时间",
        "姓名",
        "院系/部门",
        "职称/年级",
        "手机",
        "微信",
        "身份",
        "角色方向",
        "专项/研究方向",
        "从业年限",
        "AI工具",
        "AI使用频率",
        "AI熟练度",
        "AI主要用途",
        "AI最大问题",
        "工作场景",
        "最大痛点",
        "当前做法",
        "服务对象",
        "首选赛道",
        "场景备选",
        "当天最想做",
        "自定义场景",
        "想做出的成果",
        "训练营目标",
        "是否有项目",
        "项目描述",
        "是否愿意展示",
        "后续意向",
        "推动权限",
        "每周可投入时间",
        "是否带电脑",
        "电脑系统",
        "饮食禁忌",
        "拍摄授权",
    ]
    rows = [
        [
            item.id,
            item.submitted_at,
            item.name,
            item.department,
            item.title_or_grade,
            item.phone,
            item.wechat,
            item.identity,
            item.sports_role,
            item.sports_specialty,
            item.experience_years,
            item.ai_tools,
            item.ai_frequency,
            item.ai_confidence,
            item.ai_use_cases,
            item.ai_biggest_problem,
            item.work_scenes,
            item.biggest_pain,
            item.current_solution,
            item.target_audience,
            item.preferred_track,
            item.scenario_choices,
            item.primary_scenario,
            item.custom_scenario,
            item.want_to_build,
            item.goal_after_camp,
            item.has_project,
            item.project_description,
            item.showcase_willingness,
            item.followup_interest,
            item.decision_power,
            item.weekly_hours,
            item.bring_laptop,
            item.laptop_system,
            item.dietary_restrictions,
            item.photography_consent,
        ]
        for item in regs
    ]
    return csv_response("registrations.csv", rows, headers)


@app.post("/api/precamp", response_model=schemas.PrecampOut)
def create_precamp(data: schemas.PrecampCreate, db: Session = Depends(get_db)):
    record = models.PrecampSubmission(
        submitted_at=datetime.now(),
        name=data.name,
        contact=data.contact,
        department=data.department,
        identity=data.identity,
        chosen_scenario=data.chosen_scenario,
        custom_scenario=data.custom_scenario,
        target_users=data.target_users,
        must_have_features=data.must_have_features,
        desired_output=data.desired_output,
        available_materials=data.available_materials,
        bring_real_data=data.bring_real_data,
        reference_links=data.reference_links,
        group_preference=data.group_preference,
        demo_willingness=data.demo_willingness,
        biggest_blocker=data.biggest_blocker,
        questions_for_coaches=data.questions_for_coaches,
        followup_interest=data.followup_interest,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/precamp", response_model=list[schemas.PrecampOut])
def list_precamp(db: Session = Depends(get_db), _=Depends(check_admin)):
    return db.query(models.PrecampSubmission).order_by(models.PrecampSubmission.submitted_at.desc()).all()


@app.get("/api/precamp/export/csv")
def export_precamp_csv(db: Session = Depends(get_db), _=Depends(check_admin)):
    items = db.query(models.PrecampSubmission).order_by(models.PrecampSubmission.submitted_at.asc()).all()
    headers = [
        "ID",
        "提交时间",
        "姓名",
        "联系方式",
        "院系/部门",
        "身份",
        "选择场景",
        "自定义场景",
        "目标用户",
        "必须功能",
        "期待输出",
        "可携带材料",
        "是否带真实数据",
        "参考资料链接",
        "组队偏好",
        "是否愿意展示",
        "最大卡点",
        "希望教练帮助",
        "后续跟进意向",
    ]
    rows = [
        [
            item.id,
            item.submitted_at,
            item.name,
            item.contact,
            item.department,
            item.identity,
            item.chosen_scenario,
            item.custom_scenario,
            item.target_users,
            item.must_have_features,
            item.desired_output,
            item.available_materials,
            item.bring_real_data,
            item.reference_links,
            item.group_preference,
            item.demo_willingness,
            item.biggest_blocker,
            item.questions_for_coaches,
            item.followup_interest,
        ]
        for item in items
    ]
    return csv_response("precamp.csv", rows, headers)


@app.post("/api/feedback", response_model=schemas.FeedbackOut)
def create_feedback(data: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    feedback = models.Feedback(
        submitted_at=datetime.now(),
        respondent_name=data.respondent_name,
        created_project_name=data.created_project_name,
        created_project_summary=data.created_project_summary,
        created_project_link=data.created_project_link,
        biggest_takeaway=data.biggest_takeaway,
        most_valuable=data.most_valuable,
        hardest_point=data.hardest_point,
        next_two_weeks_plan=data.next_two_weeks_plan,
        need_support=data.need_support,
        paid_training_intent=data.paid_training_intent,
        project_collab=data.project_collab,
        project_collab_desc=data.project_collab_desc,
        recommend_others=data.recommend_others,
        recommend_score=data.recommend_score,
        willing_case_interview=data.willing_case_interview,
        next_topic=data.next_topic,
        overall_comments=data.overall_comments,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@app.get("/api/feedback", response_model=list[schemas.FeedbackOut])
def list_feedback(db: Session = Depends(get_db), _=Depends(check_admin)):
    return db.query(models.Feedback).order_by(models.Feedback.submitted_at.desc()).all()


@app.get("/api/feedback/export/csv")
def export_feedback_csv(db: Session = Depends(get_db), _=Depends(check_admin)):
    items = db.query(models.Feedback).order_by(models.Feedback.submitted_at.asc()).all()
    headers = [
        "ID",
        "提交时间",
        "姓名",
        "作品名称",
        "作品摘要",
        "作品链接",
        "最大收获",
        "最有价值",
        "最难理解",
        "未来两周计划",
        "需要支持",
        "付费培训意向",
        "项目合作意向",
        "项目合作描述",
        "是否愿意推荐",
        "推荐评分",
        "是否愿意案例访谈",
        "下次想学什么",
        "其他意见",
    ]
    rows = [
        [
            item.id,
            item.submitted_at,
            item.respondent_name,
            item.created_project_name,
            item.created_project_summary,
            item.created_project_link,
            item.biggest_takeaway,
            item.most_valuable,
            item.hardest_point,
            item.next_two_weeks_plan,
            item.need_support,
            item.paid_training_intent,
            item.project_collab,
            item.project_collab_desc,
            item.recommend_others,
            item.recommend_score,
            item.willing_case_interview,
            item.next_topic,
            item.overall_comments,
        ]
        for item in items
    ]
    return csv_response("feedback.csv", rows, headers)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8022, reload=True)
