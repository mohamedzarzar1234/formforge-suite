import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { AttendanceCalendarView } from '@/components/AttendanceCalendarView';
import { DatePickerField } from '@/components/DatePickerField';
import { ViewToggle } from '@/components/ViewToggle';
import { toast } from 'sonner';
import { studentAttendanceApi } from '@/services/attendance-api';
import { useTranslation } from 'react-i18next';

const today = () => new Date().toISOString().split('T')[0];

interface StudentInfo {
  id: string;
  firstname: string;
  lastname: string;
}

interface GroupAttendanceTabProps {
  students: StudentInfo[];
  recordType: 'absences' | 'lates';
  title?: string;
}

export function GroupAttendanceTab({ students, recordType, title }: GroupAttendanceTabProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formStudentId, setFormStudentId] = useState('');
  const [formDate, setFormDate] = useState(today());
  const [formJustified, setFormJustified] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [formPeriod, setFormPeriod] = useState(10);

  const isAbsences = recordType === 'absences';
  const studentIds = useMemo(() => students.map(s => s.id), [students]);

  const { data: absencesRes, isLoading: absLoading } = useQuery({
    queryKey: ['student-absences-all'],
    queryFn: () => studentAttendanceApi.getAbsences(),
    enabled: isAbsences,
  });
  const { data: latesRes, isLoading: lateLoading } = useQuery({
    queryKey: ['student-lates-all'],
    queryFn: () => studentAttendanceApi.getLates(),
    enabled: !isAbsences,
  });

  const isLoading = isAbsences ? absLoading : lateLoading;
  const rawItems: any[] = isAbsences ? (absencesRes?.data || []) : (latesRes?.data || []);

  const items = useMemo(() => {
    let filtered = rawItems.filter(i => studentIds.includes(i.studentId));
    if (dateFrom) filtered = filtered.filter(i => i.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(i => i.date <= dateTo);
    return filtered;
  }, [rawItems, studentIds, dateFrom, dateTo]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['student-absences'] });
    qc.invalidateQueries({ queryKey: ['student-absences-all'] });
    qc.invalidateQueries({ queryKey: ['student-lates'] });
    qc.invalidateQueries({ queryKey: ['student-lates-all'] });
    qc.invalidateQueries({ queryKey: ['student-attendance-stats'] });
  };

  const createMut = useMutation({
    mutationFn: (data: any) => isAbsences ? studentAttendanceApi.createAbsence(data) : studentAttendanceApi.createLate(data),
    onSuccess: (res: any) => {
      if (!res.success) { toast.error(res.message); return; }
      invalidate(); setDialogOpen(false);
      toast.success(isAbsences ? t('attendance.absenceAdded') : t('attendance.lateAdded'));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => isAbsences ? studentAttendanceApi.updateAbsence(id, data) : studentAttendanceApi.updateLate(id, data),
    onSuccess: () => { invalidate(); setEditingId(null); setDialogOpen(false); toast.success(t('attendance.updated')); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => isAbsences ? studentAttendanceApi.deleteAbsence(id) : studentAttendanceApi.deleteLate(id),
    onSuccess: () => { invalidate(); toast.success(t('attendance.deleted')); },
  });

  const getStudentName = (id: string) => {
    const s = students.find(x => x.id === id);
    return s ? `${s.firstname} ${s.lastname}` : id;
  };

  const resetForm = (item?: any) => {
    setFormStudentId(item?.studentId || '');
    setFormDate(item?.date || today());
    setFormJustified(item?.isJustified || false);
    setFormReason(item?.reason || '');
    setFormPeriod(item?.period || 10);
  };

  const handleSubmit = () => {
    if (!formStudentId) { toast.error(t('common.selectStudent')); return; }
    const base: any = { studentId: formStudentId, date: formDate, isJustified: formJustified, reason: formJustified ? formReason : undefined };
    if (!isAbsences) base.period = formPeriod;
    if (editingId) updateMut.mutate({ id: editingId, ...base });
    else createMut.mutate(base);
  };

  const recordTypeLabel = isAbsences ? t('common.absences').toLowerCase() : t('common.lates').toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} {recordTypeLabel} {title ? `— ${title}` : ''}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode !== 'calendar' && (
            <>
              <div className="flex flex-col">
                <Label className="text-xs">{t('common.dateFrom')}</Label>
                <DatePickerField value={dateFrom} onChange={setDateFrom} placeholder={t('common.dateFrom')} className="w-32 h-8" />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs">{t('common.dateTo')}</Label>
                <DatePickerField value={dateTo} onChange={setDateTo} placeholder={t('common.dateTo')} className="w-32 h-8" />
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }} className="self-end">{t('common.clearFilters')}</Button>
              )}
            </>
          )}
          <div className="self-end"><ViewToggle view={viewMode} onViewChange={setViewMode} /></div>
          <Button size="sm" className="self-end" onClick={() => { resetForm(); setEditingId(null); setDialogOpen(true); }}>
            <Plus className="me-2 h-4 w-4" />{isAbsences ? t('attendance.addAbsence') : t('attendance.addLate')}
          </Button>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-48 w-full" /> : viewMode === 'calendar' ? (
        <AttendanceCalendarView
          items={items}
          type={recordType}
          getEntityName={(item) => getStudentName(item.studentId)}
          showEntity={true}
          onEdit={(item) => { resetForm(item); setEditingId(item.id); setDialogOpen(true); }}
          onDelete={(item) => setDeleteTarget(item.id)}
        />
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.student')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                {!isAbsences && <TableHead>{t('common.period')}</TableHead>}
                <TableHead>{t('common.justified')}</TableHead>
                <TableHead>{t('common.reason')}</TableHead>
                <TableHead className="w-24">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={isAbsences ? 5 : 6} className="text-center text-muted-foreground py-8">{isAbsences ? t('attendance.noAbsences') : t('attendance.noLates')}</TableCell></TableRow>
              ) : items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{getStudentName(item.studentId)}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  {!isAbsences && <TableCell>{item.period} {t('attendance.min')}</TableCell>}
                  <TableCell><Badge variant={item.isJustified ? 'default' : 'destructive'}>{item.isJustified ? t('common.yes') : t('common.no')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.reason || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { resetForm(item); setEditingId(item.id); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setDialogOpen(false); setEditingId(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? t('common.edit') : t('common.add')} {isAbsences ? t('common.absences') : t('common.lates')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('common.student')}</Label>
              <Select value={formStudentId} onValueChange={setFormStudentId}>
                <SelectTrigger><SelectValue placeholder={t('common.selectStudent')} /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('common.date')}</Label><DatePickerField value={formDate} onChange={setFormDate} /></div>
            {!isAbsences && <div className="space-y-2"><Label>{t('common.period')}</Label><Input type="number" min={1} value={formPeriod} onChange={e => setFormPeriod(parseInt(e.target.value) || 0)} /></div>}
            <div className="flex items-center gap-2"><Switch checked={formJustified} onCheckedChange={v => { setFormJustified(v); if (!v) setFormReason(''); }} /><Label>{t('common.justified')}</Label></div>
            {formJustified && <div className="space-y-2"><Label>{t('common.reason')}</Label><Textarea value={formReason} onChange={e => setFormReason(e.target.value)} placeholder={t('common.reason')} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>{editingId ? t('common.update') : t('common.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common.deleteConfirmTitle', { entity: recordTypeLabel })}</AlertDialogTitle><AlertDialogDescription>{t('common.deleteConfirmDescAction')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteTarget) { deleteMut.mutate(deleteTarget); setDeleteTarget(null); } }}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
