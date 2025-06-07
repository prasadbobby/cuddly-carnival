'use client';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

export default function VisualExample({ resourceId, topic }) {
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState(null);
  const [showExample, setShowExample] = useState(false);

  const loadVisualExample = async () => {
    try {
      setIsLoading(true);
      console.log('🎨 Loading visual example for:', topic);
      
      const response = await apiClient.getVisualExample(resourceId);
      
      if (response.success && response.html_content) {
        setHtmlContent(response.html_content);
        setShowExample(true);
        toast.success('Interactive visual example loaded!');
      } else {
        throw new Error(response.error || 'Failed to load visual example');
      }
    } catch (error) {
      console.error('Error loading visual example:', error);
      toast.error('Failed to load visual example');
    } finally {
      setIsLoading(false);
    }
  };

  if (showExample && htmlContent) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎨</div>
              <div>
                <h3 className="text-lg font-bold">Interactive Visual Example</h3>
                <p className="text-purple-100 text-sm">Animated demonstration for: {topic}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowExample(false)}
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-white hover:text-purple-600"
            >
              <span className="mr-1">✕</span>
              Close
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {/* HTML Content Frame */}
          <iframe
            srcDoc={htmlContent}
            title={`Visual Example: ${topic}`}
            className="w-full h-[600px] border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{ backgroundColor: 'white' }}
          />
          
          {/* Overlay for full-screen option */}
          <div className="absolute top-4 right-4">
            <Button
              onClick={() => {
                const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                newWindow.document.write(htmlContent);
                newWindow.document.close();
              }}
              size="sm"
              className="bg-white/90 text-gray-700 hover:bg-white shadow-lg"
            >
              <span className="mr-1">🔗</span>
              Open Full Screen
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center">
              <span className="text-lg mr-2">✨</span>
              AI-generated interactive example
            </span>
            <span className="flex items-center">
              <span className="text-lg mr-2">🎯</span>
              Optimized for visual learning
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Interactive Visual Example
        </h3>
        <p className="text-gray-600 mb-6">
          Get an animated, interactive demonstration of <strong>{topic}</strong> 
          designed specifically for visual learners.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
          <div className="flex items-center space-x-2 text-purple-700">
            <span className="text-lg">🎬</span>
            <span>Smooth animations</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-700">
            <span className="text-lg">🖱️</span>
            <span>Interactive elements</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-700">
            <span className="text-lg">📱</span>
            <span>Mobile responsive</span>
          </div>
        </div>
        
        <Button
          onClick={loadVisualExample}
          loading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
          size="lg"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Generating Visual Example...
            </>
          ) : (
            <>
              <span className="mr-2">🎨</span>
              Generate Interactive Example
            </>
          )}
        </Button>
        
        {isLoading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>AI is creating your visual example...</strong>
              <br />
              This includes animations, interactive elements, and visual demonstrations of {topic}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}