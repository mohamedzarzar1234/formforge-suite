import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { parentApi, studentApi, templateApi } from '@/services/api';
import { DynamicView } from '@/components/DynamicView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading } = useQuery({ queryKey: ['parents', id], queryFn: () => parentApi.getById(id!) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: studentsRes } = useQuery({ queryKey: ['students'], queryFn: () => studentApi.getAll({ page: 1, limit: 1000 }) });

  const parent = res?.data;
  const fields = tplRes?.data?.parent?.fields || [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!parent) return <div className="text-center py-12 text-muted-foreground">Parent not found</div>;

  const children = studentsRes?.data?.filter(s => parent.studentIds.includes(s.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/parents')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{parent.firstname} {parent.lastname}</h1>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Children</CardTitle></CardHeader>
              <CardContent>
                {children.length === 0 ? <p className="text-muted-foreground">No children linked</p> : (
                  <div className="space-y-2">{children.map(c => <p key={c.id} className="font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/students/${c.id}`)}>{c.firstname} {c.lastname}</p>)}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
              <CardContent><DynamicView fields={fields} data={parent.dynamicFields || {}} /></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
