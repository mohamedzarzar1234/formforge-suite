import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teacherApi, subjectApi, classApi, templateApi } from '@/services/api';
import { DynamicView } from '@/components/DynamicView';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { EntityAttendanceTab } from '@/components/EntityAttendanceTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserX, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading } = useQuery({ queryKey: ['teachers', id], queryFn: () => teacherApi.getById(id!) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  const teacher = res?.data;
  const fields = tplRes?.data?.teacher?.fields || [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!teacher) return <div className="text-center py-12 text-muted-foreground">Teacher not found</div>;

  const classAssignments = teacher.classAssignments || [];
  const fullName = `${teacher.firstname} ${teacher.lastname}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teachers')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold flex-1">{fullName}</h1>
        <QRCodeDisplay entityType="teachers" entityId={teacher.id} entityName={fullName} />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="absences" className="gap-2"><UserX className="h-4 w-4" />Absences</TabsTrigger>
          <TabsTrigger value="lates" className="gap-2"><Clock className="h-4 w-4" />Lates</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Subjects</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {teacher.subjectIds.map(sid => <Badge key={sid} variant="secondary">{subjectsRes?.data?.find(s => s.id === sid)?.name || sid}</Badge>)}
                {teacher.subjectIds.length === 0 && <p className="text-muted-foreground">None assigned</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Class Assignments</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {classAssignments.length === 0 && <p className="text-muted-foreground">None assigned</p>}
                {classAssignments.map(a => {
                  const cls = classesRes?.data?.find(c => c.id === a.classId);
                  return (
                    <div key={a.classId} className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{cls?.name || a.classId}</Badge>
                      <span className="text-muted-foreground text-xs">→</span>
                      {a.subjectIds.map(sid => (
                        <Badge key={sid} variant="secondary" className="text-xs">
                          {subjectsRes?.data?.find(s => s.id === sid)?.name || sid}
                        </Badge>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
              <CardContent><DynamicView fields={fields} data={teacher.dynamicFields || {}} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <EntityAttendanceTab entityType="teacher" entityId={teacher.id} entityName={fullName} recordType="absences" />
        </TabsContent>
        <TabsContent value="lates">
          <EntityAttendanceTab entityType="teacher" entityId={teacher.id} entityName={fullName} recordType="lates" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
