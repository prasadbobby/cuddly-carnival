from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..graph_state import AgentState
import json
import uuid
from datetime import datetime

class AssessmentAgent:
    """Agent responsible for generating assessments and evaluating learning"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.5
        )
        self.agent_name = "AssessmentAgent"
    
    def __call__(self, state: AgentState) -> AgentState:
        """Generate assessments for the learning content"""
        print(f"📊 {self.agent_name} generating assessments...")
        
        try:
            generated_content = state.get("generated_content", [])
            
            if not generated_content:
                state["errors"].append("No content available for assessment generation")
                return state
            
            quiz_questions = []
            
            # Generate quiz questions for each piece of content
            for content in generated_content:
                questions = self._generate_quiz_questions(content, state)
                quiz_questions.extend(questions)
            
            # Generate overall assessment strategy
            assessment_strategy = self._create_assessment_strategy(state)
            
            # Update state
            state["quiz_questions"] = quiz_questions
            state["progress_data"]["assessment_strategy"] = assessment_strategy
            
            # Message orchestrator about completion
            state["messages"].append({
                "sender": self.agent_name,
                "receiver": "OrchestratorAgent",
                "type": "assessment_generation_complete",
                "content": {
                    "quiz_questions_count": len(quiz_questions),
                    "assessment_strategy": assessment_strategy
                },
                "timestamp": datetime.utcnow().isoformat()
            })
            
            state["current_agent"] = "OrchestratorAgent"
            state["workflow_step"] = "orchestration_complete"
            state["should_continue"] = True
            
            print(f"✅ {self.agent_name} generated {len(quiz_questions)} quiz questions")
            return state
            
        except Exception as e:
            print(f"❌ {self.agent_name} error: {e}")
            state["errors"].append(f"Assessment generation failed: {str(e)}")
            return state
    
    def _generate_quiz_questions(self, content: Dict[str, Any], state: AgentState) -> List[Dict[str, Any]]:
        """Generate quiz questions for specific content"""
        
        prompt = f"""
        Create 3-5 quiz questions based on this learning content:
        
        Content:
        - Title: {content.get('title')}
        - Topic: {content.get('key_concepts', [])}
        - Difficulty: {content.get('difficulty_level')}/5
        - Learning Objectives: {content.get('learning_objectives', [])}
        
        Content Summary: {content.get('summary', '')}
        
        Generate questions in this JSON format:
        [
            {{
                "id": "unique_id",
                "question": "clear, specific question",
                "options": ["correct answer", "wrong option 1", "wrong option 2", "wrong option 3"],
                "correct_answer": "correct answer",
                "explanation": "why this answer is correct",
                "topic": "{content.get('title')}",
                "difficulty_level": {content.get('difficulty_level', 1)},
                "learning_objective": "which objective this tests",
                "question_type": "knowledge|comprehension|application|analysis"
            }}
        ]
        
        Requirements:
        1. Test understanding of key concepts
        2. Match the difficulty level
        3. Include a mix of question types
        4. Clear, unambiguous questions
        5. Plausible but incorrect distractors
        6. Cover different cognitive levels
        7. Align with learning objectives
        
        Create questions that genuinely test understanding of {content.get('title')}.
        """
        
        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        try:
            content_text = response.content
            json_start = content_text.find('[')
            json_end = content_text.rfind(']') + 1
            
            if json_start != -1 and json_end != -1:
                json_content = content_text[json_start:json_end]
                questions = json.loads(json_content)
                
                # Add metadata to each question
                for question in questions:
                    question["id"] = str(uuid.uuid4())
                    question["resource_id"] = content.get("id")
                    question["created_at"] = datetime.utcnow().isoformat()
                    question["learner_id"] = state["learner_id"]
                
                return questions
                
        except Exception as e:
            print(f"Error parsing quiz questions: {e}")
            
        # Fallback question generation
        return self._generate_fallback_questions(content, state)
    
    def _create_assessment_strategy(self, state: AgentState) -> Dict[str, Any]:
        """Create overall assessment strategy"""
        
        learner_profile = state["learner_profile"]
        
        return {
            "strategy_type": "adaptive_assessment",
            "frequency": "after_each_resource",
            "question_count_per_quiz": 3,
            "passing_score": 70,
            "retake_policy": "unlimited_with_feedback",
            "feedback_type": "immediate_with_explanation",
            "progress_tracking": {
                "track_time_spent": True,
                "track_attempts": True,
                "track_improvement": True
            },
            "personalization": {
                "learning_style": learner_profile.get("learning_style"),
                "difficulty_adaptation": True,
                "weak_area_focus": True
            }
        }
    
    def _generate_fallback_questions(self, content: Dict[str, Any], state: AgentState) -> List[Dict[str, Any]]:
        """Generate basic questions when LLM fails"""
        
        return [
            {
                "id": str(uuid.uuid4()),
                "question": f"What is the main concept covered in {content.get('title', 'this lesson')}?",
                "options": [
                    content.get('title', 'Main concept'),
                    "Unrelated concept 1",
                    "Unrelated concept 2", 
                    "Unrelated concept 3"
                ],
                "correct_answer": content.get('title', 'Main concept'),
                "explanation": f"This lesson focuses on {content.get('title', 'the main concept')}",
                "topic": content.get('title', 'General'),
                "difficulty_level": content.get('difficulty_level', 1),
                "learning_objective": "Understanding basic concepts",
                "question_type": "knowledge",
                "resource_id": content.get("id"),
                "created_at": datetime.utcnow().isoformat(),
                "learner_id": state["learner_id"]
            }
        ]