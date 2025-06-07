# agents/orchestrator.py
import uuid
import threading
from datetime import datetime
from typing import Dict, Any, List
from dataclasses import asdict
from .content_generator import ContentGeneratorAgent
from .path_generator import PathGeneratorAgent
from .evaluator import EvaluatorAgent
from .models import LearnerProfile, LearningPath

class AgentOrchestrator:
    """Orchestrates all AI agents for coordinated learning experience"""
    
    def __init__(self, gemini_api_key: str):
        self.content_agent = ContentGeneratorAgent(gemini_api_key)
        self.path_agent = PathGeneratorAgent(gemini_api_key)
        self.evaluator_agent = EvaluatorAgent(gemini_api_key)
        print("✅ Initialized AI Agent Orchestrator with Gemini AI")
    

    def process_new_learner(self, profile_data: Dict, db) -> Dict[str, Any]:
        # Ensure knowledge_level is an integer
        knowledge_level = profile_data.get('knowledge_level', 1)
        if isinstance(knowledge_level, str):
            try:
                knowledge_level = int(knowledge_level)
            except (ValueError, TypeError):
                knowledge_level = 1
        
        # Ensure weak_areas is a list
        weak_areas = profile_data.get('weak_areas', [])
        if not isinstance(weak_areas, list):
            weak_areas = []
        
        # Handle custom subject properly
        subject = profile_data.get('subject', 'algebra')
        if profile_data.get('custom_subject'):
            subject = profile_data.get('custom_subject')
        
        print(f"🎯 Creating profile for subject: {subject}")
        
        # Create learner profile
        profile = LearnerProfile(
            id=str(uuid.uuid4()),
            name=str(profile_data['name']),
            learning_style=str(profile_data['learning_style']),
            knowledge_level=knowledge_level,
            subject=subject,  # Use the processed subject
            weak_areas=weak_areas,
            created_at=datetime.utcnow()
        )
        
        # Save profile to database
        db.learner_profiles.insert_one(asdict(profile))
        print(f"✅ Created learner profile: {profile.id} for subject: {subject}")
        
        # Create initial learning path with placeholder resources
        initial_path_resources = self._create_initial_path(profile, db)
        
        # Create learning path
        learning_path = LearningPath(
            id=str(uuid.uuid4()),
            learner_id=profile.id,
            resources=initial_path_resources,
            current_position=0,
            progress={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save learning path
        db.learning_paths.insert_one(asdict(learning_path))
        print(f"✅ Created initial learning path: {learning_path.id}")
        
        # Start background resource generation
        self._start_background_generation(profile, db, learning_path.id)
        
        return {
            'profile_id': profile.id,
            'path_id': learning_path.id,
            'initial_resources': initial_path_resources[:3],
            'status': 'generating_content'
        }

    def _create_initial_path(self, profile: LearnerProfile, db) -> List[str]:
        """Create initial path with basic topics, detailed content will be generated later"""
        
        # Get topic sequence quickly
        topics = self._get_quick_topics(profile.subject, profile.weak_areas)
        
        resource_ids = []
        for i, topic in enumerate(topics[:5]):  # Limit to 5 topics initially
            # Create basic resource entry
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
                'status': 'generating'  # Mark as being generated
            }
            
            db.learning_resources.insert_one(basic_resource)
            resource_ids.append(resource_id)
        
        return resource_ids
    
    def _get_quick_topics(self, subject: str, weak_areas: List[str]) -> List[str]:
        """Get topic sequence quickly without AI generation"""
        
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
            'trigonometry': [
                'Introduction to Trigonometry',
                'Sine, Cosine, and Tangent',
                'Unit Circle',
                'Trigonometric Identities',
                'Applications of Trigonometry'
            ],
            'calculus': [
                'Limits and Continuity',
                'Introduction to Derivatives',
                'Applications of Derivatives',
                'Introduction to Integrals',
                'Applications of Integration'
            ]
        }
        
        base_topics = topic_sequences.get(subject.lower(), topic_sequences['algebra'])
        
        # Prioritize weak areas
        if weak_areas:
            prioritized_topics = []
            for weak_area in weak_areas:
                for topic in base_topics:
                    if weak_area.lower() in topic.lower() and topic not in prioritized_topics:
                        prioritized_topics.append(topic)
            
            # Add remaining topics
            for topic in base_topics:
                if topic not in prioritized_topics:
                    prioritized_topics.append(topic)
            
            return prioritized_topics[:5]
        
        return base_topics[:5]
    
    def _start_background_generation(self, profile: LearnerProfile, db, path_id: str):
        """Start background thread to generate detailed content"""
        
        def generate_content():
            try:
                print(f"🚀 Starting background content generation for {profile.name}")
                
                # Get the basic resources
                path = db.learning_paths.find_one({'id': path_id})
                if not path:
                    return
                
                resource_ids = path['resources']
                
                for resource_id in resource_ids:
                    basic_resource = db.learning_resources.find_one({'id': resource_id})
                    if basic_resource and basic_resource.get('status') == 'generating':
                        
                        print(f"📝 Generating content for: {basic_resource['title']}")
                        
                        # Generate detailed content
                        detailed_content = self.path_agent.content_generator._generate_single_content(
                            topic=basic_resource['topic'],
                            resource_type=basic_resource['type'],
                            difficulty=basic_resource['difficulty_level'],
                            learning_style=basic_resource['learning_style'],
                            sequence_position=resource_ids.index(resource_id) + 1,
                            total_sequence=len(resource_ids)
                        )
                        
                        if detailed_content:
                            # Update the resource with generated content
                            update_data = {
                                'title': detailed_content.title,
                                'content': detailed_content.content,
                                'summary': detailed_content.summary,
                                'learning_objectives': detailed_content.learning_objectives,
                                'estimated_duration': detailed_content.estimated_duration,
                                'status': 'ready',
                                'updated_at': datetime.utcnow()
                            }
                            
                            db.learning_resources.update_one(
                                {'id': resource_id},
                                {'$set': update_data}
                            )
                            
                            print(f"✅ Updated resource: {detailed_content.title}")
                        else:
                            # Mark as ready even if generation failed
                            db.learning_resources.update_one(
                                {'id': resource_id},
                                {'$set': {'status': 'ready', 'updated_at': datetime.utcnow()}}
                            )
                
                print(f"🎉 Completed background generation for {profile.name}")
                
            except Exception as e:
                print(f"❌ Error in background generation: {e}")
        
        # Start the background thread
        thread = threading.Thread(target=generate_content)
        thread.daemon = True
        thread.start()