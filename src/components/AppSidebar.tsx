
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  MessageSquare, 
  ClipboardCheck, 
  FileText, 
  Calendar, 
  Clock,
  User
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";

// Menu items
const navigationItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: Shield,
  },
  {
    title: "Ask Agent",
    path: "/ask-agent",
    icon: MessageSquare,
  },
  {
    title: "Tasks",
    path: "/tasks",
    icon: ClipboardCheck,
  },
  {
    title: "Documents",
    path: "/documents",
    icon: FileText,
  }
];

export function AppSidebar() {
  const location = useLocation();
  
  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-complimate-purple">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-complimate-purple">CompliMate</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Compliance Guides">
                  <a href="#">
                    <FileText />
                    <span>Compliance Guides</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Upcoming Deadlines">
                  <a href="#">
                    <Calendar />
                    <span>Upcoming Deadlines</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Recent Updates">
                  <a href="#">
                    <Clock />
                    <span>Recent Updates</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User" 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">Acme Corp, LLC</p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
