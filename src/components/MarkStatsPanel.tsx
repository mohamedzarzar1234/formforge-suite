import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { markRecordApi } from '@/services/mark-record-api';
import { studentApi, levelApi, classApi, subjectApi, teacherApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface MarkStatsPanelProps {
  // Pre-filter by entity
  fixedLevelId?: string;
  fixedClassId?: string;
  fixedSubjectId?: string;
  fixedTeacherClassSubjects?: { classId: string; subjectIds: string[] }[];
  title?: string;
}

export function MarkStatsPanel({ fixedLevelId, fixedClassId, fixedSubjectId, fixedTeacherClassSubjects, title }: MarkStatsPanelProps) {
  const [statLevel, setStatLevel] = useState(fixedLevelId || 'all');
  const [statClass, setStatClass] = useState(fixedClassId || 'all');
  const [statSubject, setStatSubject] = useState(fixedSubjectId || 'all');
  const [statTeacher, setStatTeacher] = useState('all');

  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const { data: teachersRes } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: settingsRes } = useQuery({ queryKey: ['mark-record-settings'], queryFn: () => markRecordApi.getSettings() });

  const levels = levelsRes?.data || [];
  const classes = classesRes?.data || [];
  const subjects = subjectsRes?.data || [];
  const teachers = teachersRes?.data || [];
  const students = studentsRes?.data || [];
  const templates = settingsRes?.data?.officialTemplates || [];

  const effectiveLevelId = fixedLevelId || (statLevel === 'all' ? undefined : statLevel);
  const effectiveClassId = fixedClassId || (statClass === 'all' ? undefined : statClass);
  const effectiveSubjectId = fixedSubjectId || (statSubject === 'all' ? undefined : statSubject);

  let teacherClassSubjects = fixedTeacherClassSubjects;
  if (!teacherClassSubjects && statTeacher !== 'all') {
    teacherClassSubjects = teachers.find((t: any) => t.id === statTeacher)?.classAssignments || [];
  }

  // Calculate total possible students for completion
  let totalStudents = students;
  if (effectiveClassId) {
    totalStudents = students.filter((s: any) => s.classId === effectiveClassId);
  } else if (effectiveLevelId) {
    totalStudents = students.filter((s: any) => s.levelId === effectiveLevelId);
  } else if (teacherClassSubjects) {
    const tcsClassIds = teacherClassSubjects.map(cs => cs.classId);
    totalStudents = students.filter((s: any) => tcsClassIds.includes(s.classId));
  }

  // Get relevant subjects
  let relevantSubjects = subjects;
  if (effectiveSubjectId) {
    relevantSubjects = subjects.filter(s => s.id === effectiveSubjectId);
  } else if (effectiveLevelId) {
    const level = levels.find(l => l.id === effectiveLevelId);
    if (level) relevantSubjects = subjects.filter(s => level.subjectIds.includes(s.id));
  } else if (teacherClassSubjects) {
    const allSubIds = new Set(teacherClassSubjects.flatMap(cs => cs.subjectIds));
    relevantSubjects = subjects.filter(s => allSubIds.has(s.id));
  }

  const { data: statsRes } = useQuery({
    queryKey: ['mark-record-stats', effectiveLevelId, effectiveClassId, effectiveSubjectId, statTeacher, fixedTeacherClassSubjects],
    queryFn: () => markRecordApi.getOfficialStats({
      levelId: effectiveLevelId,
      classId: effectiveClassId,
      subjectId: effectiveSubjectId,
      teacherClassSubjects,
      totalStudentCount: totalStudents.length,
      relevantSubjectIds: relevantSubjects.map(s => s.id),
    }),
  });

  const stats = statsRes?.data;

  const showLevelFilter = !fixedLevelId;
  const showClassFilter = !fixedClassId;
  const showSubjectFilter = !fixedSubjectId;
  const showTeacherFilter = !fixedTeacherClassSubjects;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />{title || 'Official Mark Statistics'}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {(showLevelFilter || showClassFilter || showSubjectFilter || showTeacherFilter) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {showLevelFilter && (
              <div className="space-y-1">
                <Label className="text-xs">Level</Label>
                <Select value={statLevel} onValueChange={v => { setStatLevel(v); setStatClass('all'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showClassFilter && (
              <div className="space-y-1">
                <Label className="text-xs">Class</Label>
                <Select value={statClass} onValueChange={setStatClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.filter(c => statLevel === 'all' || c.levelId === statLevel).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showSubjectFilter && (
              <div className="space-y-1">
                <Label className="text-xs">Subject</Label>
                <Select value={statSubject} onValueChange={setStatSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showTeacherFilter && (
              <div className="space-y-1">
                <Label className="text-xs">Teacher</Label>
                <Select value={statTeacher} onValueChange={setStatTeacher}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.firstname} {t.lastname}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="space-y-4">
            {/* Overall Completion */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Overall Completion</p>
                <div className="flex items-center gap-3">
                  <Progress value={stats.completion.percentage} className="flex-1" />
                  <span className="text-sm font-mono">{stats.completion.percentage}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.completion.filled} / {stats.completion.total} cells filled</p>
              </CardContent>
            </Card>

            {/* Per-Column Completion */}
            {stats.columnCompletions && stats.columnCompletions.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-3">Per-Column Completion</p>
                  <div className="space-y-3">
                    {stats.columnCompletions.map((col: any) => (
                      <div key={col.columnId}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{col.columnName}</span>
                          <span className="text-muted-foreground font-mono text-xs">{col.filled}/{col.total} ({col.percentage}%)</span>
                        </div>
                        <Progress value={col.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Column Averages */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Column Averages</p>
                {stats.averages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data available</p>
                ) : (
                  <div className="space-y-2">
                    {stats.averages.map((avg: any) => (
                      <div key={avg.columnId} className="flex items-center justify-between text-sm">
                        <span>{avg.columnName}</span>
                        <span className="font-mono">{avg.average} / {avg.maxScore}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
