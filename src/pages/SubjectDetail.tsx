import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { subjectApi, teacherApi, levelApi } from '@/services/api';
import { lessonApi } from '@/services/exam-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Teacher } from '@/types';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subjectRes, isLoading } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => subjectApi.getById(id!),
    enabled: !!id,
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: levelsRes } = useQuery({
    queryKey: ['levels'],
    queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }),
  });

  const { data: lessonsRes } = useQuery({
    queryKey: ['lessons', 'subject', id],
    queryFn: () => lessonApi.getAll({ page: 1, limit: 1000, subjectId: id }),
    enabled: !!id,
  });

  const subject = subjectRes?.data;
  const teachers = teachersRes?.data || [];
  const levels = levelsRes?.data || [];
  const lessons = lessonsRes?.data || [];

  // Find teachers that teach this subject and their class assignments
  const teachersForSubject = teachers.filter((t: Teacher) => t.subjectIds.includes(id!));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Subject not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/subjects')}>Back to Subjects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
          <p className="text-muted-foreground">Code: {subject.code}</p>
        </div>
      </div>

      <Tabs defaultValue="information">
        <TabsList>
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="teachers">Teachers & Classes</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader><CardTitle>Subject Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{subject.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Code</p><p className="font-medium">{subject.code}</p></div>
                <div className="md:col-span-2"><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{subject.description || '—'}</p></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Statistics</p>
                <div className="grid grid-cols-3 gap-4">
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{teachersForSubject.length}</p><p className="text-xs text-muted-foreground">Teachers</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{lessons.length}</p><p className="text-xs text-muted-foreground">Lessons</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{new Set(lessons.map(l => l.levelId)).size}</p><p className="text-xs text-muted-foreground">Levels</p></CardContent></Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader><CardTitle>Teachers Teaching {subject.name}</CardTitle></CardHeader>
            <CardContent>
              {teachersForSubject.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No teachers assigned to this subject</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Classes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachersForSubject.map((teacher: Teacher) => {
                      const classesForSubject = teacher.classAssignments
                        .filter(ca => ca.subjectIds.includes(id!))
                        .map(ca => ca.classId);
                      return (
                        <TableRow key={teacher.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                          <TableCell className="font-medium">{teacher.firstname} {teacher.lastname}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {classesForSubject.length > 0 ? classesForSubject.map(cId => (
                                <Badge key={cId} variant="secondary">{cId}</Badge>
                              )) : <span className="text-muted-foreground text-sm">No classes</span>}
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

        <TabsContent value="lessons">
          <Card>
            <CardHeader><CardTitle>Lessons for {subject.name}</CardTitle></CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No lessons defined for this subject</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map(lesson => {
                      const level = levels.find(l => l.id === lesson.levelId);
                      return (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">{lesson.name}</TableCell>
                          <TableCell><Badge variant="outline">{level?.name || lesson.levelId}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{lesson.description || '—'}</TableCell>
                          <TableCell>{lesson.order}</TableCell>
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
