# agents/models.py
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any

@dataclass
class LearnerProfile:
    id: str
    name: str
    learning_style: str
    knowledge_level: int
    subject: str
    weak_areas: List[str]
    created_at: datetime

@dataclass
class LearningResource:
    id: str
    title: str
    type: str
    content_url: str
    difficulty_level: int
    learning_style: str
    topic: str
    prerequisites: List[str]

@dataclass
class LearningPath:
    id: str
    learner_id: str
    resources: List[str]
    current_position: int
    progress: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

@dataclass
class QuizQuestion:
    id: str
    question: str
    options: List[str]
    correct_answer: str
    topic: str
    difficulty_level: int
    resource_id: str

@dataclass
class LearningContent:
    id: str
    title: str
    type: str  # 'lesson', 'video_script', 'interactive', 'practice'
    content: str  # Generated content
    summary: str
    difficulty_level: int
    learning_style: str
    topic: str
    estimated_duration: int  # in minutes
    prerequisites: List[str]
    learning_objectives: List[str]
    youtube_videos: List[Dict[str, str]] = field(default_factory=list)  # YouTube videos for visual learners