# agents/path_generator.py
from typing import List
from datetime import datetime
import json
import re
from .content_generator import GeminiClient
from .learning_content_generator import LearningContentGenerator
from .models import LearnerProfile, LearningResource

class PathGeneratorAgent:
    """AI Agent for generating personalized learning paths with dynamic content"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.content_generator = LearningContentGenerator(gemini_api_key)
        self.agent_name = "PathGenerator"
        self.system_context = """You are an AI learning path optimization specialist. 
        Your role is to create optimal learning sequences based on learner profiles."""
        
    def generate_learning_path_with_content(self, learner_profile: LearnerProfile, db) -> List[str]:
        """Generate personalized learning path with dynamically created content"""
        
        print(f"🛤️ Generating learning path with content for: {learner_profile.name}")
        print(f"Subject: {learner_profile.subject}, Style: {learner_profile.learning_style}")
        print(f"Knowledge Level: {learner_profile.knowledge_level}, Weak Areas: {learner_profile.weak_areas}")
        
        try:
            # Generate learning sequence topics using AI
            topics = self._generate_topic_sequence(learner_profile)
            
            all_resource_ids = []
            
            # Generate content for each topic (reduced number for faster initial load)
            for topic in topics:
                # Generate learning resources for this topic
                learning_contents = self.content_generator.generate_learning_sequence(
                    learner_profile=learner_profile,
                    topic=topic,
                    num_resources=2  # Reduced from 3 to 2 for faster generation
                )
                
                # Save generated content to database
                for content in learning_contents:
                    resource_doc = {
                        'id': content.id,
                        'title': content.title,
                        'type': content.type,
                        'content': content.content,
                        'summary': content.summary,
                        'difficulty_level': content.difficulty_level,
                        'learning_style': content.learning_style,
                        'topic': content.topic,
                        'estimated_duration': content.estimated_duration,
                        'prerequisites': content.prerequisites,
                        'learning_objectives': content.learning_objectives,
                        'created_at': datetime.utcnow(),
                        'learner_id': learner_profile.id,
                        'status': 'ready'
                    }
                    
                    # Insert into database
                    db.learning_resources.insert_one(resource_doc)
                    all_resource_ids.append(content.id)
                    
                    print(f"✅ Generated resource: {content.title}")
            
            print(f"✅ Generated {len(all_resource_ids)} learning resources")
            return all_resource_ids
            
        except Exception as e:
            print(f"❌ Error generating learning path with content: {e}")
            return self._generate_fallback_path(learner_profile, db)
    
    def _generate_topic_sequence(self, learner_profile: LearnerProfile) -> List[str]:
        """Generate sequence of topics to cover based on learner profile"""
        
        try:
            prompt = f"""{self.system_context}

TASK: Create a logical sequence of learning topics for this learner.

LEARNER PROFILE:
- Subject: {learner_profile.subject}
- Knowledge Level: {learner_profile.knowledge_level}/5
- Weak Areas: {learner_profile.weak_areas}
- Learning Style: {learner_profile.learning_style}

REQUIREMENTS:
1. Create 4-5 progressive topics in {learner_profile.subject}
2. Start with difficulty appropriate for level {learner_profile.knowledge_level}
3. Focus on weak areas: {learner_profile.weak_areas}
4. Ensure logical progression from basic to advanced concepts
5. Each topic should build on the previous one

Return only a JSON array of topic names:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]

