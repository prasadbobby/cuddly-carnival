from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..graph_state import AgentState, AgentMessage
import json
import uuid
from datetime import datetime

class ProfileAnalysisAgent:
    """Agent responsible for analyzing learner profiles and determining learning needs"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.3
        )
        self.agent_name = "ProfileAnalysisAgent"
    
    def __call__(self, state: AgentState) -> AgentState:
        """Main entry point for the profile analysis agent"""
        print(f"🔍 {self.agent_name} analyzing learner profile...")
        
        try:
            # Extract learner information
            learner_profile = state.get("learner_profile", {})
            
            if not learner_profile:
                state["errors"].append("No learner profile provided")
                state["should_continue"] = False
                return state
            
            # Analyze learning style and preferences
            analysis_result = self._analyze_learning_profile(learner_profile)
            
            # Update state with analysis
            state["learning_objectives"] = analysis_result["learning_objectives"]
            state["difficulty_level"] = analysis_result["recommended_difficulty"]
            state["weak_areas"] = analysis_result["focus_areas"]
            
            # Add message for next agent
            message = AgentMessage(
                sender=self.agent_name,
                receiver="PathPlannerAgent",
                message_type="profile_analysis_complete",
                content=analysis_result,
                timestamp=datetime.utcnow(),
                conversation_id=state["session_id"]
            )
            
            state["messages"].append({
                "sender": message.sender,
                "receiver": message.receiver,
                "type": message.message_type,
                "content": message.content,
                "timestamp": message.timestamp.isoformat()
            })
            
            state["current_agent"] = "PathPlannerAgent"
            state["workflow_step"] = "path_planning"
            
            print(f"✅ {self.agent_name} completed profile analysis")
            return state
            
        except Exception as e:
            print(f"❌ {self.agent_name} error: {e}")
            state["errors"].append(f"Profile analysis failed: {str(e)}")
            state["retry_count"] += 1
            
            if state["retry_count"] < 3:
                state["should_continue"] = True
            else:
                state["should_continue"] = False
            
            return state
    
    def _analyze_learning_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze learner profile using LLM"""
        
        prompt = f"""
        Analyze this learner profile and provide detailed recommendations:
        
        Profile:
        - Name: {profile.get('name', 'Unknown')}
        - Learning Style: {profile.get('learning_style', 'Unknown')}
        - Subject: {profile.get('subject', 'Unknown')}
        - Knowledge Level: {profile.get('knowledge_level', 1)}/5
        - Weak Areas: {profile.get('weak_areas', [])}
        
        Provide analysis in this JSON format:
        {{
            "learning_objectives": ["objective1", "objective2", "objective3"],
            "recommended_difficulty": 1-5,
            "focus_areas": ["area1", "area2", "area3"],
            "learning_strategy": "detailed strategy description",
            "estimated_timeline": "timeline in weeks",
            "personalization_notes": "specific notes for this learner"
        }}
        
        Base your recommendations on:
        1. Learning style optimization
        2. Current knowledge level
        3. Identified weak areas
        4. Subject-specific requirements
        """
        
        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        try:
            # Extract JSON from response
            content = response.content
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_content = content[json_start:json_end]
                return json.loads(json_content)
            else:
                raise ValueError("No valid JSON found in response")
                
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            # Return fallback analysis
            return {
                "learning_objectives": [
                    f"Master fundamentals of {profile.get('subject', 'the subject')}",
                    f"Improve understanding in weak areas",
                    f"Build confidence through {profile.get('learning_style', 'adaptive')} learning"
                ],
                "recommended_difficulty": min(5, profile.get('knowledge_level', 1) + 1),
                "focus_areas": profile.get('weak_areas', [])[:3],
                "learning_strategy": f"Personalized {profile.get('learning_style', 'adaptive')} approach",
                "estimated_timeline": "4-6 weeks",
                "personalization_notes": "AI-generated personalized recommendations"
            }