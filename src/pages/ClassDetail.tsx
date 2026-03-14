import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserX, Clock, BarChart3 } from 'lucide-react';
import { classApi, levelApi, studentApi, managerApi } from '@/services/api';
import { MarkStatisticsPanel } from '@/components/MarkStatisticsPanel';
import { GroupAttendanceTab } from '@/components/GroupAttendanceTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import type { Student, Manager } from '@/types';

export default function ClassDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: classRes, isLoading } = useQuery({ queryKey: ['class', id], queryFn: () => classApi.getById(id!), enabled: !!id });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: managersRes } = useQuery({ queryKey: ['managers'], queryFn: () => managerApi.getAll({ page: 1, limit: 1000 }) });

  const cls = classRes?.data;
  const levels = levelsRes?.data || [];
  const allStudents = studentsRes?.data || [];
  const allManagers = managersRes?.data || [];

  const classStudents = allStudents.filter((s: Student) => s.classId === id);
  const classManagers = allManagers.filter((m: Manager) => m.classIds.includes(id!));
  const levelName = levels.find(l => l.id === cls?.levelId)?.name || cls?.levelId || '';

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!cls) {
    return <div className="text-center py-12"><p className="text-muted-foreground">{t('classes.notFound')}</p><Button variant="outline" className="mt-4" onClick={() => navigate('/classes')}>{t('common.backTo', { entity: t('nav.classes') })}</Button></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/classes')} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{cls.name}</h1>
          <p className="text-muted-foreground">{t('common.sectionOf', { section: cls.section })} · {levelName}</p>
        </div>
      </div>

      <Tabs defaultValue="information">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="information">{t('tabs.info')}</TabsTrigger>
          <TabsTrigger value="absences" className="gap-2"><UserX className="h-4 w-4" /><span className="hidden sm:inline">{t('tabs.absences')}</span></TabsTrigger>
          <TabsTrigger value="lates" className="gap-2"><Clock className="h-4 w-4" /><span className="hidden sm:inline">{t('tabs.lates')}</span></TabsTrigger>
          <TabsTrigger value="marks" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">{t('tabs.markStats')}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader><CardTitle>{t('classes.classInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-sm text-muted-foreground">{t('common.name')}</p><p className="font-medium">{cls.name}</p></div>
                <div><p className="text-sm text-muted-foreground">{t('common.section')}</p><p className="font-medium">{cls.section}</p></div>
                <div><p className="text-sm text-muted-foreground">{t('common.level')}</p><p className="font-medium">{levelName}</p></div>
                <div><p className="text-sm text-muted-foreground">{t('common.capacity')}</p><p className="font-medium">{cls.capacity}</p></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t('common.statistics')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{classStudents.length}</p><p className="text-xs text-muted-foreground">{t('common.students')}</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{cls.capacity}</p><p className="text-xs text-muted-foreground">{t('common.capacity')}</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{classManagers.length}</p><p className="text-xs text-muted-foreground">{t('common.managers')}</p></CardContent></Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">
                        <Badge variant={classStudents.length >= cls.capacity ? 'destructive' : 'secondary'}>
                          {classStudents.length}/{cls.capacity}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">{t('common.enrollment')}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t('common.students')}</p>
                {classStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{t('students.noStudents')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>{t('common.name')}</TableHead><TableHead className="hidden sm:table-cell">{t('common.created')}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {classStudents.map(s => (
                          <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/students/${s.id}`)}>
                            <TableCell className="font-medium">{s.firstname} {s.lastname}</TableCell>
                            <TableCell className="hidden sm:table-cell">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {classManagers.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t('common.managers')}</p>
                  <div className="flex flex-wrap gap-2">
                    {classManagers.map(m => (
                      <Badge key={m.id} variant="outline" className="cursor-pointer" onClick={() => navigate(`/managers/${m.id}`)}>
                        {m.firstname} {m.lastname}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences">
          <GroupAttendanceTab
            students={classStudents.map(s => ({ id: s.id, firstname: s.firstname, lastname: s.lastname }))}
            recordType="absences"
            title={cls.name}
          />
        </TabsContent>

        <TabsContent value="lates">
          <GroupAttendanceTab
            students={classStudents.map(s => ({ id: s.id, firstname: s.firstname, lastname: s.lastname }))}
            recordType="lates"
            title={cls.name}
          />
        </TabsContent>

        <TabsContent value="marks">
          <MarkStatisticsPanel
            fixedLevelId={cls.levelId}
            fixedClassId={cls.id}
            showFilters={true}
            title={`${t('marks.statistics')} — ${cls.name}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
