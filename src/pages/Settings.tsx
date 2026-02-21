import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplate, updateTemplate } from '@/services/api';
import { EntityType, FieldDefinition } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const FIELD_TYPES = ['text', 'date', 'select', 'multi-select', 'file', 'number', 'email', 'phone', 'textarea'] as const;
const entities: EntityType[] = ['student', 'teacher', 'parent', 'manager'];

const emptyField = (): FieldDefinition => ({
  name: '', label: '', type: 'text', required: false, options: [], placeholder: '', defaultValue: '',
  order: 0, visible: true, editable: true,
});

export default function Settings() {
  const [tab, setTab] = useState<EntityType>('student');
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Configure entity field templates</p></div>
      <Tabs value={tab} onValueChange={v => setTab(v as EntityType)}>
        <TabsList>{entities.map(e => <TabsTrigger key={e} value={e} className="capitalize">{e}</TabsTrigger>)}</TabsList>
        {entities.map(e => <TabsContent key={e} value={e}><TemplateEditor entityType={e} /></TabsContent>)}
      </Tabs>
    </div>
  );
}

function TemplateEditor({ entityType }: { entityType: EntityType }) {
  const qc = useQueryClient();
  const { data: template } = useQuery({ queryKey: ['template', entityType], queryFn: () => getTemplate(entityType) });
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<FieldDefinition>(emptyField());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { if (template) { setFields([...template.fields]); setHasChanges(false); } }, [template]);

  const save = useMutation({
    mutationFn: () => updateTemplate(entityType, fields),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['template', entityType] }); toast.success('Template saved'); setHasChanges(false); },
  });

  const openAdd = () => { setEditingIdx(null); setDraft({ ...emptyField(), order: fields.length + 1 }); setDialogOpen(true); };
  const openEdit = (i: number) => { setEditingIdx(i); setDraft({ ...fields[i] }); setDialogOpen(true); };

  const saveField = () => {
    if (!draft.name || !draft.label) { toast.error('Name and label required'); return; }
    const newFields = [...fields];
    if (editingIdx !== null) { newFields[editingIdx] = draft; }
    else {
      if (fields.some(f => f.name === draft.name)) { toast.error('Field name must be unique'); return; }
      newFields.push(draft);
    }
    setFields(newFields);
    setHasChanges(true);
    setDialogOpen(false);
  };

  const removeField = (i: number) => { setFields(f => f.filter((_, idx) => idx !== i)); setHasChanges(true); };
  const moveUp = (i: number) => { if (i === 0) return; const n = [...fields]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; n.forEach((f, idx) => f.order = idx + 1); setFields(n); setHasChanges(true); };
  const moveDown = (i: number) => { if (i >= fields.length - 1) return; const n = [...fields]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; n.forEach((f, idx) => f.order = idx + 1); setFields(n); setHasChanges(true); };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="capitalize">{entityType} Template</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Field</Button>
          <Button onClick={() => save.mutate()} disabled={!hasChanges || save.isPending}><Save className="h-4 w-4 mr-2" />{save.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? <p className="text-muted-foreground text-center py-8">No fields configured. Add fields to customize the template.</p> : (
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.name + i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30">
                <div className="flex flex-col gap-1"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(i)}><ArrowUp className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(i)}><ArrowDown className="h-3 w-3" /></Button></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{f.label}</span><Badge variant="secondary" className="text-xs">{f.type}</Badge>{f.required && <Badge className="text-xs">Required</Badge>}{!f.visible && <Badge variant="outline" className="text-xs">Hidden</Badge>}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => removeField(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>{editingIdx !== null ? 'Edit Field' : 'Add Field'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Field Name *</Label><Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value.replace(/\s/g, '') }))} placeholder="fieldName" disabled={editingIdx !== null} /></div>
              <div><Label>Display Label *</Label><Input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder="Display Label" /></div>
            </div>
            <div><Label>Field Type</Label>
              <Select value={draft.type} onValueChange={v => setDraft(d => ({ ...d, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Placeholder</Label><Input value={draft.placeholder || ''} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))} /></div>
            <div className="flex items-center justify-between"><Label>Required</Label><Switch checked={draft.required} onCheckedChange={v => setDraft(d => ({ ...d, required: v }))} /></div>
            <div className="flex items-center justify-between"><Label>Visible</Label><Switch checked={draft.visible} onCheckedChange={v => setDraft(d => ({ ...d, visible: v }))} /></div>
            <div className="flex items-center justify-between"><Label>Editable</Label><Switch checked={draft.editable} onCheckedChange={v => setDraft(d => ({ ...d, editable: v }))} /></div>
            {(draft.type === 'select' || draft.type === 'multi-select') && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {(draft.options || []).map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <Input placeholder="Value" value={opt.value} onChange={e => { const opts = [...(draft.options || [])]; opts[oi] = { ...opts[oi], value: e.target.value }; setDraft(d => ({ ...d, options: opts })); }} />
                      <Input placeholder="Label" value={opt.label} onChange={e => { const opts = [...(draft.options || [])]; opts[oi] = { ...opts[oi], label: e.target.value }; setDraft(d => ({ ...d, options: opts })); }} />
                      <Button variant="ghost" size="icon" onClick={() => { setDraft(d => ({ ...d, options: d.options?.filter((_, idx) => idx !== oi) })); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setDraft(d => ({ ...d, options: [...(d.options || []), { value: '', label: '' }] }))}>
                    <Plus className="h-3 w-3 mr-1" />Add Option
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveField}>Save Field</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