Generate the topic sequence now:"""
            
            response = self.gemini.generate(prompt, max_tokens=500)
            
            # Extract JSON array from response
            json_match = re.search(r'\[.*?\]', response, re.DOTALL)
            if json_match:
                topics = json.loads(json_match.group())
                if isinstance(topics, list) and len(topics) >= 3:
                    return topics[:5]  # Limit to 5 topics
            
            # Fallback to predefined topics
            return self._get_fallback_topics(learner_profile.subject, learner_profile.weak_areas)
            
        except Exception as e:
            print(f"❌ Error generating topic sequence: {e}")
            return self._get_fallback_topics(learner_profile.subject, learner_profile.weak_areas)
    

    def _get_fallback_topics(self, subject: str, weak_areas: List[str]) -> List[str]:
        """Generate subject-specific learning topics"""
        
        subject_lower = subject.lower()
        
        # Programming subjects
        if any(prog in subject_lower for prog in ['java', 'python', 'javascript', 'programming', 'coding', 'c++', 'c#']):
            if 'java' in subject_lower:
                base_topics = [
                    'Java Basics and Syntax',
                    'Variables and Data Types in Java',
                    'Java Control Structures and Loops',
                    'Object-Oriented Programming in Java',
                    'Java Advanced Concepts'
                ]
            elif 'python' in subject_lower:
                base_topics = [
                    'Python Fundamentals and Setup',
                    'Python Variables and Data Types',
                    'Python Control Flow and Functions',
                    'Python Data Structures and Libraries',
                    'Advanced Python Programming'
                ]
            elif 'javascript' in subject_lower:
                base_topics = [
                    'JavaScript Basics and DOM',
                    'JavaScript Functions and Variables',
                    'JavaScript Events and Interactivity',
                    'JavaScript Objects and Arrays',
                    'Modern JavaScript and Frameworks'
                ]
            else:
                base_topics = [
                    f'{subject} Programming Fundamentals',
                    f'{subject} Variables and Data Types',
                    f'{subject} Control Structures',
                    f'{subject} Functions and Methods',
                    f'Advanced {subject} Concepts'
                ]
        
        # Creative subjects
        elif any(creative in subject_lower for creative in ['photography', 'art', 'painting', 'drawing', 'design']):
            if 'photography' in subject_lower:
                base_topics = [
                    'Camera Basics and Settings',
                    'Composition and Framing',
                    'Lighting and Exposure',
                    'Photo Editing and Post-Processing',
                    'Advanced Photography Techniques'
                ]
            elif 'art' in subject_lower or 'painting' in subject_lower:
                base_topics = [
                    'Art Fundamentals and Materials',
                    'Color Theory and Mixing',
                    'Drawing and Sketching Techniques',
                    'Composition and Design Principles',
                    'Advanced Artistic Techniques'
                ]
            else:
                base_topics = [
                    f'{subject} Basics and Tools',
                    f'{subject} Fundamental Techniques',
                    f'{subject} Color and Composition',
                    f'{subject} Advanced Methods',
                    f'Professional {subject} Skills'
                ]
        
        # Cooking and culinary
        elif any(cook in subject_lower for cook in ['cooking', 'culinary', 'baking', 'chef', 'food']):
            base_topics = [
                'Kitchen Basics and Food Safety',
                'Fundamental Cooking Techniques',
                'Ingredient Knowledge and Preparation',
                'Recipe Development and Modification',
                'Advanced Culinary Skills'
            ]
        
        # Business subjects
        elif any(biz in subject_lower for biz in ['business', 'marketing', 'management', 'finance', 'economics']):
            if 'marketing' in subject_lower:
                base_topics = [
                    'Marketing Fundamentals',
                    'Market Research and Analysis',
                    'Digital Marketing Strategies',
                    'Brand Development and Management',
                    'Advanced Marketing Campaigns'
                ]
            elif 'business' in subject_lower:
                base_topics = [
                    'Business Fundamentals',
                    'Business Planning and Strategy',
                    'Operations and Management',
                    'Finance and Accounting Basics',
                    'Business Growth and Development'
                ]
            else:
                base_topics = [
                    f'{subject} Fundamentals',
                    f'{subject} Core Concepts',
                    f'{subject} Practical Applications',
                    f'{subject} Advanced Strategies',
                    f'Professional {subject} Skills'
                ]
        
        # Science subjects
        elif any(sci in subject_lower for sci in ['physics', 'chemistry', 'biology', 'science']):
            if 'physics' in subject_lower:
                base_topics = [
                    'Physics Fundamentals and Units',
                    'Motion and Forces',
                    'Energy and Work',
                    'Waves and Electromagnetic Radiation',
                    'Modern Physics Concepts'
                ]
            elif 'chemistry' in subject_lower:
                base_topics = [
                    'Atomic Structure and Periodic Table',
                    'Chemical Bonding and Reactions',
                    'States of Matter and Solutions',
                    'Acids, Bases, and pH',
                    'Organic Chemistry Basics'
                ]
            elif 'biology' in subject_lower:
                base_topics = [
                    'Cell Structure and Function',
                    'Genetics and Heredity',
                    'Evolution and Natural Selection',
                    'Ecology and Environment',
                    'Human Biology and Health'
                ]
            else:
                base_topics = [
                    f'{subject} Basic Principles',
                    f'{subject} Core Concepts',
                    f'{subject} Experimental Methods',
                    f'{subject} Applications',
                    f'Advanced {subject} Topics'
                ]
        
        # Generic approach for any other subject
        else:
            base_topics = [
                f'Introduction to {subject}',
                f'{subject} Fundamentals',
                f'Core {subject} Concepts',
                f'Practical {subject} Applications',
                f'Advanced {subject} Skills'
            ]
        
        # Customize based on weak areas if provided
        if weak_areas:
            customized_topics = []
            
            # Incorporate weak areas into topics
            for weak_area in weak_areas[:2]:
                custom_topic = f"{weak_area.title()} in {subject}"
                customized_topics.append(custom_topic)
            
            # Fill remaining slots with base topics
            for topic in base_topics:
                if len(customized_topics) >= 5:
                    break
                if not any(weak_area.lower() in topic.lower() for weak_area in weak_areas):
                    customized_topics.append(topic)
            
            return customized_topics[:5]
        
        return base_topics[:5]

    def _generate_custom_subject_topics(self, subject: str, weak_areas: List[str]) -> List[str]:
        """Generate learning topics for custom subjects"""
        
        if weak_areas:
            # Use weak areas to create focused topics
            topics = []
            for area in weak_areas[:3]:  # Use first 3 weak areas
                topics.append(f"{area.title()} in {subject}")
            
            # Add general progression topics
            topics.extend([
                f"Introduction to {subject}",
                f"Advanced {subject} Concepts"
            ])
            
            return topics
        else:
            # Generate general learning progression
            return [
                f"Introduction to {subject}",
                f"Basic {subject} Concepts", 
                f"Intermediate {subject} Topics",
                f"Advanced {subject} Applications",
                f"Practical {subject} Skills"
            ]

        def _get_resource_types_for_style(self, learning_style: str) -> List[str]:
            """Get preferred resource types for learning style"""
            
            style_preferences = {
                'visual': ['visual_lesson', 'diagram_tutorial', 'infographic_lesson', 'chart_explanation'],
                'auditory': ['audio_lesson', 'discussion_guide', 'verbal_explanation', 'story_lesson'],
                'reading': ['text_lesson', 'article', 'step_by_step_guide', 'detailed_explanation'],
                'kinesthetic': ['interactive_exercise', 'hands_on_activity', 'practice_problems', 'simulation']
            }
            
            return style_preferences.get(learning_style, ['lesson', 'tutorial', 'guide', 'practice'])
    
    def _generate_fallback_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int):
        """Generate fallback content when AI generation fails"""
        
        import uuid
        from .models import LearningContent
        
        # Comprehensive fallback content templates
        content_templates = {
            'variables and expressions': {
                1: {
                    'title': 'Understanding Variables in Algebra',
                    'content': self._get_variables_content(learning_style),
                    'summary': 'Learn what variables are and how they work in algebraic expressions.',
                    'objectives': ['Define what a variable represents', 'Identify variables in expressions', 'Use variables in real-world contexts']
                },
                2: {
                    'title': 'Working with Algebraic Expressions',
                    'content': self._get_expressions_content(learning_style),
                    'summary': 'Master the fundamentals of creating and manipulating algebraic expressions.',
                    'objectives': ['Create algebraic expressions', 'Simplify basic expressions', 'Translate word problems to expressions']
                }
            },
            'linear equations': {
                1: {
                    'title': 'Introduction to Linear Equations',
                    'content': self._get_linear_intro_content(learning_style),
                    'summary': 'Discover the basics of linear equations and their properties.',
                    'objectives': ['Identify linear equations', 'Understand the structure of linear equations', 'Recognize linear vs non-linear']
                },
                2: {
                    'title': 'Solving Linear Equations',
                    'content': self._get_linear_solving_content(learning_style),
                    'summary': 'Learn step-by-step methods to solve linear equations effectively.',
                    'objectives': ['Apply balance principle', 'Solve multi-step equations', 'Check solutions']
                }
            },
            'basic shapes and properties': {
                1: {
                    'title': 'Fundamental Geometric Shapes',
                    'content': self._get_shapes_content(learning_style),
                    'summary': 'Explore the basic building blocks of geometry: points, lines, and shapes.',
                    'objectives': ['Identify basic geometric shapes', 'Understand shape properties', 'Classify shapes by attributes']
                }
            },
            'introduction to trigonometry': {
                1: {
                    'title': 'Trigonometry Foundations',
                    'content': self._get_trig_intro_content(learning_style),
                    'summary': 'Begin your journey into trigonometry with right triangles and ratios.',
                    'objectives': ['Understand trigonometric ratios', 'Apply SOH CAH TOA', 'Solve right triangle problems']
                }
            },
            'limits and continuity': {
                1: {
                    'title': 'Understanding Limits',
                    'content': self._get_limits_content(learning_style),
                    'summary': 'Grasp the fundamental concept of limits in calculus.',
                    'objectives': ['Define limits conceptually', 'Evaluate basic limits', 'Understand limit notation']
                }
            }
        }
        
        # Find matching template
        topic_key = topic.lower()
        template_data = None
        
        for key, templates in content_templates.items():
            if key in topic_key or any(word in topic_key for word in key.split()):
                template_data = templates.get(difficulty, templates.get(1, templates[list(templates.keys())[0]]))
                break
        
        # Default template if no match found
        if not template_data:
            template_data = {
                'title': f'Learning {topic}',
                'content': f'This lesson covers the fundamentals of {topic}. Content is tailored for {learning_style} learners.',
                'summary': f'Introduction to {topic} concepts.',
                'objectives': [f'Understand {topic}', f'Apply {topic} concepts']
            }
        
        return LearningContent(
            id=str(uuid.uuid4()),
            title=template_data['title'],
            type=resource_type,
            content=template_data['content'],
            summary=template_data['summary'],
            difficulty_level=difficulty,
            learning_style=learning_style,
            topic=topic,
            estimated_duration=15,
            prerequisites=[],
            learning_objectives=template_data['objectives']
        )
    
    def _get_variables_content(self, learning_style: str) -> str:
        """Get variables content tailored to learning style"""
        
        base_content = """Welcome to the world of algebra! Let's explore variables - one of the most important concepts in mathematics.

