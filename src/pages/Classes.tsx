import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { classApi, levelApi } from '@/services/api';
import type { SchoolClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/DataTable';
import { useTranslation } from 'react-i18next';

const schema = z.object({ name: z.string().min(1, 'Required'), section: z.string().min(1, 'Required'), capacity: z.coerce.number().min(1, 'Min 1'), levelId: z.string().min(1, 'Required') });

export default function ClassesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);

  const { data: res, isLoading } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });

  const createMut = useMutation({ mutationFn: (d: Partial<SchoolClass>) => classApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setDialogOpen(false); toast.success(t('classes.created')); } });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => classApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setDialogOpen(false); toast.success(t('classes.updated')); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => classApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success(t('classes.deleted')); } });

  const columns: Column<SchoolClass>[] = [
    { key: 'name', label: t('common.name') },
    { key: 'section', label: t('common.section') },
    { key: 'capacity', label: t('common.capacity'), render: c => String(c.capacity) },
    { key: 'levelId', label: t('common.level'), render: c => levelsRes?.data?.find(l => l.id === c.levelId)?.name || c.levelId },
  ];

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', section: '', capacity: 30, levelId: '' } });
  const resetForm = () => { form.reset({ name: editing?.name || '', section: editing?.section || '', capacity: editing?.capacity || 30, levelId: editing?.levelId || '' }); };
  const handleSubmit = (data: any) => { editing ? updateMut.mutate({ id: editing.id, ...data }) : createMut.mutate(data); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">{t('classes.title')}</h1><p className="text-muted-foreground">{t('classes.count', { count: res?.total ?? 0 })}</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="me-2 h-4 w-4" />{t('classes.addClass')}</Button>
      </div>
      <DataTable data={res?.data || []} columns={columns} isLoading={isLoading} searchPlaceholder={t('classes.searchClasses')} onView={c => navigate(`/classes/${c.id}`)} onEdit={c => { setEditing(c); setDialogOpen(true); }} onDelete={c => setDeleteTarget(c)} exportFilename="classes" />
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('classes.editClass') : t('classes.addClass')}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('common.name')} *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="section" render={({ field }) => (<FormItem><FormLabel>{t('common.section')} *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="capacity" render={({ field }) => (<FormItem><FormLabel>{t('common.capacity')} *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="levelId" render={({ field }) => (
                <FormItem><FormLabel>{t('common.level')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('common.selectLevel')} /></SelectTrigger></FormControl>
                  <SelectContent>{(levelsRes?.data || []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select><FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? t('common.update') : t('common.create')}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('common.deleteConfirmTitle', { entity: t('common.class') })}</AlertDialogTitle><AlertDialogDescription>{t('common.permanently', { name: deleteTarget?.name })}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
