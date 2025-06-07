# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pymongo import MongoClient
from datetime import datetime
import uuid
from dataclasses import asdict
from dotenv import load_dotenv
import requests
import re
from urllib.parse import quote_plus

# Import agents
from agents import (
    AgentOrchestrator, 
    ContentGeneratorAgent, 
    EvaluatorAgent,
    LearnerProfile, 
    LearningResource,
    QuizQuestion
)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Gemini AI configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in environment variables!")
    print("Please set your Gemini API key in .env file")
else:
    print(f"🤖 Using Gemini AI with API key: {GEMINI_API_KEY[:10]}...")

# Database configuration
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client.personalized_tutor

def clean_mongo_doc(doc):
    if doc and '_id' in doc:
        del doc['_id']
    return doc

# Initialize orchestrator
orchestrator = AgentOrchestrator(GEMINI_API_KEY)

@app.route('/api/youtube/search', methods=['POST'])
def search_youtube():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query is required'}), 400
        
        print(f"🔍 Searching YouTube for: {query}")
        
        # Use your existing scraping logic
        videos = scrape_youtube_videos(query, limit=3)
        
        if not videos:
            # Use fallback videos
            videos = get_fallback_videos()
        
        return jsonify({
            'success': True,
            'query': query,
            'count': len(videos),
            'videos': videos
        })
        
    except Exception as e:
        print(f"❌ Error searching YouTube: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Update your existing scrape_youtube_videos function to be more educational focused
def scrape_youtube_videos(search_query, limit=3):
    """Scrape YouTube search results for educational content"""
    try:
        # Add educational keywords to the search
        educational_query = f"{search_query} math tutorial explained"
        
        # Encode search query for URL
        encoded_query = quote_plus(educational_query)
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        print(f"📡 Fetching: {url}")
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        
        if response.status_code != 200:
            print(f"❌ Error: Status code {response.status_code}")
            return []
        
        html_content = response.text
        
        # Extract video data using regex patterns
        videos = []
        
        # Enhanced pattern to match video data in YouTube's JSON
        patterns = [
            r'"videoId":"([^"]{11})"[^}]*?"title":{"runs":\[{"text":"([^"]+)"}[^}]*\][^}]*}[^}]*?"longBylineText":{"runs":\[{"text":"([^"]+)"[^}]*\]',
            r'"videoId":"([^"]{11})".*?"text":"([^"]+)".*?"ownerText":{"runs":\[{"text":"([^"]+)"',
            r'"videoId":"([^"]{11})"[^}]*?"title":{"simpleText":"([^"]+)"}[^}]*?"longBylineText":{"runs":\[{"text":"([^"]+)"'
        ]
        
        matches = []
        for pattern in patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            if matches and len(matches) >= limit:
                break
        
        if not matches:
            # Fallback: get video IDs and titles separately
            video_ids = re.findall(r'"videoId":"([^"]{11})"', html_content)
            titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"}', html_content)
            channels = re.findall(r'"ownerText":{"runs":\[{"text":"([^"]+)"', html_content)
            
            # Combine them
            matches = []
            min_length = min(len(video_ids), len(titles), len(channels))
            for i in range(min_length):
                matches.append((video_ids[i], titles[i], channels[i]))
        
        print(f"🎥 Found {len(matches)} video matches")
        
        for i, (video_id, title, channel) in enumerate(matches[:limit]):
            if len(video_id) == 11:  # Valid YouTube video ID length
                # Clean up the text
                clean_title = title.replace('\\u0026', '&').replace('\\"', '"').replace('\\n', ' ')
                clean_channel = channel.replace('\\u0026', '&').replace('\\"', '"')
                
                video_data = {
                    'video_id': video_id,
                    'title': clean_title,
                    'channel': clean_channel,
                    'url': f'https://www.youtube.com/watch?v={video_id}',
                    'embed_url': f'https://www.youtube.com/embed/{video_id}',
                    'thumbnail': f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg',
                    'duration': 'N/A',
                    'description': f"Educational video about {clean_title}"
                }
                videos.append(video_data)
                print(f"✅ Added video: {clean_title} by {clean_channel}")
        
        return videos[:limit]
        
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return []
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        return []

# Update your existing get_fallback_videos function
def get_fallback_videos():
    """Return educational fallback videos"""
    return [
        {
            'video_id': 'fDKIpRe8GW4',
            'title': 'Algebra Basics: What Is Algebra? - Math Antics',
            'channel': 'mathantics',
            'url': 'https://www.youtube.com/watch?v=fDKIpRe8GW4',
            'embed_url': 'https://www.youtube.com/embed/fDKIpRe8GW4',
            'thumbnail': 'https://img.youtube.com/vi/fDKIpRe8GW4/hqdefault.jpg',
            'duration': 'N/A',
            'description': 'Learn the fundamentals of algebra'
        },
        {
            'video_id': 'NybHckSEQBI',
            'title': 'Introduction to Variables and Expressions',
            'channel': 'Khan Academy',
            'url': 'https://www.youtube.com/watch?v=NybHckSEQBI',
            'embed_url': 'https://www.youtube.com/embed/NybHckSEQBI',
            'thumbnail': 'https://img.youtube.com/vi/NybHckSEQBI/hqdefault.jpg',
            'duration': 'N/A',
            'description': 'Understanding variables and expressions'
        },
        {
            'video_id': 'V6Dfo4zZvnA',
            'title': 'Variables and Expressions Explained',
            'channel': 'Professor Leonard',
            'url': 'https://www.youtube.com/watch?v=V6Dfo4zZvnA',
            'embed_url': 'https://www.youtube.com/embed/V6Dfo4zZvnA',
            'thumbnail': 'https://img.youtube.com/vi/V6Dfo4zZvnA/hqdefault.jpg',
            'duration': 'N/A',
            'description': 'Detailed explanation of variables and expressions'
        }
    ]


@app.route('/api/resource/<resource_id>/visual-example', methods=['GET'])
def get_visual_example(resource_id):
    try:
        print(f"🎨 Generating visual example for resource: {resource_id}")
        
        # Get the resource to know the topic
        resource = db.learning_resources.find_one({'id': resource_id})
        if not resource:
            return jsonify({'success': False, 'error': 'Resource not found'}), 404
        
        # Check if it's for a visual learner
        if resource.get('learning_style') != 'visual':
            return jsonify({'success': False, 'error': 'Visual examples only for visual learners'}), 400
        
        # Generate HTML content
        html_content = orchestrator.content_agent.generate_visual_html_example(resource['topic'])
        
        return jsonify({
            'success': True,
            'html_content': html_content,
            'topic': resource['topic']
        })
        
    except Exception as e:
        print(f"❌ Error generating visual example: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Routes without authentication
@app.route('/api/learner/create', methods=['POST'])
def create_learner():
    try:
        data = request.get_json()
        print(f"🏗️ Creating learner profile")
        
        # Log the incoming data to debug
        print(f"📥 Received data: {data}")
        
        # Ensure the subject is properly handled
        subject = data.get('subject', 'algebra')
        if data.get('custom_subject'):
            subject = data.get('custom_subject')
        
        # Update the data with the correct subject
        processed_data = {
            **data,
            'subject': subject
        }
        
        print(f"📝 Processed data with subject: {subject}")
        
        result = orchestrator.process_new_learner(processed_data, db)
        
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        print(f"❌ Error creating learner: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# backend/app.py - Add this new endpoint

@app.route('/api/generate-custom-focus-areas', methods=['POST'])
def generate_custom_focus_areas():
    try:
        data = request.get_json()
        subject = data.get('subject', '').strip()
        
        if not subject:
            return jsonify({'success': False, 'error': 'Subject is required'}), 400
        
        print(f"🎯 Generating focus areas for custom subject: {subject}")
        
        # Generate focus areas using Gemini AI
        focus_areas = orchestrator.content_agent.generate_custom_focus_areas(subject)
        
        return jsonify({
            'success': True,
            'subject': subject,
            'focus_areas': focus_areas,
            'count': len(focus_areas)
        })
        
    except Exception as e:
        print(f"❌ Error generating custom focus areas: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learner/<learner_id>/pretest', methods=['POST'])
def conduct_pretest(learner_id):
    try:
        data = request.get_json()
        subject = data.get('subject', 'algebra')
        
        print(f"🧪 Conducting pretest for learner: {learner_id}, subject: {subject}")
        
        # Get learner profile to check if it's a custom subject
        learner_profile = db.learner_profiles.find_one({'id': learner_id})
        if not learner_profile:
            return jsonify({'success': False, 'error': 'Learner profile not found'}), 404
        
        # Use the subject from learner profile (which could be custom)
        actual_subject = learner_profile.get('subject', subject)
        
        # Generate questions using content generator
        questions = orchestrator.content_agent.generate_quiz_questions(
            topic=actual_subject,
            difficulty=2,  # Medium difficulty for pretest
            count=5
        )
        
        # Create pretest record
        pretest_id = str(uuid.uuid4())
        pretest_doc = {
            'id': pretest_id,
            'learner_id': learner_id,
            'subject': actual_subject,
            'questions': [asdict(q) for q in questions],
            'created_at': datetime.utcnow(),
            'status': 'active'
        }
        
        db.pretests.insert_one(pretest_doc)
        
        return jsonify({
            'success': True,
            'pretest_id': pretest_id,
            'questions': [asdict(q) for q in questions]
        })
        
    except Exception as e:
        print(f"❌ Error conducting pretest: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500





@app.route('/api/pretest/<pretest_id>/submit', methods=['POST'])
def submit_pretest(pretest_id):
    try:
        data = request.get_json()
        answers = data.get('answers', {})
        
        print(f"📝 Submitting pretest: {pretest_id}")
        
        # Get pretest
        pretest = db.pretests.find_one({'id': pretest_id})
        if not pretest:
            return jsonify({'success': False, 'error': 'Pretest not found'}), 404
        
        # Evaluate answers
        results = []
        for question in pretest['questions']:
            user_answer = answers.get(question['id'], '')
            is_correct = user_answer.strip().lower() == question['correct_answer'].strip().lower()
            
            result = orchestrator.evaluator_agent.evaluate_quiz_response(
                QuizQuestion(**question),
                user_answer
            )
            results.append(result)
        
        # Generate overall feedback
        overall_feedback = orchestrator.evaluator_agent.generate_overall_feedback(results)
        
        # Update pretest with results
        db.pretests.update_one(
            {'id': pretest_id},
            {'$set': {
                'answers': answers,
                'results': results,
                'overall_feedback': overall_feedback,
                'completed_at': datetime.utcnow(),
                'status': 'completed'
            }}
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'overall_feedback': overall_feedback
        })
        
    except Exception as e:
        print(f"❌ Error submitting pretest: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learner/<learner_id>/path', methods=['GET'])
def get_learning_path(learner_id):
    try:
        print(f"🛤️ Getting learning path for learner: {learner_id}")
        
        # Get learner profile
        learner_profile = db.learner_profiles.find_one({'id': learner_id})
        if not learner_profile:
            return jsonify({'success': False, 'error': 'Learner profile not found'}), 404
        
        # Get learning path
        learning_path = db.learning_paths.find_one({'learner_id': learner_id})
        if not learning_path:
            return jsonify({'success': False, 'error': 'Learning path not found'}), 404
        
        # Get current resource
        current_resource = None
        if learning_path['current_position'] < len(learning_path['resources']):
            current_resource_id = learning_path['resources'][learning_path['current_position']]
            current_resource = db.learning_resources.find_one({'id': current_resource_id}, {'_id': 0})
        
        # Calculate progress
        total_resources = len(learning_path['resources'])
        completed_resources = learning_path['current_position']
        completion_percentage = (completed_resources / total_resources * 100) if total_resources > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'learner_id': learner_id,
                'current_position': learning_path['current_position'],
                'total_resources': total_resources,
                'completed_resources': completed_resources,
                'completion_percentage': completion_percentage,
                'current_resource': current_resource,
                'all_resources': learning_path['resources'],
                'progress': learning_path.get('progress', {})
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting learning path: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/resource/<resource_id>/add-videos', methods=['POST'])
def add_youtube_videos(resource_id):
    try:
        print(f"🎥 Adding YouTube videos to resource: {resource_id}")
        
        # Get the resource
        resource = db.learning_resources.find_one({'id': resource_id})
        if not resource:
            return jsonify({'success': False, 'error': 'Resource not found'}), 404
        
        # Check if it's for a visual learner
        if resource.get('learning_style') != 'visual':
            return jsonify({'success': False, 'error': 'YouTube videos only for visual learners'}), 400
        
        # Check if videos already exist
        if resource.get('youtube_videos') and len(resource.get('youtube_videos', [])) > 0:
            return jsonify({'success': True, 'videos': resource['youtube_videos']})
        
        # Import and use YouTube service
        try:
            from services.youtube_service import YouTubeService
            youtube_service = YouTubeService()
            
            # Search for videos based on resource title
            videos = youtube_service.search_videos(resource['title'], max_results=3)
            
            # Update the resource with videos
            db.learning_resources.update_one(
                {'id': resource_id},
                {'$set': {'youtube_videos': videos}}
            )
            
            print(f"✅ Added {len(videos)} videos to resource")
            return jsonify({'success': True, 'videos': videos})
            
        except ImportError:
            print("❌ YouTube service not available")
            return jsonify({'success': False, 'error': 'YouTube service not available'}), 500
        
    except Exception as e:
        print(f"❌ Error adding YouTube videos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/resource/<resource_id>', methods=['GET'])
def get_resource(resource_id):
    try:
        print(f"📚 Getting resource: {resource_id}")
        
        resource = db.learning_resources.find_one({'id': resource_id}, {'_id': 0})
        if not resource:
            return jsonify({'success': False, 'error': 'Resource not found'}), 404
        
        # Ensure youtube_videos field exists
        if 'youtube_videos' not in resource:
            resource['youtube_videos'] = []
        
        return jsonify({
            'success': True,
            'data': resource
        })
        
    except Exception as e:
        print(f"❌ Error getting resource: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/resource/<resource_id>/quiz', methods=['GET'])
def get_resource_quiz(resource_id):
    try:
        print(f"📝 Getting quiz for resource: {resource_id}")
        
        # Get resource
        resource = db.learning_resources.find_one({'id': resource_id})
        if not resource:
            return jsonify({'success': False, 'error': 'Resource not found'}), 404
        
        # Generate quiz questions
        questions = orchestrator.content_agent.generate_quiz_questions(
            topic=resource['topic'],
            difficulty=resource['difficulty_level'],
            count=3
        )
        
        # Create quiz record
        quiz_id = str(uuid.uuid4())
        quiz_doc = {
            'id': quiz_id,
            'resource_id': resource_id,
            'questions': [asdict(q) for q in questions],
            'created_at': datetime.utcnow(),
            'status': 'active'
        }
        
        db.quizzes.insert_one(quiz_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'quiz_id': quiz_id,
                'questions': [asdict(q) for q in questions]
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting resource quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/<quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    try:
        data = request.get_json()
        learner_id = data.get('learner_id')
        answers = data.get('answers', {})
        
        print(f"📝 Submitting quiz: {quiz_id} for learner: {learner_id}")
        
        # Get quiz
        quiz = db.quizzes.find_one({'id': quiz_id})
        if not quiz:
            return jsonify({'success': False, 'error': 'Quiz not found'}), 404
        
        # Evaluate answers
        results = []
        for question in quiz['questions']:
            user_answer = answers.get(question['id'], '')
            is_correct = user_answer.strip().lower() == question['correct_answer'].strip().lower()
            
            result = orchestrator.evaluator_agent.evaluate_quiz_response(
                QuizQuestion(**question),
                user_answer
            )
            results.append(result)
        
        # Generate overall feedback
        overall_feedback = orchestrator.evaluator_agent.generate_overall_feedback(results)
        
        # Save quiz submission
        submission_doc = {
            'id': str(uuid.uuid4()),
            'quiz_id': quiz_id,
            'learner_id': learner_id,
            'answers': answers,
            'results': results,
            'overall_feedback': overall_feedback,
            'submitted_at': datetime.utcnow()
        }
        
        db.quiz_submissions.insert_one(submission_doc)
        
        # Update learning path progress if score is good
        if overall_feedback.get('average_score', 0) >= 60:
            learning_path = db.learning_paths.find_one({'learner_id': learner_id})
            if learning_path:
                new_position = min(learning_path['current_position'] + 1, len(learning_path['resources']))
                db.learning_paths.update_one(
                    {'learner_id': learner_id},
                    {'$set': {
                        'current_position': new_position,
                        f'progress.{quiz["resource_id"]}': overall_feedback,
                        'updated_at': datetime.utcnow()
                    }}
                )
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'overall_feedback': overall_feedback
            }
        })
        
    except Exception as e:
        print(f"❌ Error submitting quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learner/<learner_id>/progress', methods=['GET'])
def get_learner_progress(learner_id):
    try:
        print(f"📊 Getting progress for learner: {learner_id}")
        
        # Get learner profile
        learner_profile = db.learner_profiles.find_one({'id': learner_id}, {'_id': 0})
        if not learner_profile:
            return jsonify({'success': False, 'error': 'Learner profile not found'}), 404
        
        # Get learning path
        learning_path = db.learning_paths.find_one({'learner_id': learner_id}, {'_id': 0})
        if not learning_path:
            return jsonify({'success': False, 'error': 'Learning path not found'}), 404
        
        # Calculate progress metrics
        total_resources = len(learning_path['resources'])
        completed_resources = learning_path['current_position']
        completion_percentage = (completed_resources / total_resources * 100) if total_resources > 0 else 0
        
        progress_data = {
            'learner_profile': learner_profile,
            'learning_path': {
                'total_resources': total_resources,
                'completed_resources': completed_resources,
                'completion_percentage': completion_percentage,
                'current_position': learning_path['current_position']
            },
            'progress_details': learning_path.get('progress', {})
        }
        
        return jsonify({
            'success': True,
            'data': progress_data
        })
        
    except Exception as e:
        print(f"❌ Error getting learner progress: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    try:
        print(f"📈 Getting analytics dashboard")
        
        # Get total learners
        total_learners = db.learner_profiles.count_documents({})
        
        # Get total learning paths
        total_paths = db.learning_paths.count_documents({})
        
        # Get total quizzes
        total_quizzes = db.quiz_submissions.count_documents({})
        
        # Calculate average completion rate
        paths = list(db.learning_paths.find({}, {'current_position': 1, 'resources': 1}))
        completion_rates = []
        for path in paths:
            if len(path['resources']) > 0:
                rate = (path['current_position'] / len(path['resources'])) * 100
                completion_rates.append(rate)
        
        avg_completion = sum(completion_rates) / len(completion_rates) if completion_rates else 0
        
        # Get learning styles distribution
        learning_styles = list(db.learner_profiles.aggregate([
            {'$group': {'_id': '$learning_style', 'count': {'$sum': 1}}}
        ]))
        
        analytics = {
            'total_learners': total_learners,
            'total_paths': total_paths,
            'total_quizzes': total_quizzes,
            'average_completion_rate': avg_completion,
            'learning_styles_distribution': learning_styles
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics
        })
        
    except Exception as e:
        print(f"❌ Error getting analytics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add this endpoint to backend/app.py

@app.route('/api/admin/learners', methods=['GET'])
def get_all_learners():
    try:
        print(f"📊 Getting all learners for admin")
        
        # Get all learner profiles
        learners = list(db.learner_profiles.find({}, {'_id': 0}))
        
        # Get additional stats for each learner
        for learner in learners:
            # Get learning path progress
            path = db.learning_paths.find_one({'learner_id': learner['id']})
            if path:
                learner['progress'] = {
                    'total_resources': len(path.get('resources', [])),
                    'completed_resources': path.get('current_position', 0),
                    'completion_percentage': (path.get('current_position', 0) / len(path.get('resources', [])) * 100) if path.get('resources') else 0
                }
            else:
                learner['progress'] = {'total_resources': 0, 'completed_resources': 0, 'completion_percentage': 0}
            
            # Get quiz count
            quiz_count = db.quiz_submissions.count_documents({'learner_id': learner['id']})
            learner['quiz_count'] = quiz_count
            
            # Get average score
            quiz_submissions = list(db.quiz_submissions.find({'learner_id': learner['id']}))
            if quiz_submissions:
                avg_score = sum(submission.get('overall_feedback', {}).get('average_score', 0) for submission in quiz_submissions) / len(quiz_submissions)
                learner['average_score'] = avg_score
            else:
                learner['average_score'] = 0
        
        return jsonify({
            'success': True,
            'learners': learners,
            'total_count': len(learners)
        })
        
    except Exception as e:
        print(f"❌ Error getting all learners: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    try:
        print(f"📊 Getting admin statistics")
        
        # Basic counts
        total_learners = db.learner_profiles.count_documents({})
        total_paths = db.learning_paths.count_documents({})
        total_quizzes = db.quiz_submissions.count_documents({})
        total_resources = db.learning_resources.count_documents({})
        
        # Calculate average completion rate
        paths = list(db.learning_paths.find({}, {'current_position': 1, 'resources': 1}))
        completion_rates = []
        for path in paths:
            if len(path.get('resources', [])) > 0:
                rate = (path.get('current_position', 0) / len(path['resources'])) * 100
                completion_rates.append(rate)
        
        avg_completion = sum(completion_rates) / len(completion_rates) if completion_rates else 0
        
        # Learning styles distribution
        learning_styles = list(db.learner_profiles.aggregate([
            {'$group': {'_id': '$learning_style', 'count': {'$sum': 1}}}
        ]))
        
        # Subject distribution
        subjects = list(db.learner_profiles.aggregate([
            {'$group': {'_id': '$subject', 'count': {'$sum': 1}}}
        ]))
        
        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_learners = db.learner_profiles.count_documents({
            'created_at': {'$gte': week_ago}
        })
        
        recent_quizzes = db.quiz_submissions.count_documents({
            'submitted_at': {'$gte': week_ago}
        })
        
        stats = {
            'overview': {
                'total_learners': total_learners,
                'total_paths': total_paths,
                'total_quizzes': total_quizzes,
                'total_resources': total_resources,
                'average_completion_rate': avg_completion
            },
            'distributions': {
                'learning_styles': learning_styles,
                'subjects': subjects
            },
            'recent_activity': {
                'new_learners_this_week': recent_learners,
                'quizzes_taken_this_week': recent_quizzes
            }
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        print(f"❌ Error getting admin stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add this endpoint to backend/app.py

@app.route('/api/admin/learner/<learner_id>/delete', methods=['DELETE'])
def delete_learner(learner_id):
    try:
        print(f"🗑️ Deleting learner: {learner_id}")
        
        # Check if learner exists
        learner = db.learner_profiles.find_one({'id': learner_id})
        if not learner:
            return jsonify({'success': False, 'error': 'Learner not found'}), 404
        
        # Delete all related data
        
        # 1. Delete learner profile
        db.learner_profiles.delete_one({'id': learner_id})
        
        # 2. Delete learning path
        db.learning_paths.delete_many({'learner_id': learner_id})
        
        # 3. Delete learning resources created for this learner
        db.learning_resources.delete_many({'learner_id': learner_id})
        
        # 4. Delete quiz submissions
        db.quiz_submissions.delete_many({'learner_id': learner_id})
        
        # 5. Delete pretests
        db.pretests.delete_many({'learner_id': learner_id})
        
        # 6. Delete any quizzes created for this learner's resources
        # Get resource IDs first
        resource_ids = []
        for resource in db.learning_resources.find({'learner_id': learner_id}, {'id': 1}):
            resource_ids.append(resource['id'])
        
        # Delete quizzes for these resources
        if resource_ids:
            db.quizzes.delete_many({'resource_id': {'$in': resource_ids}})
        
        print(f"✅ Successfully deleted learner {learner_id} and all related data")
        
        return jsonify({
            'success': True,
            'message': f'Learner {learner["name"]} and all related data deleted successfully'
        })
        
    except Exception as e:
        print(f"❌ Error deleting learner: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    gemini_status = test_gemini_connection()
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.utcnow().isoformat(),
        'gemini_connected': gemini_status,
        'ai_model': 'gemini-2.0-flash-exp',
        'auth_enabled': False,
        'public_access': True
    })

def test_gemini_connection():
    try:
        if not GEMINI_API_KEY:
            print("❌ Gemini API key not configured")
            return False
            
        from agents.content_generator import GeminiClient
        gemini = GeminiClient(GEMINI_API_KEY)
        response = gemini.generate("Test prompt: Say hello", max_tokens=10)
        print(f"✅ Gemini AI connection successful")
        return True
    except Exception as e:
        print(f"❌ Gemini AI connection failed: {e}")
        print("Make sure your GEMINI_API_KEY is correctly set in .env file")
        return False

if __name__ == '__main__':
    print("🤖 Starting Personalized Tutor API (No Authentication)")
    
    # Test Gemini connection
    if test_gemini_connection():
        print("✅ Ready to serve requests!")
    else:
        print("⚠️ Gemini AI connection issues detected, but server will start anyway")
        print("Make sure to set GEMINI_API_KEY in your .env file")
    
    app.run(debug=True, host='0.0.0.0', port=5000)