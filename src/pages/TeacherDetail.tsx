import { useQuery } from '@tanstack/react-query';
import { getEntityById, getTemplate, getSubjects, getClasses } from '@/services/api';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function TeacherDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: teacher } = useQuery({ queryKey: ['teacher', id], queryFn: () => getEntityById('teacher', id!) });
  const { data: template } = useQuery({ queryKey: ['template', 'teacher'], queryFn: () => getTemplate('teacher') });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });

  if (!teacher || !template) return <p>Loading...</p>;

  const teacherSubjects = subjects.filter((s: any) => teacher.subjectIds?.includes(s.id));
  const teacherClasses = classes.filter((c: any) => teacher.classIds?.includes(c.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav('/teachers')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{teacher.firstname} {teacher.lastname}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Base Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">First Name</p><p className="text-sm">{teacher.firstname}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</p><p className="text-sm">{teacher.lastname}</p></div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Subjects</p>
              <div className="flex gap-1 flex-wrap">{teacherSubjects.length > 0 ? teacherSubjects.map((s: any) => <Badge key={s.id} variant="secondary">{s.name}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Classes</p>
              <div className="flex gap-1 flex-wrap">{teacherClasses.length > 0 ? teacherClasses.map((c: any) => <Badge key={c.id} variant="secondary">{c.name}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
        <CardContent><DynamicView fields={template.fields} data={teacher} /></CardContent>
      </Card>
    </div>
  );
}
