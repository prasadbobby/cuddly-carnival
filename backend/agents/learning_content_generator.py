# agents/learning_content_generator.py
import json
import uuid
import re
import sys
import os
from typing import List, Dict, Any

# Add the parent directory to the path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .content_generator import GeminiClient
from .models import LearningContent

# Import YouTube service
try:
    from services.youtube_service import YouTubeService
except ImportError:
    print("⚠️ YouTube service not available, videos will be disabled")
    YouTubeService = None

class LearningContentGenerator:
    """AI Agent for generating actual learning content using Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.youtube_service = YouTubeService() if YouTubeService else None
        self.agent_name = "LearningContentGenerator"
        self.system_context = """You are an expert educational content creator and curriculum designer. 
        Your role is to create engaging, comprehensive learning materials tailored to specific learning styles and difficulty levels."""
    
    def generate_learning_sequence(self, learner_profile, topic: str, num_resources: int = 5) -> List[LearningContent]:
        """Generate a complete learning sequence for a topic"""
        
        print(f"📚 Generating learning sequence for {topic} - {learner_profile.learning_style} learner")
        
        # Define resource types based on learning style
        resource_types = self._get_resource_types_for_style(learner_profile.learning_style)
        
        learning_contents = []
        
        for i in range(num_resources):
            difficulty = min(5, learner_profile.knowledge_level + (i // 2))  # Gradual progression
            resource_type = resource_types[i % len(resource_types)]
            
            content = self._generate_single_content(
                topic=topic,
                resource_type=resource_type,
                difficulty=difficulty,
                learning_style=learner_profile.learning_style,
                sequence_position=i + 1,
                total_sequence=num_resources
            )
            
            if content:
                learning_contents.append(content)
        
        return learning_contents
    
    def _get_resource_types_for_style(self, learning_style: str) -> List[str]:
        """Get preferred resource types for learning style"""
        
        style_preferences = {
            'visual': ['infographic_lesson', 'diagram_tutorial', 'visual_guide', 'chart_explanation'],
            'auditory': ['audio_lesson', 'discussion_guide', 'verbal_explanation', 'story_based_lesson'],
            'reading': ['text_lesson', 'article', 'step_by_step_guide', 'detailed_explanation'],
            'kinesthetic': ['interactive_exercise', 'hands_on_activity', 'practice_problems', 'simulation']
        }
        
        return style_preferences.get(learning_style, ['lesson', 'tutorial', 'guide', 'practice'])
    


    def _generate_single_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int, total_sequence: int) -> LearningContent:
        """Generate a single piece of learning content - subject-aware"""
        
        try:
            # Extract the main subject from the topic
            main_subject = self._extract_main_subject(topic)
            
            # Create subject-aware prompt
            prompt = f"""{self.system_context}

    TASK: Create educational content about "{topic}" for a {learning_style} learner.

    IMPORTANT: This content must be specifically about "{topic}" and related to the subject "{main_subject}". 
    Do NOT create content about mathematics, algebra, or unrelated subjects.

    CONTENT SPECIFICATIONS:
    - Topic: {topic}
    - Main Subject Area: {main_subject}
    - Resource Type: {resource_type}
    - Difficulty Level: {difficulty}/5
    - Learning Style: {learning_style}
    - Position in Sequence: {sequence_position} of {total_sequence}

    REQUIREMENTS:
    1. Create content specifically about {topic} within the {main_subject} domain
    2. Tailor presentation to {learning_style} learners
    3. Include clear learning objectives related to {topic}
    4. Provide examples and applications specific to {main_subject}
    5. Ensure content builds logically in the learning sequence

    Generate content in this JSON format:
    {{
        "title": "Specific title about {topic}",
        "content": "Educational content specifically about {topic} (800-1200 words)",
        "summary": "Brief summary of {topic} concepts (2-3 sentences)",
        "learning_objectives": ["Learn {topic} concept 1", "Apply {topic} skill 2", "Master {topic} technique 3"],
        "estimated_duration": 20
    }}

    CONTENT FOCUS: Make sure everything relates to {topic} and {main_subject}, not other subjects.

    Generate the content now:"""

            response = self.gemini.generate(prompt, max_tokens=3000)
            
            # Clean and parse JSON response
            json_content = self._extract_json_from_response(response)
            
            if json_content:
                content_data = json.loads(json_content)
                
                learning_content = LearningContent(
                    id=str(uuid.uuid4()),
                    title=content_data.get('title', f'{topic} - Part {sequence_position}'),
                    type=resource_type,
                    content=content_data.get('content', ''),
                    summary=content_data.get('summary', ''),
                    difficulty_level=difficulty,
                    learning_style=learning_style,
                    topic=topic,
                    estimated_duration=content_data.get('estimated_duration', 20),
                    prerequisites=[],
                    learning_objectives=content_data.get('learning_objectives', []),
                    youtube_videos=[]
                )
                
                # Add YouTube videos for visual learners
                if learning_style == 'visual' and self.youtube_service:
                    print(f"🎥 Searching YouTube videos for: {topic}")
                    youtube_videos = self.youtube_service.search_videos(topic, max_results=3)
                    learning_content.youtube_videos = youtube_videos
                    print(f"📺 Added {len(youtube_videos)} YouTube videos")
                
                return learning_content
            else:
                return self._generate_fallback_content(topic, resource_type, difficulty, learning_style, sequence_position)
                
        except Exception as e:
            print(f"❌ Error generating content for {topic}: {e}")
            return self._generate_fallback_content(topic, resource_type, difficulty, learning_style, sequence_position)

    def _extract_main_subject(self, topic: str) -> str:
        """Extract the main subject from a topic string"""
        
        topic_lower = topic.lower()
        
        # Programming subjects
        if any(prog in topic_lower for prog in ['java', 'python', 'javascript', 'c++', 'c#', 'programming']):
            if 'java' in topic_lower:
                return 'Java Programming'
            elif 'python' in topic_lower:
                return 'Python Programming'
            elif 'javascript' in topic_lower:
                return 'JavaScript Programming'
            else:
                return 'Programming'
        
        # Creative subjects
        elif any(creative in topic_lower for creative in ['photography', 'art', 'painting', 'drawing']):
            if 'photography' in topic_lower:
                return 'Photography'
            elif 'art' in topic_lower or 'painting' in topic_lower:
                return 'Visual Arts'
            else:
                return 'Creative Arts'
        
        # Other subjects
        elif any(cook in topic_lower for cook in ['cooking', 'culinary', 'baking']):
            return 'Culinary Arts'
        elif any(biz in topic_lower for biz in ['business', 'marketing', 'finance']):
            return 'Business'
        elif any(sci in topic_lower for sci in ['physics', 'chemistry', 'biology']):
            return 'Science'
        
        # Extract subject from topic structure like "Variables in Java" -> "Java"
        if ' in ' in topic:
            return topic.split(' in ')[-1]
        
        # Fallback: use the topic itself
        return topic
    
    def _extract_json_from_response(self, response: str) -> str:
        """Extract JSON from Gemini response"""
        
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)
        
        # Find JSON object boundaries
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            return response[start_idx:end_idx + 1]
        
        return None
    


    def _generate_fallback_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int) -> LearningContent:
        """Generate fallback content when AI fails - simplified general approach"""
        
        import uuid
        from .models import LearningContent
        
        return LearningContent(
            id=str(uuid.uuid4()),
            title=f'Learning {topic} - Lesson {sequence_position}',
            type=resource_type,
            content=self._generate_general_content(topic, learning_style, difficulty, sequence_position),
            summary=f'Learn the fundamentals of {topic} with personalized content for {learning_style} learners.',
            difficulty_level=difficulty,
            learning_style=learning_style,
            topic=topic,
            estimated_duration=20,
            prerequisites=[],
            learning_objectives=[
                f'Understand basic concepts of {topic}',
                f'Apply {topic} knowledge practically',
                f'Build confidence in {topic}',
                'Develop problem-solving skills'
            ],
            youtube_videos=[]
        )

    def _generate_general_content(self, topic: str, learning_style: str, difficulty: int, sequence_position: int) -> str:
        """Generate general content for any subject"""
        
        # Get difficulty-appropriate intro
        difficulty_intro = self._get_difficulty_intro(difficulty)
        
        # Get learning style specific advice
        style_advice = self._get_learning_style_advice(learning_style, topic)
        
        # Generate the content
        content = f"""# Learning {topic} - Lesson {sequence_position}

    {difficulty_intro}

    ## Welcome to {topic}

    {topic} is an exciting subject that offers many opportunities for learning and growth. This lesson is specifically designed for {learning_style} learners like you.

    ## What You'll Discover

    In this lesson, we'll explore the key concepts of {topic} that will help you build a strong foundation. Whether you're just starting out or looking to deepen your understanding, this content will guide you step by step.

    ## Understanding {topic}

    Every subject has its core principles, and {topic} is no exception. Let's break down the essential concepts:

    ### Fundamental Concepts
    The basics of {topic} form the foundation for everything else you'll learn. Understanding these core ideas will help you tackle more advanced topics with confidence.

    ### Key Principles
    {topic} follows certain rules and patterns that, once understood, make the entire subject much clearer and more manageable.

    ### Practical Applications
    One of the best ways to learn {topic} is to see how it applies to real-world situations. This makes the learning more meaningful and memorable.

    ## Learning Strategies for You

    {style_advice}

    ## Building Your Knowledge

    As you progress in {topic}, remember these important strategies:

    1. **Start with the basics** - Master fundamental concepts before moving to advanced topics
    2. **Practice regularly** - Consistent practice helps reinforce what you learn
    3. **Connect ideas** - Look for relationships between different concepts
    4. **Apply what you learn** - Find ways to use your knowledge in practical situations
    5. **Ask questions** - Curiosity is the key to deeper understanding
    6. **Review often** - Regular review helps strengthen your memory

    ## Common Learning Challenges

    Learning {topic} can sometimes feel challenging, but this is completely normal. Here are some tips to help you overcome common obstacles:

    - **Take breaks** when you feel overwhelmed
    - **Break complex topics** into smaller, manageable pieces
    - **Practice patience** with yourself as you learn
    - **Celebrate small wins** along the way
    - **Seek help** when you need it

    ## Moving Forward

    This lesson provides a solid foundation for your {topic} journey. Each subsequent lesson will build upon what you've learned here, gradually introducing new concepts and deeper understanding.

    Remember that learning {topic} is a process that takes time. Be patient with yourself, stay curious, and enjoy the journey of discovery!

    ## Key Takeaways

    - {topic} has fundamental principles that guide everything else
    - Your {learning_style} learning style is an advantage when approached correctly
    - Regular practice and application are essential for mastery
    - Every expert in {topic} started exactly where you are now

    Keep up the great work, and remember that every step forward is progress worth celebrating!"""

        return content

    def _get_difficulty_intro(self, difficulty: int) -> str:
        """Get appropriate intro based on difficulty level"""
        
        if difficulty <= 2:
            return "This lesson is designed for beginners, so we'll take our time and explain everything clearly."
        elif difficulty <= 4:
            return "This intermediate lesson builds on basic concepts and introduces more advanced ideas."
        else:
            return "This advanced lesson explores sophisticated concepts and complex applications."

    def _get_learning_style_advice(self, learning_style: str, topic: str) -> str:
        """Get learning style specific advice - simplified"""
        
        if learning_style == 'visual':
            return f"""**Perfect for Visual Learners:**

    Since you learn best through seeing and visualizing, here are strategies that will help you master {topic}:

    - **Create visual aids** like diagrams, charts, and mind maps
    - **Use colors** to highlight important concepts and organize information
    - **Draw or sketch** ideas to help remember them better
    - **Look for patterns** and visual relationships between concepts
    - **Use flashcards** with images and visual cues
    - **Watch videos** and visual demonstrations when available

    Try to visualize concepts in your mind and create mental pictures of what you're learning."""
        
        elif learning_style == 'auditory':
            return f"""**Perfect for Auditory Learners:**

    Since you learn best through listening and speaking, here are strategies that will help you master {topic}:

    - **Read content aloud** to yourself while studying
    - **Discuss concepts** with friends, family, or study groups
    - **Explain ideas verbally** to reinforce your understanding
    - **Listen to recordings** or lectures about {topic} when available
    - **Create verbal mnemonics** to remember key concepts
    - **Talk through problems** step by step

    Don't hesitate to speak your thoughts out loud as you learn - it's your natural way of processing information!"""
        
        elif learning_style == 'reading':
            return f"""**Perfect for Reading/Writing Learners:**

    Since you learn best through reading and writing, here are strategies that will help you master {topic}:

    - **Take detailed notes** while reading and studying
    - **Rewrite concepts** in your own words to understand them better
    - **Create summaries** and outlines of what you learn
    - **Make lists** of important points and key concepts
    - **Write practice questions** and test yourself
    - **Keep a learning journal** to track your progress

    Reading and writing are your superpowers - use them to break down complex ideas into clear, written explanations."""
        
        else:  # kinesthetic
            return f"""**Perfect for Kinesthetic Learners:**

    Since you learn best through hands-on experience and movement, here are strategies that will help you master {topic}:

    - **Practice actively** rather than just reading about concepts
    - **Use hands-on activities** whenever possible
    - **Take frequent breaks** to move around while studying
    - **Create physical models** or use manipulatives when applicable
    - **Apply concepts immediately** in real-world situations
    - **Use gestures and movement** while learning and reviewing

    Learning by doing is your strength - look for every opportunity to practice and apply what you're learning!"""

    def _get_resource_types_for_style(self, learning_style: str) -> List[str]:
        """Get preferred resource types for learning style"""
        
        style_preferences = {
            'visual': ['infographic_lesson', 'diagram_tutorial', 'visual_guide', 'chart_explanation'],
            'auditory': ['audio_lesson', 'discussion_guide', 'verbal_explanation', 'story_based_lesson'],
            'reading': ['text_lesson', 'article', 'step_by_step_guide', 'detailed_explanation'],
            'kinesthetic': ['interactive_exercise', 'hands_on_activity', 'practice_problems', 'simulation']
        }
        
        return style_preferences.get(learning_style, ['lesson', 'tutorial', 'guide', 'practice'])
    
    def _generate_single_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int, total_sequence: int) -> LearningContent:
        """Generate a single piece of learning content"""
        
        try:
            prompt = f"""{self.system_context}

TASK: Create educational content for a {learning_style} learner.

CONTENT SPECIFICATIONS:
- Topic: {topic}
- Resource Type: {resource_type}
- Difficulty Level: {difficulty}/5
- Learning Style: {learning_style}
- Position in Sequence: {sequence_position} of {total_sequence}
- Target Audience: {"Beginner" if difficulty <= 2 else "Intermediate" if difficulty <= 4 else "Advanced"}

REQUIREMENTS:
1. Create engaging, comprehensive content appropriate for the difficulty level
2. Tailor the presentation style to {learning_style} learners
3. Include clear learning objectives
4. Provide practical examples and applications
5. Make it progressive (building on previous knowledge)

Please generate content in the following JSON format:
{{
    "title": "Engaging title for the content",
    "content": "Full educational content (800-1200 words for lessons, shorter for exercises)",
    "summary": "Brief summary (2-3 sentences)",
    "learning_objectives": ["Objective 1", "Objective 2", "Objective 3"],
    "estimated_duration": 15,
    "key_concepts": ["Concept 1", "Concept 2", "Concept 3"]
}}

CONTENT STYLE GUIDELINES:
- Visual learners: Include descriptions of diagrams, charts, visual examples
- Auditory learners: Use conversational tone, include discussion questions
- Reading/Writing learners: Structured text, clear headings, note-taking prompts
- Kinesthetic learners: Include hands-on activities, practice exercises, real-world applications

Generate the content now:"""

            response = self.gemini.generate(prompt, max_tokens=3000)
            
            # Clean and parse JSON response
            json_content = self._extract_json_from_response(response)
            
            if json_content:
                content_data = json.loads(json_content)
                
                return LearningContent(
                    id=str(uuid.uuid4()),
                    title=content_data.get('title', f'{topic} - Part {sequence_position}'),
                    type=resource_type,
                    content=content_data.get('content', ''),
                    summary=content_data.get('summary', ''),
                    difficulty_level=difficulty,
                    learning_style=learning_style,
                    topic=topic,
                    estimated_duration=content_data.get('estimated_duration', 15),
                    prerequisites=[],
                    learning_objectives=content_data.get('learning_objectives', [])
                )
            else:
                return self._generate_fallback_content(topic, resource_type, difficulty, learning_style, sequence_position)
                
        except Exception as e:
            print(f"❌ Error generating content: {e}")
            return self._generate_fallback_content(topic, resource_type, difficulty, learning_style, sequence_position)
    
    def _extract_json_from_response(self, response: str) -> str:
        """Extract JSON from Gemini response"""
        
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)
        
        # Find JSON object boundaries
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            return response[start_idx:end_idx + 1]
        
        return None
    

    def _generate_fallback_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int) -> LearningContent:
        """Generate fallback content when AI fails - NO MATH CONTENT"""
        
        import uuid
        from .models import LearningContent
        
        print(f"🔧 Generating fallback content for topic: {topic}")
        
        # NEVER use the old math templates - always generate subject-specific content
        return LearningContent(
            id=str(uuid.uuid4()),
            title=f'Learning {topic} - Lesson {sequence_position}',
            type=resource_type,
            content=self._create_subject_specific_content(topic, learning_style, difficulty, sequence_position),
            summary=f'Learn about {topic} with content designed for {learning_style} learners.',
            difficulty_level=difficulty,
            learning_style=learning_style,
            topic=topic,
            estimated_duration=20,
            prerequisites=[],
            learning_objectives=[
                f'Understand the basics of {topic}',
                f'Apply {topic} concepts effectively',
                f'Build practical skills in {topic}',
                'Gain confidence with the material'
            ],
            youtube_videos=[]
        )

    def _create_subject_specific_content(self, topic: str, learning_style: str, difficulty: int, sequence_position: int) -> str:
        """Create content that's always specific to the topic - never math"""
        
        # Get the main subject from the topic
        main_subject = self._extract_main_subject_from_topic(topic)
        
        print(f"📝 Creating content for topic: {topic}, main subject: {main_subject}")
        
        content = f"""# {topic}

    Welcome to learning about {topic}! This lesson is specifically designed for {learning_style} learners.

    ## About {topic}

    {topic} is an important area within {main_subject}. In this lesson, we'll explore the key concepts and practical applications that will help you understand and master this topic.

    ## What You'll Learn

    By the end of this lesson, you'll have a solid understanding of {topic} and how it fits into the broader context of {main_subject}.

    {self._get_subject_specific_content(main_subject, topic, difficulty)}

    ## Learning Approach for {learning_style} Learners

    {self._get_learning_style_specific_advice(learning_style, topic)}

    ## Key Concepts in {topic}

    Understanding {topic} involves several important ideas that we'll explore:

    ### Foundation Concepts
    The basic principles of {topic} provide the groundwork for everything else you'll learn.

    ### Practical Applications  
    {topic} has real-world uses that make learning both meaningful and relevant.

    ### Skills Development
    Through studying {topic}, you'll develop valuable skills that can be applied in many situations.

    ## Building Your Understanding

    As you progress in learning {topic}, keep these strategies in mind:

    1. **Start with the fundamentals** - Make sure you understand the basics before moving on
    2. **Practice regularly** - Apply what you learn through exercises and examples
    3. **Ask questions** - Don't hesitate to seek clarification when needed
    4. **Connect concepts** - Look for relationships between different ideas
    5. **Apply your knowledge** - Find ways to use what you learn in practical situations

    ## Real-World Relevance

    {topic} is valuable because it helps you:
    - Understand important concepts in {main_subject}
    - Develop problem-solving skills
    - Apply knowledge in practical situations
    - Build confidence in the subject area

    ## Moving Forward

    This lesson provides a foundation for your continued learning in {topic}. Each concept builds on the previous ones, so take your time to understand each part thoroughly.

    Remember, learning {topic} is a process. Be patient with yourself and celebrate your progress along the way!

    ## Summary

    {topic} is an essential part of {main_subject} that offers many opportunities for learning and growth. With the right approach and consistent effort, you can master these concepts and apply them effectively.

    Keep practicing, stay curious, and don't hesitate to review material when needed. You're building valuable knowledge and skills!"""

        return content

    def _extract_main_subject_from_topic(self, topic: str) -> str:
        """Extract the main subject from any topic"""
        
        topic_lower = topic.lower()
        
        # Programming languages
        if any(term in topic_lower for term in ['java', 'python', 'javascript', 'c++', 'c#', 'php', 'ruby', 'swift']):
            if 'java' in topic_lower:
                return 'Java Programming'
            elif 'python' in topic_lower:
                return 'Python Programming'
            elif 'javascript' in topic_lower:
                return 'JavaScript Programming'
            else:
                return 'Programming'
        
        # Creative subjects
        elif any(term in topic_lower for term in ['photography', 'photo']):
            return 'Photography'
        elif any(term in topic_lower for term in ['art', 'painting', 'drawing', 'design']):
            return 'Visual Arts'
        elif any(term in topic_lower for term in ['music', 'guitar', 'piano', 'singing']):
            return 'Music'
        
        # Practical subjects
        elif any(term in topic_lower for term in ['cooking', 'culinary', 'baking', 'chef', 'recipe']):
            return 'Culinary Arts'
        elif any(term in topic_lower for term in ['fitness', 'exercise', 'workout', 'gym']):
            return 'Fitness and Health'
        elif any(term in topic_lower for term in ['gardening', 'plants', 'garden']):
            return 'Gardening'
        
        # Business subjects
        elif any(term in topic_lower for term in ['business', 'marketing', 'sales', 'finance', 'management']):
            return 'Business'
        elif any(term in topic_lower for term in ['economics', 'economy']):
            return 'Economics'
        
        # Academic subjects
        elif any(term in topic_lower for term in ['physics']):
            return 'Physics'
        elif any(term in topic_lower for term in ['chemistry']):
            return 'Chemistry'
        elif any(term in topic_lower for term in ['biology']):
            return 'Biology'
        elif any(term in topic_lower for term in ['history']):
            return 'History'
        elif any(term in topic_lower for term in ['psychology']):
            return 'Psychology'
        elif any(term in topic_lower for term in ['literature', 'writing', 'english']):
            return 'Literature and Writing'
        
        # Language learning
        elif any(term in topic_lower for term in ['spanish', 'french', 'german', 'chinese', 'language']):
            return 'Language Learning'
        
        # Technology
        elif any(term in topic_lower for term in ['computer', 'technology', 'software', 'hardware']):
            return 'Technology'
        
        # If topic contains "in [subject]", extract the subject
        if ' in ' in topic:
            return topic.split(' in ')[-1].title()
        
        # Default: return the topic itself as the subject
        return topic.title()

    def _get_subject_specific_content(self, main_subject: str, topic: str, difficulty: int) -> str:
        """Get content specific to the subject area"""
        
        subject_lower = main_subject.lower()
        
        if 'programming' in subject_lower:
            return f"""
    ## Programming Fundamentals

    {topic} is an essential concept in programming. Whether you're writing simple scripts or complex applications, understanding {topic} will help you become a better programmer.

    ### Core Programming Concepts
    - Problem-solving through code
    - Breaking down complex tasks into smaller steps
    - Writing clean, readable code
    - Testing and debugging your programs

    ### Practical Skills
    - Writing functional code
    - Understanding syntax and structure
    - Implementing logic and algorithms
    - Working with data and user input"""

        elif 'photography' in subject_lower:
            return f"""
    ## Photography Essentials

    {topic} is a crucial aspect of photography that affects how your images look and feel. Understanding this concept will help you take better photos and express your creative vision.

    ### Photography Fundamentals
    - Camera settings and controls
    - Composition and framing
    - Light and exposure
    - Post-processing techniques

    ### Creative Skills
    - Developing your artistic eye
    - Telling stories through images
    - Understanding different photography styles
    - Building a portfolio"""

        elif 'culinary' in subject_lower or 'cooking' in subject_lower:
            return f"""
    ## Culinary Arts

    {topic} is an important technique in cooking that will expand your culinary skills. Good cooking combines technique, creativity, and understanding of ingredients.

    ### Cooking Fundamentals
    - Kitchen safety and hygiene
    - Basic cooking methods and techniques
    - Understanding ingredients and flavors
    - Recipe development and modification

    ### Practical Skills
    - Knife skills and food preparation
    - Timing and organization in the kitchen
    - Taste and seasoning
    - Presentation and plating"""

        elif 'business' in subject_lower:
            return f"""
    ## Business Concepts

    {topic} is a key concept in business that can help you understand how organizations operate and succeed. Business skills are valuable in many career paths.

    ### Business Fundamentals
    - Understanding markets and customers
    - Financial planning and management
    - Strategic thinking and planning
    - Communication and leadership

    ### Practical Applications
    - Problem-solving in business contexts
    - Decision-making with data
    - Building relationships and networks
    - Managing projects and teams"""

        elif 'science' in subject_lower or any(sci in subject_lower for sci in ['physics', 'chemistry', 'biology']):
            return f"""
    ## Scientific Understanding

    {topic} is an important concept in science that helps us understand how the world works. Scientific thinking involves observation, experimentation, and logical reasoning.

    ### Scientific Method
    - Making observations and asking questions
    - Forming hypotheses and predictions
    - Designing and conducting experiments
    - Analyzing data and drawing conclusions

    ### Core Concepts
    - Understanding natural phenomena
    - Recognizing patterns and relationships
    - Applying scientific principles
    - Communicating scientific ideas"""

        else:
            return f"""
    ## Understanding {main_subject}

    {topic} is an important concept within {main_subject}. This field offers many opportunities for learning and personal growth.

    ### Key Areas of Study
    - Fundamental principles and concepts
    - Practical applications and skills
    - Critical thinking and analysis
    - Real-world problem solving

    ### Learning Benefits
    - Developing expertise in the field
    - Building valuable skills
    - Expanding your knowledge base
    - Preparing for future opportunities"""

    def _get_learning_style_specific_advice(self, learning_style: str, topic: str) -> str:
        """Get advice specific to learning style"""
        
        if learning_style == 'visual':
            return f"""Since you're a visual learner, here are the best ways to master {topic}:

    - **Create visual aids** like diagrams, charts, and mind maps
    - **Use colors and highlighting** to organize information  
    - **Draw or sketch concepts** to help remember them
    - **Look for visual examples** and demonstrations
    - **Use flashcards** with images and visual cues
    - **Watch videos** and visual tutorials when available

    Your visual processing strength will help you understand {topic} by seeing the big picture and connections between concepts."""

        elif learning_style == 'auditory':
            return f"""Since you're an auditory learner, here are the best ways to master {topic}:

    - **Read content aloud** while studying
    - **Discuss concepts** with others or explain them verbally
    - **Listen to recordings** or lectures about {topic}
    - **Create verbal summaries** of what you learn
    - **Use mnemonics and word associations**
    - **Talk through problems** step by step

    Your listening and speaking strengths will help you understand {topic} through verbal processing and discussion."""

        elif learning_style == 'reading':
            return f"""Since you prefer reading and writing, here are the best ways to master {topic}:

    - **Take detailed notes** while learning
    - **Rewrite concepts** in your own words
    - **Create summaries and outlines** of key points
    - **Make lists** of important information
    - **Write practice questions** and answers
    - **Keep a learning journal** to track progress

    Your reading and writing strengths will help you understand {topic} through text-based learning and written practice."""

        else:  # kinesthetic
            return f"""Since you're a hands-on learner, here are the best ways to master {topic}:

    - **Practice actively** rather than just reading
    - **Use hands-on activities** whenever possible
    - **Take breaks to move around** while studying
    - **Apply concepts immediately** in real situations
    - **Create physical projects** or demonstrations
    - **Use trial and error** to learn through experience

    Your kinesthetic learning style will help you understand {topic} through direct experience and practical application."""