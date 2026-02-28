import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { levelApi, subjectApi } from '@/services/api';
import type { Level } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/DataTable';
import { cn } from '@/lib/utils';

const schema = z.object({ name: z.string().min(1, 'Required'), description: z.string().optional(), subjectIds: z.array(z.string()).optional() });

export default function LevelsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);

  const { data: res, isLoading } = useQuery({ queryKey: ['levels'], queryFn: () => levelApi.getAll({ page: 1, limit: 1000 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });
  const subjects = subjectsRes?.data || [];

  const createMut = useMutation({ mutationFn: (d: Partial<Level>) => levelApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['levels'] }); setDialogOpen(false); toast.success('Level created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => levelApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['levels'] }); setDialogOpen(false); toast.success('Level updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => levelApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['levels'] }); toast.success('Level deleted'); } });

  const columns: Column<Level>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'subjectIds' as any, label: 'Subjects', render: (l: Level) => {
      const subs = (l.subjectIds || []).map(id => subjects.find(s => s.id === id)?.name).filter(Boolean);
      return subs.length > 0 ? subs.join(', ') : '—';
    }},
  ];
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', description: '', subjectIds: [] as string[] } });

  useEffect(() => {
    if (dialogOpen) {
      form.reset({ name: editing?.name || '', description: editing?.description || '', subjectIds: editing?.subjectIds || [] });
    }
  }, [dialogOpen, editing, form]);

  const handleSubmit = (data: any) => { editing ? updateMut.mutate({ id: editing.id, ...data }) : createMut.mutate(data); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Levels</h1><p className="text-muted-foreground">{res?.total ?? 0} levels</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Level</Button>
      </div>
      <DataTable data={res?.data || []} columns={columns} isLoading={isLoading} searchPlaceholder="Search levels..." onEdit={l => { setEditing(l); setDialogOpen(true); }} onDelete={l => setDeleteTarget(l)} onView={l => navigate(`/levels/${l.id}`)} exportFilename="levels" />
      <Dialog open={dialogOpen} onOpenChange={o => setDialogOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Level' : 'Add Level'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="subjectIds" render={({ field }) => {
                const selected = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Subjects</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !selected.length && "text-muted-foreground")}>
                            {selected.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {selected.slice(0, 3).map(id => {
                                  const s = subjects.find(s => s.id === id);
                                  return s ? <Badge variant="secondary" key={id}>{s.name}</Badge> : null;
                                })}
                                {selected.length > 3 && <Badge variant="secondary">+{selected.length - 3}</Badge>}
                              </div>
                            ) : "Select subjects"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search subjects..." />
                          <CommandEmpty>No subjects found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {subjects.map(s => (
                              <CommandItem key={s.id} onSelect={() => {
                                const updated = selected.includes(s.id) ? selected.filter(x => x !== s.id) : [...selected, s.id];
                                field.onChange(updated);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", selected.includes(s.id) ? "opacity-100" : "opacity-0")} />
                                {s.name} ({s.code})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete level?</AlertDialogTitle><AlertDialogDescription>Permanently delete {deleteTarget?.name}?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
