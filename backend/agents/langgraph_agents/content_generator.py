from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..graph_state import AgentState, AgentMessage
import json
import uuid
from datetime import datetime

class ContentGeneratorAgent:
    """Agent responsible for generating learning content"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.7
        )
        self.agent_name = "ContentGeneratorAgent"
    
    def __call__(self, state: AgentState) -> AgentState:
        """Generate learning content for all pending tasks"""
        print(f"📝 {self.agent_name} generating content...")
        
        try:
            # Get content generation tasks
            content_tasks = self._get_content_tasks(state)
            
            if not content_tasks:
                state["current_agent"] = "AssessmentAgent"
                state["workflow_step"] = "assessment_generation"
                return state
            
            generated_content = []
            
            for task in content_tasks:
                print(f"🎯 Generating content for: {task['title']}")
                
                # Generate main content
                content = self._generate_content(task, state)
                
                # Generate visual examples for visual learners
                if state["learning_style"] == "visual":
                    visual_example = self._generate_visual_example(task)
                    content["visual_example"] = visual_example
                
                # Add multimedia enhancements
                content = self._enhance_with_multimedia(content, state)
                
                generated_content.append(content)
            
            # Update state
            state["generated_content"] = generated_content
            
            # Message next agent
            state["messages"].append({
                "sender": self.agent_name,
                "receiver": "AssessmentAgent",
                "type": "content_generation_complete",
                "content": {"generated_count": len(generated_content)},
                "timestamp": datetime.utcnow().isoformat()
            })
            
            state["current_agent"] = "AssessmentAgent"
            state["workflow_step"] = "assessment_generation"
            
            print(f"✅ {self.agent_name} generated {len(generated_content)} pieces of content")
            return state
            
        except Exception as e:
            print(f"❌ {self.agent_name} error: {e}")
            state["errors"].append(f"Content generation failed: {str(e)}")
            state["retry_count"] += 1
            return state
    
    def _generate_content(self, task: Dict[str, Any], state: AgentState) -> Dict[str, Any]:
        """Generate educational content using LLM"""
        
        prompt = f"""
        Create comprehensive educational content for this learning resource:
        
        Task Details:
        - Title: {task['title']}
        - Topic: {task['topic']}
        - Content Type: {task['content_type']}
        - Learning Style: {task['learning_style']}
        - Difficulty Level: {task['difficulty']}/5
        - Duration: {task['duration']} minutes
        - Objectives: {task['objectives']}
        
        Generate content in this JSON format:
        {{
            "id": "{task['resource_id']}",
            "title": "{task['title']}",
            "type": "{task['content_type']}",
            "content": "comprehensive educational content (800-1200 words)",
            "summary": "concise summary (2-3 sentences)",
            "learning_objectives": {task['objectives']},
            "key_concepts": ["concept1", "concept2", "concept3"],
            "difficulty_level": {task['difficulty']},
            "estimated_duration": {task['duration']},
            "learning_style_adaptations": {{
                "visual": "specific visual learning adaptations",
                "auditory": "specific auditory learning adaptations",
                "reading": "specific reading/writing adaptations",
                "kinesthetic": "specific hands-on adaptations"
            }},
            "interactive_elements": ["element1", "element2"],
            "prerequisites": [],
            "next_steps": ["step1", "step2"],
            "assessment_suggestions": ["suggestion1", "suggestion2"]
        }}
        
        Content Requirements:
        1. Appropriate for {task['learning_style']} learners
        2. Match difficulty level {task['difficulty']}/5
        3. Include practical examples
        4. Progressive skill building
        5. Engaging and interactive
        6. Clear explanations
        7. Real-world applications
        
        Make the content specifically optimized for {task['learning_style']} learning style.
        """
        
        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        try:
            content = response.content
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_content = content[json_start:json_end]
                parsed_content = json.loads(json_content)
                
                # Add metadata
                parsed_content["created_at"] = datetime.utcnow().isoformat()
                parsed_content["generated_by"] = self.agent_name
                parsed_content["learner_id"] = state["learner_id"]
                
                return parsed_content
                
        except Exception as e:
            print(f"Error parsing content generation: {e}")
            
        # Fallback content generation
        return self._generate_fallback_content(task)
    
    def _generate_visual_example(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Generate interactive visual example HTML"""
        
        prompt = f"""
        Create an interactive HTML visual example for: {task['title']}
        Topic: {task['topic']}
        
        Generate a complete HTML file with:
        1. Bootstrap 5 and Font Awesome
        2. Smooth CSS animations
        3. Interactive JavaScript elements
        4. Educational visualizations
        5. Responsive design
        6. Beautiful color scheme
        
        Return as JSON:
        {{
            "html_content": "complete HTML file as string",
            "description": "description of the visual example",
            "interaction_instructions": "how to interact with the example"
        }}
        
        Make it educational and visually appealing for learning {task['topic']}.
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
            print(f"Error generating visual example: {e}")
            
        return {
            "html_content": self._get_fallback_html(task),
            "description": f"Interactive demonstration of {task['topic']}",
            "interaction_instructions": "Click and explore the interactive elements"
        }
    
    def _enhance_with_multimedia(self, content: Dict[str, Any], state: AgentState) -> Dict[str, Any]:
        """Add multimedia enhancements based on learning style"""
        
        learning_style = state["learning_style"]
        
        if learning_style == "visual":
            content["youtube_search_query"] = f"{content['title']} tutorial visual explanation"
            content["visual_aids"] = [
                "Diagrams and charts",
                "Infographics",
                "Mind maps",
                "Visual demonstrations"
            ]
        
        elif learning_style == "auditory":
            content["audio_enhancements"] = {
                "text_to_speech": True,
                "discussion_prompts": [
                    f"Discuss the key concepts of {content['title']}",
                    f"Explain {content['title']} to a friend",
                    "Record yourself explaining the main points"
                ],
                "listening_exercises": [
                    "Listen to the content multiple times",
                    "Take notes while listening",
                    "Summarize verbally"
                ]
            }
        
        elif learning_style == "kinesthetic":
            content["hands_on_activities"] = [
                f"Practice exercises for {content['title']}",
                "Interactive simulations",
                "Real-world applications",
                "Step-by-step activities"
            ]
        
        return content
    
    def _get_content_tasks(self, state: AgentState) -> List[Dict[str, Any]]:
        """Extract content generation tasks from messages"""
        
        tasks = []
        for message in state["messages"]:
            if (message.get("receiver") == self.agent_name and 
                message.get("type") == "content_generation_task"):
                tasks.append(message["content"])
        
        return tasks
    
    def _generate_fallback_content(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic content when LLM fails"""
        
        return {
            "id": task["resource_id"],
            "title": task["title"],
            "type": task["content_type"],
            "content": f"This lesson covers {task['topic']}. You'll learn the fundamental concepts and practical applications.",
            "summary": f"Introduction to {task['topic']} concepts.",
            "learning_objectives": task["objectives"],
            "key_concepts": [task["topic"]],
            "difficulty_level": task["difficulty"],
            "estimated_duration": task["duration"],
            "created_at": datetime.utcnow().isoformat(),
            "generated_by": self.agent_name
        }
    
    def _get_fallback_html(self, task: Dict[str, Any]) -> str:
        """Generate basic HTML when LLM fails"""
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{task['title']}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .animated {{ animation: fadeIn 1s ease-in; }}
        @keyframes fadeIn {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="text-center">
            <h1 class="animated">{task['title']}</h1>
            <p class="lead animated">Interactive demonstration of {task['topic']}</p>
            <div class="btn btn-primary animated">Explore Concept</div>
        </div>
    </div>
</body>
</html>"""