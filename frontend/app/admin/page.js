'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { formatDate, getLearningStyleName } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [learners, setLearners] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [deletingLearner, setDeletingLearner] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      const [statsResponse, learnersResponse] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAllLearners()
      ]);
      
      console.log('Admin stats response:', statsResponse);
      console.log('Learners response:', learnersResponse);
      
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      } else {
        throw new Error(statsResponse.error || 'Failed to load stats');
      }
      
      if (learnersResponse.success) {
        // Sort learners by creation date (newest first)
        const sortedLearners = learnersResponse.learners.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setLearners(sortedLearners);
      } else {
        throw new Error(learnersResponse.error || 'Failed to load learners');
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error(`Failed to load admin data: ${error.message}`);
      
      // Fallback to basic analytics if available
      try {
        const fallbackResponse = await apiClient.getAnalyticsDashboard();
        if (fallbackResponse.success) {
          setStats({
            overview: {
              total_learners: fallbackResponse.analytics.total_learners,
              total_paths: fallbackResponse.analytics.total_paths,
              total_quizzes: fallbackResponse.analytics.total_quizzes,
              total_resources: 0,
              average_completion_rate: fallbackResponse.analytics.average_completion_rate
            },
            distributions: {
              learning_styles: fallbackResponse.analytics.learning_styles_distribution,
              subjects: []
            },
            recent_activity: {
              new_learners_this_week: 0,
              quizzes_taken_this_week: 0
            }
          });
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLearnerProgress = (learnerId) => {
    router.push(`/progress/${learnerId}`);
  };

  const handleViewLearningPath = (learnerId) => {
    router.push(`/learning-path/${learnerId}`);
  };

  const handleDeleteLearner = async (learner) => {
    try {
      setDeletingLearner(learner.id);
      
      const loadingToast = toast.loading(`Deleting ${learner.name}...`);
      
      const response = await apiClient.deleteLearner(learner.id);
      
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success(response.message || `${learner.name} deleted successfully`);
        
        // Remove learner from local state
        setLearners(prevLearners => 
          prevLearners.filter(l => l.id !== learner.id)
        );
        
        // Update stats
        if (stats) {
          setStats(prevStats => ({
            ...prevStats,
            overview: {
              ...prevStats.overview,
              total_learners: prevStats.overview.total_learners - 1
            }
          }));
        }
        
        setShowDeleteConfirm(null);
      } else {
        throw new Error(response.error || 'Failed to delete learner');
      }
    } catch (error) {
      console.error('Error deleting learner:', error);
      toast.error(`Failed to delete learner: ${error.message}`);
    } finally {
      setDeletingLearner(null);
    }
  };

  const confirmDelete = (learner) => {
    setShowDeleteConfirm(learner);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Filter learners based on search and filters (already sorted by creation date)
  const filteredLearners = learners.filter(learner => {
    const matchesSearch = learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         learner.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || learner.subject === filterSubject;
    const matchesStyle = filterStyle === 'all' || learner.learning_style === filterStyle;
    
    return matchesSearch && matchesSubject && matchesStyle;
  });

  // Get unique subjects and styles for filters
  const uniqueSubjects = [...new Set(learners.map(l => l.subject))];
  const uniqueStyles = [...new Set(learners.map(l => l.learning_style))];

  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: '📊',
      description: 'Platform statistics and insights',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'learners', 
      name: 'Learners', 
      icon: '👥',
      count: learners.length,
      description: 'Manage all registered learners',
      gradient: 'from-green-500 to-green-600'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: '📈',
      description: 'Detailed performance metrics',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <LoadingSpinner size="lg" className="border-white border-t-transparent" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Admin Dashboard</h3>
          <p className="text-gray-600">Gathering analytics and learner data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Learner</h3>
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{showDeleteConfirm.name}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This will permanently delete all their data including learning progress, quiz results, and generated content. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={deletingLearner === showDeleteConfirm.id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteLearner(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  loading={deletingLearner === showDeleteConfirm.id}
                  disabled={deletingLearner === showDeleteConfirm.id}
                >
                  {deletingLearner === showDeleteConfirm.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Monitor platform performance, track learner progress, and analyze learning patterns with advanced AI insights
          </p>
        </div>

        {/* Professional Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            {/* Background blur effect */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            
            {/* Tab container */}
            <div className="relative flex items-center p-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl shadow-${tab.gradient.split('-')[1]}-500/25`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {/* Icon */}
                  <div className={`text-xl ${activeTab === tab.id ? 'animate-pulse' : ''}`}>
                    {tab.icon}
                  </div>
                  
                  {/* Tab name */}
                  <span className="font-medium">{tab.name}</span>
                  
                  {/* Count badge */}
                  {tab.count !== undefined && (
                    <div className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {tab.count}
                    </div>
                  )}
                  
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg animate-bounce"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Tab description */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 font-medium">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="group bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {stats.overview.total_learners}
                  </div>
                  <div className="text-sm text-blue-600 font-semibold mb-1">Total Learners</div>
                  <div className="text-xs text-blue-500">Registered users</div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {stats.overview.total_paths}
                  </div>
                  <div className="text-sm text-green-600 font-semibold mb-1">Learning Paths</div>
                  <div className="text-xs text-green-500">AI generated</div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-7.5H21m-3 3H21m-3 3H21M5.25 4.5h1.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.75a.75.75 0 01.75-.75z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {stats.overview.total_quizzes}
                  </div>
                  <div className="text-sm text-purple-600 font-semibold mb-1">Quizzes Taken</div>
                  <div className="text-xs text-purple-500">Assessments</div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-yellow-700 mb-2">
                    {stats.overview.total_resources}
                  </div>
                  <div className="text-sm text-yellow-600 font-semibold mb-1">Resources</div>
                  <div className="text-xs text-yellow-500">Created</div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 010 1.299l3.942 3.942a11.95 11.95 0 01-15.487-10.85M2.25 18L6 14.25m0 0l8.485-8.485c.652-.653 1.538-1.1 2.515-1.1a2.25 2.25 0 011.575.652L21 7.742m-6.75 6.732l3-3m-3 3a2.25 2.25 0 01-3.18 0l-4.5-4.5a2.25 2.25 0 013.18-3.18l6-6a2.25 2.25 0 013.18 3.18L12 19.5z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-orange-700 mb-2">
                    {Math.round(stats.overview.average_completion_rate)}%
                  </div>
                  <div className="text-sm text-orange-600 font-semibold mb-1">Completion</div>
                  <div className="text-xs text-orange-500">Average</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Learning Styles */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                  <h2 className="text-xl font-bold flex items-center">
                    <span className="text-xl mr-3">🔥</span>
                    Recent Activity
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg">👥</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">New Learners</div>
                          <div className="text-sm text-gray-600">This week</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +{stats.recent_activity.new_learners_this_week}
                        </div>
                        <div className="text-xs text-green-500">registered</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg">📝</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Quiz Activity</div>
                          <div className="text-sm text-gray-600">This week</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          +{stats.recent_activity.quizzes_taken_this_week}
                        </div>
                        <div className="text-xs text-blue-500">completed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <h2 className="text-xl font-bold flex items-center">
                    <span className="text-xl mr-3">🎯</span>
                    Learning Styles
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {stats.distributions.learning_styles.map((style, index) => {
                      const percentage = stats.overview.total_learners > 0 
                        ? (style.count / stats.overview.total_learners) * 100 
                        : 0;
                      
                      const styleInfo = {
                        visual: { icon: '👁️', color: 'blue', name: 'Visual' },
                        auditory: { icon: '👂', color: 'green', name: 'Auditory' },
                        reading: { icon: '📚', color: 'purple', name: 'Reading' },
                        kinesthetic: { icon: '🤲', color: 'orange', name: 'Kinesthetic' }
                      };
                      
                      const info = styleInfo[style._id] || { icon: '📖', color: 'gray', name: style._id };
                     
                     return (
                       <div key={style._id} className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                         <div className="flex items-center space-x-3 w-28">
                           <div className={`w-8 h-8 bg-${info.color}-100 rounded-lg flex items-center justify-center`}>
                             <span className="text-lg">{info.icon}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-700">
                             {info.name}
                           </span>
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center space-x-3">
                             <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                               <div 
                                 className={`bg-gradient-to-r from-${info.color}-400 to-${info.color}-500 h-3 rounded-full transition-all duration-1000 ease-out`}
                                 style={{ width: `${percentage}%` }}
                               ></div>
                             </div>
                             <div className="text-sm font-semibold text-gray-600 w-12 text-right">
                               {Math.round(percentage)}%
                             </div>
                           </div>
                         </div>
                         <div className="w-8 text-sm text-gray-500 text-right font-medium">
                           {style.count}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       )}

       {/* Learners Tab */}
       {activeTab === 'learners' && (
         <div className="space-y-6 animate-fade-in">
           {/* Header with improved styling */}
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
             <div className="text-center lg:text-left">
               <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center justify-center lg:justify-start">
                 <span className="text-3xl mr-3">👥</span>
                 All Learners
               </h2>
               <p className="text-gray-600 mt-2">
                 Managing <span className="font-semibold text-green-600">{filteredLearners.length}</span> active learners 
                 <span className="text-gray-400"> • Sorted by newest first</span>
               </p>
             </div>
             
             <div className="flex justify-center lg:justify-end">
               <Button 
                 onClick={loadAdminData}
                 className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
               >
                 <span className="mr-2">🔄</span>
                 Refresh Data
               </Button>
             </div>
           </div>

           {/* Enhanced Search and Filters */}
           <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-xl">
             <CardContent className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-2">
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                     </div>
                     <input
                       type="text"
                       placeholder="Search learners by name or subject..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                     />
                   </div>
                 </div>
                 <div>
                   <select
                     value={filterSubject}
                     onChange={(e) => setFilterSubject(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                   >
                     <option value="all">All Subjects</option>
                     {uniqueSubjects.map(subject => (
                       <option key={subject} value={subject} className="capitalize">
                         {subject}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <select
                     value={filterStyle}
                     onChange={(e) => setFilterStyle(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                   >
                     <option value="all">All Learning Styles</option>
                     {uniqueStyles.map(style => (
                       <option key={style} value={style}>
                         {getLearningStyleName(style)}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Learners List */}
           {filteredLearners.length === 0 ? (
             <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
               <CardContent className="text-center py-16">
                 <div className="text-8xl mb-6">
                   {searchTerm || filterSubject !== 'all' || filterStyle !== 'all' ? '🔍' : '👥'}
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   {searchTerm || filterSubject !== 'all' || filterStyle !== 'all' 
                     ? 'No matching learners found'
                     : 'No learners registered yet'
                   }
                 </h3>
                 <p className="text-gray-600 mb-8 max-w-md mx-auto">
                   {searchTerm || filterSubject !== 'all' || filterStyle !== 'all'
                     ? 'Try adjusting your search criteria or filters to find learners'
                     : 'Learners will appear here once they create their learning profiles'
                   }
                 </p>
                 {!searchTerm && filterSubject === 'all' && filterStyle === 'all' && (
                   <Button 
                     onClick={() => router.push('/create-profile')}
                     className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                   >
                     <span className="mr-2">➕</span>
                     Create First Profile
                   </Button>
                 )}
               </CardContent>
             </Card>
           ) : (
             <div className="grid gap-6">
               {filteredLearners.map((learner, index) => (
                 <Card 
                   key={learner.id} 
                   className="group shadow-xl border-0 bg-white/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-slide-up"
                   style={{ animationDelay: `${index * 0.1}s` }}
                 >
                   <CardContent className="p-8">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-6">
                         <div className="relative">
                           <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                             <span className="text-3xl">🎓</span>
                           </div>
                           {learner.progress && learner.progress.completion_percentage > 50 && (
                             <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                               <span className="text-white text-xs font-bold">✓</span>
                             </div>
                           )}
                           {learner.average_score >= 80 && (
                             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                               <span className="text-white text-xs">🏆</span>
                             </div>
                           )}
                           {/* New Badge for recently created */}
                           {new Date() - new Date(learner.created_at) < 7 * 24 * 60 * 60 * 1000 && (
                             <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                               <span className="text-white text-xs">🆕</span>
                             </div>
                           )}
                         </div>
                         
                         <div className="flex-1">
                           <div className="flex items-center space-x-3 mb-3">
                             <h3 className="text-2xl font-bold text-gray-900">
                               {learner.name}
                             </h3>
                             {/* New indicator for recent joins */}
                             {new Date() - new Date(learner.created_at) < 7 * 24 * 60 * 60 * 1000 && (
                               <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-lg">
                                 <span className="mr-1">🆕</span>
                                 New
                               </span>
                             )}
                             {learner.average_score >= 80 && (
                               <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg">
                                 <span className="mr-1">🏆</span>
                                 Top Performer
                               </span>
                             )}
                             {learner.progress && learner.progress.completion_percentage >= 100 && (
                               <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold shadow-lg">
                                 <span className="mr-1">🎉</span>
                                 Completed
                               </span>
                             )}
                           </div>
                           
                           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                             <div className="flex items-center space-x-2">
                               <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                 <span>📚</span>
                               </div>
                               <div>
                                 <div className="text-xs text-gray-500 font-medium">Subject</div>
                                 <div className="font-semibold capitalize text-gray-900">{learner.subject}</div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                 <span>🎯</span>
                               </div>
                               <div>
                                 <div className="text-xs text-gray-500 font-medium">Style</div>
                                 <div className="font-semibold text-gray-900">{getLearningStyleName(learner.learning_style)}</div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                 <span>⭐</span>
                               </div>
                               <div>
                                 <div className="text-xs text-gray-500 font-medium">Level</div>
                                 <div className="font-semibold text-gray-900">{learner.knowledge_level}/5</div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                 <span>📊</span>
                               </div>
                               <div>
                                 <div className="text-xs text-gray-500 font-medium">Progress</div>
                                 <div className="font-semibold text-gray-900">
                                   {learner.progress ? Math.round(learner.progress.completion_percentage) : 0}%
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                 <span>📝</span>
                               </div>
                               <div>
                                 <div className="text-xs text-gray-500 font-medium">Quizzes</div>
                                 <div className="font-semibold text-gray-900">{learner.quiz_count || 0}</div>
                               </div>
                             </div>
                           </div>

                           {/* Enhanced Progress Bars */}
                           {learner.progress && (
                             <div className="mb-4">
                               <div className="flex justify-between text-sm text-gray-600 mb-2">
                                 <span className="font-medium">Learning Progress</span>
                                 <span className="font-semibold">{learner.progress.completed_resources}/{learner.progress.total_resources} resources</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                 <div 
                                   className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden"
                                   style={{ width: `${learner.progress.completion_percentage}%` }}
                                 >
                                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Quiz Performance */}
                           {learner.average_score > 0 && (
                             <div className="mb-4">
                               <div className="flex justify-between text-sm text-gray-600 mb-2">
                                 <span className="font-medium">Quiz Performance</span>
                                 <span className="font-semibold">{Math.round(learner.average_score)}% average</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                 <div 
                                   className={`h-3 rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden ${
                                     learner.average_score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                     learner.average_score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                     'bg-gradient-to-r from-red-500 to-red-600'
                                   }`}
                                   style={{ width: `${learner.average_score}%` }}
                                 >
                                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Focus Areas */}
                           {learner.weak_areas && learner.weak_areas.length > 0 && (
                             <div className="flex flex-wrap gap-2 mb-3">
                               <span className="text-sm text-gray-500 font-medium mr-2">Focus Areas:</span>
                               {learner.weak_areas.slice(0, 4).map((area, i) => (
                                 <span 
                                   key={i} 
                                   className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300"
                                 >
                                   {area}
                                 </span>
                               ))}
                               {learner.weak_areas.length > 4 && (
                                 <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-300">
                                   +{learner.weak_areas.length - 4} more
                                 </span>
                               )}
                             </div>
                           )}

                           {/* Enhanced Join Date with relative time */}
                           <div className="text-xs text-gray-500 font-medium flex items-center space-x-2">
                             <span>📅</span>
                             <span>
                               Joined: {formatDate(learner.created_at)}
                               {new Date() - new Date(learner.created_at) < 24 * 60 * 60 * 1000 && (
                                 <span className="ml-2 text-purple-600 font-semibold">(Today)</span>
                               )}
                               {new Date() - new Date(learner.created_at) < 7 * 24 * 60 * 60 * 1000 && 
                                new Date() - new Date(learner.created_at) >= 24 * 60 * 60 * 1000 && (
                                 <span className="ml-2 text-blue-600 font-semibold">(This week)</span>
                               )}
                             </span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Enhanced Action Buttons with Delete */}
                       <div className="flex flex-col space-y-3">
                         <Button
                           onClick={() => handleViewLearnerProgress(learner.id)}
                           size="sm"
                           className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                         >
                           <span className="mr-2">📊</span>
                           View Progress
                         </Button>
                         <Button
                           onClick={() => handleViewLearningPath(learner.id)}
                           variant="outline"
                           size="sm"
                           className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                         >
                           <span className="mr-2">🛤️</span>
                           Learning Path
                         </Button>
                         <Button
                           onClick={() => confirmDelete(learner)}
                           variant="outline"
                           size="sm"
                           className="border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                           disabled={deletingLearner === learner.id}
                         >
                           <span className="mr-2">🗑️</span>
                           Delete
                         </Button>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>
       )}

       {/* Analytics Tab */}
       {activeTab === 'analytics' && stats && (
         <div className="space-y-8 animate-fade-in">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center justify-center">
               <span className="text-3xl mr-3">📈</span>
               Advanced Analytics
             </h2>
             <p className="text-gray-600 mt-2">Deep insights into learning patterns and performance metrics</p>
           </div>

           {/* Subject Distribution */}
           {stats.distributions.subjects && stats.distributions.subjects.length > 0 && (
             <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
               <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
                 <h3 className="text-xl font-bold flex items-center">
                   <span className="text-xl mr-3">📚</span>
                   Subject Distribution
                 </h3>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-6">
                   {stats.distributions.subjects.map((subject, index) => {
                     const percentage = stats.overview.total_learners > 0 
                       ? (subject.count / stats.overview.total_learners) * 100 
                       : 0;
                     
                     const subjectInfo = {
                       algebra: { icon: '📐', color: 'blue', gradient: 'from-blue-400 to-blue-600' },
                       geometry: { icon: '📏', color: 'green', gradient: 'from-green-400 to-green-600' },
                       trigonometry: { icon: '📊', color: 'purple', gradient: 'from-purple-400 to-purple-600' },
                       calculus: { icon: '∫', color: 'orange', gradient: 'from-orange-400 to-orange-600' }
                     };
                     
                     const info = subjectInfo[subject._id] || { icon: '📖', color: 'gray', gradient: 'from-gray-400 to-gray-600' };
                     
                     return (
                       <div key={subject._id} className="flex items-center space-x-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 p-4 rounded-xl transition-all duration-300">
                         <div className="flex items-center space-x-4 w-40">
                           <div className={`w-12 h-12 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                             <span className="text-white text-xl font-bold">{info.icon}</span>
                           </div>
                           <div>
                             <div className="font-bold text-gray-900 capitalize text-lg">{subject._id}</div>
                             <div className="text-sm text-gray-500">{subject.count} learners</div>
                           </div>
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center space-x-4">
                             <div className="flex-1 bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                               <div 
                                 className={`bg-gradient-to-r ${info.gradient} h-4 rounded-full transition-all duration-1000 ease-out relative`}
                                 style={{ width: `${percentage}%` }}
                               >
                                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                               </div>
                             </div>
                             <div className="text-lg font-bold text-gray-700 w-16 text-right">
                               {Math.round(percentage)}%
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Performance Metrics */}
           <div className="grid lg:grid-cols-2 gap-8">
             <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
               <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                 <h3 className="text-xl font-bold flex items-center">
                   <span className="text-xl mr-3">🎯</span>
                   Performance Categories
                 </h3>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">🏆</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">High Performers</div>
                         <div className="text-sm text-gray-600">≥80% average score</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-green-600">
                         {learners.filter(l => l.average_score >= 80).length}
                       </div>
                       <div className="text-xs text-green-500">learners</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">📈</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Average Performers</div>
                         <div className="text-sm text-gray-600">60-79% average score</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-yellow-600">
                         {learners.filter(l => l.average_score >= 60 && l.average_score < 80).length}
                       </div>
                       <div className="text-xs text-yellow-500">learners</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">📚</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Need Support</div>
                         <div className="text-sm text-gray-600">&lt;60% average score</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-red-600">
                         {learners.filter(l => l.average_score > 0 && l.average_score < 60).length}
                       </div>
                       <div className="text-xs text-red-500">learners</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">⏳</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Getting Started</div>
                         <div className="text-sm text-gray-600">No quiz data yet</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-gray-600">
                         {learners.filter(l => !l.average_score || l.average_score === 0).length}
                       </div>
                       <div className="text-xs text-gray-500">learners</div>
                     </div>
                   </div>
                 </div>
               </CardContent>
               </Card>

             <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
               <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                 <h3 className="text-xl font-bold flex items-center">
                   <span className="text-xl mr-3">📊</span>
                   Engagement Metrics
                 </h3>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">🔥</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Active Learners</div>
                         <div className="text-sm text-gray-600">Started learning</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-blue-600">
                         {learners.filter(l => l.progress && l.progress.completed_resources > 0).length}
                       </div>
                       <div className="text-xs text-blue-500">active</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">🎉</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Completed Paths</div>
                         <div className="text-sm text-gray-600">100% completion</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-purple-600">
                         {learners.filter(l => l.progress && l.progress.completion_percentage >= 100).length}
                       </div>
                       <div className="text-xs text-purple-500">completed</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">📝</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Quiz Participants</div>
                         <div className="text-sm text-gray-600">Taken assessments</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-indigo-600">
                         {learners.filter(l => l.quiz_count > 0).length}
                       </div>
                       <div className="text-xs text-indigo-500">participants</div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white text-lg">📊</span>
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900">Avg Resources/Learner</div>
                         <div className="text-sm text-gray-600">Content engagement</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-emerald-600">
                         {learners.length > 0 
                           ? Math.round(learners.reduce((sum, l) => sum + (l.progress?.completed_resources || 0), 0) / learners.length)
                           : 0
                         }
                       </div>
                       <div className="text-xs text-emerald-500">resources</div>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       )}

       {/* Quick Actions */}
       <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-12">
         <Button 
           variant="outline" 
           onClick={() => router.push('/')}
           className="border-2 border-gray-400 text-gray-600 hover:bg-gray-100 hover:border-gray-500 shadow-lg hover:shadow-xl transition-all duration-300"
         >
           <span className="mr-2">←</span>
           Back to Home
         </Button>
         <Button 
           onClick={() => router.push('/create-profile')}
           className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
         >
           <span className="mr-2">➕</span>
           Create New Profile
         </Button>
         <Button 
           onClick={() => router.push('/analytics')}
           variant="outline"
           className="border-2 border-purple-400 text-purple-600 hover:bg-purple-50 hover:border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300"
         >
           <span className="mr-2">📈</span>
           Public Analytics
         </Button>
       </div>
     </div>
   </div>
 );
}