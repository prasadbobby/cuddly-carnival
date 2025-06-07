import './globals.css';
import Header from '../components/layout/Header';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Agent Guru - Personalized Learning with AI',
  description: 'Advanced AI-powered personalized learning platform with adaptive content and intelligent tutoring',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}