'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Button from '../../../components/ui/Button';
import { formatDate, getLearningStyleName } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function ProgressPage({ params }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    if (params.id) {
      loadProgress();
    }
  }, [params.id]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      console.log('Loading progress for learner:', params.id);
      
      const response = await apiClient.getLearnerProgress(params.id);
      console.log('Progress response:', response);
      
      if (response.success && response.data) {
        setProgressData(response.data);
      } else {
        throw new Error(response.error || 'Failed to load progress');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('Failed to load progress');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 text-lg">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No progress data found</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { learner_profile, learning_path, progress_details } = progressData;
  const progressEntries = Object.entries(progress_details || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
            >
              <span className="mr-2">←</span>
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-3">👤</span>
                {learner_profile.name}'s Progress
              </h1>
              <p className="text-gray-600 mt-1">
                Track learning journey and achievements
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/learning-path/${params.id}`)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
          >
            <span className="mr-2">▶️</span>
            Continue Learning
          </Button>
        </div>

        {/* Learner Info Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{learner_profile.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>📚</span>
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium capitalize">{learner_profile.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🎯</span>
                    <span className="text-gray-600">Style:</span>
                    <span className="font-medium">{getLearningStyleName(learner_profile.learning_style)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⭐</span>
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium">{learner_profile.knowledge_level}/5</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium">{formatDate(learner_profile.created_at)}</span>
                  </div>
                </div>
                {learner_profile.weak_areas && learner_profile.weak_areas.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 mr-2">Focus Areas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {learner_profile.weak_areas.map((area, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📈</div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(learning_path.completion_percentage)}%
             </div>
             <div className="text-sm text-blue-700 font-medium">Overall Progress</div>
             <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
               <div 
                 className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                 style={{ width: `${learning_path.completion_percentage}%` }}
               ></div>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
           <CardContent className="p-6 text-center">
             <div className="text-4xl mb-3">🔥</div>
             <div className="text-3xl font-bold text-green-600 mb-2">
               {learning_path.completed_resources}
             </div>
             <div className="text-sm text-green-700 font-medium">Resources Completed</div>
             <div className="text-xs text-green-600 mt-2">
               Keep it up!
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
           <CardContent className="p-6 text-center">
             <div className="text-4xl mb-3">🏆</div>
             <div className="text-3xl font-bold text-purple-600 mb-2">
               {progressEntries.length > 0 
                 ? Math.round(progressEntries.reduce((sum, [_, data]) => sum + data.average_score, 0) / progressEntries.length)
                 : 0
               }%
             </div>
             <div className="text-sm text-purple-700 font-medium">Average Score</div>
             <div className="text-xs text-purple-600 mt-2">
               {progressEntries.length} quiz{progressEntries.length !== 1 ? 'es' : ''} completed
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
           <CardContent className="p-6 text-center">
             <div className="text-4xl mb-3">📚</div>
             <div className="text-3xl font-bold text-orange-600 mb-2">
               {learning_path.total_resources - learning_path.completed_resources}
             </div>
             <div className="text-sm text-orange-700 font-medium">Remaining</div>
             <div className="text-xs text-orange-600 mt-2">
               Keep learning!
             </div>
           </CardContent>
         </Card>
       </div>

       <div className="grid lg:grid-cols-2 gap-8">
         {/* Quiz Results */}
         <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
           <CardHeader>
             <h2 className="text-2xl font-bold text-gray-900 flex items-center">
               <span className="text-2xl mr-3">📊</span>
               Quiz Performance
             </h2>
           </CardHeader>
           <CardContent>
             {progressEntries.length === 0 ? (
               <div className="text-center py-12">
                 <div className="text-6xl mb-4">🎓</div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
                   No quizzes completed yet
                 </h3>
                 <p className="text-gray-600 mb-4">
                   Complete your first quiz to see your performance here
                 </p>
                 <Button 
                   onClick={() => router.push(`/learning-path/${params.id}`)} 
                   size="sm"
                 >
                   Start Learning
                 </Button>
               </div>
             ) : (
               <div className="space-y-4 max-h-96 overflow-y-auto">
                 {progressEntries.map(([resourceId, data], index) => (
                   <div 
                     key={resourceId} 
                     className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                   >
                     <div className="flex items-center space-x-3">
                       <div className={`p-2 rounded-lg ${
                         data.average_score >= 80 
                           ? 'bg-green-100 text-green-600' 
                           : data.average_score >= 60 
                           ? 'bg-yellow-100 text-yellow-600'
                           : 'bg-red-100 text-red-600'
                       }`}>
                         <span className="text-lg">
                           {data.average_score >= 80 ? '✅' : '❌'}
                         </span>
                       </div>
                       <div>
                         <div className="font-medium text-gray-900">
                           Quiz #{index + 1}
                         </div>
                         <div className="text-sm text-gray-600">
                           {data.total_questions} questions • {data.correct_answers} correct
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className={`text-2xl font-bold ${
                         data.average_score >= 80 
                           ? 'text-green-600' 
                           : data.average_score >= 60 
                           ? 'text-yellow-600'
                           : 'text-red-600'
                       }`}>
                         {Math.round(data.average_score)}%
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>

         {/* Learning Insights */}
         <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
           <CardHeader>
             <h2 className="text-2xl font-bold text-gray-900 flex items-center">
               <span className="text-2xl mr-3">💡</span>
               Learning Insights
             </h2>
           </CardHeader>
           <CardContent>
             <div className="space-y-6">
               <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                 <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                   <span className="mr-2">🎯</span>
                   Learning Style Match
                 </h3>
                 <p className="text-blue-800 text-sm">
                   Your {getLearningStyleName(learner_profile.learning_style)} learning style is perfectly matched 
                   with personalized content designed for optimal comprehension.
                 </p>
               </div>

               <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                 <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                   <span className="mr-2">📈</span>
                   Progress Trend
                 </h3>
                 <p className="text-green-800 text-sm">
                   {learning_path.completion_percentage > 50 
                     ? "Excellent progress! You're more than halfway through your learning journey."
                     : "Great start! Keep up the momentum to reach your learning goals."
                   }
                 </p>
               </div>

               <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                 <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                   <span className="mr-2">🧠</span>
                   AI Recommendations
                 </h3>
                 <p className="text-purple-800 text-sm">
                   {progressEntries.length > 0 
                     ? "Based on your quiz performance, focus on consistent practice to maintain your learning momentum."
                     : "Complete your first quiz to receive personalized AI-powered learning recommendations."
                   }
                 </p>
               </div>

               {learner_profile.weak_areas && learner_profile.weak_areas.length > 0 && (
                 <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                   <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                     <span className="mr-2">🎯</span>
                     Focus Areas
                   </h3>
                   <p className="text-yellow-800 text-sm mb-2">
                     Your personalized path emphasizes these key areas:
                   </p>
                   <div className="flex flex-wrap gap-1">
                     {learner_profile.weak_areas.map((area, index) => (
                       <span 
                         key={index} 
                         className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium"
                       >
                         {area}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Action Cards */}
       <div className="mt-8 grid md:grid-cols-2 gap-6">
         <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
           <CardContent className="p-8 text-center">
             <div className="text-6xl mb-4">🚀</div>
             <h3 className="text-xl font-bold text-gray-900 mb-3">
               Continue Your Journey
             </h3>
             <p className="text-gray-600 mb-6">
               Pick up where you left off and continue making progress on your personalized learning path.
             </p>
             <Button 
               onClick={() => router.push(`/learning-path/${params.id}`)}
               className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
             >
               <span className="mr-2">▶️</span>
               Resume Learning
             </Button>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
           <CardContent className="p-8 text-center">
             <div className="text-6xl mb-4">📊</div>
             <h3 className="text-xl font-bold text-gray-900 mb-3">
               View All Analytics
             </h3>
             <p className="text-gray-600 mb-6">
               Explore detailed analytics and insights about learning patterns across all users.
             </p>
             <Button 
               onClick={() => router.push('/admin')}
               variant="outline"
               className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
             >
               <span className="mr-2">📈</span>
               Admin Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     </div>
   </div>
 );
}