'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getLearningStyleName } from '../../lib/utils';

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAnalyticsDashboard();
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-6">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Learning Analytics
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Insights and statistics from our AI-powered learning platform
          </p>
        </div>

        {analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-2xl mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.total_learners}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Total Learners</div>
                  <div className="text-xs text-blue-600 mt-1">Active profiles created</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-2xl mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.total_paths}
                  </div>
                  <div className="text-sm text-green-700 font-medium">Learning Paths</div>
                  <div className="text-xs text-green-600 mt-1">AI-generated curricula</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-2xl mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.total_quizzes}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Quizzes Completed</div>
                  <div className="text-xs text-purple-600 mt-1">Total assessments</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-2xl mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 010 1.299l3.942 3.942a11.95 11.95 0 01-15.487-10.85M2.25 18L6 14.25m0 0l8.485-8.485c.652-.653 1.538-1.1 2.515-1.1a2.25 2.25 0 011.575.652L21 7.742m-6.75 6.732l3-3m-3 3a2.25 2.25 0 01-3.18 0l-4.5-4.5a2.25 2.25 0 013.18-3.18l6-6a2.25 2.25 0 013.18 3.18L12 19.5z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {Math.round(analytics.average_completion_rate)}%
                  </div>
                  <div className="text-sm text-orange-700 font-medium">Avg Completion</div>
                  <div className="text-xs text-orange-600 mt-1">Success rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Styles Distribution */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-12">
              <CardHeader>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Learning Styles Distribution
                </h2>
                <p className="text-gray-600">How learners prefer to absorb information</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics.learning_styles_distribution.map((style, index) => {
                    const total = analytics.total_learners;
                    const percentage = total > 0 ? (style.count / total) * 100 : 0;
                    
                    const styleIcons = {
                      visual: '👁️',
                      auditory: '👂',
                      reading: '📚',
                      kinesthetic: '🤲'
                    };
                    
                    const styleColors = {
                      visual: 'from-blue-500 to-blue-600',
                      auditory: 'from-green-500 to-green-600',
                      reading: 'from-purple-500 to-purple-600',
                      kinesthetic: 'from-orange-500 to-orange-600'
                    };
                    
                    return (
                      <div key={style._id} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3 w-40">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">{styleIcons[style._id] || '📖'}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getLearningStyleName(style._id)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {style.count} learner{style.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${styleColors[style._id] || 'from-gray-500 to-gray-600'} h-4 rounded-full transition-all duration-1000 shadow-sm flex items-center justify-end pr-2`}
                                style={{ 
                                  width: `${percentage}%`,
                                  animationDelay: `${index * 0.2}s`
                                }}
                              >
                                {percentage > 15 && (
                                  <span className="text-white text-xs font-medium">
                                    {Math.round(percentage)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {percentage <= 15 && (
                              <div className="text-sm font-medium text-gray-600 w-12 text-right">
                                {Math.round(percentage)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Platform Features */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">🤖</span>
                    AI Features
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🧠</span>
                        </div>
                        <span className="font-medium text-gray-900">Adaptive Learning Paths</span>
                      </div>
                      <span className="text-blue-600 font-semibold">Active</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">📝</span>
                        </div>
                        <span className="font-medium text-gray-900">AI-Generated Quizzes</span>
                      </div>
                      <span className="text-green-600 font-semibold">Active</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">💬</span>
                        </div>
                        <span className="font-medium text-gray-900">Intelligent Feedback</span>
                      </div>
                      <span className="text-purple-600 font-semibold">Active</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">📊</span>
                        </div>
                        <span className="font-medium text-gray-900">Progress Analytics</span>
                      </div>
                      <span className="text-orange-600 font-semibold">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">🌟</span>
                    Platform Insights
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                      <div className="text-sm text-blue-700 font-medium">AI-Powered</div>
                      <div className="text-xs text-blue-600 mt-1">All content generated by advanced AI</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">Free</div>
                      <div className="text-sm text-green-700 font-medium">No Cost Learning</div>
                      <div className="text-xs text-green-600 mt-1">Completely free access to all features</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                      <div className="text-sm text-purple-700 font-medium">Always Available</div>
                      <div className="text-xs text-purple-600 mt-1">Learn anytime, anywhere</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Analytics Data Available
              </h3>
              <p className="text-gray-600 mb-6">
                Start using the platform to see learning analytics here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}