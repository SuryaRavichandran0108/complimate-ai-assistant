
import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <div className="hidden lg:block w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-5 flex flex-col h-full">
        <div className="mt-8 flex-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Early Access
          </h3>
          <div className="bg-complimate-soft-blue/30 rounded-lg p-4 border border-complimate-soft-blue">
            <h4 className="font-medium text-gray-800 mb-2">Want to be notified when CompliMate launches?</h4>
            <a 
              href="#" 
              className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-complimate-purple hover:bg-complimate-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-complimate-purple w-full"
            >
              Join Early Access
            </a>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Resources
          </h3>
          <div className="space-y-1">
            <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-complimate-purple hover:bg-complimate-soft-gray">
              <span className="mr-3 text-gray-500 group-hover:text-complimate-purple">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.38A7.968 7.968 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.969 7.969 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </span>
              Compliance Guides
            </a>
            <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-complimate-purple hover:bg-complimate-soft-gray">
              <Calendar className="mr-3 h-5 w-5 text-gray-500 group-hover:text-complimate-purple" />
              Upcoming Deadlines
            </a>
            <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-complimate-purple hover:bg-complimate-soft-gray">
              <Clock className="mr-3 h-5 w-5 text-gray-500 group-hover:text-complimate-purple" />
              Recent Updates
            </a>
          </div>
        </div>
        
        <div className="mt-auto pt-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Sarah Johnson</p>
              <p className="text-xs text-gray-500">Acme Corp, LLC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
