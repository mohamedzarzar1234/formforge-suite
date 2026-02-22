import { useQuery } from '@tanstack/react-query';
import { getEntityById, getTemplate, getClasses } from '@/services/api';
import { DynamicView } from '@/components/dynamic-view/DynamicView';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function ManagerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: manager } = useQuery({ queryKey: ['manager', id], queryFn: () => getEntityById('manager', id!) });
  const { data: template } = useQuery({ queryKey: ['template', 'manager'], queryFn: () => getTemplate('manager') });
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses });

  if (!manager || !template) return <p>Loading...</p>;

  const managerClasses = classes.filter((c: any) => manager.classIds?.includes(c.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav('/managers')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{manager.firstname} {manager.lastname}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Base Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">First Name</p><p className="text-sm">{manager.firstname}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</p><p className="text-sm">{manager.lastname}</p></div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Classes</p>
              <div className="flex gap-1 flex-wrap">{managerClasses.length > 0 ? managerClasses.map((c: any) => <Badge key={c.id} variant="secondary">{c.name}</Badge>) : <span className="text-sm text-muted-foreground italic">—</span>}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
        <CardContent><DynamicView fields={template.fields} data={manager} /></CardContent>
      </Card>
    </div>
  );
}
