'use client';
import { useState } from 'react';

export default function YouTubeEmbed({ videoId, title, description, channel, duration, className = '' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!videoId) return null;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-xl border border-gray-200 p-6 text-center ${className}`}>
        <div className="text-4xl mb-2">📺</div>
        <p className="text-gray-600 text-sm">Video temporarily unavailable</p>
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block"
        >
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="relative aspect-video bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
        ></iframe>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="truncate">{channel}</span>
          </span>
          {duration && duration !== 'N/A' && (
            <span className="flex items-center ml-2">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {duration}
            </span>
          )}
        </div>
        <div className="mt-3">
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}