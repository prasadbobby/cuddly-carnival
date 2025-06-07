'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import Card, { CardContent } from './Card';
import LoadingSpinner from './LoadingSpinner';

export default function ContentGenerationProgress({ learnerId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!learnerId) return;

    const checkStatus = async () => {
      try {
        const response = await apiClient.getContentStatus(learnerId);
        if (response.success) {
          setStatus(response.data);
          if (response.data.is_complete && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Error checking content status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [learnerId, onComplete]);

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="text-center py-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking content generation status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            AI is Creating Your Personalized Content
          </h3>
          <p className="text-gray-600 mb-6">
            Our AI is generating customized learning materials based on your profile...
          </p>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(status.progress_percentage)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${status.progress_percentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {status.ready_resources} of {status.total_resources} resources ready
          </div>
          
          {status.is_complete && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">
                ✅ Content generation complete! You can now start learning.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}