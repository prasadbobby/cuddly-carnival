'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { getScoreColor } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function QuizPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: resourceId } = params;
  const learnerId = searchParams.get('learner');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (resourceId) {
      loadQuiz();
    }
  }, [resourceId]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      console.log('Loading quiz for resource:', resourceId);
      
      const response = await apiClient.getResourceQuiz(resourceId);
      console.log('Quiz response:', response);
      
      if (response.success && response.data) {
        setQuiz(response.data);
        // Initialize answers
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        throw new Error(response.error || 'Failed to load quiz');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    const answeredQuestions = Object.values(answers).filter(answer => answer !== '').length;
    if (answeredQuestions < quiz.questions.length) {
      toast.error(`Please answer all questions. ${answeredQuestions}/${quiz.questions.length} completed.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty answers
      const finalAnswers = Object.fromEntries(
        Object.entries(answers).filter(([_, answer]) => answer !== '')
      );

      console.log('Submitting quiz answers:', finalAnswers);
      
      const response = await apiClient.submitQuiz(quiz.quiz_id, learnerId, finalAnswers);
      console.log('Quiz submission response:', response);
      
      if (response.success && response.data) {
        setResults(response.data);
        setShowResults(true);
        toast.success('Quiz completed successfully!');
      } else {
        throw new Error(response.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (learnerId) {
      router.push(`/learning-path/${learnerId}`);
    } else {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No quiz available</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Results
            </h1>
            <p className="text-gray-600">
              Here's how you performed
            </p>
          </div>

          <Card className="mb-8 animate-fade-in">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Overall Performance
              </h2>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(results.overall_feedback.average_score)}`}>
                  {Math.round(results.overall_feedback.average_score)}%
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.overall_feedback.correct_answers}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.overall_feedback.total_questions - results.overall_feedback.correct_answers}
                    </div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Recommendation
                  </h3>
                  <p className="text-gray-600">
                    {results.overall_feedback.recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 animate-slide-up">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Feedback
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.is_correct 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        result.is_correct 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {result.is_correct ? '✓' : '✗'}
                      </span>
                      <span className="font-medium text-gray-900">
                        Question {index + 1} - {result.topic}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      {result.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={handleContinue} size="lg">
              Continue Learning Path
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Knowledge Check
          </h1>
          <p className="text-gray-600">
            Test your understanding of the learning material
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Quiz Questions
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-8">
              {quiz.questions.map((question, questionIndex) => (
                <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Question {questionIndex + 1}
                    </h3>
                    <p className="text-gray-700">{question.question}</p>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          answers[question.id] === option
                            ? 'bg-primary-50 border-primary-300'
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Back to Learning Path
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={Object.values(answers).filter(answer => answer !== '').length < quiz.questions.length}
                >
                  Submit Quiz
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Questions answered: {Object.values(answers).filter(answer => answer !== '').length} of {quiz.questions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.values(answers).filter(answer => answer !== '').length / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}