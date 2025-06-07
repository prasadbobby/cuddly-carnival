# agents/content_generator.py
import json
import uuid
import time
import re
from typing import List, Dict
from dataclasses import dataclass
import requests
from .models import QuizQuestion

class GeminiClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
        
    def generate(self, prompt: str, max_tokens: int = 2048) -> str:
        """Generate text using Gemini AI API"""
        try:
            url = f"{self.base_url}?key={self.api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": max_tokens,
                    "topP": 0.8,
                    "topK": 40
                }
            }
            
            print(f"🤖 Sending request to Gemini AI...")
            response = requests.post(
                url, 
                json=payload, 
                headers={'Content-Type': 'application/json'},
                verify=False
            )
            response.raise_for_status()
            
            result = response.json()
            
            if 'candidates' in result and len(result['candidates']) > 0:
                if 'content' in result['candidates'][0]:
                    if 'parts' in result['candidates'][0]['content']:
                        return result['candidates'][0]['content']['parts'][0]['text']
            
            print(f"❌ Unexpected Gemini response format: {result}")
            return ""
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Gemini request error: {e}")
            raise Exception(f"Failed to connect to Gemini AI: {e}")
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            raise Exception(f"Gemini generation failed: {e}")

class ContentGeneratorAgent:
    """AI Agent for generating educational content using Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.agent_name = "ContentGenerator"
        self.system_context = """You are an expert educational content generator. 
        Your role is to create high-quality learning materials, quizzes, and analyze learning patterns."""
        
    # backend/agents/content_generator.py - Update generate_quiz_questions method

    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5) -> List[QuizQuestion]:
        """Generate quiz questions using Gemini AI - updated for any custom subject"""
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"🤖 Generating {count} questions for topic: {topic}, difficulty: {difficulty}/5 (attempt {retry_count + 1})")
                
                # Enhanced prompt that works for ANY subject
                prompt = f"""{self.system_context}

    TASK: Create exactly {count} multiple choice questions specifically about "{topic}" at difficulty level {difficulty} out of 5.

    IMPORTANT: The questions MUST be directly related to "{topic}" - not mathematics, not general learning, but specifically about {topic}.

    REQUIREMENTS:
    - Each question must have exactly 4 options
    - Difficulty level {difficulty}/5 where 1=beginner, 5=expert
    - Focus ONLY on {topic} - make questions specific to this subject
    - Return ONLY valid JSON format
    - Make questions educational and accurate for {topic}
    - Ensure one correct answer per question

    DIFFICULTY GUIDELINES FOR {topic}:
    - Level 1: Basic definitions and simple concepts in {topic}
    - Level 2: Understanding and recognition of {topic} fundamentals
    - Level 3: Application of {topic} concepts
    - Level 4: Analysis and comparison within {topic}
    - Level 5: Advanced {topic} concepts and synthesis

    EXAMPLES (adapt these patterns to {topic}):
    If topic is "Python Programming":
    - "What is the correct syntax for printing in Python?"
    - "Which data type is used for text in Python?"

    If topic is "Cooking":
    - "What temperature should chicken be cooked to for safety?"
    - "Which cooking method uses dry heat?"

    If topic is "Photography":
    - "What does ISO control in a camera?"
    - "Which aperture setting creates more depth of field?"

    FORMAT (return exactly this structure):
    [
    {{
        "question": "Specific question about {topic}",
        "options": ["Correct answer related to {topic}", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
        "correct_answer": "Correct answer related to {topic}",
        "topic": "{topic}"
    }}
    ]

    Create {count} questions specifically about {topic} now. Return only the JSON array:"""
                
                response_text = self.gemini.generate(prompt, max_tokens=2048)
                
                if not response_text:
                    raise Exception("Empty response from Gemini AI")
                
                print(f"📥 Raw Gemini response: {response_text[:300]}...")
                
                # Clean the response
                response_text = self._clean_json_response(response_text)
                
                # Parse JSON
                questions_data = json.loads(response_text)
                
                if not isinstance(questions_data, list):
                    raise ValueError("Response is not a JSON array")
                
                questions_data = questions_data[:count]
                
                questions = []
                for i, q_data in enumerate(questions_data):
                    # Validate question structure
                    required_fields = ['question', 'options', 'correct_answer']
                    if not all(field in q_data for field in required_fields):
                        print(f"⚠️ Question {i+1} missing fields, skipping")
                        continue
                    
                    if not isinstance(q_data['options'], list) or len(q_data['options']) < 4:
                        print(f"⚠️ Question {i+1} invalid options, skipping")
                        continue
                    
                    # Ensure we have exactly 4 options
                    options = q_data['options'][:4]
                    
                    # Make sure correct answer is in options
                    correct_answer = q_data['correct_answer']
                    if correct_answer not in options:
                        correct_answer = options[0]
                    
                    question = QuizQuestion(
                        id=str(uuid.uuid4()),
                        question=q_data['question'],
                        options=options,
                        correct_answer=correct_answer,
                        topic=q_data.get('topic', topic),
                        difficulty_level=difficulty,
                        resource_id=""
                    )
                    questions.append(question)
                
                if len(questions) >= count:
                    questions = questions[:count]
                    print(f"✅ Successfully generated {len(questions)} questions for {topic}")
                    return questions
                else:
                    raise ValueError(f"Generated only {len(questions)} valid questions, need {count}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error (attempt {retry_count + 1}): {e}")
                retry_count += 1
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error generating questions (attempt {retry_count + 1}): {e}")
                retry_count += 1
                time.sleep(2)
        
        # If all retries failed, generate subject-specific basic questions
        print(f"⚠️ Gemini AI failed, generating subject-specific basic questions for {topic}")
        return self._generate_subject_specific_basic_questions(topic, difficulty, count)

    def _generate_subject_specific_basic_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Generate basic questions specific to the subject when AI fails"""
        questions = []
        topic_lower = topic.lower()
        
        # Create subject-specific question templates
        if any(prog_term in topic_lower for prog_term in ['java', 'python', 'javascript', 'programming', 'coding', 'c++', 'c#', 'php', 'ruby']):
            questions = self._get_programming_fallback_questions(topic, difficulty, count)
        elif any(sci_term in topic_lower for sci_term in ['physics', 'chemistry', 'biology', 'science']):
            questions = self._get_science_fallback_questions(topic, difficulty, count)
        elif any(art_term in topic_lower for art_term in ['photography', 'art', 'painting', 'drawing', 'design']):
            questions = self._get_creative_fallback_questions(topic, difficulty, count)
        elif any(cook_term in topic_lower for cook_term in ['cooking', 'culinary', 'baking', 'chef', 'food']):
            questions = self._get_cooking_fallback_questions(topic, difficulty, count)
        elif any(biz_term in topic_lower for biz_term in ['business', 'marketing', 'management', 'finance', 'economics']):
            questions = self._get_business_fallback_questions(topic, difficulty, count)
        else:
            # Generate completely generic questions for any topic
            questions = self._get_universal_fallback_questions(topic, difficulty, count)
        
        return questions[:count]

    def _get_programming_fallback_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Programming-specific fallback questions"""
        
        if 'java' in topic.lower():
            templates = [
                (f"What is the main method signature in Java?", 
                ["public static void main(String[] args)", "public void main()", "static main(String args)", "main(String[] args)"]),
                (f"Which keyword is used to create a class in Java?", 
                ["class", "Class", "new", "object"]),
                (f"What does JVM stand for in Java?", 
                ["Java Virtual Machine", "Java Variable Method", "Java Version Manager", "Java Vector Machine"]),
                (f"Which data type stores whole numbers in Java?", 
                ["int", "float", "char", "string"]),
                (f"How do you print output in Java?", 
                ["System.out.println()", "print()", "console.log()", "output()"])
            ]
        elif 'python' in topic.lower():
            templates = [
                (f"How do you print 'Hello World' in Python?", 
                ["print('Hello World')", "console.log('Hello World')", "System.out.println('Hello World')", "echo 'Hello World'"]),
                (f"Which symbol is used for comments in Python?", 
                ["#", "//", "/*", "<!--"]),
                (f"What is the correct way to create a variable in Python?", 
                ["x = 5", "var x = 5", "int x = 5", "declare x = 5"]),
                (f"Which data type is used for text in Python?", 
                ["str", "string", "text", "char"]),
                (f"What does the len() function do in Python?", 
                ["Returns the length of an object", "Creates a list", "Loops through items", "Defines a function"])
            ]
        else:
            templates = [
                (f"What is a variable in {topic}?", 
                ["A container for storing data", "A type of loop", "A function", "A class"]),
                (f"What is debugging in {topic}?", 
                ["Finding and fixing errors", "Writing new code", "Running a program", "Deleting code"]),
                (f"What is the purpose of functions in {topic}?", 
                ["To reuse code", "To store data", "To create loops", "To debug programs"]),
                (f"What should you do when learning {topic}?", 
                ["Practice regularly", "Memorize syntax only", "Skip fundamentals", "Avoid examples"]),
                (f"What is most important when starting {topic}?", 
                ["Understanding basics", "Advanced concepts", "Complex projects", "Speed coding"])
            ]
        
        return [self._create_quiz_question_from_template(template, topic, difficulty) for template in templates[:count]]

    def _get_cooking_fallback_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Cooking-specific fallback questions"""
        
        templates = [
            (f"What internal temperature should chicken reach for food safety?", 
            ["165°F (74°C)", "145°F (63°C)", "155°F (68°C)", "175°F (79°C)"]),
            (f"Which cooking method uses dry heat?", 
            ["Roasting", "Boiling", "Steaming", "Poaching"]),
            (f"What is the purpose of salt in cooking?", 
            ["Enhances flavor", "Only preserves food", "Makes food spicy", "Changes color"]),
            (f"What does 'sauté' mean in cooking?", 
            ["Cook quickly in a small amount of fat", "Cook slowly in liquid", "Cook in the oven", "Cook over steam"]),
            (f"Which knife is best for chopping vegetables?", 
            ["Chef's knife", "Paring knife", "Bread knife", "Steak knife"]),
            (f"What does 'mise en place' mean in cooking?", 
            ["Everything in its place", "Cook quickly", "Add seasoning", "Serve immediately"]),
            (f"What is the difference between baking and roasting?", 
            ["Baking is for baked goods, roasting for meats/vegetables", "No difference", "Temperature only", "Pan type only"])
        ]
        
        return [self._create_quiz_question_from_template(template, topic, difficulty) for template in templates[:count]]

    def _get_creative_fallback_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Creative arts fallback questions"""
        
        if 'photography' in topic.lower():
            templates = [
                (f"What does ISO control in photography?", 
                ["Camera sensitivity to light", "Shutter speed", "Lens focal length", "Image color"]),
                (f"Which aperture setting creates more depth of field?", 
                ["f/11", "f/1.4", "f/2.8", "f/4"]),
                (f"What is the rule of thirds in photography?", 
                ["Dividing image into 9 equal sections", "Taking 3 photos", "Using 3 colors", "3-second exposure"]),
                (f"What does shutter speed control?", 
                ["How long sensor is exposed to light", "Image brightness only", "Lens zoom", "Color temperature"]),
                (f"What is the golden hour in photography?", 
                ["Hour after sunrise/before sunset", "Noon sunlight", "Any bright time", "Night photography"])
            ]
        else:
            templates = [
                (f"What are primary colors in {topic}?", 
                ["Red, blue, yellow", "Red, green, blue", "Black, white, gray", "Orange, purple, green"]),
                (f"What is composition in {topic}?", 
                ["Arrangement of visual elements", "Color mixing", "Brush technique", "Paper type"]),
                (f"What does contrast mean in {topic}?", 
                ["Difference between light and dark", "Same colors", "Smooth blending", "Sharp edges"]),
                (f"What is the most important skill for {topic}?", 
                ["Observation and practice", "Expensive tools", "Perfect technique", "Speed"]),
                (f"How do you improve at {topic}?", 
                ["Regular practice and study", "Expensive equipment", "Natural talent only", "Copying others"])
            ]
        
        return [self._create_quiz_question_from_template(template, topic, difficulty) for template in templates[:count]]

    def _get_business_fallback_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Business-specific fallback questions"""
        
        templates = [
            (f"What does ROI stand for in {topic}?", 
            ["Return on Investment", "Rate of Interest", "Return of Income", "Risk of Investment"]),
            (f"What is market research in {topic}?", 
            ["Gathering customer and competitor information", "Selling products", "Managing employees", "Creating ads"]),
            (f"What is the purpose of a business plan?", 
            ["Outline goals and strategies", "List employees", "Track daily sales", "Manage inventory"]),
            (f"What is supply and demand in {topic}?", 
            ["Price relationship with availability and want", "Product manufacturing", "Employee scheduling", "Office management"]),
            (f"What is customer service in {topic}?", 
            ["Helping and supporting customers", "Making products", "Hiring staff", "Managing finances"]),
            (f"What is the most important factor for business success?", 
            ["Meeting customer needs", "Having lots of money", "Big office space", "Many employees"]),
            (f"What should you do before starting a business in {topic}?", 
            ["Research the market", "Quit your job", "Buy expensive equipment", "Hire employees"])
        ]
        
        return [self._create_quiz_question_from_template(template, topic, difficulty) for template in templates[:count]]

    def _get_universal_fallback_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Universal questions that work for any topic"""
        
        templates = [
            (f"What is the best way to start learning {topic}?", 
            ["Start with fundamentals and basic concepts", "Jump to advanced topics", "Memorize everything", "Skip practice"]),
            (f"Which approach is most effective when studying {topic}?", 
            ["Regular practice and consistent study", "Cramming before tests", "Passive reading only", "Avoiding difficult parts"]),
            (f"What should you do when you don't understand something in {topic}?", 
            ["Ask questions and seek help", "Skip it and move on", "Guess the answer", "Give up immediately"]),
            (f"How can you apply {topic} knowledge effectively?", 
            ["Through hands-on practice and real examples", "By reading only", "By avoiding practice", "By memorizing facts"]),
            (f"What is most important for success in {topic}?", 
            ["Consistent effort and curiosity", "Natural talent only", "Expensive resources", "Speed over understanding"]),
            (f"How often should you review {topic} materials?", 
            ["Regularly and consistently", "Only before exams", "Once at the end", "Never"]),
            (f"What mindset helps most when learning {topic}?", 
            ["Growth mindset and patience", "Fixed mindset", "Perfectionism", "Comparison with others"])
        ]
        
        return [self._create_quiz_question_from_template(template, topic, difficulty) for template in templates[:count]]

    def _create_quiz_question_from_template(self, template, topic: str, difficulty: int) -> QuizQuestion:
        """Helper to create QuizQuestion from template"""
        question_text, options = template
        return QuizQuestion(
            id=str(uuid.uuid4()),
            question=question_text,
            options=options,
            correct_answer=options[0],  # First option is always correct
            topic=topic,
            difficulty_level=difficulty,
            resource_id=""
        )
    def generate_visual_html_example(self, topic: str) -> str:
        """Generate an animated HTML example for visual learners"""
        
        try:
            prompt = f"""Create a complete, single HTML file for the topic: "{topic}"
            
    Requirements:
    1. Use HTML5, CSS3, JavaScript, and Bootstrap 5
    2. Include Font Awesome icons or similar icon libraries
    3. Add smooth animations and transitions
    4. Make it visually appealing with modern design
    5. Include interactive elements (hover effects, click animations, etc.)
    6. Add educational content about the topic with visual representations
    7. Use cards, modals, progress bars, or other Bootstrap components
    8. Include CSS animations like fade-in, slide-in, bounce, etc.
    9. Make it responsive and mobile-friendly
    10. Add a beautiful color scheme and typography

    The HTML should be complete and ready to open in a browser. Include all CSS and JavaScript.
    Make it educational, interactive, and visually stunning with animations that help explain the concept of "{topic}".

    Please provide ONLY the HTML code with internal CSS and use best animations and Bootstrap icons.
    Focus on making the animations educational and help explain the concept visually.

    Example structure:
    - Header with animated title
    - Interactive demonstration section
    - Step-by-step visual explanation
    - Animated examples or simulations
    - Interactive exercises or quizzes

    Make sure all animations are smooth and help with learning the concept."""

            response = self.gemini.generate(prompt, max_tokens=4000)
            
            if response and response.strip():
                # Clean up the response to ensure it's valid HTML
                html_content = response.strip()
                
                # Basic validation - ensure it has HTML structure
                if '<html' in html_content.lower() and '</html>' in html_content.lower():
                    return html_content
                else:
                    # Wrap in basic HTML structure if needed
                    return f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{topic} - Visual Learning</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body>
        {html_content}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>"""
            
            return self._generate_fallback_html(topic)
            
        except Exception as e:
            print(f"❌ Error generating visual HTML: {e}")
            return self._generate_fallback_html(topic)

    def _generate_fallback_html(self, topic: str) -> str:
        """Generate fallback HTML content when AI generation fails"""
        
        return f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{topic} - Visual Learning</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            .animated-card {{
                animation: fadeInUp 1s ease-out;
                transition: transform 0.3s ease;
            }}
            .animated-card:hover {{
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }}
            @keyframes fadeInUp {{
                from {{
                    opacity: 0;
                    transform: translateY(30px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            @keyframes pulse {{
                0%, 100% {{ transform: scale(1); }}
                50% {{ transform: scale(1.05); }}
            }}
            .pulse-animation {{
                animation: pulse 2s infinite;
            }}
            .gradient-bg {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .concept-box {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 15px;
                padding: 2rem;
                margin: 1rem 0;
                animation: slideInLeft 1s ease-out;
            }}
            @keyframes slideInLeft {{
                from {{ opacity: 0; transform: translateX(-50px); }}
                to {{ opacity: 1; transform: translateX(0); }}
            }}
        </style>
    </head>
    <body class="gradient-bg text-white">
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-lg-10">
                    <div class="text-center mb-5">
                        <h1 class="display-4 pulse-animation">
                            <i class="fas fa-lightbulb me-3"></i>
                            Learning: {topic}
                        </h1>
                        <p class="lead">Interactive Visual Demonstration</p>
                    </div>
                    
                    <div class="concept-box animated-card">
                        <h2><i class="fas fa-brain me-2"></i>Understanding {topic}</h2>
                        <p>This is an interactive visual demonstration to help you understand <strong>{topic}</strong>.</p>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <div class="card bg-transparent border-light animated-card" style="animation-delay: 0.5s;">
                                    <div class="card-body text-center">
                                        <i class="fas fa-eye fa-3x mb-3 pulse-animation"></i>
                                        <h5>Visual Learning</h5>
                                        <p>See concepts in action with animations and visual representations.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-transparent border-light animated-card" style="animation-delay: 1s;">
                                    <div class="card-body text-center">
                                        <i class="fas fa-mouse-pointer fa-3x mb-3 pulse-animation"></i>
                                        <h5>Interactive</h5>
                                        <p>Click and explore to learn through hands-on interaction.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-5">
                        <button class="btn btn-light btn-lg animated-card" onclick="showConcept()">
                            <i class="fas fa-play me-2"></i>
                            Start Learning
                        </button>
                    </div>
                    
                    <div id="conceptDemo" class="concept-box mt-4" style="display: none;">
                        <h3><i class="fas fa-magic me-2"></i>Interactive Demo</h3>
                        <p>This section would contain an interactive demonstration of <strong>{topic}</strong>.</p>
                        <div class="progress mb-3">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                role="progressbar" style="width: 0%" id="progressBar"></div>
                        </div>
                        <button class="btn btn-success" onclick="animateProgress()">
                            <i class="fas fa-rocket me-2"></i>
                            See Animation
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            function showConcept() {{
                const demo = document.getElementById('conceptDemo');
                demo.style.display = 'block';
                demo.style.animation = 'fadeInUp 1s ease-out';
            }}
            
            function animateProgress() {{
                const progressBar = document.getElementById('progressBar');
                let width = 0;
                const interval = setInterval(() => {{
                    width += 10;
                    progressBar.style.width = width + '%';
                    progressBar.textContent = width + '%';
                    if (width >= 100) {{
                        clearInterval(interval);
                        setTimeout(() => {{
                            alert('Great! You\\'ve completed the {topic} demonstration!');
                        }}, 500);
                    }}
                }}, 200);
            }}
            
            // Add hover effects
            document.querySelectorAll('.animated-card').forEach(card => {{
                card.addEventListener('mouseenter', function() {{
                    this.style.transform = 'scale(1.05)';
                }});
                card.addEventListener('mouseleave', function() {{
                    this.style.transform = 'scale(1)';
                }});
            }});
        </script>
    </body>
    </html>"""
    
    def _clean_json_response(self, response_text: str) -> str:
        """Clean the Gemini response to extract valid JSON"""
        
        # Remove markdown code blocks if present
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # Find JSON array boundaries
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']')
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_content = response_text[start_idx:end_idx + 1]
        else:
            # Try to find individual objects and wrap in array
            objects = []
            lines = response_text.split('\n')
            current_object = ""
            brace_count = 0
            
            for line in lines:
                if '{' in line:
                    current_object = line
                    brace_count = line.count('{') - line.count('}')
                elif current_object and brace_count > 0:
                    current_object += " " + line
                    brace_count += line.count('{') - line.count('}')
                    
                    if brace_count == 0:
                        try:
                            obj = json.loads(current_object)
                            objects.append(obj)
                            current_object = ""
                        except:
                            current_object = ""
                            brace_count = 0
            
            if objects:
                json_content = json.dumps(objects)
            else:
                json_content = response_text
        
        return json_content
    
    def _generate_basic_questions(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Generate basic questions when Gemini AI fails"""
        questions = []
        
        question_templates = {
            'algebra': [
                ("What is a variable in algebra?", ["A letter representing an unknown", "A constant number", "An operation", "A graph"]),
                ("How do you solve x + 5 = 10?", ["Subtract 5 from both sides", "Add 5 to both sides", "Multiply by 5", "Divide by 5"]),
                ("What is a linear equation?", ["An equation with degree 1", "An equation with degree 2", "A curved line", "A circle"]),
                ("What does 'like terms' mean?", ["Terms with same variables and powers", "Any two numbers", "Equal signs", "Multiplication terms"]),
                ("What is the order of operations?", ["PEMDAS/BODMAS", "Left to right always", "Addition first", "Random order"]),
            ],
            'calculus': [
                ("What is a limit?", ["Value a function approaches", "Maximum value", "Minimum value", "Average value"]),
                ("What is a derivative?", ["Rate of change", "Area under curve", "Maximum point", "Minimum point"]),
                ("What is integration?", ["Finding area under curve", "Finding slope", "Finding maximum", "Finding minimum"]),
                ("What does continuity mean?", ["No breaks in function", "Always increasing", "Always positive", "Has a maximum"]),
                ("What is the fundamental theorem?", ["Links derivatives and integrals", "States all functions continuous", "Proves limits exist", "Shows functions are smooth"]),
            ],
            'geometry': [
                ("Sum of angles in a triangle?", ["180 degrees", "360 degrees", "90 degrees", "270 degrees"]),
                ("Area of a rectangle?", ["length × width", "2(length + width)", "length + width", "length²"]),
                ("What is a right angle?", ["90 degrees", "180 degrees", "45 degrees", "60 degrees"]),
                ("What is the Pythagorean theorem?", ["a² + b² = c²", "a + b = c", "a × b = c", "a² = b² + c²"]),
                ("How many sides does a hexagon have?", ["6", "5", "7", "8"]),
            ],
            'trigonometry': [
                ("What is sine in a right triangle?", ["opposite/hypotenuse", "adjacent/hypotenuse", "opposite/adjacent", "hypotenuse/opposite"]),
                ("What is cosine in a right triangle?", ["adjacent/hypotenuse", "opposite/hypotenuse", "opposite/adjacent", "hypotenuse/adjacent"]),
                ("What is tangent in a right triangle?", ["opposite/adjacent", "adjacent/opposite", "opposite/hypotenuse", "adjacent/hypotenuse"]),
                ("What is the unit circle?", ["Circle with radius 1", "Circle with radius 2", "Any circle", "Circle with diameter 1"]),
                ("What is the period of sin(x)?", ["2π", "π", "π/2", "4π"]),
            ]
        }
        
        templates = question_templates.get(topic.lower(), question_templates['algebra'])
        
        for i in range(min(count, len(templates))):
            question_text, options = templates[i]
            question = QuizQuestion(
                id=str(uuid.uuid4()),
                question=question_text,
                options=options,
                correct_answer=options[0],  # First option is correct
                topic=topic,
                difficulty_level=difficulty,
                resource_id=""
            )
            questions.append(question)
        
        # If we need more questions, repeat with variations
        while len(questions) < count:
            template_idx = len(questions) % len(templates)
            question_text, options = templates[template_idx]
            question = QuizQuestion(
                id=str(uuid.uuid4()),
                question=f"Advanced: {question_text}",
                options=options,
                correct_answer=options[0],
                topic=topic,
                difficulty_level=difficulty,
                resource_id=""
            )
            questions.append(question)
        
        return questions[:count]

    # backend/agents/content_generator.py - Add this method to ContentGeneratorAgent class

    def generate_custom_focus_areas(self, subject: str) -> List[str]:
        """Generate custom focus areas for any subject using Gemini AI"""
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"🎯 Generating focus areas for subject: {subject} (attempt {retry_count + 1})")
                
                prompt = f"""{self.system_context}

    TASK: Generate 6-8 key focus areas/topics for the subject "{subject}" that a learner might want to improve on.

    REQUIREMENTS:
    1. Create 6-8 specific, learnable topics within {subject}
    2. Range from basic to intermediate concepts
    3. Each area should be 1-3 words (concise)
    4. Focus on fundamental concepts that students commonly struggle with
    5. Make them practical and actionable
    6. Return as a simple JSON array of strings

    EXAMPLES:
    For "Physics": ["mechanics", "thermodynamics", "electricity", "magnetism", "waves", "optics"]
    For "Programming": ["variables", "loops", "functions", "arrays", "debugging", "algorithms"]
    For "History": ["chronology", "cause and effect", "primary sources", "analysis", "writing", "research"]

    Generate focus areas for "{subject}" now. Return only the JSON array:"""
                
                response_text = self.gemini.generate(prompt, max_tokens=500)
                
                if not response_text:
                    raise Exception("Empty response from Gemini AI")
                
                print(f"📥 Raw Gemini response: {response_text}")
                
                # Clean the response
                response_text = self._clean_json_response(response_text)
                
                # Parse JSON
                focus_areas = json.loads(response_text)
                
                if not isinstance(focus_areas, list):
                    raise ValueError("Response is not a JSON array")
                
                # Filter and clean the focus areas
                cleaned_areas = []
                for area in focus_areas:
                    if isinstance(area, str) and area.strip():
                        # Clean up the area name
                        clean_area = area.strip().lower()
                        # Remove quotes and special characters
                        clean_area = re.sub(r'[^\w\s-]', '', clean_area)
                        if clean_area and len(clean_area) <= 30:  # Reasonable length limit
                            cleaned_areas.append(clean_area)
                
                if len(cleaned_areas) >= 5:  # Need at least 5 areas
                    print(f"✅ Generated {len(cleaned_areas)} focus areas for {subject}")
                    return cleaned_areas[:8]  # Limit to 8 areas
                else:
                    raise ValueError(f"Generated only {len(cleaned_areas)} valid focus areas, need at least 5")
                    
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error (attempt {retry_count + 1}): {e}")
                retry_count += 1
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error generating focus areas (attempt {retry_count + 1}): {e}")
                retry_count += 1
                time.sleep(2)
        
        # If all retries failed, generate fallback areas
        print(f"⚠️ Gemini AI failed, generating fallback focus areas for {subject}")
        return self._generate_fallback_focus_areas(subject)

    def _generate_fallback_focus_areas(self, subject: str) -> List[str]:
        """Generate fallback focus areas when AI fails"""
        
        # Common academic subjects
        subject_lower = subject.lower()
        
        fallback_areas = {
            'physics': ['mechanics', 'thermodynamics', 'electricity', 'magnetism', 'waves', 'optics'],
            'chemistry': ['atoms', 'molecules', 'reactions', 'acids and bases', 'stoichiometry', 'organic chemistry'],
            'biology': ['cells', 'genetics', 'evolution', 'ecology', 'anatomy', 'physiology'],
            'history': ['chronology', 'cause and effect', 'primary sources', 'analysis', 'writing', 'research'],
            'literature': ['reading comprehension', 'analysis', 'writing', 'themes', 'characters', 'literary devices'],
            'programming': ['variables', 'loops', 'functions', 'data structures', 'debugging', 'algorithms'],
            'computer science': ['algorithms', 'data structures', 'programming', 'databases', 'networks', 'security'],
            'psychology': ['research methods', 'statistics', 'cognition', 'behavior', 'development', 'therapy'],
            'economics': ['supply and demand', 'markets', 'inflation', 'fiscal policy', 'international trade', 'statistics'],
            'philosophy': ['logic', 'ethics', 'metaphysics', 'epistemology', 'critical thinking', 'argumentation'],
            'art': ['drawing', 'color theory', 'composition', 'perspective', 'art history', 'techniques'],
            'music': ['theory', 'rhythm', 'melody', 'harmony', 'notation', 'performance'],
            'engineering': ['mathematics', 'physics', 'design', 'analysis', 'problem solving', 'project management'],
            'business': ['management', 'marketing', 'finance', 'operations', 'strategy', 'communication'],
            'medicine': ['anatomy', 'physiology', 'pathology', 'diagnosis', 'treatment', 'pharmacology'],
            'law': ['constitutional law', 'criminal law', 'civil law', 'contracts', 'torts', 'legal writing'],
            'statistics': ['descriptive statistics', 'probability', 'hypothesis testing', 'regression', 'data analysis', 'interpretation']
        }
        
        # Try to find a match
        for key, areas in fallback_areas.items():
            if key in subject_lower or subject_lower in key:
                return areas
        
        # Check for partial matches
        for key, areas in fallback_areas.items():
            if any(word in subject_lower for word in key.split()) or any(word in key for word in subject_lower.split()):
                return areas
        
        # Generic fallback areas for any subject
        return [
            'fundamentals',
            'basic concepts',
            'intermediate topics',
            'advanced applications',
            'problem solving',
            'practical skills'
        ]

    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5) -> List[QuizQuestion]:
        """Generate quiz questions using Gemini AI - updated to handle custom subjects"""
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"🤖 Generating {count} questions for topic: {topic}, difficulty: {difficulty}/5 (attempt {retry_count + 1})")
                
                # Enhanced prompt for custom subjects
                prompt = f"""{self.system_context}

    TASK: Create exactly {count} multiple choice questions about {topic} at difficulty level {difficulty} out of 5.

    REQUIREMENTS:
    - Each question must have exactly 4 options
    - Difficulty level {difficulty}/5 where 1=beginner, 5=expert
    - Focus specifically on {topic}
    - Return ONLY valid JSON format
    - Make questions educational and accurate
    - Ensure one correct answer per question
    - For custom subjects, create fundamental questions appropriate for learning

    DIFFICULTY GUIDELINES:
    - Level 1: Basic definitions and simple concepts
    - Level 2: Understanding and recognition 
    - Level 3: Application of concepts
    - Level 4: Analysis and comparison
    - Level 5: Synthesis and evaluation

    FORMAT (return exactly this structure):
    [
    {{
        "question": "What is a fundamental concept in {topic}?",
        "options": ["Correct Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
        "correct_answer": "Correct Answer",
        "topic": "{topic}"
    }}
    ]

    Create {count} questions about {topic} now. Return only the JSON array without any additional text or formatting:"""
                
                response_text = self.gemini.generate(prompt, max_tokens=2048)
                
                if not response_text:
                    raise Exception("Empty response from Gemini AI")
                
                print(f"📥 Raw Gemini response: {response_text[:300]}...")
                
                # Clean the response
                response_text = self._clean_json_response(response_text)
                
                # Parse JSON
                questions_data = json.loads(response_text)
                
                if not isinstance(questions_data, list):
                    raise ValueError("Response is not a JSON array")
                
                # Take only the requested number of questions
                questions_data = questions_data[:count]
                
                questions = []
                for i, q_data in enumerate(questions_data):
                    # Validate question structure
                    required_fields = ['question', 'options', 'correct_answer']
                    if not all(field in q_data for field in required_fields):
                        print(f"⚠️ Question {i+1} missing fields, skipping")
                        continue
                    
                    if not isinstance(q_data['options'], list) or len(q_data['options']) < 4:
                        print(f"⚠️ Question {i+1} invalid options, skipping")
                        continue
                    
                    # Ensure we have exactly 4 options
                    options = q_data['options'][:4]
                    
                    # Make sure correct answer is in options
                    correct_answer = q_data['correct_answer']
                    if correct_answer not in options:
                        # Use the first option as correct answer
                        correct_answer = options[0]
                    
                    question = QuizQuestion(
                        id=str(uuid.uuid4()),
                        question=q_data['question'],
                        options=options,
                        correct_answer=correct_answer,
                        topic=q_data.get('topic', topic),
                        difficulty_level=difficulty,
                        resource_id=""
                    )
                    questions.append(question)
                
                if len(questions) >= count:
                    questions = questions[:count]
                    print(f"✅ Successfully generated {len(questions)} questions")
                    return questions
                else:
                    raise ValueError(f"Generated only {len(questions)} valid questions, need {count}")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error (attempt {retry_count + 1}): {e}")
                print(f"Response text: {response_text}")
                retry_count += 1
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error generating questions (attempt {retry_count + 1}): {e}")
                retry_count += 1
                time.sleep(2)
        
        # If all retries failed, generate simple questions
        print("⚠️ Gemini AI failed, generating basic questions")
        return self._generate_basic_questions_for_custom_subject(topic, difficulty, count)

    def _generate_basic_questions_for_custom_subject(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Generate basic questions for custom subjects when AI fails"""
        questions = []
        
        # Generic question templates that work for any subject
        question_templates = [
            (f"What is a fundamental concept in {topic}?", 
            [f"Basic principle of {topic}", "Unrelated concept", "Random term", "Incorrect definition"]),
            
            (f"Which of the following is most important when learning {topic}?", 
            ["Understanding the basics", "Memorizing everything", "Skipping fundamentals", "Avoiding practice"]),
            
            (f"What is the best approach to studying {topic}?", 
            ["Start with fundamentals", "Jump to advanced topics", "Avoid reading", "Skip practice"]),
            
            (f"Which skill is essential for {topic}?", 
            ["Critical thinking", "Memorization only", "Guessing", "Avoiding questions"]),
            
            (f"What should you do when learning {topic}?", 
            ["Practice regularly", "Study once", "Avoid examples", "Skip review"])
        ]
        
        for i in range(min(count, len(question_templates))):
            question_text, options = question_templates[i]
            question = QuizQuestion(
                id=str(uuid.uuid4()),
                question=question_text,
                options=options,
                correct_answer=options[0],  # First option is correct
                topic=topic,
                difficulty_level=difficulty,
                resource_id=""
            )
            questions.append(question)
        
        # If we need more questions, generate more generic ones
        while len(questions) < count:
            question = QuizQuestion(
                id=str(uuid.uuid4()),
                question=f"What is an important aspect of {topic}?",
                options=[
                    f"Key concept in {topic}",
                    "Irrelevant information",
                    "Random fact",
                    "Incorrect statement"
                ],
                correct_answer=f"Key concept in {topic}",
                topic=topic,
                difficulty_level=difficulty,
                resource_id=""
            )
            questions.append(question)
        
        return questions[:count]


    def analyze_weak_areas(self, quiz_results: List[Dict]) -> List[str]:
        """Analyze quiz results to identify weak areas using Gemini AI"""
        try:
            if not quiz_results:
                return []
            
            prompt = f"""{self.system_context}

TASK: Analyze quiz results and identify weak learning areas.

Quiz Results:
{json.dumps(quiz_results, indent=2)}

Based on incorrect answers and topics, identify the main weak areas that need attention.
Return only a JSON array of weak area topics (maximum 5 topics).

Example format: ["algebra", "geometry", "calculus"]

Return only the JSON array without any additional text:"""
            
            response = self.gemini.generate(prompt, max_tokens=500)
            
            # Try to extract JSON array
            try:
                start = response.find('[')
                end = response.rfind(']')
                if start != -1 and end != -1:
                    weak_areas = json.loads(response[start:end+1])
                    return weak_areas if isinstance(weak_areas, list) else []
            except:
                pass
            
            # Fallback to simple analysis
            incorrect_topics = []
            for result in quiz_results:
                if not result.get('is_correct', False):
                    topic = result.get('topic', '').lower()
                    if topic:
                        incorrect_topics.append(topic)
            return list(set(incorrect_topics))
            
        except Exception as e:
            print(f"❌ Error analyzing weak areas: {e}")
            # Fallback analysis
            incorrect_topics = []
            for result in quiz_results:
                if not result.get('is_correct', False):
                    topic = result.get('topic', '').lower()
                    if topic:
                        incorrect_topics.append(topic)
            return list(set(incorrect_topics))