import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCheck, Shield, BookOpen, Layers, Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const statCards = [
  { key: 'students', label: 'Students', icon: GraduationCap, color: 'text-primary', link: '/students' },
  { key: 'teachers', label: 'Teachers', icon: Users, color: 'text-accent', link: '/teachers' },
  { key: 'parents', label: 'Parents', icon: UserCheck, color: 'text-warning', link: '/parents' },
  { key: 'managers', label: 'Managers', icon: Shield, color: 'text-info', link: '/managers' },
  { key: 'classes', label: 'Classes', icon: BookOpen, color: 'text-success', link: '/classes' },
  { key: 'levels', label: 'Levels', icon: Layers, color: 'text-destructive', link: '/levels' },
  { key: 'subjects', label: 'Subjects', icon: Library, color: 'text-primary', link: '/subjects' },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to School Management System</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(s.link)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{(stats as any)?.[s.key] ?? 0}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
