import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntities, getTemplate, createEntity, updateEntity, deleteEntity, getSubjects, getClasses } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Teachers() {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: () => getEntities('teacher') });
  const { data: template } = useQuery({ queryKey: ['template', 'teacher'], queryFn: () => getTemplate('teacher') });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');

  const openNew = () => { setEditing(null); setFirstname(''); setLastname(''); setSubjectIds([]); setClassIds([]); setOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setFirstname(t.firstname); setLastname(t.lastname); setSubjectIds(t.subjectIds || []); setClassIds(t.classIds || []); setOpen(true); };

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, firstname, lastname, subjectIds, classIds };
      return editing ? updateEntity('teacher', editing.id, payload) : createEntity('teacher', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); toast.success(editing ? 'Updated' : 'Created'); setOpen(false); },
  });

  const del = useMutation({ mutationFn: (id: string) => deleteEntity('teacher', id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Deleted'); } });

  const columns: Column[] = [
    { key: 'firstname', label: 'First Name', sortable: true },
    { key: 'lastname', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'subjectIds', label: 'Subjects', render: (v: string[]) => v?.map(id => subjects.find((s: any) => s.id === id)?.name).filter(Boolean).join(', ') || '—' },
  ];

  const teacherSubjects = (t: any) => subjects.filter((s: any) => t.subjectIds?.includes(s.id));
  const teacherClasses = (t: any) => classes.filter((c: any) => t.classIds?.includes(c.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Teachers</h1><p className="text-muted-foreground">Manage teacher records</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Teacher</Button>
      </div>
      <DataTable columns={columns} data={teachers} searchPlaceholder="Search teachers..."
        actions={row => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setViewing(row)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete teacher?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      />

      {/* Detail View Dialog */}
      <Dialog open={!!viewing} onOpenChange={o => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{viewing?.firstname} {viewing?.lastname}</DialogTitle></DialogHeader>
          {viewing && template && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">First Name</p><p className="text-sm">{viewing.firstname}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</p><p className="text-sm">{viewing.lastname}</p></div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Subjects</p>
                  <div className="flex gap-1 flex-wrap">{teacherSubjects(viewing).length > 0 ? teacherSubjects(viewing).map((s: any) => <Badge key={s.id} variant="secondary">{s.name}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Classes</p>
                  <div className="flex gap-1 flex-wrap">{teacherClasses(viewing).length > 0 ? teacherClasses(viewing).map((c: any) => <Badge key={c.id} variant="secondary">{c.name}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
                </div>
              </div>
              <DynamicView fields={template.fields} data={viewing} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button onClick={() => { const t = viewing; setViewing(null); openEdit(t); }}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Teacher' : 'New Teacher'}</DialogTitle></DialogHeader>
          {template && (
            <DynamicForm fields={template.fields} initialData={editing} onSubmit={d => mutation.mutate(d)} onCancel={() => setOpen(false)} isLoading={mutation.isPending}
              extraFieldsBefore={
                <div className="space-y-4 pb-4 border-b mb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>First Name *</Label><Input value={firstname} onChange={e => setFirstname(e.target.value)} required /></div>
                    <div><Label>Last Name *</Label><Input value={lastname} onChange={e => setLastname(e.target.value)} required /></div>
                  </div>
                  <div><Label>Subjects</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-auto">
                      {subjects.map((s: any) => (<label key={s.id} className="flex items-center gap-2"><Checkbox checked={subjectIds.includes(s.id)} onCheckedChange={c => setSubjectIds(p => c ? [...p, s.id] : p.filter(x => x !== s.id))} /><span className="text-sm">{s.name}</span></label>))}
                    </div>
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
