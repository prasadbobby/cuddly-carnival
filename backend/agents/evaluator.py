# agents/evaluator.py
from typing import Dict, List, Any
from .content_generator import GeminiClient
from .models import QuizQuestion

class EvaluatorAgent:
    """AI Agent for evaluating quiz responses and providing feedback using Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.agent_name = "QuizEvaluator"
        self.system_context = """You are an educational assessment expert. 
        Your role is to evaluate quiz responses and provide constructive, encouraging feedback."""
    
    def evaluate_quiz_response(self, question: QuizQuestion, user_answer: str) -> Dict[str, Any]:
        """Evaluate quiz response using Gemini AI"""
        
        is_correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
        
        try:
            prompt = f"""{self.system_context}

TASK: Provide educational feedback for this quiz question.

QUESTION: {question.question}
OPTIONS: {', '.join(question.options)}
CORRECT ANSWER: {question.correct_answer}
USER ANSWER: {user_answer}
RESULT: {'CORRECT' if is_correct else 'INCORRECT'}

Write helpful, encouraging feedback (2-3 sentences) that:
1. Explains why the answer is correct/incorrect
2. Provides a learning tip or concept explanation
3. Encourages continued learning

Keep the tone positive and educational. Return only the feedback text without any additional formatting:"""
            
            response = self.gemini.generate(prompt, max_tokens=300)
            feedback = response.strip() if response else f"Your answer is {'correct' if is_correct else 'incorrect'}."
            
        except Exception as e:
            print(f"❌ Error generating feedback: {e}")
            feedback = f"Your answer is {'correct' if is_correct else 'incorrect'}. The correct answer is {question.correct_answer}."
        
        return {
            'is_correct': is_correct,
            'feedback': feedback,
            'topic': question.topic,
            'score': 100 if is_correct else 0
        }
    
    def generate_overall_feedback(self, quiz_results: List[Dict]) -> Dict[str, Any]:
        """Generate overall feedback for quiz performance using Gemini AI"""
        if not quiz_results:
            return {
                'average_score': 0,
                'total_questions': 0,
                'correct_answers': 0,
                'weak_topics': [],
                'strong_topics': [],
                'recommendation': 'No quiz data available'
            }
        
        total_score = sum(r.get('score', 0) for r in quiz_results)
        average_score = total_score / len(quiz_results)
        
        weak_topics = [r['topic'] for r in quiz_results if not r.get('is_correct', False)]
        strong_topics = [r['topic'] for r in quiz_results if r.get('is_correct', False)]
        
        try:
            prompt = f"""{self.system_context}

TASK: Provide an encouraging recommendation based on quiz performance.

PERFORMANCE DATA:
- Score: {average_score:.1f}%
- Correct: {len(strong_topics)}/{len(quiz_results)}
- Strong areas: {list(set(strong_topics))}
- Areas to improve: {list(set(weak_topics))}

Write an encouraging 1-2 sentence recommendation that:
1. Acknowledges their effort
2. Provides specific guidance for improvement
3. Motivates continued learning

Return only the recommendation text without any additional formatting:"""
            
            response = self.gemini.generate(prompt, max_tokens=200)
            recommendation = response.strip() if response else (
                'Great job! Keep up the good work!' if average_score >= 70 else 'Keep practicing to improve your understanding!'
            )
            
        except Exception as e:
            print(f"❌ Error generating recommendation: {e}")
            recommendation = 'Great job! Keep up the good work!' if average_score >= 70 else 'Keep practicing to improve!'
        
        return {
            'average_score': average_score,
            'total_questions': len(quiz_results),
            'correct_answers': len(strong_topics),
            'weak_topics': list(set(weak_topics)),
            'strong_topics': list(set(strong_topics)),
            'recommendation': recommendation
        }