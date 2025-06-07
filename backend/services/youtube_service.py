# backend/services/youtube_service.py
import requests
import re
import json
from urllib.parse import quote_plus
import time
from typing import List, Dict, Optional

class YouTubeService:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    def search_videos(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search YouTube videos based on query"""
        try:
            print(f"🔍 Searching YouTube for: {query}")
            
            # Clean and optimize the search query
            search_query = self._optimize_search_query(query)
            encoded_query = quote_plus(search_query)
            url = f"https://www.youtube.com/results?search_query={encoded_query}"
            
            print(f"📡 Fetching: {url}")
            response = requests.get(url, headers=self.headers, timeout=15, verify=False)
            
            if response.status_code != 200:
                print(f"❌ YouTube request failed with status: {response.status_code}")
                return self._get_fallback_videos(query)
            
            videos = self._extract_video_data(response.text, max_results)
            
            if not videos:
                print("⚠️ No videos found, using fallback")
                return self._get_fallback_videos(query)
            
            print(f"✅ Found {len(videos)} YouTube videos")
            return videos
            
        except Exception as e:
            print(f"❌ YouTube search error: {e}")
            return self._get_fallback_videos(query)
    
    def _optimize_search_query(self, query: str) -> str:
        """Optimize search query for educational content"""
        # Remove common words that might not help in search
        query = query.lower()
        
        # Add educational keywords
        educational_keywords = [
            "tutorial", "explained", "lesson", "learn", "education",
            "mathematics", "math", "algebra", "geometry", "calculus"
        ]
        
        # Check if query already contains educational terms
        has_educational_term = any(keyword in query for keyword in educational_keywords)
        
        if not has_educational_term:
            # Add relevant educational keywords based on content
            if any(term in query for term in ["equation", "solve", "variable", "algebra"]):
                query += " algebra tutorial"
            elif any(term in query for term in ["triangle", "circle", "angle", "geometry"]):
                query += " geometry lesson"
            elif any(term in query for term in ["limit", "derivative", "integral", "calculus"]):
                query += " calculus explained"
            elif any(term in query for term in ["trigonometry", "sine", "cosine", "tangent"]):
                query += " trigonometry tutorial"
            else:
                query += " mathematics tutorial"
        
        return query
    
    def _extract_video_data(self, html_content: str, max_results: int) -> List[Dict]:
        """Extract video data from YouTube search results"""
        videos = []
        
        try:
            # Multiple patterns to catch different YouTube layouts
            patterns = [
                r'"videoId":"([^"]{11})"[^}]*?"title":{"runs":\[{"text":"([^"]+)"}[^}]*\][^}]*}[^}]*?"longBylineText":{"runs":\[{"text":"([^"]+)"[^}]*\]',
                r'"videoId":"([^"]{11})".*?"text":"([^"]+)".*?"ownerText":{"runs":\[{"text":"([^"]+)"',
                r'"videoId":"([^"]{11})"[^}]*?"title":{"simpleText":"([^"]+)"}[^}]*?"longBylineText":{"runs":\[{"text":"([^"]+)"'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, html_content, re.DOTALL)
                if matches and len(matches) >= max_results:
                    break
            
            if not matches:
                # Fallback: just get video IDs and basic titles
                video_ids = re.findall(r'"videoId":"([^"]{11})"', html_content)
                titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"}', html_content)
                channels = re.findall(r'"ownerText":{"runs":\[{"text":"([^"]+)"', html_content)
                
                # Combine the data
                matches = []
                min_length = min(len(video_ids), len(titles), len(channels))
                for i in range(min_length):
                    matches.append((video_ids[i], titles[i], channels[i]))
            
            for i, (video_id, title, channel) in enumerate(matches[:max_results]):
                if len(video_id) == 11:  # Valid YouTube video ID
                    # Clean up title and channel
                    clean_title = self._clean_text(title)
                    clean_channel = self._clean_text(channel)
                    
                    video_data = {
                        'video_id': video_id,
                        'title': clean_title,
                        'channel': clean_channel,
                        'url': f'https://www.youtube.com/watch?v={video_id}',
                        'embed_url': f'https://www.youtube.com/embed/{video_id}',
                        'thumbnail': f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg',
                        'duration': 'N/A',
                        'description': f"Educational video about {clean_title}"
                    }
                    videos.append(video_data)
                    print(f"📺 Added video: {clean_title} by {clean_channel}")
            
            return videos
            
        except Exception as e:
            print(f"❌ Error extracting video data: {e}")
            return []
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        if not text:
            return ""
        
        # Replace HTML entities and clean up
        text = text.replace('\\u0026', '&')
        text = text.replace('\\"', '"')
        text = text.replace('\\n', ' ')
        text = re.sub(r'\\u[0-9a-fA-F]{4}', '', text)  # Remove unicode escapes
        
        return text.strip()
    
    def _get_fallback_videos(self, query: str) -> List[Dict]:
        """Provide fallback videos when search fails"""
        
        # Define educational video collections by topic
        fallback_collections = {
            'algebra': [
                {
                    'video_id': 'fDKIpRe8GW4',
                    'title': 'Algebra Basics: What Is Algebra? - Math Antics',
                    'channel': 'mathantics',
                    'description': 'Learn the fundamentals of algebra'
                },
                {
                    'video_id': 'NybHckSEQBI',
                    'title': 'Linear Equations - Algebra Basics',
                    'channel': 'Khan Academy',
                    'description': 'Understanding linear equations step by step'
                },
                {
                    'video_id': 'V6Dfo4zZvnA',
                    'title': 'Solving Basic Equations',
                    'channel': 'Professor Leonard',
                    'description': 'How to solve basic algebraic equations'
                }
            ],
            'geometry': [
                {
                    'video_id': 'MFhxShGxHWc',
                    'title': 'Geometry Basics: Points, Lines, Planes, and Angles',
                    'channel': 'Math Antics',
                    'description': 'Introduction to basic geometry concepts'
                },
                {
                    'video_id': 'KXJSjte_OAI',
                    'title': 'Triangle Basics and Properties',
                    'channel': 'Khan Academy',
                    'description': 'Understanding triangles and their properties'
                },
                {
                    'video_id': 'cUEkOVdUjHc',
                    'title': 'Circle Geometry Explained',
                    'channel': 'Professor Dave Explains',
                    'description': 'Complete guide to circle geometry'
                }
            ],
            'calculus': [
                {
                    'video_id': '3d6DsjIBzJ4',
                    'title': 'What is a Limit? Basic Idea of Limits',
                    'channel': 'Professor Leonard',
                    'description': 'Introduction to limits in calculus'
                },
                {
                    'video_id': 'WUvTyaaNkzM',
                    'title': 'Introduction to Derivatives',
                    'channel': '3Blue1Brown',
                    'description': 'Visual introduction to derivatives'
                },
                {
                    'video_id': 'rfG8ce4nNh0',
                    'title': 'Integration and the fundamental theorem of calculus',
                    'channel': '3Blue1Brown',
                    'description': 'Understanding integration visually'
                }
            ],
            'trigonometry': [
                {
                    'video_id': 'yBw67Fb31Es',
                    'title': 'Introduction to Trigonometry',
                    'channel': 'Khan Academy',
                    'description': 'Basic trigonometry concepts'
                },
                {
                    'video_id': 'kGjTiBq8bJI',
                    'title': 'SOH CAH TOA - Trigonometry',
                    'channel': 'Math Antics',
                    'description': 'Understanding sine, cosine, and tangent'
                }
            ]
        }
        
        # Determine which collection to use based on query
        query_lower = query.lower()
        collection_key = 'algebra'  # default
        
        for key in fallback_collections.keys():
            if key in query_lower:
                collection_key = key
                break
        
        # Format the fallback videos
        fallback_videos = []
        for video_data in fallback_collections.get(collection_key, fallback_collections['algebra']):
            formatted_video = {
                'video_id': video_data['video_id'],
                'title': video_data['title'],
                'channel': video_data['channel'],
                'url': f"https://www.youtube.com/watch?v={video_data['video_id']}",
                'embed_url': f"https://www.youtube.com/embed/{video_data['video_id']}",
                'thumbnail': f"https://img.youtube.com/vi/{video_data['video_id']}/hqdefault.jpg",
                'duration': 'N/A',
                'description': video_data['description']
            }
            fallback_videos.append(formatted_video)
        
        return fallback_videos