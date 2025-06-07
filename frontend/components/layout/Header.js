'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { simpleAuth } from '../../lib/simpleAuth';
import { cn } from '../../lib/utils';

const AcademicCapIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.606 50.606 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const UserPlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);

const LoginIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth status
    const loggedIn = simpleAuth.isLoggedIn();
    const admin = simpleAuth.isAdmin();
    const userData = simpleAuth.getUser();
    
    setIsLoggedIn(loggedIn);
    setIsAdmin(admin);
    setUser(userData);
  }, [pathname]); // Re-check on route change

  const handleLogout = () => {
    simpleAuth.logout();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    window.location.href = '/'; // Force refresh to update state
  };

  // Base navigation items that always show
  const baseNavigation = [
    { 
      name: 'Home', 
      href: '/', 
      icon: HomeIcon,
      description: 'Back to homepage',
      animation: 'hover:scale-110 transition-transform duration-300',
      show: true
    }
  ];

  // Conditional navigation items based on auth status
  const conditionalNavigation = [
    { 
      name: 'Create Profile', 
      href: '/create-profile', 
      icon: UserPlusIcon,
      description: 'Start your learning journey',
      animation: 'hover:rotate-12 hover:scale-110 transition-all duration-300',
      show: isLoggedIn // Only show when logged in
    },
    { 
      name: 'Login', 
      href: '/login', 
      icon: LoginIcon,
      description: 'Sign in to your account',
      animation: 'hover:scale-110 transition-transform duration-300',
      show: !isLoggedIn // Only show when NOT logged in
    },
    { 
      name: 'Admin Dashboard', 
      href: '/admin', 
      icon: CogIcon,
      description: 'Administrator panel',
      animation: 'hover:rotate-180 hover:scale-110 transition-all duration-500',
      show: isLoggedIn && isAdmin // Only show when logged in AND admin
    }
  ];

  // User menu for logged-in users
  const userNavigation = [
    {
      name: 'Logout',
      href: '#',
      icon: LogoutIcon,
      description: 'Sign out of your account',
      animation: 'hover:scale-110 transition-transform duration-300',
      show: isLoggedIn, // Only show when logged in
      onClick: handleLogout
    }
  ];

  // Combine all navigation items and filter by show property
  const navigation = [
    ...baseNavigation,
    ...conditionalNavigation,
    ...userNavigation
  ].filter(item => item.show);

  return (
    <header 
      className="shadow-xl border-b sticky top-0 z-50 backdrop-blur-sm"
      style={{ backgroundColor: '#8700e2', borderBottomColor: '#7200c4' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border backdrop-blur-sm transform"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <AcademicCapIcon className="h-7 w-7 text-white group-hover:animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-lg">
                  <div className="h-full w-full bg-yellow-300 rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-white group-hover:text-yellow-200 transition-colors duration-300">
                  Agent Guru
                </span>
                <span className="text-xs text-purple-100 -mt-1 group-hover:text-yellow-100 transition-colors duration-300">
                  Powered by AI Mavericks
                </span>
              </div>
            </Link>
          </div>

          {/* User Info - Show when logged in */}
          {/* {isLoggedIn && user && (
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  Welcome back!
                </div>
                <div className="text-xs text-purple-200 capitalize">
                  {user.type} user
                </div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user.type === 'admin' ? '⚙️' : user.type === 'teacher' ? '👨‍🏫' : '🎓'}
                </span>
              </div>
            </div>
          )} */}

          {/* Navigation Section - Desktop */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex items-center space-x-3 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group relative',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm transform scale-105'
                      : 'text-purple-100 hover:text-white hover:bg-white/10 hover:shadow-md'
                  )}
                  title={item.description}
                >
                  <div className={`${item.animation}`}>
                    <IconComponent 
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        isActive ? "text-white" : "text-purple-200 group-hover:text-white"
                      )} 
                    />
                  </div>
                  <span className="hidden xl:block">{item.name}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-lg">
                      <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Compact navigation for medium screens */}
          <nav className="hidden md:flex lg:hidden items-center space-x-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group relative',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm transform scale-110'
                      : 'text-purple-100 hover:text-white hover:bg-white/10 hover:shadow-md'
                  )}
                  title={item.description}
                >
                  <div className={`${item.animation}`}>
                    <IconComponent 
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        isActive ? "text-white" : "text-purple-200 group-hover:text-white"
                      )} 
                    />
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-lg">
                      <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t backdrop-blur-sm" style={{ borderTopColor: '#7200c4', backgroundColor: 'rgba(135, 0, 226, 0.5)' }}>
        <div className="px-4 py-3">
          <div className={`grid gap-2 ${navigation.length <= 2 ? 'grid-cols-2' : navigation.length <= 3 ? 'grid-cols-3' : navigation.length <= 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex flex-col items-center space-y-2 px-3 py-3 rounded-2xl text-xs font-medium transition-all duration-300 relative transform',
                    isActive
                      ? 'bg-white/20 text-white scale-105 shadow-lg'
                      : 'text-purple-100 hover:text-white hover:bg-white/10 active:scale-95'
                  )}
                >
                  <div className="relative">
                    <div className={`${item.animation}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                  <span className="text-xs text-center leading-tight">
                    {/* Shorten text for mobile */}
                    {item.name === 'Admin Dashboard' ? 'Admin' : 
                     item.name === 'Create Profile' ? 'Profile' : 
                     item.name}
                  </span>
                  
                  {/* Active indicator for mobile */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-lg">
                      <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