What is a Variable?
A variable is a letter or symbol that represents an unknown number or a quantity that can change. Think of it as a container that can hold different values.

Why Use Variables?
Variables allow us to:
- Write general mathematical statements
- Solve problems with unknown quantities  
- Create formulas that work for many situations
- Express relationships between quantities"""

        if learning_style == 'visual':
            return base_content + """

Visual Examples:
Imagine variables as empty boxes:
[x] + 3 = 7
The box [x] contains some number that makes this equation true.

Picture a balance scale:
Left side: x + 3
Right side: 7
The scale balances when x = 4

Diagram Exercise:
Draw boxes and fill them with different numbers to see how variables work in expressions like 2x + 5."""

        elif learning_style == 'auditory':
            return base_content + """

Think About It:
Say this out loud: "x represents a mystery number"
Now say: "When I add 3 to my mystery number, I get 7"
What must the mystery number be?

Discussion Questions:
- How would you explain variables to a friend?
- Can you think of variables in everyday life?
- What's the difference between a variable and a regular number?

Listen and Learn:
Variables are like actors in a play - they can represent different characters (numbers) in different scenes (problems)."""

        elif learning_style == 'reading':
            return base_content + """

Detailed Explanation:
Variables serve as placeholders in mathematical expressions. The term "variable" comes from the word "vary," indicating that the value can change or vary depending on the context.

