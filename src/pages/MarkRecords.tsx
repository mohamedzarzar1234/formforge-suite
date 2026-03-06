import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markRecordApi } from '@/services/mark-record-api';
import { studentApi, levelApi, classApi, subjectApi, teacherApi } from '@/services/api';
import type { MarkRecord, NonOfficialMarkRecord, OfficialMarkRecord } from '@/types/mark-record';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, Download, Upload, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ExcelImportDialog } from '@/components/ExcelImportDialog';
import { exportToExcel } from '@/lib/excel-utils';
import { DatePickerField } from '@/components/DatePickerField';
import { MarkStatsPanel } from '@/components/MarkStatsPanel';
import type { Column } from '@/components/DataTable';

export default function MarkRecords() {
  const qc = useQueryClient();
  const [page] = useState(1);
  const [filterOfficial, setFilterOfficial] = useState<string>('all');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [nonOfficialOpen, setNonOfficialOpen] = useState(false);
  const [officialOpen, setOfficialOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<MarkRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const isOfficialFilter = filterOfficial === 'all' ? null : filterOfficial === 'official';

  const { data: recordsRes, isLoading } = useQuery({
    queryKey: ['mark-records', page, filterOfficial, filterType, filterLevel, filterClass, filterSubject, filterStudent, filterDateFrom, filterDateTo],
    queryFn: () => markRecordApi.getAll({
      page, limit: 100,
      isOfficial: isOfficialFilter === null ? undefined : isOfficialFilter,
      typeId: filterType === 'all' ? undefined : filterType,
      levelId: filterLevel === 'all' ? undefined : filterLevel,
      classId: filterClass === 'all' ? undefined : filterClass,
      subjectId: filterSubject === 'all' ? undefined : filterSubject,
      studentId: filterStudent === 'all' ? undefined : filterStudent,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
  });
  const { data: settingsRes } = useQuery({ queryKey: ['mark-record-settings'], queryFn: () => markRecordApi.getSettings() });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const { data: teachersRes } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });

  const deleteMut = useMutation({
    mutationFn: (id: string) => markRecordApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mark-records'] }); toast.success('Record deleted'); setDeleteId(null); },
  });

  const records = recordsRes?.data || [];
  const types = settingsRes?.data?.types || [];
  const templates = settingsRes?.data?.officialTemplates || [];
  const students = studentsRes?.data || [];
  const levels = levelsRes?.data || [];
  const classes = classesRes?.data || [];
  const subjects = subjectsRes?.data || [];
  const teachers = teachersRes?.data || [];

  const getStudentName = (id: string) => { const s = students.find(x => x.id === id); return s ? `${s.firstname} ${s.lastname}` : id; };
  const getSubjectName = (id: string) => subjects.find(x => x.id === id)?.name || id;
  const getTypeName = (id: string) => types.find(x => x.id === id)?.name || id;
  const getTemplateName = (id: string) => templates.find(x => x.id === id)?.name || id;

  const getScoreDisplay = (record: MarkRecord) => {
    if (!record.isOfficial) {
      const nr = record as NonOfficialMarkRecord;
      return `${nr.score}/${nr.maxScore}`;
    }
    const official = record as OfficialMarkRecord;
    const tpl = templates.find(t => t.id === official.templateId);
    if (!tpl) return '—';
    const total = Object.values(official.scores).reduce((a, b) => a + b, 0);
    const max = tpl.columns.reduce((a, c) => a + c.maxScore, 0);
    return `${total}/${max}`;
  };

  const handleExport = () => {
    const cols: Column<MarkRecord>[] = [
      { key: 'id' as any, label: 'ID' },
      { key: 'studentId' as any, label: 'Student', render: r => getStudentName(r.studentId) as any },
      { key: 'subjectId' as any, label: 'Subject', render: r => getSubjectName(r.subjectId) as any },
      { key: 'isOfficial' as any, label: 'Type', render: r => (r.isOfficial ? 'Official' : getTypeName((r as NonOfficialMarkRecord).typeId)) as any },
      { key: 'date' as any, label: 'Date' },
      { key: 'notes' as any, label: 'Notes' },
    ];
    exportToExcel(records, cols, 'mark-records');
    toast.success('Exported to Excel');
  };

  const handleImport = (rows: Record<string, string>[]) => {
    const newRecords = rows.map(row => {
      const student = students.find(s => `${s.firstname} ${s.lastname}` === row['Student']);
      const subject = subjects.find(s => s.name === row['Subject']);
      return {
        studentId: student?.id || '',
        subjectId: subject?.id || '',
        levelId: student?.levelId || '',
        classId: student?.classId || '',
        typeId: types.find(t => t.name === row['Type'])?.id || types[0]?.id || '',
        score: Number(row['Score']) || 0,
        maxScore: Number(row['MaxScore']) || 100,
        date: row['Date'] || new Date().toISOString().split('T')[0],
        notes: row['Notes'] || '',
        isOfficial: false as const,
      };
    }).filter(r => r.studentId && r.subjectId);

    if (newRecords.length === 0) { toast.error('No valid records found'); return; }
    markRecordApi.bulkCreate(newRecords).then(() => {
      qc.invalidateQueries({ queryKey: ['mark-records'] });
      toast.success(`${newRecords.length} records imported`);
    });
  };

  const handleEditClick = (record: MarkRecord) => {
    setEditRecord(record);
    if (record.isOfficial) {
      setOfficialOpen(true);
    } else {
      setNonOfficialOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Records</h1>
          <p className="text-muted-foreground">Manage student grades and scores.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}><BarChart3 className="mr-2 h-4 w-4" />{showStats ? 'Hide Stats' : 'Statistics'}</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import</Button>
          <Button size="sm" variant="outline" onClick={() => { setEditRecord(null); setOfficialOpen(true); }}><Plus className="mr-2 h-4 w-4" />Official</Button>
          <Button size="sm" onClick={() => { setEditRecord(null); setNonOfficialOpen(true); }}><Plus className="mr-2 h-4 w-4" />Non-Official</Button>
        </div>
      </div>

      {showStats && <MarkStatsPanel />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={filterOfficial} onValueChange={setFilterOfficial}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                  <SelectItem value="non-official">Non-Official</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterOfficial !== 'official' && (
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select value={filterLevel} onValueChange={v => { setFilterLevel(v); setFilterClass('all'); }}>
                <SelectTrigger><SelectValue placeholder="All levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Class</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {classes.filter(c => filterLevel === 'all' || c.levelId === filterLevel).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date From</Label>
              <DatePickerField value={filterDateFrom} onChange={setFilterDateFrom} placeholder="From date" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date To</Label>
              <DatePickerField value={filterDateTo} onChange={setFilterDateTo} placeholder="To date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type / Template</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
            ) : records.map(record => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{getStudentName(record.studentId)}</TableCell>
                <TableCell>{getSubjectName(record.subjectId)}</TableCell>
                <TableCell>
                  <Badge variant={record.isOfficial ? 'default' : 'secondary'}>
                    {record.isOfficial ? 'Official' : 'Non-Official'}
                  </Badge>
                </TableCell>
                <TableCell>{record.isOfficial ? getTemplateName((record as OfficialMarkRecord).templateId) : getTypeName((record as NonOfficialMarkRecord).typeId)}</TableCell>
                <TableCell className="font-mono">{getScoreDisplay(record)}</TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell className="max-w-32 truncate">{record.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(record)}><Pencil className="h-4 w-4" /></Button>
                    {!record.isOfficial && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(record.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NonOfficialFormDialog
        open={nonOfficialOpen}
        onOpenChange={setNonOfficialOpen}
        record={editRecord as NonOfficialMarkRecord | null}
        students={students}
        subjects={subjects}
        levels={levels}
        classes={classes}
        types={types}
        onSaved={() => qc.invalidateQueries({ queryKey: ['mark-records'] })}
      />

      <OfficialFormDialog
        open={officialOpen}
        onOpenChange={setOfficialOpen}
        record={editRecord as OfficialMarkRecord | null}
        students={students}
        subjects={subjects}
        levels={levels}
        classes={classes}
        templates={templates}
        onSaved={() => qc.invalidateQueries({ queryKey: ['mark-records'] })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete record?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        expectedColumns={['Student', 'Subject', 'Type', 'Score', 'MaxScore', 'Date', 'Notes']}
      />
    </div>
  );
}

// ─── Non-Official Form ───────────────────────────────────────────
function NonOfficialFormDialog({ open, onOpenChange, record, students, subjects, levels, classes, types, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: NonOfficialMarkRecord | null;
  students: any[];
  subjects: any[];
  levels: any[];
  classes: any[];
  types: any[];
  onSaved: () => void;
}) {
  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const isEditing = !!record && !record.isOfficial;

  useEffect(() => {
    if (open) {
      if (record && !record.isOfficial) {
        setLevelId(record.levelId);
        setClassId(record.classId);
        setStudentId(record.studentId);
        setSubjectId(record.subjectId);
        setTypeId(record.typeId);
        setScore(record.score);
        setMaxScore(record.maxScore);
        setDate(record.date);
        setNotes(record.notes);
      } else {
        setLevelId(''); setClassId(''); setStudentId(''); setSubjectId('');
        setTypeId(''); setScore(0); setMaxScore(100); setDate(new Date().toISOString().split('T')[0]); setNotes('');
      }
    }
  }, [open, record]);

  const filteredStudents = students.filter(s => {
    if (classId) return s.classId === classId;
    if (levelId) return s.levelId === levelId;
    return true;
  });

  const createMut = useMutation({
    mutationFn: (data: any) => isEditing ? markRecordApi.update(record!.id, data) : markRecordApi.create(data),
    onSuccess: () => { onSaved(); onOpenChange(false); toast.success(isEditing ? 'Record updated' : 'Record created'); },
  });

  const handleScoreChange = (val: number) => {
    setScore(Math.min(val, maxScore));
  };

  const handleMaxScoreChange = (val: number) => {
    setMaxScore(val);
    if (score > val) setScore(val);
  };

  const handleSave = () => {
    if (!studentId || !subjectId || !typeId) { toast.error('Student, Subject and Type are required'); return; }
    if (score > maxScore) { toast.error('Score cannot be greater than max score'); return; }
    const student = students.find(s => s.id === studentId);
    createMut.mutate({
      studentId, subjectId,
      levelId: levelId || student?.levelId || '',
      classId: classId || student?.classId || '',
      typeId, score, maxScore, date, notes, isOfficial: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit Non-Official Record' : 'Add Non-Official Record'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={levelId || 'none'} onValueChange={v => { setLevelId(v === 'none' ? '' : v); setClassId(''); setStudentId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All levels</SelectItem>
                  {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId || 'none'} onValueChange={v => { setClassId(v === 'none' ? '' : v); setStudentId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All classes</SelectItem>
                  {classes.filter((c: any) => !levelId || c.levelId === levelId).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={studentId || 'none'} onValueChange={v => setStudentId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select student</SelectItem>
                  {filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId || 'none'} onValueChange={v => setSubjectId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select subject</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={typeId || 'none'} onValueChange={v => setTypeId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select type</SelectItem>
                {types.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input type="number" min={1} value={maxScore} onChange={e => handleMaxScoreChange(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Score</Label>
              <Input type="number" min={0} max={maxScore} value={score} onChange={e => handleScoreChange(Number(e.target.value))} />
              {score > maxScore && <p className="text-xs text-destructive">Score cannot exceed max score</p>}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePickerField value={date} onChange={setDate} placeholder="Pick date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMut.isPending}>{isEditing ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Official Form ───────────────────────────────────────────────
function OfficialFormDialog({ open, onOpenChange, record, students, subjects, levels, classes, templates, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: OfficialMarkRecord | null;
  students: any[];
  subjects: any[];
  levels: any[];
  classes: any[];
  templates: any[];
  onSaved: () => void;
}) {
  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (open) {
      if (record && record.isOfficial) {
        setLevelId(record.levelId);
        setClassId(record.classId);
        setStudentId(record.studentId);
        setSubjectId(record.subjectId);
        setScores({ ...record.scores });
        setDate(record.date);
        setNotes(record.notes);
        setExistingId(record.id);
      } else {
        setLevelId(''); setClassId(''); setStudentId(''); setSubjectId('');
        setScores({}); setDate(new Date().toISOString().split('T')[0]); setNotes(''); setExistingId(null);
      }
    }
  }, [open, record]);

  useEffect(() => {
    if (studentId && subjectId && open && !(record?.isOfficial)) {
      setLoadingExisting(true);
      markRecordApi.findOfficialRecord(studentId, subjectId).then(res => {
        if (res.data) {
          setScores({ ...res.data.scores });
          setDate(res.data.date);
          setNotes(res.data.notes);
          setExistingId(res.data.id);
        } else {
          setScores({});
          setExistingId(null);
        }
        setLoadingExisting(false);
      });
    }
  }, [studentId, subjectId]);

  const template = templates.find((t: any) => t.levelId === levelId);

  const filteredStudents = students.filter(s => {
    if (classId) return s.classId === classId;
    if (levelId) return s.levelId === levelId;
    return true;
  });

  const upsertMut = useMutation({
    mutationFn: (data: any) => markRecordApi.upsertOfficial(data),
    onSuccess: () => { onSaved(); onOpenChange(false); toast.success(existingId ? 'Official record updated' : 'Official record created'); },
  });

  const handleScoreChange = (colId: string, val: number, maxScore: number) => {
    setScores(prev => ({ ...prev, [colId]: Math.min(val, maxScore) }));
  };

  const handleSave = () => {
    if (!studentId || !subjectId) { toast.error('Student and Subject are required'); return; }
    if (!template) { toast.error('No template defined for this level'); return; }
    // Validate scores don't exceed max
    for (const col of template.columns) {
      if (scores[col.id] !== undefined && scores[col.id] > col.maxScore) {
        toast.error(`${col.name} score cannot exceed ${col.maxScore}`);
        return;
      }
    }
    const student = students.find(s => s.id === studentId);
    upsertMut.mutate({
      studentId, subjectId,
      levelId: levelId || student?.levelId || '',
      classId: classId || student?.classId || '',
      templateId: template.id,
      scores, date, notes, isOfficial: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Official Mark Record</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Level *</Label>
              <Select value={levelId || 'none'} onValueChange={v => { setLevelId(v === 'none' ? '' : v); setClassId(''); setStudentId(''); setScores({}); setExistingId(null); }}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select level</SelectItem>
                  {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId || 'none'} onValueChange={v => { setClassId(v === 'none' ? '' : v); setStudentId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All classes</SelectItem>
                  {classes.filter((c: any) => !levelId || c.levelId === levelId).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={studentId || 'none'} onValueChange={v => setStudentId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select student</SelectItem>
                  {filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId || 'none'} onValueChange={v => setSubjectId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select subject</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {levelId && !template && (
            <p className="text-sm text-destructive">No official template configured for this level. Please configure one in Settings.</p>
          )}

          {existingId && (
            <Badge variant="outline" className="text-xs">Editing existing record — values will be updated</Badge>
          )}

          {template && studentId && subjectId && (
            <div className="space-y-2">
              <Label>{template.name}</Label>
              {loadingExisting ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {template.columns.sort((a: any, b: any) => a.order - b.order).map((col: any) => (
                    <div key={col.id} className="flex items-center gap-3">
                      <span className="text-sm flex-1">{col.name} <span className="text-muted-foreground">(max: {col.maxScore})</span></span>
                      <Input
                        type="number"
                        className="w-24"
                        min={0}
                        max={col.maxScore}
                        value={scores[col.id] ?? ''}
                        onChange={e => handleScoreChange(col.id, Number(e.target.value), col.maxScore)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePickerField value={date} onChange={setDate} placeholder="Pick date" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsertMut.isPending}>{existingId ? 'Update' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
