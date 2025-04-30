
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Upload, FolderOpen, FileUp, Clock, Star, Filter, Grid, List, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Documents: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const recentDocuments = [
    {
      id: 1,
      name: 'Privacy Policy v2.1',
      type: 'pdf',
      size: '420 KB',
      lastModified: '2025-04-28',
      tags: ['Privacy', 'Legal'],
      status: 'reviewed'
    },
    {
      id: 2,
      name: 'Employee Handbook 2025',
      type: 'docx',
      size: '1.2 MB',
      lastModified: '2025-04-22',
      tags: ['HR', 'Policies'],
      status: 'pending'
    },
    {
      id: 3,
      name: 'Data Processing Agreement',
      type: 'pdf',
      size: '380 KB',
      lastModified: '2025-04-15',
      tags: ['Legal', 'GDPR'],
      status: 'reviewed'
    },
    {
      id: 4,
      name: 'CCPA Compliance Checklist',
      type: 'xlsx',
      size: '250 KB',
      lastModified: '2025-04-10',
      tags: ['Compliance', 'Privacy'],
      status: 'pending'
    }
  ];
  
  const starredDocuments = [
    {
      id: 5,
      name: 'Security Protocol v1.3',
      type: 'pdf',
      size: '520 KB',
      lastModified: '2025-04-05',
      tags: ['Security', 'Internal'],
      status: 'reviewed'
    },
    {
      id: 6,
      name: 'Vendor Assessment Form',
      type: 'docx',
      size: '340 KB',
      lastModified: '2025-03-30',
      tags: ['Vendors', 'Assessment'],
      status: 'reviewed'
    }
  ];
  
  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf':
        return <FileText className="text-red-500" />;
      case 'docx':
        return <FileText className="text-blue-500" />;
      case 'xlsx':
        return <FileText className="text-green-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'reviewed':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-900/30 text-green-300">Reviewed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-900/30 text-yellow-300">Pending Review</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-900/30 text-gray-300">Draft</span>;
    }
  };
  
  const DocumentCard = ({ document }) => (
    <Card className="tech-card hover:border-complimate-purple/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(document.type)}
            <div>
              <h3 className="font-medium text-foreground">{document.name}</h3>
              <p className="text-xs text-muted-foreground">
                {document.type.toUpperCase()} • {document.size}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {document.tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/50 text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock size={12} className="mr-1" />
            {document.lastModified}
          </div>
          {getStatusBadge(document.status)}
        </div>
      </CardContent>
    </Card>
  );
  
  const DocumentRow = ({ document }) => (
    <div className="flex items-center p-3 border border-border rounded-lg bg-card hover:border-complimate-purple/30 transition-all">
      <Checkbox id={`doc-${document.id}`} className="mr-3" />
      <div className="flex items-center gap-3 flex-1">
        {getFileIcon(document.type)}
        <div>
          <h3 className="font-medium text-foreground">{document.name}</h3>
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/50 text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-xs text-muted-foreground">
          {document.lastModified}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {document.size}
        </div>
        
        {getStatusBadge(document.status)}
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Star size={16} className={document.id > 4 ? "text-yellow-500 fill-yellow-500" : ""} />
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your compliance documents and files
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <FolderOpen size={16} />
              Browse
            </Button>
            <Button className="flex items-center gap-2">
              <Upload size={16} />
              Upload
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Card className="tech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="search"
                    placeholder="Search documents..."
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter size={16} />
                    Filter
                  </Button>
                  
                  <div className="bg-secondary rounded-lg flex">
                    <Button 
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid size={16} />
                    </Button>
                    <Button 
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon" 
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="recent">
          <TabsList className="mb-6">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="all">All Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDocuments.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
                <Card className="tech-card border-dashed flex flex-col items-center justify-center p-6 h-full">
                  <FileUp size={32} className="text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-center mb-3">
                    Drop files here or click to upload
                  </p>
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Document
                  </Button>
                </Card>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-muted rounded-lg text-sm font-medium">
                  <div className="w-6 mr-3"></div>
                  <div className="flex-1">Name</div>
                  <div className="flex items-center gap-6">
                    <div className="w-24">Date</div>
                    <div className="w-24">Size</div>
                    <div className="w-28">Status</div>
                    <div className="w-10"></div>
                  </div>
                </div>
                {recentDocuments.map(doc => (
                  <DocumentRow key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="starred">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starredDocuments.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-muted rounded-lg text-sm font-medium">
                  <div className="w-6 mr-3"></div>
                  <div className="flex-1">Name</div>
                  <div className="flex items-center gap-6">
                    <div className="w-24">Date</div>
                    <div className="w-24">Size</div>
                    <div className="w-28">Status</div>
                    <div className="w-10"></div>
                  </div>
                </div>
                {starredDocuments.map(doc => (
                  <DocumentRow key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...recentDocuments, ...starredDocuments].map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-muted rounded-lg text-sm font-medium">
                  <div className="w-6 mr-3"></div>
                  <div className="flex-1">Name</div>
                  <div className="flex items-center gap-6">
                    <div className="w-24">Date</div>
                    <div className="w-24">Size</div>
                    <div className="w-28">Status</div>
                    <div className="w-10"></div>
                  </div>
                </div>
                {[...recentDocuments, ...starredDocuments].map(doc => (
                  <DocumentRow key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Documents;
