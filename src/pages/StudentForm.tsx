import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplate, getEntities, getEntityById, createEntity, updateEntity, getLevels, getClasses } from '@/services/api';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = !!id && id !== 'new';
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: template } = useQuery({ queryKey: ['template', 'student'], queryFn: () => getTemplate('student') });
  const { data: student } = useQuery({ queryKey: ['student', id], queryFn: () => getEntityById('student', id!), enabled: isEdit });
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });
  const { data: parents = [] } = useQuery({ queryKey: ['parents'], queryFn: () => getEntities('parent') });

  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [defaultParentId, setDefaultParentId] = useState('');

  // Sync initial data
  useMemo(() => {
    if (student) {
      setLevelId(student.levelId || '');
      setClassId(student.classId || '');
      setParentIds(student.parentIds || []);
      setDefaultParentId(student.defaultParentId || '');
    }
  }, [student]);

  const filteredClasses = classes.filter((c: any) => !levelId || c.levelId === levelId);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, levelId, classId, parentIds, defaultParentId: defaultParentId || parentIds[0] || '' };
      return isEdit ? updateEntity('student', id!, payload) : createEntity('student', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success(isEdit ? 'Student updated' : 'Student created');
      nav('/students');
    },
    onError: () => toast.error('Failed to save student'),
  });

  if (!template) return <p>Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav('/students')}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold">{isEdit ? 'Edit Student' : 'New Student'}</h1></div>
      </div>
      <Card>
        <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
        <CardContent>
          <DynamicForm
            fields={template.fields}
            initialData={student}
            onSubmit={d => mutation.mutate(d)}
            onCancel={() => nav('/students')}
            isLoading={mutation.isPending}
            extraFieldsBefore={
              <div className="space-y-4 pb-4 border-b mb-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>First Name <span className="text-destructive">*</span></Label>
                    <Input defaultValue={student?.firstname || ''} name="firstname"
                      onChange={e => { if (student) student.firstname = e.target.value; }}
                      required placeholder="First name" />
                  </div>
                  <div>
                    <Label>Last Name <span className="text-destructive">*</span></Label>
                    <Input defaultValue={student?.lastname || ''} name="lastname"
                      onChange={e => { if (student) student.lastname = e.target.value; }}
                      required placeholder="Last name" />
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
        </CardContent>
      </Card>
    </div>
  );
}
