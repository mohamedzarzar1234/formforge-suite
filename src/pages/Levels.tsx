import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLevels, createLevel, updateLevel, deleteLevel } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Levels() {
  const qc = useQueryClient();
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ name: l.name, description: l.description }); setOpen(true); };

  const mutation = useMutation({
    mutationFn: () => editing ? updateLevel(editing.id, form) : createLevel(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['levels'] }); toast.success(editing ? 'Updated' : 'Created'); setOpen(false); },
  });

  const del = useMutation({ mutationFn: deleteLevel, onSuccess: () => { qc.invalidateQueries({ queryKey: ['levels'] }); toast.success('Deleted'); } });

  const columns: Column[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Levels</h1><p className="text-muted-foreground">Manage grade levels</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Level</Button>
      </div>
      <DataTable columns={columns} data={levels} searchPlaceholder="Search levels..."
        actions={row => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete level?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Level' : 'New Level'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
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
