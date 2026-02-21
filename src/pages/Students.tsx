import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntities, deleteEntity, getTemplate, getLevels, getClasses } from '@/services/api';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Students() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: students = [], isLoading } = useQuery({ queryKey: ['students'], queryFn: () => getEntities('student') });
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: getLevels });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });

  const del = useMutation({
    mutationFn: (id: string) => deleteEntity('student', id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted'); },
  });

  const levelName = (id?: string) => levels.find((l: any) => l.id === id)?.name ?? '—';
  const className = (id?: string) => classes.find((c: any) => c.id === id)?.name ?? '—';

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
        <Button onClick={() => nav('/students/new')}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
      </div>
      {isLoading ? <p>Loading...</p> : (
        <DataTable columns={columns} data={students} searchPlaceholder="Search students..."
          onRowClick={r => nav(`/students/${r.id}`)}
          actions={row => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => nav(`/students/${row.id}`)}><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => nav(`/students/${row.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
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
    </div>
  );
}
