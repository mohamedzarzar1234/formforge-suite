import { useQuery } from '@tanstack/react-query';
import { getEntityById, getTemplate, getLevels, getClasses, getEntities } from '@/services/api';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: student } = useQuery({ queryKey: ['student', id], queryFn: () => getEntityById('student', id!) });
  const { data: template } = useQuery({ queryKey: ['template', 'student'], queryFn: () => getTemplate('student') });
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });
  const { data: parents = [] } = useQuery({ queryKey: ['parents'], queryFn: () => getEntities('parent') });

  if (!student || !template) return <p>Loading...</p>;

  const level = levels.find((l: any) => l.id === student.levelId);
  const cls = classes.find((c: any) => c.id === student.classId);
  const studentParents = parents.filter((p: any) => student.parentIds?.includes(p.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav('/students')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{student.firstname} {student.lastname}</h1>
            <p className="text-muted-foreground">ID: {student.id}</p>
          </div>
        </div>
        <Button onClick={() => nav(`/students/${id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Base Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Level</p><p className="text-sm">{level?.name ?? '—'}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Class</p><p className="text-sm">{cls?.name ?? '—'}</p></div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Parents</p>
              <div className="flex gap-2 flex-wrap">{studentParents.length > 0 ? studentParents.map((p: any) => (
                <Badge key={p.id} variant="secondary">{p.firstname} {p.lastname}{student.defaultParentId === p.id ? ' (default)' : ''}</Badge>
              )) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
        <CardContent><DynamicView fields={template.fields} data={student} /></CardContent>
      </Card>
    </div>
  );
}
