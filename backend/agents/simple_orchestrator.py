from typing import Dict, Any
from .content_generator import ContentGeneratorAgent
from .path_generator import PathGeneratorAgent
from .evaluator import EvaluatorAgent
from .models import LearnerProfile
from dataclasses import asdict
import uuid
from datetime import datetime

class SimpleOrchestrator:
    """Simplified orchestrator that mimics LangGraph workflow patterns"""
    
    def __init__(self, gemini_api_key: str):
        self.content_agent = ContentGeneratorAgent(gemini_api_key)
        self.path_agent = PathGeneratorAgent(gemini_api_key)
        self.evaluator_agent = EvaluatorAgent(gemini_api_key)
        self.gemini_api_key = gemini_api_key
        print("✅ Initialized Simple Agent Orchestrator (LangGraph-style)")
    
    def process_new_learner(self, profile_data: Dict, db) -> Dict[str, Any]:
        """Process new learner using agent workflow"""
        
        try:
            print(f"🎯 Processing new learner: {profile_data.get('name')}")
            
            # Step 1: Profile Analysis
            profile = self._create_learner_profile(profile_data)
            db.learner_profiles.insert_one(asdict(profile))
            print(f"✅ Profile Analysis: Created learner profile {profile.id}")
            
            # Step 2: Path Planning
            learning_path_resources = self._generate_learning_path(profile, db)
            print(f"✅ Path Planning: Generated {len(learning_path_resources)} resources")
            
            # Step 3: Content Generation (async in background)
            self._start_content_generation(profile, db, learning_path_resources)
            print(f"✅ Content Generation: Started background generation")
            
            # Step 4: Assessment Generation
            # This will be done after content is ready
            
            return {
                "profile_id": profile.id,
                "path_id": str(uuid.uuid4()),
                "session_id": str(uuid.uuid4()),
                "total_resources": len(learning_path_resources),
                "status": "generating_content",
                "workflow_type": "langgraph_style"
            }
            
        except Exception as e:
            print(f"❌ Error in orchestrator: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_learner_profile(self, profile_data: Dict) -> LearnerProfile:
        """Step 1: Profile Analysis Agent simulation"""
        
        knowledge_level = profile_data.get('knowledge_level', 1)
        if isinstance(knowledge_level, str):
            try:
                knowledge_level = int(knowledge_level)
            except (ValueError, TypeError):
                knowledge_level = 1
        
        weak_areas = profile_data.get('weak_areas', [])
        if not isinstance(weak_areas, list):
            weak_areas = []
        
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
    
    def _generate_learning_path(self, profile: LearnerProfile, db) -> list:
        """Step 2: Path Planning Agent simulation"""
        
        # Generate topic sequence
        topics = self._get_topic_sequence(profile)
        
        resource_ids = []
        for i, topic in enumerate(topics[:5]):
            resource_id = str(uuid.uuid4())
            basic_resource = {
                'id': resource_id,
                'title': f"{topic} - Introduction",
                'type': 'lesson',
                'content': f"Loading comprehensive content for {topic}...",
                'summary': f"Learn the fundamentals of {topic}",
                'difficulty_level': min(5, profile.knowledge_level + (i // 2)),
                'learning_style': profile.learning_style,
                'topic': topic,
                'estimated_duration': 15,
                'prerequisites': [],
                'learning_objectives': [f"Understand {topic} concepts"],
                'created_at': datetime.utcnow(),
                'learner_id': profile.id,
                'status': 'generating'
            }
            
            db.learning_resources.insert_one(basic_resource)
            resource_ids.append(resource_id)
        
        # Create learning path
        learning_path = {
            'id': str(uuid.uuid4()),
            'learner_id': profile.id,
            'resources': resource_ids,
            'current_position': 0,
            'progress': {},
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'workflow_type': 'langgraph_style'
        }
        
        db.learning_paths.insert_one(learning_path)
        
        return resource_ids
    
    def _start_content_generation(self, profile: LearnerProfile, db, resource_ids: list):
        """Step 3: Content Generation Agent simulation"""
        
        import threading
        
        def generate_content():
            try:
                print(f"🚀 Starting content generation for {profile.name}")
                
                for resource_id in resource_ids:
                    basic_resource = db.learning_resources.find_one({'id': resource_id})
                    if basic_resource and basic_resource.get('status') == 'generating':
                        
                        print(f"📝 Generating content for: {basic_resource['title']}")
                        
                        # Simulate content generation
                        detailed_content = self._generate_detailed_content(basic_resource, profile)
                        
                        if detailed_content:
                            update_data = {
                                'title': detailed_content['title'],
                                'content': detailed_content['content'],
                                'summary': detailed_content['summary'],
                                'learning_objectives': detailed_content['learning_objectives'],
                                'estimated_duration': detailed_content['estimated_duration'],
                                'status': 'ready',
                                'updated_at': datetime.utcnow(),
                                'generated_by': 'SimpleOrchestrator',
                                'workflow_step': 'content_generation_complete'
                            }
                            
                            db.learning_resources.update_one(
                                {'id': resource_id},
                                {'$set': update_data}
                            )
                            
                            print(f"✅ Updated resource: {detailed_content['title']}")
                
                print(f"🎉 Completed content generation for {profile.name}")
                
            except Exception as e:
                print(f"❌ Error in content generation: {e}")
        
        thread = threading.Thread(target=generate_content)
        thread.daemon = True
        thread.start()
    
    def _generate_detailed_content(self, basic_resource: Dict, profile: LearnerProfile) -> Dict:
        """Generate detailed content using existing content generator"""
        
        # Use the existing learning content generator
        from .learning_content_generator import LearningContentGenerator
        
        content_gen = LearningContentGenerator(self.gemini_api_key)
        
        # Generate content sequence
        learning_contents = content_gen.generate_learning_sequence(
            learner_profile=profile,
            topic=basic_resource['topic'],
            num_resources=1
        )
        
        if learning_contents:
            content = learning_contents[0]
            return {
                'title': content.title,
                'content': content.content,
                'summary': content.summary,
                'learning_objectives': content.learning_objectives,
                'estimated_duration': content.estimated_duration
            }
        
        return None
    
    def _get_topic_sequence(self, profile: LearnerProfile) -> list:
        """Get topic sequence based on profile"""
        
        topic_sequences = {
            'algebra': [
                'Variables and Expressions',
                'Linear Equations', 
                'Systems of Equations',
                'Quadratic Functions',
                'Polynomial Operations'
            ],
            'geometry': [
                'Basic Shapes and Properties',
                'Angles and Triangles',
                'Area and Perimeter',
                'Circle Geometry',
                '3D Shapes and Volume'
            ],
            'programming': [
                f'{profile.subject} Fundamentals',
                f'{profile.subject} Variables and Data Types',
                f'{profile.subject} Control Structures',
                f'{profile.subject} Functions and Methods',
                f'Advanced {profile.subject} Concepts'
            ]
        }
        
        # Check if it's a programming language
        if any(prog in profile.subject.lower() for prog in ['java', 'python', 'javascript', 'programming']):
            return topic_sequences['programming']
        
        return topic_sequences.get(profile.subject.lower(), [
            f'Introduction to {profile.subject}',
            f'{profile.subject} Fundamentals',
            f'Core {profile.subject} Concepts',
            f'Advanced {profile.subject} Topics',
            f'Practical {profile.subject} Applications'
        ])
    
    def get_workflow_status(self, session_id: str) -> Dict[str, Any]:
        """Get workflow status (simplified)"""
        return {
            "session_id": session_id,
            "status": "running",
            "workflow_type": "simple_orchestrator"
        }
    
    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5):
        """Generate quiz questions"""
        return self.content_agent.generate_quiz_questions(topic, difficulty, count)