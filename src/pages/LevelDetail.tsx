import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { levelApi, classApi, subjectApi, teacherApi, studentApi, managerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Teacher, SchoolClass, Student, Manager } from '@/types';

export default function LevelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: levelRes, isLoading } = useQuery({
    queryKey: ['level', id],
    queryFn: () => levelApi.getById(id!),
    enabled: !!id,
  });

  const { data: classesRes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: subjectsRes } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: studentsRes } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: managersRes } = useQuery({
    queryKey: ['managers'],
    queryFn: () => managerApi.getAll({ page: 1, limit: 1000 }),
  });

  const level = levelRes?.data;
  const allClasses = classesRes?.data || [];
  const allSubjects = subjectsRes?.data || [];
  const allTeachers = teachersRes?.data || [];
  const allStudents = studentsRes?.data || [];
  const allManagers = managersRes?.data || [];

  const levelClasses = allClasses.filter((c: SchoolClass) => c.levelId === id);
  const levelClassIds = levelClasses.map((c: SchoolClass) => c.id);

  // Find subjects taught in this level's classes
  const subjectTeacherMap = new Map<string, Set<string>>();
  allTeachers.forEach((t: Teacher) => {
    t.classAssignments.forEach(ca => {
      if (levelClassIds.includes(ca.classId)) {
        ca.subjectIds.forEach(sId => {
          if (!subjectTeacherMap.has(sId)) subjectTeacherMap.set(sId, new Set());
          subjectTeacherMap.get(sId)!.add(t.id);
        });
      }
    });
  });

  const levelSubjectIds = Array.from(subjectTeacherMap.keys());
  const levelSubjects = allSubjects.filter(s => levelSubjectIds.includes(s.id));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!level) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Level not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/levels')}>Back to Levels</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/levels')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{level.name}</h1>
          <p className="text-muted-foreground">{level.description}</p>
        </div>
      </div>

      <Tabs defaultValue="information">
        <TabsList>
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="subjects">Subjects & Teachers</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader><CardTitle>Level Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{level.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{level.description || '—'}</p></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Statistics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{levelClasses.length}</p><p className="text-xs text-muted-foreground">Classes</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{allStudents.filter((s: Student) => s.levelId === id).length}</p><p className="text-xs text-muted-foreground">Students</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{levelSubjects.length}</p><p className="text-xs text-muted-foreground">Subjects</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{levelClasses.reduce((sum, c) => sum + c.capacity, 0)}</p><p className="text-xs text-muted-foreground">Total Capacity</p></CardContent></Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader><CardTitle>Subjects & Teachers in {level.name}</CardTitle></CardHeader>
            <CardContent>
              {levelSubjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No subjects assigned to this level</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Teachers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelSubjects.map(subject => {
                      const teacherIds = Array.from(subjectTeacherMap.get(subject.id) || []);
                      const subjectTeachers = allTeachers.filter((t: Teacher) => teacherIds.includes(t.id));
                      return (
                        <TableRow key={subject.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/subjects/${subject.id}`)}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell><Badge variant="outline">{subject.code}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {subjectTeachers.map((t: Teacher) => (
                                <Badge key={t.id} variant="secondary">{t.firstname} {t.lastname}</Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader><CardTitle>Classes in {level.name}</CardTitle></CardHeader>
            <CardContent>
              {levelClasses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No classes in this level</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Active Students</TableHead>
                      <TableHead>Managers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelClasses.map((cls: SchoolClass) => {
                      const activeStudents = allStudents.filter((s: Student) => s.classId === cls.id).length;
                      const classManagers = allManagers.filter((m: Manager) => m.classIds.includes(cls.id));
                      return (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>{cls.section}</TableCell>
                          <TableCell>{cls.capacity}</TableCell>
                          <TableCell>
                            <Badge variant={activeStudents >= cls.capacity ? 'destructive' : 'secondary'}>
                              {activeStudents} / {cls.capacity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {classManagers.length > 0 ? classManagers.map((m: Manager) => (
                                <Badge key={m.id} variant="outline" className="cursor-pointer" onClick={() => navigate(`/managers/${m.id}`)}>
                                  {m.firstname} {m.lastname}
                                </Badge>
                              )) : <span className="text-muted-foreground text-sm">None</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
