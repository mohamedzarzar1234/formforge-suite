import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { parentApi, templateApi } from '@/services/api';
import { buildDynamicSchema, getDynamicDefaults } from '@/lib/schema-builder';
import type { Parent } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/DataTable';
import { DynamicFormFields } from '@/components/DynamicFormFields';
import { ExcelImportDialog } from '@/components/ExcelImportDialog';

export default function ParentsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: res, isLoading } = useQuery({ queryKey: ['parents'], queryFn: () => parentApi.getAll({ page: 1, limit: 1000 }) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const fields = tplRes?.data?.parent?.fields || [];

  const createMut = useMutation({ mutationFn: (d: Partial<Parent>) => parentApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); setDialogOpen(false); toast.success('Parent created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => parentApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); setDialogOpen(false); toast.success('Parent updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => parentApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); toast.success('Parent deleted'); } });

  const columns: Column<Parent>[] = useMemo(() => [
    { key: 'firstname', label: 'First Name' },
    { key: 'lastname', label: 'Last Name' },
    { key: 'studentIds', label: 'Children', render: p => `${p.studentIds.length} student(s)` },
    ...fields.filter(f => f.visible).slice(0, 2).map(f => ({ key: f.name, label: f.label, render: (p: Parent) => String(p.dynamicFields?.[f.name] ?? '—') })),
  ], [fields]);

  const handleSubmit = (data: any) => { const { firstname, lastname, ...rest } = data; const payload = { firstname, lastname, studentIds: editing?.studentIds || [], dynamicFields: rest }; editing ? updateMut.mutate({ id: editing.id, ...payload }) : createMut.mutate(payload); };

  const handleImport = (rows: Record<string, string>[]) => {
    let count = 0;
    rows.forEach(row => {
      const p: Partial<Parent> = { firstname: row['First Name'] || row['firstname'] || '', lastname: row['Last Name'] || row['lastname'] || '', studentIds: [], dynamicFields: {} };
      if (p.firstname && p.lastname) { createMut.mutate(p); count++; }
    });
    toast.success(`Imported ${count} parents`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Parents</h1><p className="text-muted-foreground">{res?.total ?? 0} parents</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Parent</Button>
      </div>
      <DataTable data={res?.data || []} columns={columns} isLoading={isLoading} searchPlaceholder="Search parents..." onView={p => navigate(`/parents/${p.id}`)} onEdit={p => { setEditing(p); setDialogOpen(true); }} onDelete={p => setDeleteTarget(p)} exportFilename="parents" onImportClick={() => setImportOpen(true)} />
      <SimpleEntityDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} fields={fields} isSubmitting={createMut.isPending || updateMut.isPending} onSubmit={handleSubmit} title="Parent" />
      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} expectedColumns={['First Name', 'Last Name']} />
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete parent?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {deleteTarget?.firstname} {deleteTarget?.lastname}.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function SimpleEntityDialog({ open, onOpenChange, editing, fields, isSubmitting, onSubmit, title }: any) {
  const schema = z.object({
    firstname: z.string().min(1, 'Required'),
    lastname: z.string().min(1, 'Required'),
    ...buildDynamicSchema(fields)
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: '',
      lastname: '',
      ...getDynamicDefaults(fields)
    }
  });

  // Reset form when dialog opens or when editing/fields change
  useEffect(() => {
    if (open) {
      form.reset({
        firstname: editing?.firstname || '',
        lastname: editing?.lastname || '',
        ...getDynamicDefaults(fields, editing?.dynamicFields)
      });
    }
  }, [open, editing, fields, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstname" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastname" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DynamicFormFields fields={fields} control={form.control} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
