import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
    user: UserProfile | null;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-20">
      <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AgentFlow</h1>
        </div>
        
        {user ? (
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-3 bg-gray-800/50 hover:bg-gray-700/50 transition">
                    <img src={user.picture} alt="User avatar" className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-gray-300 hidden sm:block">{user.given_name}</span>
                     <svg className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="p-1">
                            <button 
                                onClick={() => {
                                    onSignOut();
                                    setDropdownOpen(false);
                                }} 
                                className="w-full text-left flex items-center space-x-2 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/20 rounded-md transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
             <a href="https://github.com/google/generative-ai-docs/issues/1077#issue-2313658249" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                Inspired by a prompt
             </a>
        )}
      </div>
    </header>
  );
};

export default Header;