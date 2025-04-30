
import React from 'react';
import Layout from '../components/Layout';
import UploadCard from '../components/UploadCard';
import ChatInterface from '../components/ChatInterface';
import TaskPreview from '../components/TaskPreview';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to CompliMate</h1>
          <p className="mt-2 text-lg text-gray-600">Hi there 👋 — Ready to check your compliance?</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UploadCard />
            <ChatInterface />
          </div>
          <div className="lg:col-span-1">
            <TaskPreview />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
