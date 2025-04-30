
import React from 'react';
import Layout from '../components/Layout';
import UploadCard from '../components/UploadCard';
import ChatInterface from '../components/ChatInterface';
import TaskPreview from '../components/TaskPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Shield className="mr-3 text-complimate-purple" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Welcome to CompliMate</h1>
          </div>
          <p className="text-lg text-muted-foreground">Hi there 👋 — Ready to check your compliance?</p>
        </div>
        
        <Card className="tech-card mb-6 bg-complimate-tech-dark border-complimate-dark-purple/40 overflow-hidden">
          <div className="absolute inset-0 tech-gradient opacity-30"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-complimate-purple mb-1">AI Compliance Assistant</h2>
                <p className="text-muted-foreground">
                  Get instant analysis of your policies and compliance status
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Learn More</Button>
                <Button>Join Early Access</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="upload" className="mb-6">
              <TabsList>
                <TabsTrigger value="upload">Upload Document</TabsTrigger>
                <TabsTrigger value="policy">Create Policy</TabsTrigger>
                <TabsTrigger value="check">Quick Check</TabsTrigger>
              </TabsList>
            </Tabs>
            
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
