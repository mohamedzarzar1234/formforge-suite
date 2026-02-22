import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntities, getTemplate, createEntity, updateEntity, deleteEntity } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Parents() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: parents = [] } = useQuery({ queryKey: ['parents'], queryFn: () => getEntities('parent') });
  const { data: template } = useQuery({ queryKey: ['template', 'parent'], queryFn: () => getTemplate('parent') });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');

  const openNew = () => { setEditing(null); setFirstname(''); setLastname(''); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setFirstname(p.firstname); setLastname(p.lastname); setOpen(true); };

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, firstname, lastname, studentIds: editing?.studentIds || [] };
      return editing ? updateEntity('parent', editing.id, payload) : createEntity('parent', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); toast.success(editing ? 'Updated' : 'Created'); setOpen(false); },
  });

  const del = useMutation({ mutationFn: (id: string) => deleteEntity('parent', id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); toast.success('Deleted'); } });

  const columns: Column[] = [
    { key: 'firstname', label: 'First Name', sortable: true },
    { key: 'lastname', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Parents</h1><p className="text-muted-foreground">Manage parent records</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Parent</Button>
      </div>
      <DataTable columns={columns} data={parents} searchPlaceholder="Search parents..."
        actions={row => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => nav(`/parents/${row.id}`)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete parent?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Parent' : 'New Parent'}</DialogTitle></DialogHeader>
          {template && (
            <DynamicForm fields={template.fields} initialData={editing} onSubmit={d => mutation.mutate(d)} onCancel={() => setOpen(false)} isLoading={mutation.isPending}
              extraFieldsBefore={
                <div className="grid gap-4 md:grid-cols-2 pb-4 border-b mb-4">
                  <div><Label>First Name *</Label><Input value={firstname} onChange={e => setFirstname(e.target.value)} required /></div>
                  <div><Label>Last Name *</Label><Input value={lastname} onChange={e => setLastname(e.target.value)} required /></div>
                </div>
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
