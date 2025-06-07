'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import YouTubeEmbed from '../../../components/ui/YouTubeEmbed';
import TextToSpeech from '../../../components/ui/TextToSpeech';
import MarkdownRenderer from '../../../components/ui/MarkdownRenderer';
import { getLearningStyleName } from '../../../lib/utils';
import toast from 'react-hot-toast';
import VisualExample from '../../../components/ui/VisualExample';

export default function ResourcePage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: resourceId } = params;
  const learnerId = searchParams.get('learner');
  
  const [isLoading, setIsLoading] = useState(true);
  const [resource, setResource] = useState(null);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (resourceId) {
      loadResource();
    }
  }, [resourceId]);

  const loadResource = async () => {
    try {
      setIsLoading(true);
      console.log('Loading resource:', resourceId);
      
      const response = await apiClient.getResource(resourceId);
      console.log('Resource response:', response);
      
      if (response.success && response.data) {
        setResource(response.data);
        
        // If it's a visual learner, automatically search for YouTube videos
        if (response.data.learning_style === 'visual') {
          searchYouTubeVideos(response.data.title);
        }
      } else {
        throw new Error(response.error || 'Failed to load resource');
      }
    } catch (error) {
      console.error('Error loading resource:', error);
      toast.error('Failed to load learning resource');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const searchYouTubeVideos = async (title) => {
    try {
      setLoadingVideos(true);
      console.log('🎥 Searching YouTube for:', title);
      
      const response = await apiClient.searchYouTube(title);
      
      if (response.success && response.videos && response.videos.length > 0) {
        setYoutubeVideos(response.videos);
        console.log('✅ Found YouTube videos:', response.videos);
        // toast.success(`Found ${response.videos.length} educational videos!`);
      } else {
        console.log('⚠️ No YouTube videos found');
        toast.info('No videos found for this topic');
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast.error('Could not load YouTube videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleTakeQuiz = () => {
    if (learnerId) {
      router.push(`/quiz/${resourceId}?learner=${learnerId}`);
    } else {
      toast.error('Learner ID not found');
    }
  };

  const handleBackToPath = () => {
    if (learnerId) {
      router.push(`/learning-path/${learnerId}`);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Loading learning content...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h2>
            <p className="text-gray-600 mb-6">
              The learning resource you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.back()} className="w-full">
              <span className="mr-2">←</span>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToPath}
              className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
            >
              <span className="mr-2">←</span>
              Back to Path
            </Button>
          </div>
          <Button
            onClick={handleTakeQuiz}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <span className="mr-2">📝</span>
            Take Quiz
          </Button>
        </div>

        {/* Resource Header */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6 mb-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-5xl">
                    {resource.learning_style === 'visual' ? '👁️' :
                     resource.learning_style === 'auditory' ? '🔊' :
                     resource.type === 'interactive' ? '🎮' : 
                     resource.type === 'video_script' ? '🎥' : '📝'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {resource.title}
                </h1>
                
                {resource.summary && (
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {resource.summary}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-lg">📖</span>
                    <div>
                      <div className="text-xs text-gray-500">Type</div>
                      <div className="font-medium capitalize">{resource.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-lg">🎯</span>
                    <div>
                      <div className="text-xs text-gray-500">Topic</div>
                      <div className="font-medium capitalize">{resource.topic}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="text-xs text-gray-500">Difficulty</div>
                      <div className="font-medium">Level {resource.difficulty_level}/5</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="font-medium">{resource.estimated_duration || 15} min</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    <span className="mr-2">🧠</span>
                    {getLearningStyleName(resource.learning_style)} Optimized
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <span className="mr-2">🤖</span>
                    AI Generated
                  </span>
                  {resource.learning_style === 'visual' && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                      <span className="mr-2">📺</span>
                      Video Enhanced
                    </span>
                  )}
                  {resource.learning_style === 'auditory' && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      <span className="mr-2">🔊</span>
                      Audio Enhanced
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            {resource.learning_objectives && resource.learning_objectives.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Learning Objectives
                </h3>
                <ul className="space-y-2">
                  {resource.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3 text-blue-800">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Text-to-Speech Section - Only for Auditory Learners */}
        {resource.learning_style === 'auditory' && (
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="text-2xl mr-3">🔊</span>
                Audio Learning Experience
              </h2>
              <p className="text-green-100 mt-2">
                Listen to the content with our AI-powered text-to-speech system
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <TextToSpeech 
                text={resource.content} 
                title={resource.title}
              />
              
              {/* Auditory Learning Tips */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🎧</div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Auditory Learning Tips
                      </h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Listen to the content first, then read along</li>
                        <li>• Adjust speed to match your comprehension</li>
                        <li>• Take notes while listening</li>
                        <li>• Replay difficult sections multiple times</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🧠</div>
                    <div>
                      <h4 className="text-lg font-semibold text-purple-900 mb-2">
                        Study Strategy
                      </h4>
                      <ul className="space-y-1 text-sm text-purple-800">
                        <li>• Listen in a quiet environment</li>
                        <li>• Use headphones for better focus</li>
                        <li>• Discuss concepts aloud after listening</li>
                        <li>• Record your own explanations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Audio Statistics */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="text-lg mr-2">🎙️</span>
                    AI-powered text-to-speech
                  </span>
                  <span className="flex items-center">
                    <span className="text-lg mr-2">⚡</span>
                    Optimized for auditory learners
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* YouTube Videos Section - Only for Visual Learners */}
        {resource.learning_style === 'visual' && (
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="text-2xl mr-3">📺</span>
                Visual Learning Videos
              </h2>
              <p className="text-red-100 mt-2">
                Educational videos found for: <span className="font-semibold">"{resource.title}"</span>
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {/* Loading State */}
              {loadingVideos && (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Searching YouTube for educational videos...</p>
                </div>
              )}

              {/* Videos Grid */}
              {!loadingVideos && youtubeVideos.length > 0 && (
                <>
                  <div className={`grid gap-6 ${youtubeVideos.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : youtubeVideos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                    {youtubeVideos.map((video, index) => (
                      <YouTubeEmbed
                        key={index}
                        videoId={video.video_id}
                        title={video.title}
                        description={video.description}
                        channel={video.channel}
                        duration={video.duration}
                      />
                    ))}
                  </div>
                  
                  {/* Learning Enhancement Tips */}
                  <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">💡</div>
                        <div>
                          <h4 className="text-lg font-semibold text-blue-900 mb-2">
                            Visual Learning Tips
                          </h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li>• Watch videos before reading the text content</li>
                            <li>• Take visual notes and create diagrams</li>
                            <li>• Pause frequently to process information</li>
                            <li>• Rewatch sections that need clarification</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                          <h4 className="text-lg font-semibold text-green-900 mb-2">
                            Study Strategy
                          </h4>
                          <ul className="space-y-1 text-sm text-green-800">
                            <li>• Compare video explanations with text content</li>
                            <li>• Draw what you see in the videos</li>
                            <li>• Use multiple video perspectives</li>
                            <li>• Practice examples shown in videos</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video Statistics */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <span className="text-lg mr-2">📊</span>
                        <strong>{youtubeVideos.length}</strong> educational videos found
                      </span>
                      <span className="flex items-center">
                        <span className="text-lg mr-2">🎥</span>
                        Automatically searched from YouTube
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* No Videos Found */}
              {!loadingVideos && youtubeVideos.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Videos Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find educational videos for "{resource.title}" at the moment.
                  </p>
                  <Button 
                    onClick={() => searchYouTubeVideos(resource.title)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={loadingVideos}
                  >
                    <span className="mr-2">🔄</span>
                    Search Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {resource.learning_style === 'visual' && (
  <div className="mb-8">
    <VisualExample 
      resourceId={resourceId} 
      topic={resource.topic} 
    />
  </div>
)}

        {/* Main Content */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-3">📚</span>
              Learning Content
            </h2>
          </CardHeader>
          <CardContent className="p-8">
            <MarkdownRenderer content={resource.content} />
          </CardContent>
        </Card>

        {/* Interactive Elements for Auditory Learners */}
        {resource.learning_style === 'auditory' && (
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="text-2xl mr-3">🎵</span>
                Auditory Learning Tools
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-4xl mb-3">🎤</div>
                  <h3 className="font-bold text-blue-900 mb-2">Speak & Record</h3>
                  <p className="text-blue-800 text-sm">
                    Read concepts aloud and record yourself explaining key points
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="font-bold text-green-900 mb-2">Discuss</h3>
                  <p className="text-green-800 text-sm">
                    Talk through problems with others or explain concepts verbally
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                  <div className="text-4xl mb-3">🎧</div>
                  <h3 className="font-bold text-yellow-900 mb-2">Listen & Repeat</h3>
                  <p className="text-yellow-800 text-sm">
                    Use the audio player to listen multiple times at different speeds
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Elements for Visual Learners */}
{resource.learning_style === 'visual' && (
  <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
    <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
      <h2 className="text-2xl font-bold flex items-center">
        <span className="text-2xl mr-3">🎨</span>
        Visual Learning Tools
      </h2>
    </CardHeader>
    <CardContent className="p-6">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="font-bold text-purple-900 mb-2">Interactive Demo</h3>
          <p className="text-purple-800 text-sm">
            AI-generated animated examples with interactive elements above
          </p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-4xl mb-3">🖍️</div>
          <h3 className="font-bold text-blue-900 mb-2">Draw & Sketch</h3>
          <p className="text-blue-800 text-sm">
            Create diagrams and visual representations of the concepts you're learning
          </p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="font-bold text-green-900 mb-2">Color Code</h3>
          <p className="text-green-800 text-sm">
            Use different colors to highlight different types of information and concepts
          </p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="font-bold text-yellow-900 mb-2">Mind Maps</h3>
          <p className="text-yellow-800 text-sm">
            Create visual mind maps to connect related concepts and ideas
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}

        {/* Next Steps */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Test Your Knowledge?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {resource.learning_style === 'visual' 
                ? "Great job watching the videos and studying the visual content! Now it's time to put your new knowledge to the test with a personalized quiz."
                : resource.learning_style === 'auditory'
                ? "Excellent! You've listened to the content and engaged with the audio learning tools. Now let's test your understanding with a personalized quiz."
                : "Great job completing this learning resource! Now it's time to put your new knowledge to the test with a personalized quiz designed specifically for this content."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleTakeQuiz}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                size="lg"
              >
                <span className="mr-2">📝</span>
                Take Quiz Now
              </Button>
              <Button
                onClick={handleBackToPath}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                size="lg"
              >
                <span className="mr-2">🛤️</span>
                Back to Learning Path
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}