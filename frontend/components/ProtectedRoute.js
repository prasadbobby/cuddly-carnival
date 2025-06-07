'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../lib/auth';
import LoadingSpinner from './ui/LoadingSpinner';

export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false, requireStudent = false }) {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(true);
 const [isAuthorized, setIsAuthorized] = useState(false);

 useEffect(() => {
   checkAuthorization();
 }, []);

 const checkAuthorization = async () => {
   try {
     setIsLoading(true);

     if (!requireAuth) {
       setIsAuthorized(true);
       return;
     }

     // Check if user is authenticated
     if (!authService.isAuthenticated()) {
       router.push('/login');
       return;
     }

     // Verify token with server
     try {
       await authService.verifyToken();
     } catch (error) {
       console.error('Token verification failed:', error);
       router.push('/login');
       return;
     }

     const user = authService.getUser();

     // Check role-specific requirements
     if (requireAdmin && user.role !== 'admin') {
       router.push('/dashboard');
       return;
     }

     if (requireStudent && user.role !== 'student') {
       router.push('/admin');
       return;
     }

     setIsAuthorized(true);

   } catch (error) {
     console.error('Authorization check failed:', error);
     router.push('/login');
   } finally {
     setIsLoading(false);
   }
 };

 if (isLoading) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center">
       <div className="text-center">
         <LoadingSpinner size="xl" />
         <p className="mt-4 text-gray-600 text-lg">Checking authorization...</p>
       </div>
     </div>
   );
 }

 if (!isAuthorized) {
   return null;
 }

 return children;
}