Key Points to Remember:
1. Variables are typically represented by letters (x, y, z, a, b, c)
2. The same variable in an expression represents the same value throughout
3. Different variables can represent different values
4. Variables can be replaced with actual numbers when their values are known

Written Practice:
Write three different expressions using the variable x. For each expression, explain in words what it means."""

        else:  # kinesthetic
            return base_content + """

Hands-On Activities:
1. Use physical objects (coins, blocks) to represent variables
2. Create a "variable box" - put different numbers in and see how expressions change
3. Act out word problems by walking through the steps

Interactive Exercise:
Step 1: Pick a number (this is your variable)
Step 2: Add 5 to it
Step 3: Multiply by 2
Step 4: Write this as an expression: 2(x + 5)

Real-World Connection:
Variables are like recipes - the ingredients (numbers) can change, but the process (expression) stays the same."""

    def _get_expressions_content(self, learning_style: str) -> str:
        """Get expressions content tailored to learning style"""
        
        base_content = """Algebraic expressions are combinations of variables, numbers, and operations that represent mathematical relationships.

Components of Expressions:
- Terms: Parts separated by + or - signs
- Coefficients: Numbers multiplied by variables  
- Constants: Numbers without variables
- Like terms: Terms with the same variable and power

Basic Operations:
- Addition: x + 5
- Subtraction: x - 3
- Multiplication: 4x or 4 × x
- Division: x/2 or x ÷ 2"""

        if learning_style == 'visual':
            return base_content + """

