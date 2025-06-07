export default function YouTubeVideoSkeleton() {
  return (
    <div className="bg-gray-100 rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-pulse">
      <div className="aspect-video bg-gray-300"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}