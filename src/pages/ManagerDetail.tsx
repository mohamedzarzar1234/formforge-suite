import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { managerApi, classApi, templateApi } from '@/services/api';
import { DynamicView } from '@/components/DynamicView';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { EntityAttendanceTab } from '@/components/EntityAttendanceTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserX, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManagerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading } = useQuery({ queryKey: ['managers', id], queryFn: () => managerApi.getById(id!) });
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const { data: classesRes } = useQuery({ queryKey: ['classes'], queryFn: () => classApi.getAll({ page: 1, limit: 1000 }) });

  const manager = res?.data;
  const fields = tplRes?.data?.manager?.fields || [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!manager) return <div className="text-center py-12 text-muted-foreground">Manager not found</div>;

  const fullName = `${manager.firstname} ${manager.lastname}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/managers')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold flex-1">{fullName}</h1>
        <QRCodeDisplay entityType="managers" entityId={manager.id} entityName={fullName} />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="absences" className="gap-2"><UserX className="h-4 w-4" />Absences</TabsTrigger>
          <TabsTrigger value="lates" className="gap-2"><Clock className="h-4 w-4" />Lates</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Assigned Classes</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {manager.classIds.map(cid => <Badge key={cid} variant="outline">{classesRes?.data?.find(c => c.id === cid)?.name || cid}</Badge>)}
                {manager.classIds.length === 0 && <p className="text-muted-foreground">None assigned</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
              <CardContent><DynamicView fields={fields} data={manager.dynamicFields || {}} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <EntityAttendanceTab entityType="manager" entityId={manager.id} entityName={fullName} recordType="absences" />
        </TabsContent>
        <TabsContent value="lates">
          <EntityAttendanceTab entityType="manager" entityId={manager.id} entityName={fullName} recordType="lates" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