Visual Breakdown:
In the expression 3x + 2y - 5:
[3x] [+] [2y] [-] [5]
 ↓     ↓    ↓     ↓
term  op  term   constant

Color-Code Your Work:
- Variables in blue
- Coefficients in red  
- Constants in green
- Operations in black"""

        elif learning_style == 'auditory':
            return base_content + """

Say It Out Loud:
3x + 2y - 5 reads as:
"Three x plus two y minus five"

Rhythm and Patterns:
Clap while saying expressions to remember the pattern:
CLAP-x CLAP-plus CLAP-five
(coefficient)(variable)(operation)(number)

Verbal Practice:
Take turns reading expressions aloud and explaining what each part means."""

        else:
            return base_content + """

Detailed Analysis:
Expressions are like mathematical sentences. Each part has a specific role, similar to how words have roles in grammar.

Practice Building Expressions:
1. Start with a variable: x
2. Add a coefficient: 3x
3. Add another term: 3x + 7
4. Add more complexity: 3x + 7 - 2y

Step-by-Step Approach:
Break down complex expressions into smaller, manageable parts before trying to understand the whole."""

    def _get_linear_intro_content(self, learning_style: str) -> str:
        """Get linear equations introduction content"""
        
        base_content = """Linear equations are the foundation of algebra. They create straight lines when graphed and have many real-world applications.

Definition:
A linear equation is an equation where the highest power of any variable is 1.

Standard Form: ax + b = c
Where a, b, and c are numbers, and x is the variable.

Examples of Linear Equations:
- x + 3 = 7
- 2y - 5 = 11  
- 3z + 8 = 20
- 4w = 16"""

        if learning_style == 'visual':
            return base_content + """

Graph Visualization:
Linear equations create straight lines on a coordinate plane.

Key Visual Features:
- Always a straight line
- Has a constant slope (steepness)
- Crosses the y-axis at one point
- May or may not cross the x-axis

Identify Linear vs Non-Linear:
✓ Linear: x + 2 = 5
✗ Non-Linear: x² + 2 = 5 (has x²)
✗ Non-Linear: 1/x = 5 (has x in denominator)"""

        elif learning_style == 'auditory':
            return base_content + """

Remember the Rule:
"If the variable has power one, then linear is what we've done!"

Talk Through Examples:
Say each equation and identify why it's linear:
- "x plus three equals seven" - x has power 1
- "Two y minus five equals eleven" - y has power 1

Listen for Keywords:
Linear equations often come from phrases like:
"How many...", "What number...", "Find the value..."
"""

        else:
            return base_content + """

Systematic Identification:
To determine if an equation is linear, check:
1. Are all variables raised to the first power?
2. Are variables not in denominators?
3. Are variables not inside radicals?
4. Are variables not inside other functions?

