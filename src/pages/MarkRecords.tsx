import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markRecordApi } from '@/services/mark-record-api';
import { studentApi, levelApi, classApi, subjectApi } from '@/services/api';
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
import { Plus, Trash2, Pencil, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ExcelImportDialog } from '@/components/ExcelImportDialog';
import { exportToExcel } from '@/lib/excel-utils';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<MarkRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const isOfficialFilter = filterOfficial === 'all' ? null : filterOfficial === 'official';

  const { data: recordsRes, isLoading } = useQuery({
    queryKey: ['mark-records', page, filterOfficial, filterType, filterLevel, filterClass, filterSubject, filterStudent],
    queryFn: () => markRecordApi.getAll({ page, limit: 100, isOfficial: isOfficialFilter, typeId: filterType === 'all' ? undefined : filterType, levelId: filterLevel === 'all' ? undefined : filterLevel, classId: filterClass === 'all' ? undefined : filterClass, subjectId: filterSubject === 'all' ? undefined : filterSubject, studentId: filterStudent === 'all' ? undefined : filterStudent }),
  });
  const { data: settingsRes } = useQuery({ queryKey: ['mark-record-settings'], queryFn: () => markRecordApi.getSettings() });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });

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

  const getStudentName = (id: string) => { const s = students.find(x => x.id === id); return s ? `${s.firstname} ${s.lastname}` : id; };
  const getSubjectName = (id: string) => subjects.find(x => x.id === id)?.name || id;
  const getLevelName = (id: string) => levels.find(x => x.id === id)?.name || id;
  const getClassName = (id: string) => classes.find(x => x.id === id)?.name || id;
  const getTypeName = (id: string) => types.find(x => x.id === id)?.name || id;
  const getTemplateName = (id: string) => templates.find(x => x.id === id)?.name || id;

  const getScoreDisplay = (record: MarkRecord) => {
    if (!record.isOfficial) return String((record as NonOfficialMarkRecord).score);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Records</h1>
          <p className="text-muted-foreground">Manage student grades and scores.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import</Button>
          <Button size="sm" onClick={() => { setEditRecord(null); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Record</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
              <Select value={filterLevel} onValueChange={v => { setFilterLevel(v); setFilterClass(''); }}>
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
                  <SelectItem value="">All</SelectItem>
                  {classes.filter(c => !filterLevel || c.levelId === filterLevel).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
                </SelectContent>
              </Select>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditRecord(record); setCreateOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(record.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MarkRecordFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        record={editRecord}
        students={students}
        subjects={subjects}
        levels={levels}
        classes={classes}
        types={types}
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
        expectedColumns={['Student', 'Subject', 'Type', 'Score', 'Date', 'Notes']}
      />
    </div>
  );
}

// Form dialog for creating/editing mark records
function MarkRecordFormDialog({ open, onOpenChange, record, students, subjects, levels, classes, types, templates, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: MarkRecord | null;
  students: any[];
  subjects: any[];
  levels: any[];
  classes: any[];
  types: any[];
  templates: any[];
  onSaved: () => void;
}) {
  const [isOfficial, setIsOfficial] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const createMut = useMutation({
    mutationFn: (data: any) => record ? markRecordApi.update(record.id, data) : markRecordApi.create(data),
    onSuccess: () => { onSaved(); onOpenChange(false); toast.success(record ? 'Record updated' : 'Record created'); },
  });

  // Reset form when dialog opens
  const resetForm = () => {
    if (record) {
      setIsOfficial(record.isOfficial);
      setStudentId(record.studentId);
      setSubjectId(record.subjectId);
      setLevelId(record.levelId);
      setClassId(record.classId);
      setDate(record.date);
      setNotes(record.notes);
      if (record.isOfficial) {
        setTemplateId((record as OfficialMarkRecord).templateId);
        setScores({ ...(record as OfficialMarkRecord).scores });
      } else {
        setTypeId((record as NonOfficialMarkRecord).typeId);
        setScore((record as NonOfficialMarkRecord).score);
      }
    } else {
      setIsOfficial(false);
      setStudentId('');
      setSubjectId('');
      setLevelId('');
      setClassId('');
      setTypeId('');
      setTemplateId('');
      setScore(0);
      setScores({});
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  };

  // Auto-fill level/class when student is selected
  const handleStudentChange = (sid: string) => {
    setStudentId(sid);
    const student = students.find(s => s.id === sid);
    if (student) {
      setLevelId(student.levelId || '');
      setClassId(student.classId || '');
    }
  };

  const selectedTemplate = templates.find((t: any) => t.id === templateId);

  const handleSave = () => {
    if (!studentId || !subjectId) { toast.error('Student and Subject are required'); return; }
    if (isOfficial) {
      if (!templateId) { toast.error('Select a template'); return; }
      createMut.mutate({ studentId, subjectId, levelId, classId, templateId, scores, date, notes, isOfficial: true });
    } else {
      if (!typeId) { toast.error('Select a type'); return; }
      createMut.mutate({ studentId, subjectId, levelId, classId, typeId, score, date, notes, isOfficial: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? 'Edit Mark Record' : 'Add Mark Record'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={isOfficial ? 'official' : 'non-official'} onValueChange={v => setIsOfficial(v === 'official')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="non-official">Non-Official</SelectItem>
                <SelectItem value="official">Official</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Student *</Label>
            <Select value={studentId} onValueChange={handleStudentChange}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={levelId} onValueChange={v => { setLevelId(v); setClassId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.filter((c: any) => !levelId || c.levelId === levelId).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {isOfficial ? (
            <>
              <div className="space-y-2">
                <Label>Template *</Label>
                <Select value={templateId} onValueChange={v => { setTemplateId(v); setScores({}); }}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>{templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>Scores</Label>
                  <div className="space-y-2 rounded-md border p-3">
                    {selectedTemplate.columns.sort((a: any, b: any) => a.order - b.order).map((col: any) => (
                      <div key={col.id} className="flex items-center gap-3">
                        <span className="text-sm flex-1">{col.name} <span className="text-muted-foreground">(max: {col.maxScore})</span></span>
                        <Input
                          type="number"
                          className="w-24"
                          min={0}
                          max={col.maxScore}
                          value={scores[col.id] ?? ''}
                          onChange={e => setScores(prev => ({ ...prev, [col.id]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={typeId} onValueChange={setTypeId}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{types.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Input type="number" value={score} onChange={e => setScore(Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMut.isPending}>{record ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
