import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntities, deleteEntity, getTemplate, getLevels, getClasses, createEntity, updateEntity } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Students() {
  const qc = useQueryClient();
  const { data: students = [], isLoading } = useQuery({ queryKey: ['students'], queryFn: () => getEntities('student') });
  const { data: template } = useQuery({ queryKey: ['template', 'student'], queryFn: () => getTemplate('student') });
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });
  const { data: parents = [] } = useQuery({ queryKey: ['parents'], queryFn: () => getEntities('parent') });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);

  // Form state
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [defaultParentId, setDefaultParentId] = useState('');

  const openNew = () => { setEditing(null); setFirstname(''); setLastname(''); setLevelId(''); setClassId(''); setParentIds([]); setDefaultParentId(''); setFormOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setFirstname(s.firstname); setLastname(s.lastname); setLevelId(s.levelId || ''); setClassId(s.classId || ''); setParentIds(s.parentIds || []); setDefaultParentId(s.defaultParentId || ''); setFormOpen(true); };

  const filteredClasses = classes.filter((c: any) => !levelId || c.levelId === levelId);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, firstname, lastname, levelId, classId, parentIds, defaultParentId: defaultParentId || parentIds[0] || '' };
      return editing ? updateEntity('student', editing.id, payload) : createEntity('student', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success(editing ? 'Student updated' : 'Student created'); setFormOpen(false); },
    onError: () => toast.error('Failed to save student'),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteEntity('student', id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted'); },
  });

  const levelName = (id?: string) => levels.find((l: any) => l.id === id)?.name ?? '—';
  const className = (id?: string) => classes.find((c: any) => c.id === id)?.name ?? '—';
  const studentParents = (s: any) => parents.filter((p: any) => s.parentIds?.includes(p.id));

  const columns: Column[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'firstname', label: 'First Name', sortable: true },
    { key: 'lastname', label: 'Last Name', sortable: true },
    { key: 'levelId', label: 'Level', sortable: true, render: (v) => levelName(v) },
    { key: 'classId', label: 'Class', sortable: true, render: (v) => className(v) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Students</h1><p className="text-muted-foreground">Manage student records</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
      </div>
      {isLoading ? <p>Loading...</p> : (
        <DataTable columns={columns} data={students} searchPlaceholder="Search students..."
          actions={row => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setViewing(row)}><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete student?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(row.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        />
      )}

      {/* Detail View Dialog */}
      <Dialog open={!!viewing} onOpenChange={o => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{viewing?.firstname} {viewing?.lastname}</DialogTitle></DialogHeader>
          {viewing && template && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">ID</p><p className="text-sm">{viewing.id}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">First Name</p><p className="text-sm">{viewing.firstname}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</p><p className="text-sm">{viewing.lastname}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Level</p><p className="text-sm">{levelName(viewing.levelId)}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Class</p><p className="text-sm">{className(viewing.classId)}</p></div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Parents</p>
                  <div className="flex gap-1 flex-wrap">{studentParents(viewing).length > 0 ? studentParents(viewing).map((p: any) => <Badge key={p.id} variant="secondary">{p.firstname} {p.lastname}{viewing.defaultParentId === p.id ? ' (default)' : ''}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
                </div>
              </div>
              <DynamicView fields={template.fields} data={viewing} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button onClick={() => { const s = viewing; setViewing(null); openEdit(s); }}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Student' : 'New Student'}</DialogTitle></DialogHeader>
          {template && (
            <DynamicForm
              fields={template.fields}
              initialData={editing}
              onSubmit={d => mutation.mutate(d)}
              onCancel={() => setFormOpen(false)}
              isLoading={mutation.isPending}
              extraFieldsBefore={
                <div className="space-y-4 pb-4 border-b mb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>First Name <span className="text-destructive">*</span></Label>
                      <Input value={firstname} onChange={e => setFirstname(e.target.value)} required placeholder="First name" />
                    </div>
                    <div>
                      <Label>Last Name <span className="text-destructive">*</span></Label>
                      <Input value={lastname} onChange={e => setLastname(e.target.value)} required placeholder="Last name" />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Select value={levelId} onValueChange={v => { setLevelId(v); setClassId(''); }}>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>{levels.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Class</Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{filteredClasses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Parents</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-auto">
                      {parents.map((p: any) => (
                        <label key={p.id} className="flex items-center gap-2">
                          <Checkbox checked={parentIds.includes(p.id)} onCheckedChange={checked => {
                            setParentIds(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                          }} />
                          <span className="text-sm">{p.firstname} {p.lastname}</span>
                        </label>
                      ))}
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
