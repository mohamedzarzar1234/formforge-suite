import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { subjectApi, teacherApi, levelApi, classApi } from '@/services/api';
import { lessonApi, unitApi } from '@/services/exam-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Teacher, Level, SchoolClass } from '@/types';
import type { Lesson, Unit } from '@/types/exam';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedLessonLevel, setSelectedLessonLevel] = useState<string | null>(null);

  const { data: subjectRes, isLoading } = useQuery({ queryKey: ['subject', id], queryFn: () => subjectApi.getById(id!), enabled: !!id });
  const { data: teachersRes } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  // Lessons for selected level
  const { data: lessonsRes } = useQuery({
    queryKey: ['lessons', 'subject', id, selectedLessonLevel],
    queryFn: () => lessonApi.getBySubjectAndLevel(id!, selectedLessonLevel!),
    enabled: !!id && !!selectedLessonLevel,
  });
  const { data: unitsRes } = useQuery({
    queryKey: ['units', id, selectedLessonLevel],
    queryFn: () => unitApi.getAll({ subjectId: id!, levelId: selectedLessonLevel! }),
    enabled: !!id && !!selectedLessonLevel,
  });

  const subject = subjectRes?.data;
  const teachers = teachersRes?.data || [];
  const allLevels = levelsRes?.data || [];
  const allClasses = classesRes?.data || [];
  const lessons = lessonsRes?.data ?? [];
  const units = (unitsRes?.data ?? []).sort((a: Unit, b: Unit) => a.order - b.order);

  // Levels that include this subject
  const subjectLevels = allLevels.filter((l: Level) => (l.subjectIds || []).includes(id!));

  // Teachers that teach this subject
  const teachersForSubject = teachers.filter((t: Teacher) => t.subjectIds.includes(id!));

  if (isLoading) {
    return (<div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>);
  }
  if (!subject) {
    return (<div className="text-center py-12"><p className="text-muted-foreground">Subject not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/subjects')}>Back to Subjects</Button></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
          <p className="text-muted-foreground">Code: {subject.code}</p>
        </div>
      </div>

      <Tabs defaultValue="information">
        <TabsList>
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
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
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{subjectLevels.length}</p><p className="text-xs text-muted-foreground">Levels</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{lessons.length}</p><p className="text-xs text-muted-foreground">Lessons{selectedLessonLevel ? '' : ' (select level)'}</p></CardContent></Card>
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
                      <TableHead>Level</TableHead>
                      <TableHead>Classes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachersForSubject.map((teacher: Teacher) => {
                      const classesForSubject = teacher.classAssignments
                        .filter(ca => ca.subjectIds.includes(id!))
                        .map(ca => {
                          const cls = allClasses.find((c: SchoolClass) => c.id === ca.classId);
                          return cls;
                        })
                        .filter(Boolean) as SchoolClass[];

                      // Group by level
                      const byLevel = new Map<string, SchoolClass[]>();
                      classesForSubject.forEach(cls => {
                        const arr = byLevel.get(cls.levelId) || [];
                        arr.push(cls);
                        byLevel.set(cls.levelId, arr);
                      });

                      return (
                        <TableRow key={teacher.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                          <TableCell className="font-medium">{teacher.firstname} {teacher.lastname}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(byLevel.keys()).map(lvlId => {
                                const lvl = allLevels.find((l: Level) => l.id === lvlId);
                                return <Badge key={lvlId} variant="outline">{lvl?.name || lvlId}</Badge>;
                              })}
                              {classesForSubject.length === 0 && <span className="text-muted-foreground text-sm">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {classesForSubject.length > 0 ? classesForSubject.map(cls => (
                                <Badge key={cls.id} variant="secondary">{cls.name}</Badge>
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
              {/* Sub-tabs: levels */}
              {subjectLevels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No levels assigned to this subject</p>
              ) : (
                <Tabs value={selectedLessonLevel || ''} onValueChange={v => setSelectedLessonLevel(v)}>
                  <TabsList>
                    {subjectLevels.map((lvl: Level) => (
                      <TabsTrigger key={lvl.id} value={lvl.id}>{lvl.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {subjectLevels.map((lvl: Level) => (
                    <TabsContent key={lvl.id} value={lvl.id}>
                      <LevelLessonsView lessons={lessons} units={units} levelId={lvl.id} selectedLevelId={selectedLessonLevel} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LevelLessonsView({ lessons, units, levelId, selectedLevelId }: { lessons: Lesson[]; units: Unit[]; levelId: string; selectedLevelId: string | null }) {
  if (selectedLevelId !== levelId) return null;

  const ungroupedLessons = lessons.filter(l => !l.unitId || !units.find(u => u.id === l.unitId));
  const unitLessonsMap = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    units.forEach(u => map.set(u.id, []));
    lessons.forEach(l => {
      if (l.unitId && map.has(l.unitId)) {
        map.get(l.unitId)!.push(l);
      }
    });
    // Sort lessons within each unit
    map.forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [lessons, units]);

  if (lessons.length === 0 && units.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No lessons or units for this level</p>;
  }

  return (
    <div className="space-y-4 mt-4">
      {units.map(unit => {
        const unitLessons = unitLessonsMap.get(unit.id) || [];
        return (
          <div key={unit.id} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
              <Badge className="bg-primary/10 text-primary border-0">{unit.order}</Badge>
              <span className="font-semibold text-sm">{unit.name}</span>
              <Badge variant="secondary" className="ml-auto text-xs">{unitLessons.length} lessons</Badge>
            </div>
            <div className="p-3 space-y-2">
              {unitLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No lessons</p>
              ) : (
                unitLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    <Badge variant="outline" className="shrink-0 text-xs font-mono">{lesson.order}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lesson.name}</p>
                      {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      {ungroupedLessons.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b">
            <span className="font-semibold text-sm text-muted-foreground">Ungrouped Lessons</span>
          </div>
          <div className="p-3 space-y-2">
            {ungroupedLessons.map(lesson => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Badge variant="outline" className="shrink-0 text-xs font-mono">{lesson.order}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{lesson.name}</p>
                  {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
