import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { templateApi } from '@/services/api';
import { settingsApi, type PredefinedSettings } from '@/services/settings-api';
import { markRecordApi } from '@/services/mark-record-api';
import { defaultTemplates } from '@/services/mock-data';
import type { EntityType, FieldDefinition, FieldType, EntityTemplateConfig } from '@/types';
import type { MarkRecordSettings, MarkRecordType, OfficialTemplate, OfficialTemplateColumn } from '@/types/mark-record';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const BASE_FIELDS = ['firstname', 'lastname'];
const FIELD_TYPES: FieldType[] = ['text', 'date', 'select', 'multi-select', 'file', 'number', 'email', 'phone', 'textarea'];

function SortableFieldCard({ field, onEdit, onDelete }: { field: FieldDefinition; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.name });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Card ref={setNodeRef} style={style} className="shadow-none">
      <CardContent className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{field.label}</span>
            <Badge variant="secondary" className="text-xs">{field.type}</Badge>
            {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            {!field.visible && <Badge variant="outline" className="text-xs">Hidden</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{field.name}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [settingsTab, setSettingsTab] = useState('templates');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure templates and predefined lists.</p>
      </div>

      <Tabs value={settingsTab} onValueChange={setSettingsTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="predefined">Predefined Lists</TabsTrigger>
          <TabsTrigger value="mark-records">Mark Records</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="predefined">
          <PredefinedListsTab />
        </TabsContent>

        <TabsContent value="mark-records">
          <MarkRecordSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesTab() {
  const qc = useQueryClient();
  const [activeEntity, setActiveEntity] = useState<EntityType>('student');
  const [localFields, setLocalFields] = useState<FieldDefinition[]>([]);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [deleteFieldName, setDeleteFieldName] = useState<string | null>(null);

  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const saveMut = useMutation({
    mutationFn: (config: EntityTemplateConfig) => templateApi.update(activeEntity, config),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template saved'); },
  });

  useEffect(() => {
    if (tplRes?.data) setLocalFields([...tplRes.data[activeEntity].fields]);
  }, [tplRes, activeEntity]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedFields.findIndex(f => f.name === active.id);
    const newIdx = sortedFields.findIndex(f => f.name === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const newFields = [...sortedFields];
    const [moved] = newFields.splice(oldIdx, 1);
    newFields.splice(newIdx, 0, moved);
    newFields.forEach((f, i) => f.order = i + 1);
    setLocalFields(newFields);
  };

  const handleSave = () => {
    const config = tplRes?.data?.[activeEntity];
    if (!config) return;
    saveMut.mutate({ ...config, fields: localFields });
  };

  const addField = (field: FieldDefinition) => {
    setLocalFields(prev => [...prev, { ...field, order: prev.length + 1 }]);
    setFieldDialogOpen(false);
  };

  const updateField = (name: string, updated: FieldDefinition) => {
    setLocalFields(prev => prev.map(f => f.name === name ? updated : f));
    setFieldDialogOpen(false);
  };

  const removeField = (name: string) => {
    setLocalFields(prev => prev.filter(f => f.name !== name));
    setDeleteFieldName(null);
  };

  const sortedFields = [...localFields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Configure dynamic fields for each entity type. Drag to reorder.</p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { if (tplRes?.data) { const def = JSON.parse(JSON.stringify((defaultTemplates as any)[activeEntity].fields)); setLocalFields(def); toast.info('Reset to defaults — click Save to apply'); } }}>Reset to Default</Button>
          <Button onClick={handleSave} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving...' : 'Save Template'}</Button>
        </div>
      </div>

      <Tabs value={activeEntity} onValueChange={v => setActiveEntity(v as EntityType)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
        </TabsList>

        {(['student', 'teacher', 'manager', 'parent'] as EntityType[]).map(entity => (
          <TabsContent key={entity} value={entity} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-30" />
                <span className="font-medium text-sm">firstname</span>
                <Badge variant="secondary" className="text-xs">text</Badge>
                <Badge variant="default" className="text-xs">Base Field</Badge>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-30" />
                <span className="font-medium text-sm">lastname</span>
                <Badge variant="secondary" className="text-xs">text</Badge>
                <Badge variant="default" className="text-xs">Base Field</Badge>
              </div>
              <Separator />
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedFields.map(f => f.name)} strategy={verticalListSortingStrategy}>
                  {sortedFields.map(field => (
                    <SortableFieldCard
                      key={field.name}
                      field={field}
                      onEdit={() => { setEditingField(field); setFieldDialogOpen(true); }}
                      onDelete={() => setDeleteFieldName(field.name)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <Button variant="outline" onClick={() => { setEditingField(null); setFieldDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Field</Button>
          </TabsContent>
        ))}
      </Tabs>

      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        existingNames={localFields.map(f => f.name)}
        onSave={(field) => editingField ? updateField(editingField.name, field) : addField(field)}
      />

      <AlertDialog open={!!deleteFieldName} onOpenChange={o => !o && setDeleteFieldName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove field?</AlertDialogTitle><AlertDialogDescription>This will remove the "{deleteFieldName}" field from the template.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => removeField(deleteFieldName!)}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PredefinedListsTab() {
  const qc = useQueryClient();
  const { data: settingsRes } = useQuery({ queryKey: ['predefined-settings'], queryFn: () => settingsApi.getPredefined() });
  const [sessions, setSessions] = useState<string[]>([]);
  const [newSession, setNewSession] = useState('');

  useEffect(() => {
    if (settingsRes?.data) setSessions([...settingsRes.data.sessions]);
  }, [settingsRes]);

  const saveMut = useMutation({
    mutationFn: (data: PredefinedSettings) => settingsApi.updatePredefined(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['predefined-settings'] }); toast.success('Predefined lists saved'); },
  });

  const addSession = () => {
    if (!newSession.trim()) return;
    if (sessions.includes(newSession.trim())) { toast.error('Session already exists'); return; }
    setSessions(prev => [...prev, newSession.trim()]);
    setNewSession('');
  };

  const removeSession = (idx: number) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    saveMut.mutate({ sessions });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Configure predefined lists used across the application.</p>
        <Button onClick={handleSave} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving...' : 'Save Settings'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Numbers</CardTitle>
          <p className="text-sm text-muted-foreground">Define the session options available for teacher attendance tracking.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {sessions.map((session, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={session}
                  onChange={e => setSessions(prev => prev.map((s, i) => i === idx ? e.target.value : s))}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeSession(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSession}
              onChange={e => setNewSession(e.target.value)}
              placeholder="e.g. Session 9 - 17:00"
              onKeyDown={e => e.key === 'Enter' && addSession()}
            />
            <Button variant="outline" onClick={addSession}><Plus className="mr-2 h-4 w-4" />Add</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldEditorDialog({ open, onOpenChange, field, existingNames, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; field: FieldDefinition | null; existingNames: string[]; onSave: (f: FieldDefinition) => void }) {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [visible, setVisible] = useState(true);
  const [editable, setEditable] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (field) {
        setName(field.name); setLabel(field.label); setType(field.type); setRequired(field.required);
        setVisible(field.visible); setEditable(field.editable); setPlaceholder(field.placeholder || '');
        setOptions(field.options || []);
      } else {
        setName(''); setLabel(''); setType('text'); setRequired(false); setVisible(true);
        setEditable(true); setPlaceholder(''); setOptions([]);
      }
      setError('');
    }
  }, [open, field]);

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!label.trim()) { setError('Label is required'); return; }
    if (/\s/.test(name)) { setError('Name cannot contain spaces'); return; }
    if (BASE_FIELDS.includes(name)) { setError('Cannot use base field name'); return; }
    if (!field && existingNames.includes(name)) { setError('Name already exists'); return; }
    if ((type === 'select' || type === 'multi-select') && options.length === 0) { setError('Add at least one option'); return; }

    onSave({
      name: name.trim(), label: label.trim(), type, required, visible, editable,
      placeholder: placeholder.trim(), order: field?.order || 999,
      options: (type === 'select' || type === 'multi-select') ? options : undefined,
    });
  };

  const addOption = () => setOptions(prev => [...prev, { value: '', label: '' }]);
  const updateOption = (idx: number, key: 'value' | 'label', val: string) => {
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, [key]: val } : o));
  };
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="field_name" disabled={!!field} />
            </div>
            <div className="space-y-2">
              <Label>Display Label *</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Field Label" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={type} onValueChange={v => setType(v as FieldType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Required</Label><Switch checked={required} onCheckedChange={setRequired} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Visible</Label><Switch checked={visible} onCheckedChange={setVisible} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Editable</Label><Switch checked={editable} onCheckedChange={setEditable} />
          </div>
          {(type === 'select' || type === 'multi-select') && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Value" value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)} className="flex-1" />
                    <Input placeholder="Label" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeOption(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOption}><Plus className="mr-1 h-3 w-3" />Add Option</Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>{field ? 'Update' : 'Add'} Field</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MarkRecordSettingsTab() {
  const qc = useQueryClient();
  const { data: settingsRes } = useQuery({ queryKey: ['mark-record-settings'], queryFn: () => markRecordApi.getSettings() });
  const { data: levelsRes } = useQuery({ queryKey: ['levels'], queryFn: () => import('@/services/api').then(m => m.levelApi.getAll({ page: 1, limit: 1000 })) });
  const [types, setTypes] = useState<MarkRecordType[]>([]);
  const [templates, setTemplates] = useState<OfficialTemplate[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OfficialTemplate | null>(null);

  useEffect(() => {
    if (settingsRes?.data) {
      setTypes([...settingsRes.data.types]);
      setTemplates(JSON.parse(JSON.stringify(settingsRes.data.officialTemplates)));
    }
  }, [settingsRes]);

  const saveMut = useMutation({
    mutationFn: (data: MarkRecordSettings) => markRecordApi.updateSettings(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mark-record-settings'] }); toast.success('Mark record settings saved'); },
  });

  const addType = () => {
    if (!newTypeName.trim()) return;
    if (types.some(t => t.name === newTypeName.trim())) { toast.error('Type already exists'); return; }
    setTypes(prev => [...prev, { id: `mrt-${Date.now()}`, name: newTypeName.trim() }]);
    setNewTypeName('');
  };

  const removeType = (id: string) => setTypes(prev => prev.filter(t => t.id !== id));

  const handleSave = () => saveMut.mutate({ types, officialTemplates: templates });

  const openTemplateEditor = (tpl?: OfficialTemplate) => {
    setEditingTemplate(tpl || { id: `otpl-${Date.now()}`, name: '', levelId: '', columns: [] });
    setEditTemplateOpen(true);
  };

  const saveTemplate = (tpl: OfficialTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === tpl.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = tpl; return next; }
      return [...prev, tpl];
    });
    setEditTemplateOpen(false);
  };

  const removeTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Configure non-official mark types and official templates.</p>
        <Button onClick={handleSave} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving...' : 'Save Settings'}</Button>
      </div>

      {/* Non-Official Types */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Non-Official Types</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {types.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <Input value={t.name} onChange={e => setTypes(prev => prev.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeType(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g. Quiz" onKeyDown={e => e.key === 'Enter' && addType()} />
            <Button variant="outline" onClick={addType}><Plus className="mr-2 h-4 w-4" />Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Official Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Official Templates</CardTitle>
            <Button variant="outline" size="sm" onClick={() => openTemplateEditor()}><Plus className="mr-2 h-4 w-4" />Add Template</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length === 0 && <p className="text-muted-foreground text-sm">No official templates configured.</p>}
          {templates.map(tpl => (
            <div key={tpl.id} className="flex items-center justify-between p-3 rounded-md border">
              <div>
                <p className="font-medium text-sm">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">{tpl.columns.length} columns · Max: {tpl.columns.reduce((a, c) => a + c.maxScore, 0)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTemplateEditor(tpl)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTemplate(tpl.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <OfficialTemplateEditorDialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen} template={editingTemplate} onSave={saveTemplate} />
    </div>
  );
}

function OfficialTemplateEditorDialog({ open, onOpenChange, template, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; template: OfficialTemplate | null; onSave: (t: OfficialTemplate) => void;
}) {
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<OfficialTemplateColumn[]>([]);

  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setColumns(JSON.parse(JSON.stringify(template.columns)));
    }
  }, [open, template]);

  const addColumn = () => setColumns(prev => [...prev, { id: `col-${Date.now()}`, name: '', maxScore: 10, order: prev.length + 1 }]);

  const updateColumn = (idx: number, updates: Partial<OfficialTemplateColumn>) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };

  const removeColumn = (idx: number) => setColumns(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    if (columns.length === 0) { toast.error('Add at least one column'); return; }
    onSave({ id: template!.id, name: name.trim(), columns: columns.map((c, i) => ({ ...c, order: i + 1 })) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{template?.name ? 'Edit Template' : 'Add Template'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Semester Report" />
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-2">
                  <Input value={col.name} onChange={e => updateColumn(idx, { name: e.target.value })} placeholder="Column name" className="flex-1" />
                  <Input type="number" value={col.maxScore} onChange={e => updateColumn(idx, { maxScore: Number(e.target.value) })} className="w-20" min={1} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeColumn(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addColumn}><Plus className="mr-2 h-4 w-4" />Add Column</Button>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
