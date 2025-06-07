from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..graph_state import AgentState, AgentMessage, LearningTask
import json
import uuid
from datetime import datetime

class PathPlannerAgent:
    """Agent responsible for creating personalized learning paths"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.4
        )
        self.agent_name = "PathPlannerAgent"
    
    def __call__(self, state: AgentState) -> AgentState:
        """Create a personalized learning path"""
        print(f"🛤️ {self.agent_name} creating learning path...")
        
        try:
            # Get profile analysis results
            profile_message = self._get_latest_message(state, "profile_analysis_complete")
            
            if not profile_message:
                state["errors"].append("No profile analysis found")
                state["should_continue"] = False
                return state
            
            # Create learning path
            learning_path = self._create_learning_path(state, profile_message["content"])
            
            # Generate learning tasks
            learning_tasks = self._generate_learning_tasks(learning_path, state)
            
            # Update state
            state["current_resources"] = learning_path["resources"]
            state["learning_path_id"] = str(uuid.uuid4())
            
            # Create tasks for content generation
            for task in learning_tasks:
                state["messages"].append({
                    "sender": self.agent_name,
                    "receiver": "ContentGeneratorAgent",
                    "type": "content_generation_task",
                    "content": task,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            state["current_agent"] = "ContentGeneratorAgent"
            state["workflow_step"] = "content_generation"
            
            print(f"✅ {self.agent_name} created learning path with {len(learning_tasks)} tasks")
            return state
            
        except Exception as e:
            print(f"❌ {self.agent_name} error: {e}")
            state["errors"].append(f"Path planning failed: {str(e)}")
            state["retry_count"] += 1
            return state
    
    def _create_learning_path(self, state: AgentState, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Create a structured learning path using LLM"""
        
        learner_profile = state["learner_profile"]
        
        prompt = f"""
        Create a comprehensive learning path based on this analysis:
        
        Learner Profile:
        - Subject: {learner_profile.get('subject')}
        - Learning Style: {learner_profile.get('learning_style')}
        - Knowledge Level: {learner_profile.get('knowledge_level')}/5
        - Weak Areas: {learner_profile.get('weak_areas')}
        
        Analysis Results:
        - Learning Objectives: {analysis.get('learning_objectives', [])}
        - Focus Areas: {analysis.get('focus_areas', [])}
        - Recommended Difficulty: {analysis.get('recommended_difficulty')}
        - Learning Strategy: {analysis.get('learning_strategy')}
        
        Create a learning path with 5-7 progressive learning resources in this JSON format:
        {{
            "path_name": "descriptive name",
            "total_duration": "estimated weeks",
            "resources": [
                {{
                    "id": "unique_id",
                    "title": "resource title",
                    "type": "lesson|tutorial|practice|assessment",
                    "topic": "specific topic",
                    "difficulty": 1-5,
                    "duration_minutes": 15-45,
                    "learning_objectives": ["obj1", "obj2"],
                    "prerequisites": ["prereq1"],
                    "description": "detailed description"
                }}
            ],
            "milestones": [
                {{
                    "milestone": "milestone name",
                    "after_resource": "resource_id",
                    "assessment_type": "quiz|project|discussion"
                }}
            ]
        }}
        
        Ensure:
        1. Progressive difficulty increase
        2. Learning style optimization
        3. Focus on weak areas
        4. Balanced content types
        5. Regular assessment points
        """
        
        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        try:
            content = response.content
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_content = content[json_start:json_end]
                return json.loads(json_content)
                
        except Exception as e:
            print(f"Error parsing learning path: {e}")
            
        # Fallback path generation
        return self._generate_fallback_path(state)
    
    def _generate_fallback_path(self, state: AgentState) -> Dict[str, Any]:
        """Generate a basic learning path when LLM fails"""
        
        subject = state["subject"]
        learning_style = state["learning_style"]
        difficulty = state["difficulty_level"]
        
        return {
            "path_name": f"Personalized {subject} Learning Path",
            "total_duration": "4-6 weeks",
            "resources": [
                {
                    "id": str(uuid.uuid4()),
                    "title": f"Introduction to {subject}",
                    "type": "lesson",
                    "topic": f"{subject} fundamentals",
                    "difficulty": max(1, difficulty - 1),
                    "duration_minutes": 20,
                    "learning_objectives": [f"Understand basic {subject} concepts"],
                    "prerequisites": [],
                    "description": f"Foundational concepts in {subject}"
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": f"Core {subject} Concepts",
                    "type": "tutorial",
                    "topic": f"{subject} core principles",
                    "difficulty": difficulty,
                    "duration_minutes": 30,
                    "learning_objectives": [f"Apply {subject} principles"],
                    "prerequisites": [],
                    "description": f"Deep dive into {subject} principles"
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": f"Practical {subject} Applications",
                    "type": "practice",
                    "topic": f"{subject} applications",
                    "difficulty": min(5, difficulty + 1),
                    "duration_minutes": 35,
                    "learning_objectives": [f"Practice {subject} skills"],
                    "prerequisites": [],
                    "description": f"Hands-on practice with {subject}"
                }
            ],
            "milestones": [
                {
                    "milestone": "Foundation Complete",
                    "after_resource": "resource_1",
                    "assessment_type": "quiz"
                }
            ]
        }
    
    def _generate_learning_tasks(self, learning_path: Dict[str, Any], state: AgentState) -> List[Dict[str, Any]]:
        """Generate specific tasks for content generation agents"""
        
        tasks = []
        
        for resource in learning_path["resources"]:
            task = {
                "task_id": str(uuid.uuid4()),
                "resource_id": resource["id"],
                "task_type": "content_generation",
                "content_type": resource["type"],
                "topic": resource["topic"],
                "title": resource["title"],
                "difficulty": resource["difficulty"],
                "learning_style": state["learning_style"],
                "duration": resource["duration_minutes"],
                "objectives": resource["learning_objectives"],
                "description": resource["description"],
                "priority": 1,
                "status": "pending"
            }
            tasks.append(task)
            
        return tasks
    
    def _get_latest_message(self, state: AgentState, message_type: str) -> Dict[str, Any]:
        """Get the latest message of a specific type"""
        
        for message in reversed(state["messages"]):
            if message.get("type") == message_type:
                return message
        return None