If all answers are yes, the equation is linear.

Classification Practice:
Create a chart with "Linear" and "Non-Linear" columns and sort various equations."""

    def _get_linear_solving_content(self, learning_style: str) -> str:
        """Get linear equation solving content"""
        
        base_content = """Solving linear equations means finding the value of the variable that makes the equation true.

The Golden Rule: Balance
Whatever you do to one side of the equation, you must do to the other side.

Basic Steps:
1. Simplify both sides if needed
2. Get variable terms on one side
3. Get constants on the other side
4. Divide to get the variable alone
5. Check your answer

Example: 2x + 3 = 11
Step 1: 2x + 3 - 3 = 11 - 3
Step 2: 2x = 8
Step 3: x = 4"""

        if learning_style == 'visual':
            return base_content + """

Balance Scale Method:
Picture a balance scale with the equation:

[2x + 3] = [11]

When you subtract 3 from both sides:
[2x] = [8]

When you divide both sides by 2:
[x] = [4]

Visual Check:
Substitute back: 2(4) + 3 = 8 + 3 = 11 ✓"""

        elif learning_style == 'auditory':
            return base_content + """

Verbal Strategy:
Say each step out loud:
"I have 2x plus 3 equals 11"
"I subtract 3 from both sides"
"Now I have 2x equals 8"  
"I divide both sides by 2"
"So x equals 4"

Memory Phrase:
"Same operation, both sides, always applies"

Talk Through Your Work:
Explain each step to yourself or a study partner."""

        else:
            return base_content + """

Systematic Approach:
Follow this checklist for every linear equation:

□ Write the equation clearly
□ Identify the variable to solve for
□ Plan your steps before starting
□ Show each step with reasoning
□ Check your final answer
□ Verify the answer makes sense

Common Patterns:
- ax = b → x = b/a
- x + a = b → x = b - a  
- ax + b = c → x = (c - b)/a

Practice Template:
Original equation: ___________
Step 1: ___________
Step 2: ___________
Final answer: x = ___________
Check: ___________"""

    def _get_shapes_content(self, learning_style: str) -> str:
        """Get geometric shapes content"""
        
        base_content = """Geometry begins with understanding basic shapes and their properties.

Fundamental Elements:
- Point: A location with no size
- Line: Extends infinitely in both directions
- Line Segment: Part of a line with two endpoints
- Ray: Part of a line with one endpoint

Basic 2D Shapes:
- Triangle: 3 sides, 3 angles
- Rectangle: 4 sides, 4 right angles
- Square: 4 equal sides, 4 right angles
- Circle: All points equal distance from center"""

        if learning_style == 'visual':
            return base_content + """

Shape Recognition:
Look around your environment and identify:
- Rectangular windows and doors
- Circular clocks and wheels
- Triangular roof sections
- Square floor tiles

Visual Memory Aid:
Create mental pictures:
- Triangle = mountain peak
- Rectangle = book cover
- Circle = wheel
- Square = window pane"""

        elif learning_style == 'auditory':
            return base_content + """

Shape Songs and Rhymes:
"Triangle has three sides, three corners too
Rectangle's four sides, but square's sides are new
Circle goes around and around it goes
That's how our shape identification grows!"

Verbal Descriptions:
Practice describing shapes without showing them:
"I'm thinking of a shape with four equal sides and four right angles..."

Discussion Topics:
Talk about where you see each shape in daily life."""

        else:
            return base_content + """

Shape Classification System:
Organize shapes by properties:

By Number of Sides:
- 3 sides: Triangle
- 4 sides: Quadrilateral  
- More than 4: Polygon

By Angle Types:
- All right angles: Rectangle, Square
- Various angles: Triangle, Parallelogram

Measurement Activities:
Use rulers and protractors to measure real objects and classify their shapes."""

    def _get_trig_intro_content(self, learning_style: str) -> str:
        """Get trigonometry introduction content"""
        
        base_content = """Trigonometry is the study of relationships between angles and sides in triangles.

The Right Triangle Foundation:
Trigonometry starts with right triangles (triangles with a 90° angle).

