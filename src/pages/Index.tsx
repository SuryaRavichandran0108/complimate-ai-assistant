
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskPreview from '../components/TaskPreview';
import AgentSuggestions from '../components/AgentSuggestions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, FileText, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocuments } from '@/utils/documentUtils';

const Index: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    if (!user) return;
    
    // Get user documents
    const docs = await getUserDocuments(user.id);
    setDocuments(docs || []);
  };
  
  const handleDocumentSelect = async (doc: any) => {
    setActiveDocument(doc);
    
    toast({
      title: "Document Selected",
      description: `${doc.name} is ready for analysis`,
    });
  };

  const clearActiveDocument = () => {
    setActiveDocument(null);
  };

  // Handle navigation with auth check
  const handleNavigation = (path: string) => {
    if (!user && path !== '/auth') {
      navigate('/auth');
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
      });
    } else {
      navigate(path);
    }
  };

  const complianceStats = [
    { label: 'Compliance Score', value: '72%', color: 'text-complimate-purple' },
    { label: 'Tasks Completed', value: '8/12', color: 'text-green-500' },
    { label: 'Issues Found', value: '3', color: 'text-amber-500' },
    { label: 'Improvement Areas', value: '4', color: 'text-blue-500' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header and tagline */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Shield className="mr-3 text-complimate-purple" size={28} />
            <h1 className="text-3xl font-bold text-foreground">CompliMate</h1>
          </div>
          <p className="text-lg text-muted-foreground">Your AI Compliance Officer — 24/7, Affordable, and Always Up to Date</p>
        </div>
        
        {/* Main CTA section */}
        <Card className="tech-card mb-6 bg-complimate-tech-dark border-complimate-dark-purple/40 overflow-hidden">
          <div className="absolute inset-0 tech-gradient opacity-30"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-complimate-purple mb-1">
                  Upload your policy. Ask a question. Get smart compliance support in seconds.
                </h2>
                <p className="text-muted-foreground">
                  Our AI reviews every document against SOC 2, GDPR, HIPAA, and state-specific labor laws to identify gaps and provide actionable recommendations.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleNavigation('/documents')} 
                  className="flex items-center gap-2"
                >
                  <FileText size={16} /> Upload Document
                </Button>
                <Button 
                  onClick={() => handleNavigation('/ask-agent')} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} /> Quick Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Document analysis card - only shows when a document is selected */}
        {activeDocument && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-complimate-soft-gray flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-complimate-purple" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Document Analysis</h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      Analysis Complete
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeDocument.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-4 gap-4">
                  {complianceStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={clearActiveDocument}>Clear</Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area - Removed Quick Links */}
          <div className="lg:col-span-2">
            {/* This is where Quick Links used to be */}
          </div>
          
          {/* Sidebar with agent suggestions and task preview */}
          <div className="lg:col-span-1">
            <AgentSuggestions />
            <TaskPreview />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
