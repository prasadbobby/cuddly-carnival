'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { simpleAuth } from '../../lib/simpleAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      // Determine user type based on email (simple logic)
      let userType = 'user';
      if (formData.email.toLowerCase().includes('admin')) {
        userType = 'admin';
      } else if (formData.email.toLowerCase().includes('teacher')) {
        userType = 'teacher';
      } else if (formData.email.toLowerCase().includes('student')) {
        userType = 'student';
      }

      simpleAuth.login(userType);
      toast.success('Login successful! Welcome back!');
      router.push('/');
    }, 1500);
  };

  const handleDemoLogin = (userType) => {
    setIsLoading(true);
    
    const demoCredentials = {
      student: { email: 'student@example.com', password: 'password123' },
      teacher: { email: 'teacher@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'password123' }
    };

    setFormData(demoCredentials[userType]);
    
    setTimeout(() => {
      simpleAuth.login(userType);
      toast.success(`Welcome back, ${userType}!`);
      router.push('/');
    }, 1000);
  };

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.606 50.606 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a .75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">Sign In</h3>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="text-lg py-3"
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="text-lg py-3"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 text-lg font-semibold shadow-lg"
              >
                {isLoading ? 'Signing you in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or try demo accounts</span>
                </div>
              </div>
            </div>

            {/* Demo Login Buttons */}
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleDemoLogin('student')}
                variant="outline"
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                disabled={isLoading}
              >
                <span className="mr-2">🎓</span>
                Demo Student Login
              </Button>
              
              <Button
                onClick={() => handleDemoLogin('teacher')}
                variant="outline"
                className="w-full border-green-300 text-green-600 hover:bg-green-50"
                disabled={isLoading}
              >
                <span className="mr-2">👨‍🏫</span>
                Demo Teacher Login
              </Button>
              
              <Button
                onClick={() => handleDemoLogin('admin')}
                variant="outline"
                className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                disabled={isLoading}
              >
                <span className="mr-2">⚙️</span>
                Demo Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/create-profile" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Create your learning profile
            </Link>
          </p>
        </div>

        {/* Additional Links */}
        <div className="text-center space-y-2">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Features Preview */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            🚀 What awaits you:
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <span className="text-gray-700">AI-powered learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎯</span>
              <span className="text-gray-700">Personalized paths</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="text-gray-700">Progress tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏆</span>
              <span className="text-gray-700">Achievement system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}