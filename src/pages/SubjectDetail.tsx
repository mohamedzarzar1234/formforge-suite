import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { subjectApi, teacherApi, levelApi, classApi } from '@/services/api';
import { MarkStatisticsPanel } from '@/components/MarkStatisticsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectLessonsEditor } from '@/components/SubjectLessonsEditor';
import { useTranslation } from 'react-i18next';
import type { Teacher, Level, SchoolClass } from '@/types';

export default function SubjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedLessonLevel, setSelectedLessonLevel] = useState<string | null>(null);

  const { data: subjectRes, isLoading } = useQuery({ queryKey: ['subject', id], queryFn: () => subjectApi.getById(id!), enabled: !!id });
  const { data: teachersRes } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  const subject = subjectRes?.data;
  const teachers = teachersRes?.data || [];
  const allLevels = levelsRes?.data || [];
  const allClasses = classesRes?.data || [];

  const subjectLevels = allLevels.filter((l: Level) => (l.subjectIds || []).includes(id!));
  const teachersForSubject = teachers.filter((tea: Teacher) => tea.subjectIds.includes(id!));

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!subject) {
    return <div className="text-center py-12"><p className="text-muted-foreground">{t('subjects.notFound')}</p><Button variant="outline" className="mt-4" onClick={() => navigate('/subjects')}>{t('common.backTo', { entity: t('nav.subjects') })}</Button></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{subject.name}</h1>
          <p className="text-muted-foreground">{t('common.codeLabel', { code: subject.code })}</p>
        </div>
      </div>

      <Tabs defaultValue="information">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="information">{t('tabs.info')}</TabsTrigger>
          <TabsTrigger value="teachers">{t('tabs.teachers')}</TabsTrigger>
          <TabsTrigger value="lessons">{t('tabs.lessons')}</TabsTrigger>
          <TabsTrigger value="marks" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">{t('tabs.markStats')}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader><CardTitle>{t('subjects.subjectInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">{t('common.name')}</p><p className="font-medium">{subject.name}</p></div>
                <div><p className="text-sm text-muted-foreground">{t('common.code')}</p><p className="font-medium">{subject.code}</p></div>
                <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">{t('common.description')}</p><p className="font-medium">{subject.description || '—'}</p></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t('common.statistics')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{teachersForSubject.length}</p><p className="text-xs text-muted-foreground">{t('common.teachers')}</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{subjectLevels.length}</p><p className="text-xs text-muted-foreground">{t('nav.levels')}</p></CardContent></Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader><CardTitle>{t('teachers.teachingSubject', { name: subject.name })}</CardTitle></CardHeader>
            <CardContent>
              {teachersForSubject.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('subjects.noTeachersAssigned')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.teacher')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('common.level')}</TableHead>
                        <TableHead>{t('nav.classes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachersForSubject.map((teacher: Teacher) => {
                        const classesForSubject = teacher.classAssignments
                          .filter(ca => ca.subjectIds.includes(id!))
                          .map(ca => allClasses.find((c: SchoolClass) => c.id === ca.classId))
                          .filter(Boolean) as SchoolClass[];

                        return (
                          <TableRow key={teacher.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                            <TableCell className="font-medium">{teacher.firstname} {teacher.lastname}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {Array.from(new Set(classesForSubject.map(c => c.levelId))).map(lvlId => {
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
                                )) : <span className="text-muted-foreground text-sm">{t('common.noClasses')}</span>}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card>
            <CardHeader><CardTitle>{t('subjects.lessonsFor', { name: subject.name })}</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {subjectLevels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('subjects.noLevelsAssigned')}</p>
              ) : (
                <Tabs value={selectedLessonLevel || subjectLevels[0]?.id || ''} onValueChange={v => setSelectedLessonLevel(v)}>
                  <TabsList className="flex-wrap h-auto">
                    {subjectLevels.map((lvl: Level) => (
                      <TabsTrigger key={lvl.id} value={lvl.id}>{lvl.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {subjectLevels.map((lvl: Level) => (
                    <TabsContent key={lvl.id} value={lvl.id}>
                      <SubjectLessonsEditor subjectId={id!} levelId={lvl.id} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <MarkStatisticsPanel
            fixedSubjectId={id!}
            showFilters={true}
            title={`${t('marks.statistics')} — ${subject.name}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
