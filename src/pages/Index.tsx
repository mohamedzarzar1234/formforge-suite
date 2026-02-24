import { useQuery } from '@tanstack/react-query';
import { studentApi, teacherApi, parentApi, managerApi, classApi, levelApi, subjectApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCircle, Briefcase, School, Layers, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stats = [
  { key: 'students', label: 'Students', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', path: '/students' },
  { key: 'teachers', label: 'Teachers', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/teachers' },
  { key: 'parents', label: 'Parents', icon: UserCircle, color: 'text-violet-600', bg: 'bg-violet-50', path: '/parents' },
  { key: 'managers', label: 'Managers', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', path: '/managers' },
  { key: 'classes', label: 'Classes', icon: School, color: 'text-rose-600', bg: 'bg-rose-50', path: '/classes' },
  { key: 'levels', label: 'Levels', icon: Layers, color: 'text-teal-600', bg: 'bg-teal-50', path: '/levels' },
  { key: 'subjects', label: 'Subjects', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/subjects' },
] as const;

const apis: Record<string, any> = { students: studentApi, teachers: teacherApi, parents: parentApi, managers: managerApi, classes: classApi, levels: levelApi, subjects: subjectApi };

export default function Dashboard() {
  const navigate = useNavigate();
  const queries = Object.fromEntries(
    stats.map(s => [s.key, useQuery({ queryKey: [s.key], queryFn: () => apis[s.key].getAll({ page: 1, limit: 1000 }) })])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">School management overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(s.path)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queries[s.key]?.data?.total ?? '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
