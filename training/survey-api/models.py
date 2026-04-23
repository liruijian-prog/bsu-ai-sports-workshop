from sqlalchemy import Column, DateTime, Integer, Text
from sqlalchemy.sql import func

from database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submitted_at = Column(DateTime, default=func.now())

    name = Column(Text, nullable=False)
    department = Column(Text)
    title_or_grade = Column(Text)
    phone = Column(Text)
    wechat = Column(Text)
    identity = Column(Text)
    sports_role = Column(Text)
    sports_specialty = Column(Text)
    experience_years = Column(Text)

    ai_tools = Column(Text)
    ai_frequency = Column(Text)
    ai_confidence = Column(Text)
    ai_use_cases = Column(Text)
    ai_biggest_problem = Column(Text)

    work_scenes = Column(Text)
    biggest_pain = Column(Text)
    current_solution = Column(Text)
    target_audience = Column(Text)
    preferred_track = Column(Text)
    scenario_choices = Column(Text)
    primary_scenario = Column(Text)
    custom_scenario = Column(Text)
    want_to_build = Column(Text)

    goal_after_camp = Column(Text)
    has_project = Column(Text)
    project_description = Column(Text)
    showcase_willingness = Column(Text)
    followup_interest = Column(Text)
    decision_power = Column(Text)
    weekly_hours = Column(Text)

    bring_laptop = Column(Text)
    laptop_system = Column(Text)
    dietary_restrictions = Column(Text)
    photography_consent = Column(Text)


class PrecampSubmission(Base):
    __tablename__ = "precamp_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submitted_at = Column(DateTime, default=func.now())

    name = Column(Text, nullable=False)
    contact = Column(Text)
    department = Column(Text)
    identity = Column(Text)
    chosen_scenario = Column(Text)
    custom_scenario = Column(Text)
    target_users = Column(Text)
    must_have_features = Column(Text)
    desired_output = Column(Text)
    available_materials = Column(Text)
    bring_real_data = Column(Text)
    reference_links = Column(Text)
    group_preference = Column(Text)
    demo_willingness = Column(Text)
    biggest_blocker = Column(Text)
    questions_for_coaches = Column(Text)
    followup_interest = Column(Text)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submitted_at = Column(DateTime, default=func.now())

    respondent_name = Column(Text)
    created_project_name = Column(Text)
    created_project_summary = Column(Text)
    created_project_link = Column(Text)
    biggest_takeaway = Column(Text)
    most_valuable = Column(Text)
    hardest_point = Column(Text)
    next_two_weeks_plan = Column(Text)
    need_support = Column(Text)
    paid_training_intent = Column(Text)
    project_collab = Column(Text)
    project_collab_desc = Column(Text)
    recommend_others = Column(Text)
    recommend_score = Column(Integer)
    willing_case_interview = Column(Text)
    next_topic = Column(Text)
    overall_comments = Column(Text)
