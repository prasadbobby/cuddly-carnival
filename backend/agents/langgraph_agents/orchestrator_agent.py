from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..graph_state import AgentState
import json
from datetime import datetime

class OrchestratorAgent:
    """Main orchestrator agent that coordinates the entire workflow"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.2
        )
        self.agent_name = "OrchestratorAgent"
    
    def __call__(self, state: AgentState) -> AgentState:
        """Orchestrate the final workflow completion"""
        print(f"🎯 {self.agent_name} orchestrating workflow completion...")
        
        try:
            # Validate workflow completion
            validation_result = self._validate_workflow_completion(state)
            
            if not validation_result["is_complete"]:
                return self._handle_incomplete_workflow(state, validation_result)
            
            # Generate final learning package
            learning_package = self._create_learning_package(state)
            
            # Create progress tracking setup
            progress_setup = self._setup_progress_tracking(state)
            
            # Update state with final results
            state["learning_package"] = learning_package
            state["progress_tracking"] = progress_setup
            state["workflow_status"] = "completed"
            state["should_continue"] = False
            state["next_action"] = "deliver_to_learner"
            
            # Final success message
            state["messages"].append({
                "sender": self.agent_name,
                "receiver": "System",
                "type": "workflow_complete",
                "content": {
                    "learning_package": learning_package,
                    "completion_time": datetime.utcnow().isoformat(),
                    "total_resources": len(state.get("generated_content", [])),
                    "total_assessments": len(state.get("quiz_questions", []))
                },
                "timestamp": datetime.utcnow().isoformat()
            })
            
            print(f"✅ {self.agent_name} completed workflow orchestration")
            return state
            
        except Exception as e:
            print(f"❌ {self.agent_name} error: {e}")
            state["errors"].append(f"Orchestration failed: {str(e)}")
            return state
    
    def _validate_workflow_completion(self, state: AgentState) -> Dict[str, Any]:
        """Validate that all required workflow steps are complete"""
        
        required_components = {
            "learner_profile": state.get("learner_profile") is not None,
            "learning_objectives": len(state.get("learning_objectives", [])) > 0,
            "generated_content": len(state.get("generated_content", [])) > 0,
            "quiz_questions": len(state.get("quiz_questions", [])) > 0,
            "learning_path_id": state.get("learning_path_id") is not None
        }
        
        missing_components = [comp for comp, exists in required_components.items() if not exists]
        
        return {
            "is_complete": len(missing_components) == 0,
            "missing_components": missing_components,
            "completion_percentage": (len(required_components) - len(missing_components)) / len(required_components) * 100
        }
    
    def _handle_incomplete_workflow(self, state: AgentState, validation: Dict[str, Any]) -> AgentState:
        """Handle cases where workflow is incomplete"""
        
        missing = validation["missing_components"]
        
        state["errors"].append(f"Workflow incomplete. Missing: {', '.join(missing)}")
        
        # Determine next action based on what's missing
        if "learner_profile" in missing:
            state["next_action"] = "restart_profile_analysis"
            state["current_agent"] = "ProfileAnalysisAgent"
        elif "generated_content" in missing:
            state["next_action"] = "restart_content_generation"
            state["current_agent"] = "ContentGeneratorAgent"
        elif "quiz_questions" in missing:
            state["next_action"] = "restart_assessment_generation"
            state["current_agent"] = "AssessmentAgent"
        else:
            state["should_continue"] = False
            state["next_action"] = "manual_intervention_required"
        
        return state
    
    def _create_learning_package(self, state: AgentState) -> Dict[str, Any]:
        """Create the final learning package for delivery"""
        
        return {
            "package_id": state["learning_path_id"],
            "learner_id": state["learner_id"],
            "created_at": datetime.utcnow().isoformat(),
            "learning_profile": state["learner_profile"],
            "learning_objectives": state["learning_objectives"],
            "content_resources": state["generated_content"],
            "assessments": {
                "quiz_questions": state["quiz_questions"],
                "assessment_strategy": state["progress_data"].get("assessment_strategy", {})
            },
            "multimedia_enhancements": {
                "visual_examples": state.get("visual_examples", []),
                "youtube_videos": state.get("youtube_videos", [])
            },
            "personalization": {
                "learning_style": state["learning_style"],
                "difficulty_level": state["difficulty_level"],
                "weak_areas": state["weak_areas"]
            },
            "workflow_metadata": {
                "agents_involved": self._extract_agents_involved(state),
                "total_processing_time": self._calculate_processing_time(state),
                "message_count": len(state["messages"]),
                "error_count": len(state["errors"])
            }
        }
    
    def _setup_progress_tracking(self, state: AgentState) -> Dict[str, Any]:
        """Setup progress tracking configuration"""
        
        return {
            "tracking_id": f"progress_{state['learner_id']}",
            "milestones": [
                {
                    "milestone_id": f"resource_{i}",
                    "resource_id": content["id"],
                    "title": content["title"],
                    "required_score": 70,
                    "attempts_allowed": 3
                }
                for i, content in enumerate(state["generated_content"])
            ],
            "adaptive_settings": {
                "difficulty_adjustment": True,
                "content_recommendation": True,
                "weak_area_focus": True
            },
            "reporting": {
                "real_time_progress": True,
                "detailed_analytics": True,
                "learning_insights": True
            }
        }
    
    def _extract_agents_involved(self, state: AgentState) -> List[str]:
        """Extract list of agents that participated in the workflow"""
        
        agents = set()
        for message in state["messages"]:
            agents.add(message.get("sender", "Unknown"))
        
        return list(agents)
    
    def _calculate_processing_time(self, state: AgentState) -> str:
        """Calculate total processing time"""
        
        if state["messages"]:
            start_time = datetime.fromisoformat(state["messages"][0]["timestamp"])
            end_time = datetime.utcnow()
            duration = end_time - start_time
            return str(duration.total_seconds())
        
        return "0"