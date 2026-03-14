import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentApi, studentApi, templateApi } from '@/services/api';
import { DynamicView } from '@/components/DynamicView';
import { DynamicFormFields } from '@/components/DynamicFormFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ParentDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: res, isLoading } = useQuery({ queryKey: ['parents', id], queryFn: () => parentApi.getById(id!) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const parent = res?.data;
  const fields = tplRes?.data?.parent?.fields || [];

  const updateMut = useMutation({
    mutationFn: (data: any) => parentApi.update(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents', id] }); setEditOpen(false); toast.success(t('parents.updated')); },
  });
  const deleteMut = useMutation({
    mutationFn: () => parentApi.delete(id!),
    onSuccess: () => { toast.success(t('parents.deleted')); navigate('/parents'); },
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!parent) return <div className="text-center py-12 text-muted-foreground">{t('parents.notFound')}</div>;

  const children = studentsRes?.data?.filter(s => parent.studentIds.includes(s.id)) || [];

  const openEdit = () => {
    setEditForm({ firstname: parent.firstname, lastname: parent.lastname, dynamicFields: { ...(parent.dynamicFields || {}) } });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/parents')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold flex-1">{parent.firstname} {parent.lastname}</h1>
        <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="me-2 h-4 w-4" />{t('common.edit')}</Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="me-2 h-4 w-4" />{t('common.delete')}</Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t('tabs.info')}</TabsTrigger>
          <TabsTrigger value="students">{t('common.relatedStudents')} ({children.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t('common.details')}</CardTitle></CardHeader>
            <CardContent><DynamicView fields={fields} data={parent.dynamicFields || {}} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t('common.children')}</CardTitle></CardHeader>
            <CardContent>
              {children.length === 0 ? <p className="text-muted-foreground">{t('common.noChildrenLinked')}</p> : (
                <div className="space-y-3">
                  {children.map(c => {
                    const relation = c.parentRelations?.[parent.id];
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/students/${c.id}`)}>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{c.firstname} {c.lastname}</p>
                            <p className="text-sm text-muted-foreground">{t('common.id')}: {c.id}</p>
                          </div>
                          {relation && <Badge variant="outline">{relation}</Badge>}
                        </div>
                        <Button variant="ghost" size="sm">{t('common.view')}</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('parents.editParent')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('common.firstName')}</Label><Input value={editForm.firstname || ''} onChange={e => setEditForm((f: any) => ({ ...f, firstname: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('common.lastName')}</Label><Input value={editForm.lastname || ''} onChange={e => setEditForm((f: any) => ({ ...f, lastname: e.target.value }))} /></div>
            </div>
            {fields.length > 0 && (
              <DynamicFormFields fields={fields} values={editForm.dynamicFields || {}} onChange={(vals) => setEditForm((f: any) => ({ ...f, dynamicFields: vals }))} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => updateMut.mutate(editForm)} disabled={updateMut.isPending}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common.deleteConfirmTitle', { entity: t('nav.parents').toLowerCase() })}</AlertDialogTitle><AlertDialogDescription>{t('common.deleteConfirmDesc', { name: `${parent.firstname} ${parent.lastname}` })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteMut.mutate()}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}