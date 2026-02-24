import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi, parentApi, levelApi, classApi, templateApi } from '@/services/api';
import { DynamicView } from '@/components/DynamicView';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { EntityAttendanceTab } from '@/components/EntityAttendanceTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserX, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading } = useQuery({ queryKey: ['students', id], queryFn: () => studentApi.getById(id!) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: parentsRes } = useQuery({ queryKey: ['parents'], queryFn: () => parentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  const student = res?.data;
  const fields = tplRes?.data?.student?.fields || [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!student) return <div className="text-center py-12 text-muted-foreground">Student not found</div>;

  const level = levelsRes?.data?.find(l => l.id === student.levelId);
  const cls = classesRes?.data?.find(c => c.id === student.classId);
  const studentParents = parentsRes?.data?.filter(p => student.parentIds.includes(p.id)) || [];
  const fullName = `${student.firstname} ${student.lastname}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground">ID: {student.id}</p>
        </div>
        <QRCodeDisplay entityType="students" entityId={student.id} entityName={fullName} />
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
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">First Name</p><p className="font-medium">{student.firstname}</p></div>
                  <div><p className="text-sm text-muted-foreground">Last Name</p><p className="font-medium">{student.lastname}</p></div>
                  <div><p className="text-sm text-muted-foreground">Level</p><p className="font-medium">{level?.name || '—'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Class</p><p className="font-medium">{cls?.name || '—'}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Parents</CardTitle></CardHeader>
              <CardContent>
                {studentParents.length === 0 ? <p className="text-muted-foreground">No parents assigned</p> : (
                  <div className="space-y-2">
                    {studentParents.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/parents/${p.id}`)}>{p.firstname} {p.lastname}</span>
                        {p.id === student.defaultParentId && <Badge variant="secondary">Default</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
              <CardContent><DynamicView fields={fields} data={student.dynamicFields || {}} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <EntityAttendanceTab entityType="student" entityId={student.id} entityName={fullName} recordType="absences" />
        </TabsContent>
        <TabsContent value="lates">
          <EntityAttendanceTab entityType="student" entityId={student.id} entityName={fullName} recordType="lates" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
