import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { subjectApi } from '@/services/api';
import type { Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, type Column } from '@/components/DataTable';
import { useTranslation } from 'react-i18next';

const schema = z.object({ name: z.string().min(1, 'Required'), code: z.string().min(1, 'Required'), description: z.string().optional() });

export default function SubjectsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const { data: res, isLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const createMut = useMutation({ mutationFn: (d: Partial<Subject>) => subjectApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); setDialogOpen(false); toast.success(t('subjects.created')); } });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => subjectApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); setDialogOpen(false); toast.success(t('subjects.updated')); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => subjectApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success(t('subjects.deleted')); } });

  const columns: Column<Subject>[] = [{ key: 'name', label: t('common.name') }, { key: 'code', label: t('common.code') }, { key: 'description', label: t('common.description') }];
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', code: '', description: '' } });
  const resetForm = () => { form.reset({ name: editing?.name || '', code: editing?.code || '', description: editing?.description || '' }); };
  const handleSubmit = (data: any) => { editing ? updateMut.mutate({ id: editing.id, ...data }) : createMut.mutate(data); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">{t('subjects.title')}</h1><p className="text-muted-foreground">{t('subjects.count', { count: res?.total ?? 0 })}</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="me-2 h-4 w-4" />{t('subjects.addSubject')}</Button>
      </div>
      <DataTable data={res?.data || []} columns={columns} isLoading={isLoading} searchPlaceholder={t('subjects.searchSubjects')} onEdit={s => { setEditing(s); setDialogOpen(true); }} onDelete={s => setDeleteTarget(s)} onView={s => navigate(`/subjects/${s.id}`)} exportFilename="subjects" />
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('subjects.editSubject') : t('subjects.addSubject')}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('common.name')} *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>{t('common.code')} *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>{t('common.description')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? t('common.update') : t('common.create')}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('common.deleteConfirmTitle', { entity: t('common.subject') })}</AlertDialogTitle><AlertDialogDescription>{t('common.permanently', { name: deleteTarget?.name })}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
