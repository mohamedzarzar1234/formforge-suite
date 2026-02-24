import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { QRScanner } from '@/components/QRScanner';
import { Bell, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/parents': 'Parents',
  '/managers': 'Managers',
  '/classes': 'Classes',
  '/levels': 'Levels',
  '/subjects': 'Subjects',
  '/settings': 'Settings',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const baseRoute = '/' + (pathname.split('/').filter(Boolean)[0] || '');
  const pageTitle = pageTitles[baseRoute] || 'Details';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b border-border bg-card px-6 shrink-0 gap-3 shadow-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            
            <div className="hidden md:flex items-center">
              <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>

            <div className="flex-1 flex justify-center max-w-xl mx-auto">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-1">
              <QRScanner />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                <Maximize2 className="h-[18px] w-[18px]" />
              </Button>
              <div className="ml-2 pl-3 border-l border-border flex items-center gap-3">
                <Avatar className="h-8 w-8 bg-primary/10">
                  <AvatarFallback className="text-xs font-semibold text-primary bg-primary/10">AD</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground leading-none">Admin</p>
                  <p className="text-xs text-muted-foreground">admin@school.com</p>
                </div>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
