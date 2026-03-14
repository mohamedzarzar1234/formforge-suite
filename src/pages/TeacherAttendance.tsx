import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/FilterBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Pencil, Download, Upload, UserX, Clock, BarChart3, ListPlus, ScanLine } from 'lucide-react';
import { AttendanceCalendarView } from '@/components/AttendanceCalendarView';
import { ViewToggle } from '@/components/ViewToggle';
import { toast } from 'sonner';
import { teacherAttendanceApi, getSessionOptions } from '@/services/attendance-api';
import { teacherApi, classApi, levelApi, subjectApi } from '@/services/api';
import { ExcelImportDialog } from '@/components/ExcelImportDialog';
import { exportToExcel } from '@/lib/excel-utils';
import { AttendanceQRScanner } from '@/components/AttendanceQRScanner';
import { DatePickerField } from '@/components/DatePickerField';
import { useTranslation } from 'react-i18next';
import type { TeacherAbsence, TeacherLate, AttendanceFilter } from '@/types/attendance';

const today = () => new Date().toISOString().split('T')[0];

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'absences' | 'lates' | 'stats'>('absences');
  const [filter, setFilter] = useState<AttendanceFilter>({});
  const [absDialog, setAbsDialog] = useState(false);
  const [lateDialog, setLateDialog] = useState(false);
  const [bulkAbsDialog, setBulkAbsDialog] = useState(false);
  const [bulkLateDialog, setBulkLateDialog] = useState(false);
  const [importAbsOpen, setImportAbsOpen] = useState(false);
  const [importLateOpen, setImportLateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'absence' | 'late' } | null>(null);
  const [editingAbsence, setEditingAbsence] = useState<TeacherAbsence | null>(null);
  const [editingLate, setEditingLate] = useState<TeacherLate | null>(null);
  const [absView, setAbsView] = useState<'table' | 'calendar'>('table');
  const [lateView, setLateView] = useState<'table' | 'calendar'>('table');

  const sessionOptions = getSessionOptions();
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formSession, setFormSession] = useState(sessionOptions[0]);
  const [formDate, setFormDate] = useState(today());
  const [formJustified, setFormJustified] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [formPeriod, setFormPeriod] = useState(10);

  const [bulkRowCount, setBulkRowCount] = useState(3);
  const [bulkShared, setBulkShared] = useState(true);
  const [bulkSharedDate, setBulkSharedDate] = useState(today());
  const [bulkRows, setBulkRows] = useState<{ teacherId: string; session: string; date: string; isJustified: boolean; reason?: string; period?: number }[]>([{ teacherId: '', session: sessionOptions[0], date: today(), isJustified: false, period: 10 }]);

  const { data: teachersRes } = useQuery({ queryKey: ['teachers-all'], queryFn: () => teacherApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes-all'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels-all'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects-all'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const teachers = teachersRes?.data || [];
  const classes = classesRes?.data || [];
  const levels = levelsRes?.data || [];
  const subjects = subjectsRes?.data || [];

  const { data: absencesRes, isLoading: absLoading } = useQuery({ queryKey: ['teacher-absences', filter], queryFn: () => teacherAttendanceApi.getAbsences(filter) });
  const { data: latesRes, isLoading: lateLoading } = useQuery({ queryKey: ['teacher-lates', filter], queryFn: () => teacherAttendanceApi.getLates(filter) });
  const { data: statsRes } = useQuery({ queryKey: ['teacher-attendance-stats', filter], queryFn: () => teacherAttendanceApi.getStats(filter) });

  const absences = absencesRes?.data || [];
  const lates = latesRes?.data || [];
  const stats = statsRes?.data;

  const filteredAbsences = useMemo(() => {
    let items = absences;
    if (filter.entityId) items = items.filter(i => i.teacherId === filter.entityId);
    if (filter.classId) { const tIds = teachers.filter(t => t.classAssignments.some(ca => ca.classId === filter.classId)).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    if (filter.levelId) { const cIds = classes.filter(c => c.levelId === filter.levelId).map(c => c.id); const tIds = teachers.filter(t => t.classAssignments.some(ca => cIds.includes(ca.classId))).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    if ((filter as any).subjectId) { const tIds = teachers.filter(t => t.subjectIds.includes((filter as any).subjectId)).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    return items;
  }, [absences, filter, teachers, classes]);

  const filteredLates = useMemo(() => {
    let items = lates;
    if (filter.entityId) items = items.filter(i => i.teacherId === filter.entityId);
    if (filter.classId) { const tIds = teachers.filter(t => t.classAssignments.some(ca => ca.classId === filter.classId)).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    if (filter.levelId) { const cIds = classes.filter(c => c.levelId === filter.levelId).map(c => c.id); const tIds = teachers.filter(t => t.classAssignments.some(ca => cIds.includes(ca.classId))).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    if ((filter as any).subjectId) { const tIds = teachers.filter(t => t.subjectIds.includes((filter as any).subjectId)).map(t => t.id); items = items.filter(i => tIds.includes(i.teacherId)); }
    return items;
  }, [lates, filter, teachers, classes]);

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['teacher-absences'] }); qc.invalidateQueries({ queryKey: ['teacher-lates'] }); qc.invalidateQueries({ queryKey: ['teacher-attendance-stats'] }); };

  const createAbsMut = useMutation({
    mutationFn: (d: Omit<TeacherAbsence, 'id' | 'createdAt'>) => teacherAttendanceApi.createAbsence(d),
    onSuccess: (res) => { if (!res.success) { toast.error(res.message); return; } invalidate(); setAbsDialog(false); toast.success(t('attendance.absenceAdded')); },
  });
  const updateAbsMut = useMutation({ mutationFn: ({ id, ...d }: { id: string } & Partial<TeacherAbsence>) => teacherAttendanceApi.updateAbsence(id, d), onSuccess: () => { invalidate(); setEditingAbsence(null); toast.success(t('attendance.updated')); } });
  const deleteAbsMut = useMutation({ mutationFn: (id: string) => teacherAttendanceApi.deleteAbsence(id), onSuccess: () => { invalidate(); toast.success(t('attendance.deleted')); } });
  const bulkAbsMut = useMutation({
    mutationFn: (d: Omit<TeacherAbsence, 'id' | 'createdAt'>[]) => teacherAttendanceApi.createAbsenceBulk(d),
    onSuccess: (res) => { invalidate(); setBulkAbsDialog(false); toast.success(res.message); },
  });

  const createLateMut = useMutation({
    mutationFn: (d: Omit<TeacherLate, 'id' | 'createdAt'>) => teacherAttendanceApi.createLate(d),
    onSuccess: (res) => { if (!res.success) { toast.error(res.message); return; } invalidate(); setLateDialog(false); toast.success(t('attendance.lateAdded')); },
  });
  const updateLateMut = useMutation({ mutationFn: ({ id, ...d }: { id: string } & Partial<TeacherLate>) => teacherAttendanceApi.updateLate(id, d), onSuccess: () => { invalidate(); setEditingLate(null); toast.success(t('attendance.updated')); } });
  const deleteLateMut = useMutation({ mutationFn: (id: string) => teacherAttendanceApi.deleteLate(id), onSuccess: () => { invalidate(); toast.success(t('attendance.deleted')); } });
  const bulkLateMut = useMutation({
    mutationFn: (d: Omit<TeacherLate, 'id' | 'createdAt'>[]) => teacherAttendanceApi.createLateBulk(d),
    onSuccess: (res) => { invalidate(); setBulkLateDialog(false); toast.success(res.message); },
  });

  const getTeacherName = (id: string) => { const te = teachers.find(x => x.id === id); return te ? `${te.firstname} ${te.lastname}` : id; };

  const resetAbsForm = (a?: TeacherAbsence) => { setFormTeacherId(a?.teacherId || ''); setFormSession(a?.session || sessionOptions[0]); setFormDate(a?.date || today()); setFormJustified(a?.isJustified || false); setFormReason(a?.reason || ''); };
  const resetLateForm = (l?: TeacherLate) => { setFormTeacherId(l?.teacherId || ''); setFormSession(l?.session || sessionOptions[0]); setFormDate(l?.date || today()); setFormJustified(l?.isJustified || false); setFormReason(l?.reason || ''); setFormPeriod(l?.period || 10); };

  const handleAbsSubmit = () => {
    if (!formTeacherId) { toast.error(t('common.selectTeacher')); return; }
    const data = { teacherId: formTeacherId, session: formSession, date: formDate, isJustified: formJustified, reason: formJustified ? formReason : undefined };
    if (editingAbsence) updateAbsMut.mutate({ id: editingAbsence.id, ...data });
    else createAbsMut.mutate(data);
  };

  const handleLateSubmit = () => {
    if (!formTeacherId) { toast.error(t('common.selectTeacher')); return; }
    const data = { teacherId: formTeacherId, session: formSession, date: formDate, isJustified: formJustified, reason: formJustified ? formReason : undefined, period: formPeriod };
    if (editingLate) updateLateMut.mutate({ id: editingLate.id, ...data });
    else createLateMut.mutate(data);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'absence') deleteAbsMut.mutate(deleteTarget.id);
    else deleteLateMut.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleScanSingleAbs = (ids: string[]) => { if (ids[0]) { resetAbsForm(); setFormTeacherId(ids[0]); setAbsDialog(true); } };
  const handleScanSingleLate = (ids: string[]) => { if (ids[0]) { resetLateForm(); setFormTeacherId(ids[0]); setLateDialog(true); } };
  const handleScanBulkAbs = (ids: string[]) => { setBulkRows(ids.map(id => ({ teacherId: id, session: sessionOptions[0], date: today(), isJustified: false }))); setBulkAbsDialog(true); };
  const handleScanBulkLate = (ids: string[]) => { setBulkRows(ids.map(id => ({ teacherId: id, session: sessionOptions[0], date: today(), isJustified: false, period: 10 }))); setBulkLateDialog(true); };

  const handleImportAbsences = (rows: Record<string, string>[]) => {
    const records = rows.map(r => ({ teacherId: r['Teacher ID'] || r['teacherId'] || '', session: r['Session'] || r['session'] || sessionOptions[0], date: r['Date'] || r['date'] || today(), isJustified: r['Justified']?.toLowerCase() === 'yes' || r['isJustified']?.toLowerCase() === 'true', reason: r['Reason'] || r['reason'] || undefined })).filter(r => r.teacherId);
    if (!records.length) { toast.error(t('attendance.noValidRecords')); return; }
    bulkAbsMut.mutate(records);
  };

  const handleImportLates = (rows: Record<string, string>[]) => {
    const records = rows.map(r => ({ teacherId: r['Teacher ID'] || r['teacherId'] || '', session: r['Session'] || r['session'] || sessionOptions[0], date: r['Date'] || r['date'] || today(), isJustified: r['Justified']?.toLowerCase() === 'yes' || r['isJustified']?.toLowerCase() === 'true', reason: r['Reason'] || r['reason'] || undefined, period: parseInt(r['Period'] || r['period'] || '10') || 10 })).filter(r => r.teacherId);
    if (!records.length) { toast.error(t('attendance.noValidRecords')); return; }
    bulkLateMut.mutate(records);
  };

  const addBulkRow = () => setBulkRows(prev => [...prev, { teacherId: '', session: sessionOptions[0], date: today(), isJustified: false, period: 10 }]);
  const removeBulkRow = (idx: number) => setBulkRows(prev => prev.filter((_, i) => i !== idx));
  const updateBulkRow = (idx: number, field: string, value: any) => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const generateBulkRows = () => {
    const count = Math.max(1, Math.min(50, bulkRowCount));
    setBulkRows(Array.from({ length: count }, () => ({ teacherId: '', session: sessionOptions[0], date: today(), isJustified: false, period: 10 })));
  };

  const activeView = tab === 'absences' ? absView : lateView;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">{t('attendance.teacherAttendance')}</h1><p className="text-sm text-muted-foreground">{t('attendance.trackBySession')}</p></div>

      <FilterBar showClear={!!(filter.entityId || filter.dateFrom || filter.dateTo || filter.levelId || filter.classId || (filter as any).subjectId)} onClear={() => setFilter({})}>
        {activeView !== 'calendar' && (
          <>
            <div className="space-y-1 flex flex-col"><Label className="text-xs">{t('common.dateFrom')}</Label><DatePickerField value={filter.dateFrom || ''} onChange={v => setFilter(f => ({ ...f, dateFrom: v || undefined }))} placeholder={t('common.dateFrom')} className="w-40" /></div>
            <div className="space-y-1 flex flex-col"><Label className="text-xs">{t('common.dateTo')}</Label><DatePickerField value={filter.dateTo || ''} onChange={v => setFilter(f => ({ ...f, dateTo: v || undefined }))} placeholder={t('common.dateTo')} className="w-40" /></div>
          </>
        )}
        <div className="space-y-1">
          <Label className="text-xs">{t('common.teacher')}</Label>
          <Select value={filter.entityId || 'all'} onValueChange={v => setFilter(f => ({ ...f, entityId: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.allTeachers')}</SelectItem>{teachers.map(te => <SelectItem key={te.id} value={te.id}>{te.firstname} {te.lastname}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('common.class')}</Label>
          <Select value={filter.classId || 'all'} onValueChange={v => setFilter(f => ({ ...f, classId: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.allClasses')}</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('common.level')}</Label>
          <Select value={filter.levelId || 'all'} onValueChange={v => setFilter(f => ({ ...f, levelId: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.allLevels')}</SelectItem>{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('common.subject')}</Label>
          <Select value={(filter as any).subjectId || 'all'} onValueChange={v => setFilter(f => ({ ...f, subjectId: v === 'all' ? undefined : v } as any))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.allSubjects')}</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="ml-auto self-end">
          {tab === 'absences' && <ViewToggle view={absView} onViewChange={setAbsView} />}
          {tab === 'lates' && <ViewToggle view={lateView} onViewChange={setLateView} />}
        </div>
      </FilterBar>

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="absences" className="gap-2"><UserX className="h-4 w-4" />{t('attendance.absences')} ({filteredAbsences.length})</TabsTrigger>
          <TabsTrigger value="lates" className="gap-2"><Clock className="h-4 w-4" />{t('attendance.lates')} ({filteredLates.length})</TabsTrigger>
          <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" />{t('common.statistics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" onClick={() => { resetAbsForm(); setAbsDialog(true); }}><Plus className="me-2 h-4 w-4" />{t('attendance.addAbsence')}</Button>
            <AttendanceQRScanner entityType="teachers" mode="single" onScanned={handleScanSingleAbs} trigger={<Button size="sm" variant="outline"><ScanLine className="me-2 h-4 w-4" />{t('common.scanAdd')}</Button>} />
            <Button size="sm" variant="outline" onClick={() => { setBulkRows([{ teacherId: '', session: sessionOptions[0], date: today(), isJustified: false }]); setBulkAbsDialog(true); }}><ListPlus className="me-2 h-4 w-4" />{t('common.bulkAdd')}</Button>
            <AttendanceQRScanner entityType="teachers" mode="bulk" onScanned={handleScanBulkAbs} trigger={<Button size="sm" variant="outline"><ScanLine className="me-2 h-4 w-4" />{t('attendance.bulkScan')}</Button>} />
            <Button size="sm" variant="outline" onClick={() => setImportAbsOpen(true)}><Upload className="me-2 h-4 w-4" />{t('common.import')}</Button>
            <Button size="sm" variant="outline" onClick={() => exportToExcel(filteredAbsences.map(a => ({ ...a, teacherName: getTeacherName(a.teacherId), justified: a.isJustified ? t('common.yes') : t('common.no'), reason: a.reason || '' })), [{ key: 'teacherName', label: t('common.teacher') }, { key: 'session', label: t('common.session') }, { key: 'date', label: t('common.date') }, { key: 'justified', label: t('common.justified') }, { key: 'reason', label: t('common.reason') }], 'teacher-absences')}><Download className="me-2 h-4 w-4" />{t('common.export')}</Button>
          </div>
          {absLoading ? <Skeleton className="h-48 w-full" /> : absView === 'calendar' ? (
            <AttendanceCalendarView items={filteredAbsences} type="absences" getEntityName={(item) => getTeacherName(item.teacherId)} onEdit={(item) => { resetAbsForm(item as any); setEditingAbsence(item as any); }} onDelete={(item) => setDeleteTarget({ id: item.id, type: 'absence' })} />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>{t('common.teacher')}</TableHead><TableHead>{t('common.session')}</TableHead><TableHead>{t('common.date')}</TableHead><TableHead>{t('common.justified')}</TableHead><TableHead>{t('common.reason')}</TableHead><TableHead className="w-24">{t('common.actions')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAbsences.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('attendance.noAbsences')}</TableCell></TableRow> :
                    filteredAbsences.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>{getTeacherName(a.teacherId)}</TableCell>
                        <TableCell>{a.session}</TableCell>
                        <TableCell>{a.date}</TableCell>
                        <TableCell><Badge variant={a.isJustified ? 'default' : 'destructive'}>{a.isJustified ? t('common.yes') : t('common.no')}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{a.reason || '—'}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { resetAbsForm(a); setEditingAbsence(a); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ id: a.id, type: 'absence' })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lates" className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" onClick={() => { resetLateForm(); setLateDialog(true); }}><Plus className="me-2 h-4 w-4" />{t('attendance.addLate')}</Button>
            <AttendanceQRScanner entityType="teachers" mode="single" onScanned={handleScanSingleLate} trigger={<Button size="sm" variant="outline"><ScanLine className="me-2 h-4 w-4" />{t('common.scanAdd')}</Button>} />
            <Button size="sm" variant="outline" onClick={() => { setBulkRows([{ teacherId: '', session: sessionOptions[0], date: today(), isJustified: false, period: 10 }]); setBulkLateDialog(true); }}><ListPlus className="me-2 h-4 w-4" />{t('common.bulkAdd')}</Button>
            <AttendanceQRScanner entityType="teachers" mode="bulk" onScanned={handleScanBulkLate} trigger={<Button size="sm" variant="outline"><ScanLine className="me-2 h-4 w-4" />{t('attendance.bulkScan')}</Button>} />
            <Button size="sm" variant="outline" onClick={() => setImportLateOpen(true)}><Upload className="me-2 h-4 w-4" />{t('common.import')}</Button>
            <Button size="sm" variant="outline" onClick={() => exportToExcel(filteredLates.map(l => ({ ...l, teacherName: getTeacherName(l.teacherId), justified: l.isJustified ? t('common.yes') : t('common.no'), periodStr: `${l.period} ${t('attendance.min')}`, reason: l.reason || '' })), [{ key: 'teacherName', label: t('common.teacher') }, { key: 'session', label: t('common.session') }, { key: 'date', label: t('common.date') }, { key: 'periodStr', label: t('common.period') }, { key: 'justified', label: t('common.justified') }, { key: 'reason', label: t('common.reason') }], 'teacher-lates')}><Download className="me-2 h-4 w-4" />{t('common.export')}</Button>
          </div>
          {lateLoading ? <Skeleton className="h-48 w-full" /> : lateView === 'calendar' ? (
            <AttendanceCalendarView items={filteredLates} type="lates" getEntityName={(item) => getTeacherName(item.teacherId)} onEdit={(item) => { resetLateForm(item as any); setEditingLate(item as any); }} onDelete={(item) => setDeleteTarget({ id: item.id, type: 'late' })} />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>{t('common.teacher')}</TableHead><TableHead>{t('common.session')}</TableHead><TableHead>{t('common.date')}</TableHead><TableHead>{t('common.period')}</TableHead><TableHead>{t('common.justified')}</TableHead><TableHead>{t('common.reason')}</TableHead><TableHead className="w-24">{t('common.actions')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredLates.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('attendance.noLates')}</TableCell></TableRow> :
                    filteredLates.map(l => (
                      <TableRow key={l.id}>
                        <TableCell>{getTeacherName(l.teacherId)}</TableCell>
                        <TableCell>{l.session}</TableCell>
                        <TableCell>{l.date}</TableCell>
                        <TableCell>{l.period} {t('attendance.min')}</TableCell>
                        <TableCell><Badge variant={l.isJustified ? 'default' : 'destructive'}>{l.isJustified ? t('common.yes') : t('common.no')}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{l.reason || '—'}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { resetLateForm(l); setEditingLate(l); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ id: l.id, type: 'late' })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats">
          {stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalAbsences')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalAbsences}</p><p className="text-xs text-muted-foreground">{stats.justifiedAbsences} {t('attendance.justified').toLowerCase()} · {stats.unjustifiedAbsences} {t('attendance.unjustified').toLowerCase()}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalLates')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalLates}</p><p className="text-xs text-muted-foreground">{stats.justifiedLates} {t('attendance.justified').toLowerCase()} · {stats.unjustifiedLates} {t('attendance.unjustified').toLowerCase()}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.avgLatePeriod')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.averageLatePeriod} {t('attendance.min')}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.justificationRate')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalAbsences + stats.totalLates > 0 ? Math.round(((stats.justifiedAbsences + stats.justifiedLates) / (stats.totalAbsences + stats.totalLates)) * 100) : 0}%</p></CardContent></Card>
            </div>
          ) : <Skeleton className="h-32 w-full" />}
        </TabsContent>
      </Tabs>

      <Dialog open={absDialog || !!editingAbsence} onOpenChange={o => { if (!o) { setAbsDialog(false); setEditingAbsence(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAbsence ? t('attendance.editAbsence') : t('attendance.addAbsence')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t('common.teacher')}</Label><Select value={formTeacherId} onValueChange={setFormTeacherId}><SelectTrigger><SelectValue placeholder={t('common.selectTeacher')} /></SelectTrigger><SelectContent>{teachers.map(te => <SelectItem key={te.id} value={te.id}>{te.firstname} {te.lastname}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('common.session')}</Label><Select value={formSession} onValueChange={setFormSession}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sessionOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('common.date')}</Label><DatePickerField value={formDate} onChange={setFormDate} /></div>
            <div className="flex items-center gap-2"><Switch checked={formJustified} onCheckedChange={v => { setFormJustified(v); if (!v) setFormReason(''); }} /><Label>{t('common.justified')}</Label></div>
            {formJustified && <div className="space-y-2"><Label>{t('common.reason')}</Label><Textarea value={formReason} onChange={e => setFormReason(e.target.value)} placeholder={t('attendance.enterReason')} /></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setAbsDialog(false); setEditingAbsence(null); }}>{t('common.cancel')}</Button><Button onClick={handleAbsSubmit}>{editingAbsence ? t('common.update') : t('common.add')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lateDialog || !!editingLate} onOpenChange={o => { if (!o) { setLateDialog(false); setEditingLate(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLate ? t('attendance.editLate') : t('attendance.addLate')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t('common.teacher')}</Label><Select value={formTeacherId} onValueChange={setFormTeacherId}><SelectTrigger><SelectValue placeholder={t('common.selectTeacher')} /></SelectTrigger><SelectContent>{teachers.map(te => <SelectItem key={te.id} value={te.id}>{te.firstname} {te.lastname}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('common.session')}</Label><Select value={formSession} onValueChange={setFormSession}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sessionOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('common.date')}</Label><DatePickerField value={formDate} onChange={setFormDate} /></div>
            <div className="space-y-2"><Label>{t('attendance.periodOfLate')}</Label><Input type="number" min={1} value={formPeriod} onChange={e => setFormPeriod(parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-center gap-2"><Switch checked={formJustified} onCheckedChange={v => { setFormJustified(v); if (!v) setFormReason(''); }} /><Label>{t('common.justified')}</Label></div>
            {formJustified && <div className="space-y-2"><Label>{t('common.reason')}</Label><Textarea value={formReason} onChange={e => setFormReason(e.target.value)} placeholder={t('attendance.enterReason')} /></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setLateDialog(false); setEditingLate(null); }}>{t('common.cancel')}</Button><Button onClick={handleLateSubmit}>{editingLate ? t('common.update') : t('common.add')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAbsDialog} onOpenChange={setBulkAbsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('attendance.bulkAddAbsences')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="space-y-1"><Label className="text-xs">{t('common.numberOfRows')}</Label><Input type="number" min={1} max={50} value={bulkRowCount} onChange={e => setBulkRowCount(Math.max(1, Number(e.target.value)))} className="w-24" /></div>
              <Button variant="outline" size="sm" onClick={generateBulkRows}>{t('common.generateRows')}</Button>
            </div>
            <div className="flex items-center gap-2"><Switch checked={bulkShared} onCheckedChange={setBulkShared} /><Label className="text-sm">{t('common.sharedSettings')}</Label></div>
            {bulkShared && (
              <div className="flex gap-3 flex-wrap p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1"><Label className="text-xs">{t('common.date')}</Label><DatePickerField value={bulkSharedDate} onChange={setBulkSharedDate} className="w-40" /></div>
              </div>
            )}
            <div className="space-y-2">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-end flex-wrap border-b border-border pb-2">
                <div className="flex-1 min-w-[140px] space-y-1"><Label className="text-xs">{t('common.teacher')}</Label><Select value={row.teacherId} onValueChange={v => updateBulkRow(idx, 'teacherId', v)}><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger><SelectContent>{teachers.map(te => <SelectItem key={te.id} value={te.id}>{te.firstname} {te.lastname}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">{t('common.session')}</Label><Select value={row.session} onValueChange={v => updateBulkRow(idx, 'session', v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{sessionOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-1 pb-1"><Switch checked={row.isJustified} onCheckedChange={v => { updateBulkRow(idx, 'isJustified', v); if (!v) updateBulkRow(idx, 'reason', ''); }} /><Label className="text-xs">{t('common.justified')}</Label></div>
                {!bulkShared && <div className="space-y-1"><Label className="text-xs">{t('common.date')}</Label><DatePickerField value={row.date} onChange={v => updateBulkRow(idx, 'date', v)} className="w-36" /></div>}
                {row.isJustified && <div className="w-full space-y-1"><Label className="text-xs">{t('common.reason')}</Label><Input value={row.reason || ''} onChange={e => updateBulkRow(idx, 'reason', e.target.value)} placeholder={t('common.reason')} /></div>}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeBulkRow(idx)} disabled={bulkRows.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addBulkRow}><Plus className="me-2 h-4 w-4" />{t('common.addRow')}</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkAbsDialog(false)}>{t('common.cancel')}</Button><Button onClick={() => { const valid = bulkRows.filter(r => r.teacherId); if (!valid.length) { toast.error(t('attendance.addValidRow')); return; } bulkAbsMut.mutate(valid.map(r => ({ teacherId: r.teacherId, session: r.session, date: bulkShared ? bulkSharedDate : r.date, isJustified: r.isJustified, reason: r.isJustified ? r.reason : undefined }))); }}>{t('attendance.addCountAbsences', { count: bulkRows.filter(r => r.teacherId).length })}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkLateDialog} onOpenChange={setBulkLateDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('attendance.bulkAddLates')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="space-y-1"><Label className="text-xs">{t('common.numberOfRows')}</Label><Input type="number" min={1} max={50} value={bulkRowCount} onChange={e => setBulkRowCount(Math.max(1, Number(e.target.value)))} className="w-24" /></div>
              <Button variant="outline" size="sm" onClick={generateBulkRows}>{t('common.generateRows')}</Button>
            </div>
            <div className="flex items-center gap-2"><Switch checked={bulkShared} onCheckedChange={setBulkShared} /><Label className="text-sm">{t('common.sharedSettings')}</Label></div>
            {bulkShared && (
              <div className="flex gap-3 flex-wrap p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1"><Label className="text-xs">{t('common.date')}</Label><DatePickerField value={bulkSharedDate} onChange={setBulkSharedDate} className="w-40" /></div>
              </div>
            )}
            <div className="space-y-2">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-end flex-wrap border-b border-border pb-2">
                <div className="flex-1 min-w-[140px] space-y-1"><Label className="text-xs">{t('common.teacher')}</Label><Select value={row.teacherId} onValueChange={v => updateBulkRow(idx, 'teacherId', v)}><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger><SelectContent>{teachers.map(te => <SelectItem key={te.id} value={te.id}>{te.firstname} {te.lastname}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">{t('common.session')}</Label><Select value={row.session} onValueChange={v => updateBulkRow(idx, 'session', v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{sessionOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">{t('common.period')}</Label><Input type="number" min={1} value={row.period ?? 10} onChange={e => updateBulkRow(idx, 'period', parseInt(e.target.value) || 0)} className="w-20" /></div>
                <div className="flex items-center gap-1 pb-1"><Switch checked={row.isJustified} onCheckedChange={v => { updateBulkRow(idx, 'isJustified', v); if (!v) updateBulkRow(idx, 'reason', ''); }} /><Label className="text-xs">{t('common.justified')}</Label></div>
                {!bulkShared && <div className="space-y-1"><Label className="text-xs">{t('common.date')}</Label><DatePickerField value={row.date} onChange={v => updateBulkRow(idx, 'date', v)} className="w-36" /></div>}
                {row.isJustified && <div className="w-full space-y-1"><Label className="text-xs">{t('common.reason')}</Label><Input value={row.reason || ''} onChange={e => updateBulkRow(idx, 'reason', e.target.value)} placeholder={t('common.reason')} /></div>}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeBulkRow(idx)} disabled={bulkRows.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addBulkRow}><Plus className="me-2 h-4 w-4" />{t('common.addRow')}</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkLateDialog(false)}>{t('common.cancel')}</Button><Button onClick={() => { const valid = bulkRows.filter(r => r.teacherId); if (!valid.length) { toast.error(t('attendance.addValidRow')); return; } bulkLateMut.mutate(valid.map(r => ({ teacherId: r.teacherId, session: r.session, date: bulkShared ? bulkSharedDate : r.date, isJustified: r.isJustified, reason: r.isJustified ? r.reason : undefined, period: r.period ?? 10 }))); }}>{t('attendance.addCountLates', { count: bulkRows.filter(r => r.teacherId).length })}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('common.deleteConfirmTitle', { entity: deleteTarget?.type === 'absence' ? t('attendance.absences').toLowerCase() : t('attendance.lates').toLowerCase() })}</AlertDialogTitle><AlertDialogDescription>{t('common.deleteConfirmDescAction')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={importAbsOpen} onOpenChange={setImportAbsOpen} onImport={handleImportAbsences} expectedColumns={['Teacher ID', 'Session', 'Date', 'Justified', 'Reason']} />
      <ExcelImportDialog open={importLateOpen} onOpenChange={setImportLateOpen} onImport={handleImportLates} expectedColumns={['Teacher ID', 'Session', 'Date', 'Period', 'Justified', 'Reason']} />
    </div>
  );
}
