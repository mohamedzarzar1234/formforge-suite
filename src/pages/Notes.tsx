import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { noteApi, noteTemplateApi } from '@/services/note-point-api';
import { studentApi, classApi, levelApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/FilterBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerField } from '@/components/DatePickerField';
import { AttendanceQRScanner } from '@/components/AttendanceQRScanner';
import { Plus, Trash2, ListPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Note } from '@/types/note-point';

const today = () => new Date().toISOString().split('T')[0];

export default function Notes() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<{ studentId?: string; templateId?: string; dateFrom?: string; dateTo?: string }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formTemplateId, setFormTemplateId] = useState('');
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [formDate, setFormDate] = useState(today());
  const [formDesc, setFormDesc] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [bulkRows, setBulkRows] = useState<{ templateId: string; studentIds: string[]; date: string; description: string }[]>([
    { templateId: '', studentIds: [], date: today(), description: '' }
  ]);

  const { data: templatesRes } = useQuery({ queryKey: ['note-templates'], queryFn: () => noteTemplateApi.getAll() });
  const { data: notesRes, isLoading } = useQuery({ queryKey: ['notes', filter], queryFn: () => noteApi.getAll(filter) });
  const { data: studentsRes } = useQuery({ queryKey: ['students-all'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: classesRes } = useQuery({ queryKey: ['classes-all'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  const templates = templatesRes?.data || [];
  const notesList = notesRes?.data || [];
  const students = studentsRes?.data || [];
  const classes = classesRes?.data || [];

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['notes'] }); qc.invalidateQueries({ queryKey: ['points'] }); };

  const createMut = useMutation({
    mutationFn: (d: Omit<Note, 'id' | 'createdAt'>) => noteApi.create(d),
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success(t('notes.noteAdded')); },
  });
  const bulkMut = useMutation({
    mutationFn: (d: Omit<Note, 'id' | 'createdAt'>[]) => noteApi.createBulk(d),
    onSuccess: (res) => { invalidate(); setBulkOpen(false); toast.success(res.message); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => noteApi.delete(id),
    onSuccess: () => { invalidate(); setDeleteId(null); toast.success(t('notes.noteDeleted')); },
  });

  const getStudentName = (id: string) => { const s = students.find(x => x.id === id); return s ? `${s.firstname} ${s.lastname}` : id; };
  const getTemplateName = (id: string) => templates.find(t => t.id === id)?.title || id;
  const getTemplateType = (id: string) => templates.find(t => t.id === id)?.type;

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students.slice(0, 20);
    const q = studentSearch.toLowerCase();
    return students.filter(s => `${s.firstname} ${s.lastname}`.toLowerCase().includes(q)).slice(0, 20);
  }, [students, studentSearch]);

  const openSingle = () => {
    setFormTemplateId(''); setFormStudentIds([]); setFormDate(today()); setFormDesc(''); setStudentSearch('');
    setDialogOpen(true);
  };

  const openBulk = () => {
    setBulkRows([{ templateId: '', studentIds: [], date: today(), description: '' }]);
    setBulkOpen(true);
  };

  const handleSubmit = () => {
    if (!formTemplateId) { toast.error(t('notes.selectNoteError')); return; }
    if (formStudentIds.length === 0) { toast.error(t('notes.selectStudentError')); return; }
    createMut.mutate({ templateId: formTemplateId, studentIds: formStudentIds, date: formDate, description: formDesc || undefined });
  };

  const handleBulkSubmit = () => {
    const valid = bulkRows.filter(r => r.templateId && r.studentIds.length > 0);
    if (!valid.length) { toast.error(t('notes.addValidRow')); return; }
    bulkMut.mutate(valid.map(r => ({ templateId: r.templateId, studentIds: r.studentIds, date: r.date, description: r.description || undefined })));
  };

  const toggleStudentInForm = (id: string) => {
    setFormStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleScanSingle = (ids: string[]) => { if (ids[0]) { setFormStudentIds([ids[0]]); setDialogOpen(true); } };
  const handleScanBulk = (ids: string[]) => {
    setBulkRows(ids.map(id => ({ templateId: '', studentIds: [id], date: today(), description: '' })));
    setBulkOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('notes.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('notes.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AttendanceQRScanner mode="single" entityType="students" onScanned={handleScanSingle} label={t('notes.scanSingle')} />
          <AttendanceQRScanner mode="bulk" entityType="students" onScanned={handleScanBulk} label={t('notes.scanBulk')} />
          <Button variant="outline" onClick={openBulk}><ListPlus className="me-2 h-4 w-4" />{t('notes.bulkAdd')}</Button>
          <Button onClick={openSingle}><Plus className="me-2 h-4 w-4" />{t('notes.addNote')}</Button>
        </div>
      </div>

      <FilterBar showClear={!!(filter.studentId || filter.templateId || filter.dateFrom || filter.dateTo)} onClear={() => setFilter({})}>
        <div className="space-y-1">
          <Label className="text-xs">{t('common.student')}</Label>
          <Select value={filter.studentId || 'all'} onValueChange={v => setFilter(f => ({ ...f, studentId: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.allStudents')}</SelectItem>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('notes.noteType')}</Label>
          <Select value={filter.templateId || 'all'} onValueChange={v => setFilter(f => ({ ...f, templateId: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('common.all')}</SelectItem>{templates.map(tpl => <SelectItem key={tpl.id} value={tpl.id}>{tpl.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex flex-col"><Label className="text-xs">{t('common.dateFrom')}</Label><DatePickerField value={filter.dateFrom || ''} onChange={v => setFilter(f => ({ ...f, dateFrom: v || undefined }))} placeholder={t('common.from')} className="w-40" /></div>
        <div className="space-y-1 flex flex-col"><Label className="text-xs">{t('common.dateTo')}</Label><DatePickerField value={filter.dateTo || ''} onChange={v => setFilter(f => ({ ...f, dateTo: v || undefined }))} placeholder={t('common.to')} className="w-40" /></div>
      </FilterBar>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : notesList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">{t('notes.noNotes')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('sidebar.students')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  <TableHead className="w-16">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notesList.map(n => (
                  <TableRow key={n.id}>
                    <TableCell>{n.date}</TableCell>
                    <TableCell>
                      <Badge variant={getTemplateType(n.templateId) === 'positive' ? 'default' : 'destructive'}>
                        {getTemplateName(n.templateId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {n.studentIds.map(id => (
                          <Badge key={id} variant="outline">{getStudentName(id)}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{n.description || '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('notes.addNote')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('notes.noteType')}</Label>
              <Select value={formTemplateId} onValueChange={setFormTemplateId}>
                <SelectTrigger><SelectValue placeholder={t('notes.selectType')} /></SelectTrigger>
                <SelectContent>{templates.map(tpl => <SelectItem key={tpl.id} value={tpl.id}>{tpl.title} ({tpl.type === 'positive' ? t('common.positive') : t('common.negative')})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('sidebar.students')}</Label>
              <Input placeholder={t('notes.searchStudents')} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                {filteredStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm">
                    <input type="checkbox" checked={formStudentIds.includes(s.id)} onChange={() => toggleStudentInForm(s.id)} className="rounded" />
                    {s.firstname} {s.lastname}
                    <span className="text-muted-foreground text-xs ms-auto">{classes.find(c => c.id === s.classId)?.name || ''}</span>
                  </label>
                ))}
              </div>
              {formStudentIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formStudentIds.map(id => (
                    <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => toggleStudentInForm(id)}>
                      {getStudentName(id)} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('common.date')}</Label>
              <DatePickerField value={formDate} onChange={setFormDate} />
            </div>
            <div className="space-y-2">
              <Label>{t('notes.descriptionOptional')}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder={t('notes.addDescription')} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending}>{t('notes.addNote')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('notes.bulkAddNotes')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-end border-b pb-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t('common.type')}</Label>
                  <Select value={row.templateId} onValueChange={v => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, templateId: v } : r))}>
                    <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                    <SelectContent>{templates.map(tpl => <SelectItem key={tpl.id} value={tpl.id}>{tpl.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t('common.student')}</Label>
                  <Select value={row.studentIds[0] || ''} onValueChange={v => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, studentIds: [v] } : r))}>
                    <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="w-40 space-y-1">
                  <Label className="text-xs">{t('common.date')}</Label>
                  <DatePickerField value={row.date} onChange={v => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, date: v } : r))} className="w-full" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setBulkRows(prev => prev.filter((_, i) => i !== idx))} disabled={bulkRows.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setBulkRows(prev => [...prev, { templateId: '', studentIds: [], date: today(), description: '' }])}>
              <Plus className="me-2 h-4 w-4" />{t('notes.addRow')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleBulkSubmit} disabled={bulkMut.isPending}>{t('notes.submitAll')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notes.deleteNote')}</AlertDialogTitle>
            <AlertDialogDescription>{t('notes.deleteNoteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
