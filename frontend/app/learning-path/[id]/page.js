'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { getLearningStyleName } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function LearningPathPage({ params }) {
  const router = useRouter();
  const { id: learnerId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [pathData, setPathData] = useState(null);
  const [currentResource, setCurrentResource] = useState(null);

  useEffect(() => {
    if (learnerId) {
      loadLearningPath();
    }
  }, [learnerId]);

  const loadLearningPath = async () => {
    try {
      setIsLoading(true);
      console.log('Loading learning path for learner:', learnerId);
      
      const response = await apiClient.getLearningPath(learnerId);
      console.log('Learning path response:', response);
      
      if (response.success && response.data) {
        setPathData(response.data);
        setCurrentResource(response.data.current_resource);
      } else {
        throw new Error(response.error || 'Failed to load learning path');
      }
    } catch (error) {
      console.error('Error loading learning path:', error);
      toast.error('Failed to load learning path');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLearning = () => {
    if (currentResource?.id) {
      router.push(`/resource/${currentResource.id}?learner=${learnerId}`);
    } else {
      toast.error('No learning resource available');
    }
  };

  const handleViewQuiz = () => {
    if (currentResource?.id) {
      router.push(`/quiz/${currentResource.id}?learner=${learnerId}`);
    } else {
      toast.error('No quiz available');
    }
  };

  const handleViewProgress = () => {
    router.push(`/progress/${learnerId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Learning Path Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find your learning path. Please create a new profile.
            </p>
            <Button onClick={() => router.push('/create-profile')} className="w-full">
              <span className="mr-2">👤</span>
              Create New Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = pathData.total_resources > 0 
    ? (pathData.current_position / pathData.total_resources) * 100 
    : 0;

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
                <span className="text-2xl mr-3">📚</span>
                Your Learning Journey
              </h1>
              <p className="text-gray-600 mt-1">
                AI-generated personalized learning path
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-3">📊</span>
              Learning Progress
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <span className="font-medium">Overall Progress</span>
                  <span className="font-bold">{Math.round(progressPercentage)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 shadow-sm flex items-center justify-end pr-2"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {progressPercentage > 10 && (
                      <span className="text-white text-xs">🔥</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Resource */}
        {currentResource ? (
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-3">▶️</span>
                Current Learning Resource
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-4xl">
                        {currentResource.type === 'lesson' ? '📖' : 
                         currentResource.type === 'interactive' ? '🎮' : 
                         currentResource.type === 'video_script' ? '🎥' : '📝'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {currentResource.title}
                    </h3>
                    
                    {currentResource.summary && (
                      <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                        {currentResource.summary}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📖</span>
                        <span>Type: {currentResource.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>🎯</span>
                        <span>Topic: {currentResource.topic}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>🏆</span>
                        <span>Level: {currentResource.difficulty_level}/5</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>⏱️</span>
                        <span>{currentResource.estimated_duration || 15} min</span>
                      </div>
                    </div>

                    {currentResource.learning_objectives && currentResource.learning_objectives.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {currentResource.learning_objectives.map((objective, index) => (
                            <li key={index} className="text-gray-600">{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <span className="mr-1">🧠</span>
                        {getLearningStyleName(currentResource.learning_style)}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <span className="mr-1">📖</span>
                        {currentResource.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    onClick={handleStartLearning} 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                    size="lg"
                  >
                    <span className="mr-2">📖</span>
                    Start Learning
                  </Button>
                  <Button 
                    onClick={handleViewQuiz}
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    size="lg"
                  >
                    <span className="mr-2">📝</span>
                    Take Quiz
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleViewProgress}
                    className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                    size="lg"
                  >
                    <span className="mr-2">📊</span>
                    View Progress
                    </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       ) : (
         <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
           <CardContent className="text-center py-16">
             <div className="text-8xl mb-6">🏆</div>
             <h2 className="text-3xl font-bold text-gray-900 mb-4">
               Congratulations! 🎉
             </h2>
             <h3 className="text-xl font-semibold text-gray-700 mb-4">
               You've completed all learning resources!
             </h3>
             <p className="text-gray-600 mb-8 max-w-md mx-auto">
               Amazing work on finishing your personalized learning path. You've shown dedication and commitment to your education.
             </p>
             <Button 
               onClick={handleViewProgress}
               className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
               size="lg"
             >
               <span className="mr-2">🏆</span>
               View Your Achievements
             </Button>
           </CardContent>
         </Card>
       )}

       {/* Learning Path Overview */}
       <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
         <CardHeader>
           <h2 className="text-2xl font-bold text-gray-900 flex items-center">
             <span className="text-2xl mr-3">🛤️</span>
             AI-Generated Learning Path
           </h2>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {pathData.all_resources && pathData.all_resources.map((resourceId, index) => {
               const isCompleted = index < pathData.current_position;
               const isCurrent = index === pathData.current_position;
               const isUpcoming = index > pathData.current_position;
               
               // Get resource details if it's the current one
               const resourceDetails = isCurrent ? currentResource : null;
               
               return (
                 <div 
                   key={index}
                   className={`flex items-center space-x-4 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                     isCompleted
                       ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-sm' 
                       : isCurrent
                       ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300 shadow-lg ring-2 ring-purple-200 transform scale-105'
                       : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
                     isCompleted
                       ? 'bg-green-500 text-white' 
                       : isCurrent
                       ? 'bg-purple-500 text-white animate-pulse'
                       : 'bg-gray-300 text-gray-600'
                   }`}>
                     {isCompleted ? '✅' : isCurrent ? '▶️' : '⏰'}
                   </div>
                   
                   <div className="flex-1">
                     <div className="font-bold text-lg text-gray-900 mb-2">
                       {resourceDetails?.title || `Learning Resource ${index + 1}`}
                     </div>
                     
                     {resourceDetails?.summary && (
                       <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                         {resourceDetails.summary}
                       </p>
                     )}
                     
                     <div className="flex items-center space-x-4 text-sm">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                         isCompleted
                           ? 'bg-green-100 text-green-700 border border-green-200'
                           : isCurrent
                           ? 'bg-purple-100 text-purple-700 border border-purple-200'
                           : 'bg-gray-100 text-gray-600 border border-gray-200'
                       }`}>
                         {isCompleted ? '✅ Completed' : isCurrent ? '▶️ In Progress' : '⏰ Upcoming'}
                       </span>
                       
                       {resourceDetails && (
                         <>
                           <span className="text-gray-400">•</span>
                           <span className="text-gray-600 capitalize flex items-center">
                             <span className="mr-1">
                               {resourceDetails.type === 'lesson' ? '📖' : 
                                resourceDetails.type === 'interactive' ? '🎮' : 
                                resourceDetails.type === 'video_script' ? '🎥' : '📝'}
                             </span>
                             {resourceDetails.type.replace('_', ' ')}
                           </span>
                           <span className="text-gray-400">•</span>
                           <span className="text-gray-600">
                             Level {resourceDetails.difficulty_level}/5
                           </span>
                           <span className="text-gray-400">•</span>
                           <span className="text-gray-600">
                             {resourceDetails.estimated_duration || 15} min
                           </span>
                         </>
                       )}
                     </div>
                     
                     {resourceDetails?.learning_objectives && resourceDetails.learning_objectives.length > 0 && (
                       <div className="mt-3">
                         <div className="text-xs text-gray-500 mb-1">Learning Objectives:</div>
                         <div className="flex flex-wrap gap-1">
                           {resourceDetails.learning_objectives.slice(0, 3).map((objective, i) => (
                             <span 
                               key={i} 
                               className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                             >
                               {objective}
                             </span>
                           ))}
                           {resourceDetails.learning_objectives.length > 3 && (
                             <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                               +{resourceDetails.learning_objectives.length - 3} more
                             </span>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                   
                   <div className="flex flex-col space-y-2">
                     {isCurrent && (
                       <>
                         <Button
                           onClick={handleStartLearning}
                           size="sm"
                           className="bg-purple-600 hover:bg-purple-700 text-white"
                         >
                           <span className="mr-1">📖</span>
                           Learn
                         </Button>
                         <Button
                           onClick={handleViewQuiz}
                           size="sm"
                           variant="outline"
                           className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                         >
                           <span className="mr-1">📝</span>
                           Quiz
                         </Button>
                       </>
                     )}
                     
                     {isCompleted && (
                       <Button
                         onClick={() => router.push(`/resource/${resourceId}?learner=${learnerId}`)}
                         size="sm"
                         variant="outline"
                         className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                       >
                         <span className="mr-1">👁️</span>
                         Review
                       </Button>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
           
           {/* AI Generation Notice */}
           <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
             <div className="flex items-center space-x-3">
               <div className="text-2xl">🤖</div>
               <div>
                 <h4 className="font-semibold text-blue-900 mb-1">
                   AI-Powered Personalization
                 </h4>
                 <p className="text-blue-800 text-sm">
                   This learning path was dynamically generated by our AI based on your learning style, 
                   knowledge level, and focus areas. Each resource is tailored specifically for you!
                 </p>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Action Buttons */}
       <div className="mt-8 flex justify-center space-x-4">
         <Button 
           variant="outline" 
           onClick={() => router.push('/')}
           className="border-gray-300 text-gray-600 hover:bg-gray-100"
         >
           <span className="mr-2">←</span>
           Back to Home
         </Button>
         {currentResource && (
           <Button 
             onClick={handleStartLearning}
             className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
           >
             <span className="mr-2">▶️</span>
             Continue Learning
           </Button>
         )}
       </div>
     </div>
   </div>
 );
}