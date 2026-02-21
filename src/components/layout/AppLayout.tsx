import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { globalSearch } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function AppLayout() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const res = await globalSearch(q);
    setResults(res);
    setOpen(res.length > 0);
  };

  const goTo = (r: any) => {
    setOpen(false);
    setQuery('');
    const paths: Record<string, string> = { student: '/students', teacher: '/teachers', manager: '/managers' };
    navigate(`${paths[r.type]}/${r.id}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 gap-4 bg-card shrink-0">
            <SidebarTrigger />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students, teachers, managers..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </PopoverTrigger>
              {results.length > 0 && (
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="max-h-64 overflow-auto">
                    {results.map(r => (
                      <button key={`${r.type}-${r.id}`} onClick={() => goTo(r)}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{r.type}{r.extra ? ` · ${r.extra}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
