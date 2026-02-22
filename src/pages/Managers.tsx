import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntities, getTemplate, createEntity, updateEntity, deleteEntity, getClasses } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Managers() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: managers = [] } = useQuery({ queryKey: ['managers'], queryFn: () => getEntities('manager') });
  const { data: template } = useQuery({ queryKey: ['template', 'manager'], queryFn: () => getTemplate('manager') });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);

  const openNew = () => { setEditing(null); setFirstname(''); setLastname(''); setClassIds([]); setOpen(true); };
  const openEdit = (m: any) => { setEditing(m); setFirstname(m.firstname); setLastname(m.lastname); setClassIds(m.classIds || []); setOpen(true); };

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, firstname, lastname, classIds };
      return editing ? updateEntity('manager', editing.id, payload) : createEntity('manager', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['managers'] }); toast.success(editing ? 'Updated' : 'Created'); setOpen(false); },
  });

  const del = useMutation({ mutationFn: (id: string) => deleteEntity('manager', id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['managers'] }); toast.success('Deleted'); } });

  const columns: Column[] = [
    { key: 'firstname', label: 'First Name', sortable: true },
    { key: 'lastname', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Department' },
    { key: 'position', label: 'Position' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Managers</h1><p className="text-muted-foreground">Manage school managers</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Manager</Button>
      </div>
      <DataTable columns={columns} data={managers} searchPlaceholder="Search managers..."
        actions={row => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => nav(`/managers/${row.id}`)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete manager?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Manager' : 'New Manager'}</DialogTitle></DialogHeader>
          {template && (
            <DynamicForm fields={template.fields} initialData={editing} onSubmit={d => mutation.mutate(d)} onCancel={() => setOpen(false)} isLoading={mutation.isPending}
              extraFieldsBefore={
                <div className="space-y-4 pb-4 border-b mb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>First Name *</Label><Input value={firstname} onChange={e => setFirstname(e.target.value)} required /></div>
                    <div><Label>Last Name *</Label><Input value={lastname} onChange={e => setLastname(e.target.value)} required /></div>
                  </div>
                  <div><Label>Classes</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-auto">
                      {classes.map((c: any) => (<label key={c.id} className="flex items-center gap-2"><Checkbox checked={classIds.includes(c.id)} onCheckedChange={ch => setClassIds(p => ch ? [...p, c.id] : p.filter(x => x !== c.id))} /><span className="text-sm">{c.name}</span></label>))}
                    </div>
                  </div>
                </div>
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
