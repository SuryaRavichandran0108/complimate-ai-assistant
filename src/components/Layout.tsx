
import React from 'react';
import Header from './Header';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarInset } from './ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background pointer-events-auto">
        <AppSidebar />
        <SidebarInset className="relative flex flex-col flex-1 pointer-events-auto">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pointer-events-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
