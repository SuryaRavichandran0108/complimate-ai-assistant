
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-complimate-purple">CompliMate</h1>
          </Link>
          <p className="ml-3 text-sm text-gray-500 hidden md:block">Your AI Compliance Officer — Simplified.</p>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="nav-link active">Dashboard</Link>
          <Link to="#" className="nav-link">Ask Agent</Link>
          <Link to="#" className="nav-link">Tasks</Link>
          <Link to="#" className="nav-link">Documents</Link>
        </nav>
        <div className="md:hidden">
          <button className="text-gray-500 hover:text-complimate-purple">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