Triangle Parts:
- Hypotenuse: Longest side (opposite the right angle)
- Opposite: Side across from the angle we're studying
- Adjacent: Side next to the angle we're studying

The Big Three Ratios:
- Sine (sin): opposite/hypotenuse
- Cosine (cos): adjacent/hypotenuse  
- Tangent (tan): opposite/adjacent

Memory Device: SOH CAH TOA"""

        if learning_style == 'visual':
            return base_content + """

Visual Triangle Setup:
Draw a right triangle and label:
    /|
   / |
  /  | opposite
 /   |
/___|
adjacent

Color Coding:
- Hypotenuse in red
- Opposite in blue  
- Adjacent in green

Visual SOH CAH TOA:
Create a diagram with the ratios clearly labeled for each trigonometric function."""

        elif learning_style == 'auditory':
            return base_content + """

SOH CAH TOA Chant:
"SOH CAH TOA, helps me every day!
Sine is opposite over hypotenuse, hip hip hooray!
Cosine is adjacent over hypotenuse, that's the way!
Tangent is opposite over adjacent, so they say!"

Pronunciation Guide:
- Sine: "sign"
- Cosine: "co-sign"  
- Tangent: "tan-jent"

Verbal Practice:
Say the ratios out loud while pointing to triangle parts."""

        else:
            return base_content + """

Systematic Setup:
For any right triangle problem:

Step 1: Draw and label the triangle
Step 2: Identify the given angle
Step 3: Label opposite, adjacent, hypotenuse relative to that angle
Step 4: Choose the appropriate ratio
Step 5: Set up the equation
Step 6: Solve

Reference Card:
Create a study card with:
- SOH CAH TOA
- Sample triangle with labels
- Common angle values (30°, 45°, 60°)"""

    def _get_limits_content(self, learning_style: str) -> str:
        """Get limits content for calculus"""
        
        base_content = """Limits are the foundation of calculus, describing what happens to function values as inputs approach a certain point.

What is a Limit?
A limit describes the value that a function approaches as the input gets arbitrarily close to some number.

Notation: lim[x→a] f(x) = L
Reads: "The limit of f(x) as x approaches a equals L"

Key Concept:
We care about what happens NEAR a point, not necessarily AT the point.

Example:
As x gets closer to 2, what does x² approach?
When x = 1.9: (1.9)² = 3.61
When x = 1.99: (1.99)² = 3.9601  
When x = 2.01: (2.01)² = 4.0401
When x = 2.1: (2.1)² = 4.41

The limit is 4."""

        if learning_style == 'visual':
            return base_content + """

Graph Visualization:
Picture a graph of y = x²:
- As x approaches 2 from the left, y approaches 4
- As x approaches 2 from the right, y approaches 4
- The function "aims" toward the point (2, 4)

Table Method:
Create tables showing x values getting closer to the target and observe where y values are heading.

Graphical Approach:
Use graphing tools to zoom in on the point of interest."""

        elif learning_style == 'auditory':
            return base_content + """

Think Out Loud:
"As x gets closer and closer to 2, what does x-squared get closer and closer to?"

Verbal Explanation:
Practice explaining limits to someone else:
"Imagine walking toward a wall - you get closer and closer but never quite touch it. Limits are like that wall."

Discussion Method:
Talk through limit problems step by step, explaining your reasoning at each stage."""

        else:
            return base_content + """

Systematic Limit Evaluation:

Method 1: Direct Substitution
If the function is continuous at the point, substitute directly.

Method 2: Table of Values  
Create a table with x-values approaching the target from both sides.

Method 3: Algebraic Manipulation
Simplify the expression to remove problematic forms.

Practice Framework:
1. Identify the limit to evaluate
2. Try direct substitution
3. If that fails, use algebraic techniques
4. Verify with a table or graph
5. State the final answer clearly"""

    def generate_learning_path(self, learner_profile: LearnerProfile, available_resources: List[LearningResource]) -> List[str]:
        """Legacy method for compatibility - delegates to new method"""
        print("⚠️ Using legacy generate_learning_path method")
        return []  # This won't be used in the new system