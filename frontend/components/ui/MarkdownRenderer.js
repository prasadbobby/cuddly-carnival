'use client';

export default function MarkdownRenderer({ content }) {
  // Simple markdown to HTML converter for basic formatting
  const formatContent = (text) => {
    if (!text) return '';

    let formatted = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-4 flex items-center"><span class="mr-2">📖</span>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center"><span class="mr-3">📚</span>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<div class="bg-gray-100 rounded-lg p-4 my-4 font-mono text-sm border border-gray-300"><pre class="whitespace-pre-wrap">$1</pre></div>')
      
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Emojis in lists
      .replace(/^- (.*$)/gim, '<li class="flex items-start space-x-2 mb-2"><span class="text-blue-500 mt-1">•</span><span>$1</span></li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="flex items-start space-x-2 mb-2"><span class="text-blue-500 font-bold">$1.</span><span>$2</span></li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />');

    // Wrap in paragraphs and handle lists
    formatted = formatted
      .split('</p><p class="mb-4">')
      .map(paragraph => {
        if (paragraph.includes('<li class=')) {
          return `<ul class="space-y-1 mb-6">${paragraph}</ul>`;
        } else if (paragraph.includes('<h1') || paragraph.includes('<h2') || paragraph.includes('<h3') || paragraph.includes('<div class="bg-gray-100')) {
          return paragraph;
        } else {
          return `<p class="mb-4 leading-relaxed text-gray-700">${paragraph}</p>`;
        }
      })
      .join('');

    return formatted;
  };

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}