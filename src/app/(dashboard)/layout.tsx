import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import SideNavBar from '@/components/layout/SideNavBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNavBar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-sidebar-width flex flex-col h-screen w-[calc(100%-260px)] relative">
        {children}
      </div>
    </div>
  );
}
