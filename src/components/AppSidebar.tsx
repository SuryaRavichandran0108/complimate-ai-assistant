
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, MessageSquare, CheckSquare, FileText, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-complimate-purple",
        isActive ? "bg-complimate-soft-gray text-complimate-purple" : ""
      )
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <div className={cn(
      "bg-sidebar-background text-sidebar-foreground h-screen border-r border-complimate-dark-purple/20 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="text-complimate-purple" size={24} />
              <span className="font-bold text-lg">CompliMate</span>
            </div>
          )}
          {collapsed && (
            <Shield className="text-complimate-purple" size={24} />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={collapsed ? "rotate-180" : ""}
          >
            <ArrowLeft size={16} />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        <NavItem 
          to="/" 
          icon={<Shield size={collapsed ? 20 : 18} />} 
          label={collapsed ? "" : "Dashboard"} 
        />
        <NavItem 
          to="/ask-agent" 
          icon={<MessageSquare size={collapsed ? 20 : 18} />} 
          label={collapsed ? "" : "Ask Agent"} 
        />
        <NavItem 
          to="/tasks" 
          icon={<CheckSquare size={collapsed ? 20 : 18} />} 
          label={collapsed ? "" : "Tasks"} 
        />
        <NavItem 
          to="/documents" 
          icon={<FileText size={collapsed ? 20 : 18} />} 
          label={collapsed ? "" : "Documents"} 
        />
      </nav>

      <div className="p-4">
        {user ? (
          <>
            {!collapsed && <p className="text-xs text-muted-foreground mb-2">Signed in as {user.email}</p>}
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className={cn("w-full justify-start", collapsed && "justify-center")}
            >
              <LogOut size={18} className={cn("mr-2", collapsed && "mr-0")} />
              {!collapsed && "Sign Out"}
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/auth'} 
            className={cn("w-full justify-start", collapsed && "justify-center")}
          >
            <LogIn size={18} className={cn("mr-2", collapsed && "mr-0")} />
            {!collapsed && "Sign In"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppSidebar;
