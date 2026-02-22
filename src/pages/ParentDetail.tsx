import { useQuery } from '@tanstack/react-query';
import { getEntityById, getTemplate, getEntities } from '@/services/api';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function ParentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: parent } = useQuery({ queryKey: ['parent', id], queryFn: () => getEntityById('parent', id!) });
  const { data: template } = useQuery({ queryKey: ['template', 'parent'], queryFn: () => getTemplate('parent') });
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => getEntities('student') });

  if (!parent || !template) return <p>Loading...</p>;

  const parentStudents = students.filter((s: any) => s.parentIds?.includes(parent.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav('/parents')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{parent.firstname} {parent.lastname}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Base Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">First Name</p><p className="text-sm">{parent.firstname}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</p><p className="text-sm">{parent.lastname}</p></div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Students</p>
              <div className="flex gap-1 flex-wrap">{parentStudents.length > 0 ? parentStudents.map((s: any) => <Badge key={s.id} variant="secondary">{s.firstname} {s.lastname}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
        <CardContent><DynamicView fields={template.fields} data={parent} /></CardContent>
      </Card>
    </div>
  );
}
