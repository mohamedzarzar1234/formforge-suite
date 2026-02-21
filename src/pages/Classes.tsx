import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, getLevels, createClass, updateClass, deleteClass } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Classes() {
  const qc = useQueryClient();
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', section: '', capacity: 30, levelId: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', section: '', capacity: 30, levelId: '' }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, section: c.section, capacity: c.capacity, levelId: c.levelId }); setOpen(true); };

  const mutation = useMutation({
    mutationFn: () => editing ? updateClass(editing.id, form) : createClass(form as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success(editing ? 'Updated' : 'Created'); setOpen(false); },
  });

  const del = useMutation({ mutationFn: deleteClass, onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success('Deleted'); } });

  const columns: Column[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'capacity', label: 'Capacity', sortable: true },
    { key: 'levelId', label: 'Level', sortable: true, render: (v) => levels.find((l: any) => l.id === v)?.name ?? '—' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Classes</h1><p className="text-muted-foreground">Manage school classes</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Class</Button>
      </div>
      <DataTable columns={columns} data={classes} searchPlaceholder="Search classes..."
        actions={row => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete class?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Class' : 'New Class'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Section *</Label><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} /></div>
            <div><Label>Level *</Label>
              <Select value={form.levelId} onValueChange={v => setForm(f => ({ ...f, levelId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{levels.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
