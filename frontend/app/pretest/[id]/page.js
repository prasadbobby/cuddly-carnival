'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PretestPage({ params }) {
  const router = useRouter();
  const { id: learnerId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pretest, setPretest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    if (learnerId) {
      conductPretest();
    }
  }, [learnerId]);

  const conductPretest = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.conductPretest(learnerId, 'algebra');
      
      if (response.success) {
        console.log('Pretest response:', response);
        setPretest(response);
        // Initialize answers object to track completion
        const initialAnswers = {};
        response.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        throw new Error(response.error || 'Failed to load pretest');
      }
    } catch (error) {
      console.error('Error conducting pretest:', error);
      toast.error('Failed to load pretest');
      router.push('/');
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

  const handleNextQuestion = () => {
    const currentQuestionId = pretest.questions[currentQuestion].id;
    const currentAnswer = answers[currentQuestionId];
    
    if (!currentAnswer) {
      toast.error('Please select an answer before continuing');
      return;
    }

    if (currentQuestion < pretest.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleQuestionJump = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const handleSubmit = async () => {
    const currentQuestionId = pretest.questions[currentQuestion].id;
    const currentAnswer = answers[currentQuestionId];
    
    if (!currentAnswer) {
      toast.error('Please select an answer before submitting');
      return;
    }

    // Check if all questions have been answered
    const answeredCount = Object.values(answers).filter(answer => answer !== '').length;
    const totalQuestions = pretest.questions.length;

    if (answeredCount < totalQuestions) {
      const unansweredQuestions = pretest.questions
        .map((q, index) => answers[q.id] ? null : index + 1)
        .filter(q => q !== null);
      
      toast.error(`Please answer all questions. Missing: Question ${unansweredQuestions.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty answers
      const finalAnswers = Object.fromEntries(
        Object.entries(answers).filter(([_, answer]) => answer !== '')
      );

      console.log('Submitting answers:', finalAnswers);
      
      const response = await apiClient.submitPretest(pretest.pretest_id, finalAnswers);
      
      if (response.success) {
        toast.success('Pretest completed successfully!');
        router.push(`/learning-path/${learnerId}`);
      } else {
        throw new Error(response.error || 'Failed to submit pretest');
      }
    } catch (error) {
      console.error('Error submitting pretest:', error);
      toast.error(error.message || 'Failed to submit pretest');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Loading your pretest...</p>
        </div>
      </div>
    );
  }

  if (!pretest || !pretest.questions || pretest.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No questions available</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const question = pretest.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / pretest.questions.length) * 100;
  const answeredCount = Object.values(answers).filter(answer => answer !== '').length;
  const currentAnswer = answers[question.id] || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pre-Assessment
          </h1>
          <p className="text-gray-600">
            This helps us understand your current knowledge level
          </p>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Question {currentQuestion + 1} of {pretest.questions.length}
            </p>
            <p className="text-xs text-gray-400">
              Answered: {answeredCount}/{pretest.questions.length}
            </p>
          </div>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Question {currentQuestion + 1}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-lg text-gray-900 leading-relaxed">
                {question.question}
              </div>

              <div className="space-y-3">
                {question.options && question.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      currentAnswer === option
                        ? 'bg-primary-50 border-primary-300'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 flex-1">{option}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="secondary"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                <div className="flex space-x-3">
                  {currentQuestion < pretest.questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={!currentAnswer}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      disabled={answeredCount < pretest.questions.length}
                      variant="success"
                    >
                      Complete Assessment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question navigation */}
        <div className="mt-6 flex justify-center">
          <div className="flex flex-wrap gap-2 justify-center">
            {pretest.questions.map((q, index) => {
              const isAnswered = answers[q.id] && answers[q.id] !== '';
              const isCurrent = index === currentQuestion;
              
              return (
                <button
                  key={index}
                  onClick={() => handleQuestionJump(index)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                      : isAnswered
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {pretest.questions.map((q, index) => {
            const isAnswered = answers[q.id] && answers[q.id] !== '';
            const isCurrent = index === currentQuestion;
            
            return (
              <div
                key={index}
                className={`h-3 rounded-full transition-colors ${
                  isCurrent
                    ? isAnswered
                      ? 'bg-primary-500'
                      : 'bg-yellow-500'
                    : isAnswered
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              ></div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Click on question numbers to jump between questions. 
            Green indicates completed questions.
          </p>
        </div>
      </div>
    </div>
  );
}