
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border/40 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-complimate-purple to-complimate-neon-blue bg-clip-text text-transparent">
              CompliMate
            </span>
          </Link>
          <p className="ml-3 text-sm text-gray-400 hidden md:block">Your AI Compliance Officer — Simplified.</p>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/ask-agent" 
            className={`nav-link ${isActive('/ask-agent') ? 'active' : ''}`}
          >
            Ask Agent
          </Link>
          <Link 
            to="/tasks" 
            className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
          >
            Tasks
          </Link>
          <Link 
            to="/documents" 
            className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
          >
            Documents
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-complimate-purple">
            <Bell size={20} />
          </button>
          <button className="text-gray-400 hover:text-complimate-purple">
            <User size={20} />
          </button>
          <button 
            className="md:hidden text-gray-400 hover:text-complimate-purple"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border/40 py-4 px-4">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/ask-agent" 
              className={`nav-link ${isActive('/ask-agent') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Ask Agent
            </Link>
            <Link 
              to="/tasks" 
              className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tasks
            </Link>
            <Link 
              to="/documents" 
              className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Documents
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
