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

export default function ParentDetail() {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents', id] }); setEditOpen(false); toast.success('Parent updated'); },
  });
  const deleteMut = useMutation({
    mutationFn: () => parentApi.delete(id!),
    onSuccess: () => { toast.success('Parent deleted'); navigate('/parents'); },
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!parent) return <div className="text-center py-12 text-muted-foreground">Parent not found</div>;

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
        <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="students">Related Students ({children.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
            <CardContent><DynamicView fields={fields} data={parent.dynamicFields || {}} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader><CardTitle className="text-lg">Children</CardTitle></CardHeader>
            <CardContent>
              {children.length === 0 ? <p className="text-muted-foreground">No children linked</p> : (
                <div className="space-y-3">
                  {children.map(c => {
                    const relation = c.parentRelations?.[parent.id];
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/students/${c.id}`)}>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{c.firstname} {c.lastname}</p>
                            <p className="text-sm text-muted-foreground">ID: {c.id}</p>
                          </div>
                          {relation && <Badge variant="outline">{relation}</Badge>}
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Parent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>First Name</Label><Input value={editForm.firstname || ''} onChange={e => setEditForm((f: any) => ({ ...f, firstname: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={editForm.lastname || ''} onChange={e => setEditForm((f: any) => ({ ...f, lastname: e.target.value }))} /></div>
            </div>
            {fields.length > 0 && (
              <DynamicFormFields fields={fields} values={editForm.dynamicFields || {}} onChange={(vals) => setEditForm((f: any) => ({ ...f, dynamicFields: vals }))} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate(editForm)} disabled={updateMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete parent?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {parent.firstname} {parent.lastname}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMut.mutate()}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
