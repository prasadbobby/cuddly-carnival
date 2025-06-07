from typing import Dict, Any
from .langgraph_workflow import LearningAgentWorkflow
from .models import LearnerProfile
from dataclasses import asdict
import uuid
from datetime import datetime

class LangGraphOrchestrator:
    """Main orchestrator using LangGraph workflow"""
    
    def __init__(self, gemini_api_key: str):
        self.workflow = LearningAgentWorkflow(gemini_api_key)
        print("✅ Initialized LangGraph-based Agent Orchestrator")
    
    def process_new_learner(self, profile_data: Dict, db) -> Dict[str, Any]:
        """Process new learner using LangGraph workflow"""
        
        try:
            print(f"🎯 Processing new learner with LangGraph: {profile_data.get('name')}")
            
            # Create learner profile
            profile = self._create_learner_profile(profile_data)
            
            # Save profile to database
            db.learner_profiles.insert_one(asdict(profile))
            print(f"✅ Created learner profile: {profile.id}")
            
            # Run the LangGraph workflow
            workflow_result = self.workflow.run_workflow_sync(asdict(profile))
            
            if workflow_result["success"]:
                # Save workflow results to database
                learning_package = workflow_result["learning_package"]
                progress_tracking = workflow_result["progress_tracking"]
                
                # Save learning path
                learning_path_doc = {
                    "id": learning_package["package_id"],
                    "learner_id": profile.id,
                    "resources": [content["id"] for content in learning_package["content_resources"]],
                    "current_position": 0,
                    "progress": {},
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "workflow_metadata": workflow_result["workflow_metadata"]
                }
                
                db.learning_paths.insert_one(learning_path_doc)
                
                # Save generated content
                for content in learning_package["content_resources"]:
                    content_doc = {
                        **content,
                        "learner_id": profile.id,
                        "status": "ready"
                    }
                    db.learning_resources.insert_one(content_doc)
                
                # Save quiz questions
                for question in learning_package["assessments"]["quiz_questions"]:
                    quiz_doc = {
                        "id": str(uuid.uuid4()),
                        "resource_id": question["resource_id"],
                        "questions": [question],  # Each quiz can have multiple questions
                        "created_at": datetime.utcnow(),
                        "status": "active"
                    }
                    db.quizzes.insert_one(quiz_doc)
                
                return {
                    "profile_id": profile.id,
                    "path_id": learning_package["package_id"],
                    "session_id": workflow_result["workflow_metadata"]["session_id"],
                    "total_resources": len(learning_package["content_resources"]),
                    "total_assessments": len(learning_package["assessments"]["quiz_questions"]),
                    "status": "completed",
                    "workflow_metadata": workflow_result["workflow_metadata"]
                }
            else:
                # Handle workflow failure
                return {
                    "profile_id": profile.id,
                    "status": "failed",
                    "errors": workflow_result.get("errors", []),
                    "partial_results": workflow_result.get("partial_results", {})
                }
                
        except Exception as e:
            print(f"❌ Error in LangGraph orchestrator: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_learner_profile(self, profile_data: Dict) -> LearnerProfile:
        """Create learner profile from input data"""
        
        # Handle knowledge level
        knowledge_level = profile_data.get('knowledge_level', 1)
        if isinstance(knowledge_level, str):
            try:
                knowledge_level = int(knowledge_level)
            except (ValueError, TypeError):
                knowledge_level = 1
        
        # Handle weak areas
        weak_areas = profile_data.get('weak_areas', [])
        if not isinstance(weak_areas, list):
            weak_areas = []
        
        # Handle custom subject
        subject = profile_data.get('subject', 'algebra')
        if profile_data.get('custom_subject'):
            subject = profile_data.get('custom_subject')
        
        return LearnerProfile(
            id=str(uuid.uuid4()),
            name=str(profile_data['name']),
            learning_style=str(profile_data['learning_style']),
            knowledge_level=knowledge_level,
            subject=subject,
            weak_areas=weak_areas,
            created_at=datetime.utcnow()
        )
    
    def get_workflow_status(self, session_id: str) -> Dict[str, Any]:
        """Get status of running workflow"""
        return self.workflow.get_workflow_status(session_id)
    
    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5):
        """Generate quiz questions using the assessment agent"""
        
        # This is a simplified version for backwards compatibility
        from .langgraph_agents.assessment_agent import AssessmentAgent
        
        agent = AssessmentAgent(self.workflow.gemini_api_key)
        
        # Create minimal content for question generation
        mock_content = {
            "title": topic,
            "key_concepts": [topic],
            "difficulty_level": difficulty,
            "learning_objectives": [f"Understand {topic}"],
            "summary": f"Learning content about {topic}"
        }
        
        # Create minimal state
        mock_state = {
            "learner_id": "temp",
            "learning_style": "visual"
        }
        
        questions = agent._generate_quiz_questions(mock_content, mock_state)
        
        # Convert to expected format
        from .models import QuizQuestion
        quiz_questions = []
        
        for q in questions[:count]:
            quiz_question = QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                topic=q["topic"],
                difficulty_level=q["difficulty_level"],
                resource_id=""
            )
            quiz_questions.append(quiz_question)
        
        return quiz_questions