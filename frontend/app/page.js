'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api';
import { simpleAuth } from '../lib/simpleAuth';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';

export default function HomePage() {
  const router = useRouter();
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalPaths: 0,
    avgCompletion: 0
  });

  useEffect(() => {
    checkSystemHealth();
    loadDashboardStats();
    
    // Check auth status
    const loggedIn = simpleAuth.isLoggedIn();
    const userData = simpleAuth.getUser();
    setIsLoggedIn(loggedIn);
    setUser(userData);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await apiClient.healthCheck();
      setSystemHealth(response);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.getAnalyticsDashboard();
      if (response.success) {
        setStats({
          totalLearners: response.analytics.total_learners,
          totalPaths: response.analytics.total_paths,
          avgCompletion: Math.round(response.analytics.average_completion_rate)
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleStartLearning = () => {
    router.push('/create-profile');
  };


 return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full border border-primary-200">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse mr-3"></div>
                  <span className="text-primary-700 text-sm font-medium">AI-Powered Learning Platform</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-gray-900">Master Any Subject</span>
                  <br />
                  <span className="text-primary-600">
                    with AI Precision
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Experience personalized education that adapts to your unique learning style. 
                  From programming to creative arts, our AI creates custom learning paths just for you.
                </p>
              </div>

              {/* CTA Section - Updated to show different content based on login status */}
              <div className="space-y-6">
                {isLoggedIn && user ? (
                  // Logged-in user content
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">
                          {user.type === 'admin' ? '⚙️' : user.type === 'teacher' ? '👨‍🏫' : '🎓'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Welcome back!</h3>
                        <p className="text-gray-600 capitalize">Logged in as {user.type}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleStartLearning}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg"
                      >
                        <span className="mr-2">🚀</span>
                        Continue Learning
                      </Button>
                      
                      {user.type === 'admin' && (
                        <Button
                          onClick={() => router.push('/admin')}
                          variant="outline"
                          className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                        >
                          <span className="mr-2">⚙️</span>
                          Admin Panel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Guest user content
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleStartLearning}
                      className="group relative bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1 transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center">
                        Start Learning Now
                        <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Button>
                    
                    <Button
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-500 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                      </span>
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No setup required
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Instant AI assessment
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Personalized content
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Visual */}
            <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">AI Learning Path</h3>
                          <p className="text-sm text-gray-500">Personalized for you</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-500">94%</div>
                    </div>
                    
                    <div className="space-y-3">
                      {['Fundamentals', 'Practical Skills', 'Advanced Concepts'].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index < 2 ? 'bg-green-500' : 'bg-gray-200'
                          }`}>
                            {index < 2 ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <span className={index < 2 ? 'text-gray-700' : 'text-gray-400'}>{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-primary-50 rounded-2xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">"Great progress! Ready for the next challenge?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                  <svg className="w-8 h-8 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>

                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats.totalLearners > 0 && (
        <section className="py-16 bg-white/50 backdrop-blur-sm border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalLearners.toLocaleString()}+</div>
                <div className="text-gray-600">Active Learners</div>
              </div>
              
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalPaths.toLocaleString()}+</div>
                <div className="text-gray-600">AI Learning Paths</div>
              </div>
              
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.avgCompletion}%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Learning Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of education with intelligent, adaptive learning that grows with you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "AI-Powered Assessment",
                description: "Our intelligent system evaluates your knowledge and identifies the perfect starting point for your learning journey.",
                bgColor: "bg-yellow-500"
              },
              {
                icon: (
                  <svg className="w-8 h-8 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Adaptive Learning Paths",
                description: "Dynamic curriculum that adjusts in real-time based on your progress, learning style, and performance.",
                bgColor: "bg-primary-600"
              },
              {
                icon: (
                  <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: "Multi-Modal Content",
                description: "Learn through videos, interactive exercises, audio content, and hands-on projects tailored to your learning style.",
                bgColor: "bg-green-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} rounded-2xl mb-6 text-white group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Styles Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Personalized for Every Learning Style
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI adapts to how you learn best, creating a unique experience that maximizes your potential
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: "Visual",
                description: "Diagrams, charts, and visual demonstrations",
                color: "primary"
              },
              {
                icon: (
                  <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ),
                title: "Auditory", 
                description: "Audio content, discussions, and verbal explanations",
                color: "green"
              },
              {
                icon: (
                  <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: "Reading/Writing",
                description: "Text-based content, notes, and written exercises",
                color: "primary"
              },
              {
                icon: (
                  <svg className="w-8 h-8 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5h2a2 2 0 012 2v2" />
                  </svg>
                ),
                title: "Kinesthetic",
                description: "Hands-on activities and interactive projects",
                color: "orange"
              }
            ].map((style, index) => (
              <div key={index} className={`group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 ${
                style.color === 'primary' ? 'border-primary-500' : 
                style.color === 'green' ? 'border-green-500' : 
                'border-orange-500'
              }`}>
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${
                    style.color === 'primary' ? 'bg-primary-100 text-primary-600' : 
                    style.color === 'green' ? 'bg-green-100 text-green-600' : 
                    'bg-orange-100 text-orange-600'
                  } rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    {style.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{style.title}</h3>
                  <p className="text-gray-600 text-sm">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who have revolutionized their education with AI-powered personalization
          </p>
          
          <div className="space-y-6">
            <Button
              onClick={handleStartLearning}
              className="group bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-white/25 transform hover:-translate-y-1 transition-all duration-300"
            >
              <span className="flex items-center">
                Begin Your AI Learning Journey
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
            
            <p className="text-primary-200 text-sm">
              Start learning in under 60 seconds • Personalized by AI • No commitment required
            </p>
          </div>
        </div>
      </section>

      {/* System Status */}
      {systemHealth && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-green-200 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">System Online</span>
          </div>
        </div>
      )}
    </div>
  );
}