import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { managerApi, classApi, templateApi } from '@/services/api';
import { buildDynamicSchema, getDynamicDefaults } from '@/lib/schema-builder';
import type { Manager } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/DataTable';
import { DynamicFormFields } from '@/components/DynamicFormFields';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ExcelImportDialog } from '@/components/ExcelImportDialog';
import { cn } from '@/lib/utils';

export default function ManagersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manager | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: res, isLoading } = useQuery({ queryKey: ['managers'], queryFn: () => managerApi.getAll({ page: 1, limit: 1000 }) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });
  const fields = tplRes?.data?.manager?.fields || [];

  const createMut = useMutation({ mutationFn: (d: Partial<Manager>) => managerApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['managers'] }); setDialogOpen(false); toast.success('Manager created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => managerApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['managers'] }); setDialogOpen(false); toast.success('Manager updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => managerApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager deleted'); } });

  const columns: Column<Manager>[] = useMemo(() => [
    { key: 'firstname', label: 'First Name' },
    { key: 'lastname', label: 'Last Name' },
    { key: 'classIds', label: 'Classes', render: m => m.classIds.map(id => classesRes?.data?.find(c => c.id === id)?.name).filter(Boolean).join(', ') || '—' },
    ...fields.filter(f => f.visible).slice(0, 2).map(f => ({ key: f.name, label: f.label, render: (m: Manager) => String(m.dynamicFields?.[f.name] ?? '—') })),
  ], [fields, classesRes]);

  const handleSubmit = (data: any) => { const { firstname, lastname, classIds, photo, ...rest } = data; const payload = { firstname, lastname, classIds, dynamicFields: { ...rest, photo } }; editing ? updateMut.mutate({ id: editing.id, ...payload }) : createMut.mutate(payload); };

  const handleImport = (rows: Record<string, string>[]) => {
    let count = 0;
    rows.forEach(row => {
      const m: Partial<Manager> = { firstname: row['First Name'] || row['firstname'] || '', lastname: row['Last Name'] || row['lastname'] || '', classIds: [], dynamicFields: {} };
      if (m.firstname && m.lastname) { createMut.mutate(m); count++; }
    });
    toast.success(`Imported ${count} managers`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Managers</h1><p className="text-muted-foreground">{res?.total ?? 0} managers</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Manager</Button>
      </div>
      <DataTable data={res?.data || []} columns={columns} isLoading={isLoading} searchPlaceholder="Search managers..." onView={m => navigate(`/managers/${m.id}`)} onEdit={m => { setEditing(m); setDialogOpen(true); }} onDelete={m => setDeleteTarget(m)} exportFilename="managers" onImportClick={() => setImportOpen(true)} />
      <ManagerDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} fields={fields} classes={classesRes?.data || []} isSubmitting={createMut.isPending || updateMut.isPending} onSubmit={handleSubmit} />
      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} expectedColumns={['First Name', 'Last Name']} />
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete manager?</AlertDialogTitle><AlertDialogDescription>Permanently delete {deleteTarget?.firstname} {deleteTarget?.lastname}?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ManagerDialog({ open, onOpenChange, editing, fields, classes, isSubmitting, onSubmit }: any) {
  const schema = z.object({
    firstname: z.string().min(1, 'Required'),
    lastname: z.string().min(1, 'Required'),
    classIds: z.array(z.string()).optional(),
    photo: z.string().optional(),
    ...buildDynamicSchema(fields)
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: '',
      lastname: '',
      classIds: [],
      photo: '',
      ...getDynamicDefaults(fields)
    }
  });

  // Reset form when dialog opens or when editing/fields change
  useEffect(() => {
    if (open) {
      form.reset({
        firstname: editing?.firstname || '',
        lastname: editing?.lastname || '',
        classIds: editing?.classIds || [],
        photo: editing?.dynamicFields?.photo || '',
        ...getDynamicDefaults(fields, editing?.dynamicFields)
      });
    }
  }, [open, editing, fields, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Manager' : 'Add Manager'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="photo" render={({ field }) => (
              <FormItem>
                <PhotoUpload value={field.value} onChange={field.onChange} initials={(form.watch('firstname')?.[0] || '') + (form.watch('lastname')?.[0] || '')} />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstname" render={({ field }) => (
                <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastname" render={({ field }) => (
                <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* Multi-select for Classes */}
            <FormField
              control={form.control}
              name="classIds"
              render={({ field }) => {
                const selectedClassIds = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Classes</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !selectedClassIds.length && "text-muted-foreground"
                            )}
                          >
                            {selectedClassIds.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {selectedClassIds.slice(0, 2).map((id) => {
                                  const cls = classes.find((c: any) => c.id === id);
                                  return cls ? (
                                    <Badge variant="secondary" key={id}>
                                      {cls.name}
                                    </Badge>
                                  ) : null;
                                })}
                                {selectedClassIds.length > 2 && (
                                  <Badge variant="secondary">+{selectedClassIds.length - 2}</Badge>
                                )}
                              </div>
                            ) : (
                              "Select classes"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search classes..." />
                          <CommandEmpty>No classes found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {classes.map((cls: any) => (
                              <CommandItem
                                key={cls.id}
                                onSelect={() => {
                                  const current = field.value || [];
                                  const updated = current.includes(cls.id)
                                    ? current.filter((id: string) => id !== cls.id)
                                    : [...current, cls.id];
                                  field.onChange(updated);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClassIds.includes(cls.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cls.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

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