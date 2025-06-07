from typing import Dict, List, Any, Optional, TypedDict
from dataclasses import dataclass
from datetime import datetime

class AgentState(TypedDict):
    """State shared across all agents in the workflow"""
    
    # Learner Information
    learner_id: str
    learner_profile: Optional[Dict[str, Any]]
    
    # Learning Path Data
    learning_path_id: Optional[str]
    current_resources: List[Dict[str, Any]]
    learning_objectives: List[str]
    
    # Content Generation
    topic: str
    subject: str
    difficulty_level: int
    learning_style: str
    weak_areas: List[str]
    
    # Generated Content
    generated_content: List[Dict[str, Any]]
    quiz_questions: List[Dict[str, Any]]
    visual_examples: List[Dict[str, Any]]
    youtube_videos: List[Dict[str, Any]]
    
    # Assessment Results
    pretest_results: Optional[Dict[str, Any]]
    quiz_results: List[Dict[str, Any]]
    progress_data: Dict[str, Any]
    
    # Agent Communication
    messages: List[Dict[str, str]]
    current_agent: str
    workflow_step: str
    
    # Error Handling
    errors: List[str]
    retry_count: int
    
    # Workflow Control
    should_continue: bool
    next_action: str
    
    # Metadata
    timestamp: datetime
    session_id: str

@dataclass
class LearningTask:
    """Represents a specific learning task"""
    task_id: str
    task_type: str  # 'content_generation', 'assessment', 'path_planning', etc.
    parameters: Dict[str, Any]
    priority: int
    status: str  # 'pending', 'in_progress', 'completed', 'failed'
    assigned_agent: Optional[str]
    result: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

@dataclass
class AgentMessage:
    """Message format for inter-agent communication"""
    sender: str
    receiver: str
    message_type: str
    content: Dict[str, Any]
    timestamp: datetime
    conversation_id: str