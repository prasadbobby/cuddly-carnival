from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .graph_state import AgentState
from .langgraph_agents.profile_agent import ProfileAnalysisAgent
from .langgraph_agents.path_planner import PathPlannerAgent
from .langgraph_agents.content_generator import ContentGeneratorAgent
from .langgraph_agents.assessment_agent import AssessmentAgent
from .langgraph_agents.orchestrator_agent import OrchestratorAgent
from datetime import datetime
import uuid

class LearningAgentWorkflow:
    """LangGraph-based multi-agent workflow for personalized learning"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        
        # Initialize agents
        self.profile_agent = ProfileAnalysisAgent(gemini_api_key)
        self.path_planner = PathPlannerAgent(gemini_api_key)
        self.content_generator = ContentGeneratorAgent(gemini_api_key)
        self.assessment_agent = AssessmentAgent(gemini_api_key)
        self.orchestrator = OrchestratorAgent(gemini_api_key)
        
        # Create workflow graph
        self.workflow = self._create_workflow()
        
        # Add memory for conversation persistence
        self.memory = MemorySaver()
    
    def _create_workflow(self) -> StateGraph:
        """Create the LangGraph workflow"""
        
        # Define the workflow graph
        workflow = StateGraph(AgentState)
        
        # Add agent nodes
        workflow.add_node("profile_analysis", self.profile_agent)
        workflow.add_node("path_planning", self.path_planner)
        workflow.add_node("content_generation", self.content_generator)
        workflow.add_node("assessment_generation", self.assessment_agent)
        workflow.add_node("orchestration", self.orchestrator)
        
        # Define workflow edges
        workflow.add_edge("profile_analysis", "path_planning")
        workflow.add_edge("path_planning", "content_generation")
        workflow.add_edge("content_generation", "assessment_generation")
        workflow.add_edge("assessment_generation", "orchestration")
        workflow.add_edge("orchestration", END)
        
        # Set entry point
        workflow.set_entry_point("profile_analysis")
        
        # Add conditional edges for error handling and retries
        workflow.add_conditional_edges(
            "profile_analysis",
            self._should_continue_from_profile,
            {
                "continue": "path_planning",
                "retry": "profile_analysis",
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "path_planning",
            self._should_continue_from_path,
            {
                "continue": "content_generation",
                "retry": "path_planning",
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "content_generation",
            self._should_continue_from_content,
            {
                "continue": "assessment_generation",
                "retry": "content_generation",
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "assessment_generation",
            self._should_continue_from_assessment,
            {
                "continue": "orchestration",
                "retry": "assessment_generation",
                "end": END
            }
        )
        
        return workflow.compile(checkpointer=self.memory)
    
    def _should_continue_from_profile(self, state: AgentState) -> Literal["continue", "retry", "end"]:
        """Determine next step after profile analysis"""
        
        if state.get("errors") and state.get("retry_count", 0) < 3:
            return "retry"
        elif state.get("errors"):
            return "end"
        elif state.get("learning_objectives"):
            return "continue"
        else:
            return "retry"
    
    def _should_continue_from_path(self, state: AgentState) -> Literal["continue", "retry", "end"]:
        """Determine next step after path planning"""
        
        if state.get("errors") and state.get("retry_count", 0) < 3:
            return "retry"
        elif state.get("errors"):
            return "end"
        elif state.get("current_resources"):
            return "continue"
        else:
            return "retry"
    
    def _should_continue_from_content(self, state: AgentState) -> Literal["continue", "retry", "end"]:
        """Determine next step after content generation"""
        
        if state.get("errors") and state.get("retry_count", 0) < 3:
            return "retry"
        elif state.get("errors"):
            return "end"
        elif state.get("generated_content"):
            return "continue"
        else:
            return "retry"
    
    def _should_continue_from_assessment(self, state: AgentState) -> Literal["continue", "retry", "end"]:
        """Determine next step after assessment generation"""
        
        if state.get("errors") and state.get("retry_count", 0) < 3:
            return "retry"
        elif state.get("errors"):
            return "end"
        elif state.get("quiz_questions"):
            return "continue"
        else:
            return "retry"
    
    async def run_workflow(self, learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Run the complete learning workflow"""
        
        print(f"🚀 Starting LangGraph workflow for learner: {learner_profile.get('name')}")
        
        # Initialize state
        initial_state = self._create_initial_state(learner_profile)
        
        # Create thread configuration
        thread_config = {
            "configurable": {
                "thread_id": initial_state["session_id"]
            }
        }
        
        try:
            # Run the workflow
            final_state = await self.workflow.ainvoke(initial_state, config=thread_config)
            
            # Extract results
            return self._extract_workflow_results(final_state)
            
        except Exception as e:
            print(f"❌ Workflow execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "partial_results": initial_state
            }
    
    def run_workflow_sync(self, learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Run the workflow synchronously"""
        
        print(f"🚀 Starting LangGraph workflow for learner: {learner_profile.get('name')}")
        
        # Initialize state
        initial_state = self._create_initial_state(learner_profile)
        
        # Create thread configuration
        thread_config = {
            "configurable": {
                "thread_id": initial_state["session_id"]
            }
        }
        
        try:
            # Run the workflow synchronously
            final_state = self.workflow.invoke(initial_state, config=thread_config)
            
            # Extract results
            return self._extract_workflow_results(final_state)
            
        except Exception as e:
            print(f"❌ Workflow execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "partial_results": initial_state
            }
    
    def _create_initial_state(self, learner_profile: Dict[str, Any]) -> AgentState:
        """Create initial state for the workflow"""
        
        session_id = str(uuid.uuid4())
        
        return AgentState(
            learner_id=learner_profile.get("id", str(uuid.uuid4())),
            learner_profile=learner_profile,
            learning_path_id=None,
            current_resources=[],
            learning_objectives=[],
            topic=learner_profile.get("subject", "general"),
            subject=learner_profile.get("subject", "general"),
            difficulty_level=learner_profile.get("knowledge_level", 1),
            learning_style=learner_profile.get("learning_style", "visual"),
            weak_areas=learner_profile.get("weak_areas", []),
            generated_content=[],
            quiz_questions=[],
            visual_examples=[],
            youtube_videos=[],
            pretest_results=None,
            quiz_results=[],
            progress_data={},
            messages=[],
            current_agent="ProfileAnalysisAgent",
            workflow_step="profile_analysis",
            errors=[],
            retry_count=0,
            should_continue=True,
            next_action="start_workflow",
            timestamp=datetime.utcnow(),
            session_id=session_id
        )
    
    def _extract_workflow_results(self, final_state: AgentState) -> Dict[str, Any]:
        """Extract and format workflow results"""
        
        if final_state.get("errors"):
            return {
                "success": False,
                "errors": final_state["errors"],
                "partial_results": {
                    "generated_content": final_state.get("generated_content", []),
                    "quiz_questions": final_state.get("quiz_questions", []),
                    "learning_objectives": final_state.get("learning_objectives", [])
                }
            }
        
        return {
            "success": True,
            "learning_package": final_state.get("learning_package", {}),
            "progress_tracking": final_state.get("progress_tracking", {}),
            "workflow_metadata": {
                "session_id": final_state["session_id"],
                "total_messages": len(final_state.get("messages", [])),
                "agents_involved": len(set(msg.get("sender") for msg in final_state.get("messages", []))),
                "completion_time": final_state["timestamp"].isoformat(),
                "workflow_step": final_state.get("workflow_step")
            }
        }

    def get_workflow_status(self, session_id: str) -> Dict[str, Any]:
        """Get current status of a workflow"""
        
        thread_config = {
            "configurable": {
                "thread_id": session_id
            }
        }
        
        try:
            # Get current state from memory
            current_state = self.workflow.get_state(config=thread_config)
            
            return {
                "session_id": session_id,
                "current_step": current_state.values.get("workflow_step", "unknown"),
                "current_agent": current_state.values.get("current_agent", "unknown"),
                "progress_percentage": self._calculate_progress_percentage(current_state.values),
                "errors": current_state.values.get("errors", []),
                "should_continue": current_state.values.get("should_continue", False)
            }
            
        except Exception as e:
            return {
                "session_id": session_id,
                "error": str(e),
                "status": "error"
            }
    
    def _calculate_progress_percentage(self, state: AgentState) -> int:
        """Calculate workflow progress percentage"""
        
        steps = {
            "profile_analysis": 20,
            "path_planning": 40,
            "content_generation": 70,
            "assessment_generation": 90,
            "orchestration_complete": 100
        }
        
        current_step = state.get("workflow_step", "profile_analysis")
        return steps.get(current_step, 0)