from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RegistrationCreate(BaseModel):
    name: str
    department: Optional[str] = None
    title_or_grade: Optional[str] = None
    phone: Optional[str] = None
    wechat: Optional[str] = None
    identity: Optional[str] = None
    sports_role: Optional[str] = None
    sports_specialty: Optional[str] = None
    experience_years: Optional[str] = None
    ai_tools: Optional[List[str]] = None
    ai_frequency: Optional[str] = None
    ai_confidence: Optional[str] = None
    ai_use_cases: Optional[List[str]] = None
    ai_biggest_problem: Optional[str] = None
    work_scenes: Optional[List[str]] = None
    biggest_pain: Optional[str] = None
    current_solution: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_track: Optional[str] = None
    scenario_choices: Optional[List[str]] = None
    primary_scenario: Optional[str] = None
    custom_scenario: Optional[str] = None
    want_to_build: Optional[str] = None
    goal_after_camp: Optional[str] = None
    has_project: Optional[str] = None
    project_description: Optional[str] = None
    showcase_willingness: Optional[str] = None
    followup_interest: Optional[str] = None
    decision_power: Optional[str] = None
    weekly_hours: Optional[str] = None
    bring_laptop: Optional[str] = None
    laptop_system: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    photography_consent: Optional[str] = None


class RegistrationOut(BaseModel):
    id: int
    submitted_at: Optional[datetime]
    name: str
    department: Optional[str]
    title_or_grade: Optional[str]
    phone: Optional[str]
    wechat: Optional[str]
    identity: Optional[str]
    sports_role: Optional[str]
    sports_specialty: Optional[str]
    experience_years: Optional[str]
    ai_tools: Optional[str]
    ai_frequency: Optional[str]
    ai_confidence: Optional[str]
    ai_use_cases: Optional[str]
    ai_biggest_problem: Optional[str]
    work_scenes: Optional[str]
    biggest_pain: Optional[str]
    current_solution: Optional[str]
    target_audience: Optional[str]
    preferred_track: Optional[str]
    scenario_choices: Optional[str]
    primary_scenario: Optional[str]
    custom_scenario: Optional[str]
    want_to_build: Optional[str]
    goal_after_camp: Optional[str]
    has_project: Optional[str]
    project_description: Optional[str]
    showcase_willingness: Optional[str]
    followup_interest: Optional[str]
    decision_power: Optional[str]
    weekly_hours: Optional[str]
    bring_laptop: Optional[str]
    laptop_system: Optional[str]
    dietary_restrictions: Optional[str]
    photography_consent: Optional[str]

    class Config:
        from_attributes = True


class PrecampCreate(BaseModel):
    name: str
    contact: Optional[str] = None
    department: Optional[str] = None
    identity: Optional[str] = None
    chosen_scenario: Optional[str] = None
    custom_scenario: Optional[str] = None
    target_users: Optional[str] = None
    must_have_features: Optional[str] = None
    desired_output: Optional[str] = None
    available_materials: Optional[str] = None
    bring_real_data: Optional[str] = None
    reference_links: Optional[str] = None
    group_preference: Optional[str] = None
    demo_willingness: Optional[str] = None
    biggest_blocker: Optional[str] = None
    questions_for_coaches: Optional[str] = None
    followup_interest: Optional[str] = None


class PrecampOut(BaseModel):
    id: int
    submitted_at: Optional[datetime]
    name: str
    contact: Optional[str]
    department: Optional[str]
    identity: Optional[str]
    chosen_scenario: Optional[str]
    custom_scenario: Optional[str]
    target_users: Optional[str]
    must_have_features: Optional[str]
    desired_output: Optional[str]
    available_materials: Optional[str]
    bring_real_data: Optional[str]
    reference_links: Optional[str]
    group_preference: Optional[str]
    demo_willingness: Optional[str]
    biggest_blocker: Optional[str]
    questions_for_coaches: Optional[str]
    followup_interest: Optional[str]

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    respondent_name: Optional[str] = None
    created_project_name: Optional[str] = None
    created_project_summary: Optional[str] = None
    created_project_link: Optional[str] = None
    biggest_takeaway: Optional[str] = None
    most_valuable: Optional[str] = None
    hardest_point: Optional[str] = None
    next_two_weeks_plan: Optional[str] = None
    need_support: Optional[str] = None
    paid_training_intent: Optional[str] = None
    project_collab: Optional[str] = None
    project_collab_desc: Optional[str] = None
    recommend_others: Optional[str] = None
    recommend_score: Optional[int] = None
    willing_case_interview: Optional[str] = None
    next_topic: Optional[str] = None
    overall_comments: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    submitted_at: Optional[datetime]
    respondent_name: Optional[str]
    created_project_name: Optional[str]
    created_project_summary: Optional[str]
    created_project_link: Optional[str]
    biggest_takeaway: Optional[str]
    most_valuable: Optional[str]
    hardest_point: Optional[str]
    next_two_weeks_plan: Optional[str]
    need_support: Optional[str]
    paid_training_intent: Optional[str]
    project_collab: Optional[str]
    project_collab_desc: Optional[str]
    recommend_others: Optional[str]
    recommend_score: Optional[int]
    willing_case_interview: Optional[str]
    next_topic: Optional[str]
    overall_comments: Optional[str]

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    registration_count: int
    precamp_count: int
    feedback_count: int
