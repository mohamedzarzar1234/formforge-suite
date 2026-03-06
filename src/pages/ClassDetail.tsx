import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserX, Clock, Award } from 'lucide-react';
import { classApi, levelApi, studentApi, teacherApi, managerApi, subjectApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EntityAttendanceTab } from '@/components/EntityAttendanceTab';
import { MarkStatsPanel } from '@/components/MarkStatsPanel';
import type { Student, Teacher, Manager } from '@/types';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: classRes, isLoading } = useQuery({ queryKey: ['class', id], queryFn: () => classApi.getById(id!), enabled: !!id });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: teachersRes } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });
  const { data: managersRes } = useQuery({ queryKey: ['managers'], queryFn: () => managerApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });

  const cls = classRes?.data;
  const levels = levelsRes?.data || [];
  const students = studentsRes?.data || [];
  const teachers = teachersRes?.data || [];
  const managers = managersRes?.data || [];
  const subjects = subjectsRes?.data || [];

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!cls) return <div className="text-center py-12"><p className="text-muted-foreground">Class not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/classes')}>Back to Classes</Button></div>;

  const level = levels.find(l => l.id === cls.levelId);
  const classStudents = students.filter((s: Student) => s.classId === id);
  const classManagers = managers.filter((m: Manager) => m.classIds.includes(id!));
  const classTeachers = teachers.filter((t: Teacher) => t.classAssignments.some(ca => ca.classId === id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/classes')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
          <p className="text-muted-foreground">{level?.name || cls.levelId} · Section {cls.section}</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="absences" className="gap-2"><UserX className="h-4 w-4" />Absences</TabsTrigger>
          <TabsTrigger value="lates" className="gap-2"><Clock className="h-4 w-4" />Lates</TabsTrigger>
          <TabsTrigger value="marks" className="gap-2"><Award className="h-4 w-4" />Mark Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Class Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{cls.name}</p></div>
                  <div><p className="text-sm text-muted-foreground">Section</p><p className="font-medium">{cls.section}</p></div>
                  <div><p className="text-sm text-muted-foreground">Level</p><p className="font-medium">{level?.name || '—'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Capacity</p><p className="font-medium">{classStudents.length} / {cls.capacity}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Managers</CardTitle></CardHeader>
              <CardContent>
                {classManagers.length === 0 ? <p className="text-muted-foreground">No managers assigned</p> : (
                  <div className="flex flex-wrap gap-2">
                    {classManagers.map(m => (
                      <Badge key={m.id} variant="secondary" className="cursor-pointer" onClick={() => navigate(`/managers/${m.id}`)}>
                        {m.firstname} {m.lastname}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Teachers & Subjects</CardTitle></CardHeader>
              <CardContent>
                {classTeachers.length === 0 ? <p className="text-muted-foreground">No teachers assigned</p> : (
                  <div className="space-y-2">
                    {classTeachers.map(t => {
                      const ca = t.classAssignments.find(a => a.classId === id);
                      return (
                        <div key={t.id} className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/teachers/${t.id}`)}>
                            {t.firstname} {t.lastname}
                          </Badge>
                          {ca?.subjectIds.map(sid => (
                            <Badge key={sid} variant="secondary" className="text-xs">
                              {subjects.find(s => s.id === sid)?.name || sid}
                            </Badge>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Students ({classStudents.length})</CardTitle></CardHeader>
              <CardContent>
                {classStudents.length === 0 ? <p className="text-muted-foreground">No students</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {classStudents.map(s => (
                        <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/students/${s.id}`)}>
                          <TableCell className="font-medium">{s.firstname} {s.lastname}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">Class-level absence tracking coming soon. View individual student absences from their detail pages.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lates">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">Class-level late tracking coming soon. View individual student lates from their detail pages.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <MarkStatsPanel fixedClassId={id} fixedLevelId={cls.levelId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
