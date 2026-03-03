import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { markRecordApi } from '@/services/mark-record-api';
import { subjectApi } from '@/services/api';
import type { NonOfficialMarkRecord, OfficialMarkRecord, MarkRecord } from '@/types/mark-record';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Props {
  studentId: string;
  studentName: string;
}

export function StudentMarkRecordsTab({ studentId }: Props) {
  const [filterOfficial, setFilterOfficial] = useState<string>('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  const isOfficialFilter = filterOfficial === 'all' ? null : filterOfficial === 'official';

  const { data: recordsRes, isLoading } = useQuery({
    queryKey: ['mark-records', 'student', studentId, filterOfficial, filterType, filterSubject],
    queryFn: () => markRecordApi.getAll({ page: 1, limit: 1000, studentId, isOfficial: isOfficialFilter === null ? undefined : isOfficialFilter, typeId: filterType === 'all' ? undefined : filterType, subjectId: filterSubject === 'all' ? undefined : filterSubject }),
  });
  const { data: settingsRes } = useQuery({ queryKey: ['mark-record-settings'], queryFn: () => markRecordApi.getSettings() });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectApi.getAll({ page: 1, limit: 1000 }) });

  const records = recordsRes?.data || [];
  const types = settingsRes?.data?.types || [];
  const templates = settingsRes?.data?.officialTemplates || [];
  const subjects = subjectsRes?.data || [];

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
  const getTypeName = (id: string) => types.find(t => t.id === id)?.name || id;
  const getTemplateName = (id: string) => templates.find(t => t.id === id)?.name || id;

  const getScoreDisplay = (record: MarkRecord) => {
    if (!record.isOfficial) return String((record as NonOfficialMarkRecord).score);
    const official = record as OfficialMarkRecord;
    const tpl = templates.find(t => t.id === official.templateId);
    if (!tpl) return '—';
    const total = Object.values(official.scores).reduce((a, b) => a + b, 0);
    const max = tpl.columns.reduce((a, c) => a + c.maxScore, 0);
    return `${total}/${max}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={filterOfficial} onValueChange={setFilterOfficial}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="official">Official</SelectItem>
              <SelectItem value="non-official">Non-Official</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filterOfficial !== 'official' && (
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Subject</Label>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type / Template</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No mark records found</TableCell></TableRow>
            ) : records.map(record => (
              <TableRow key={record.id}>
                <TableCell>{getSubjectName(record.subjectId)}</TableCell>
                <TableCell>
                  <Badge variant={record.isOfficial ? 'default' : 'secondary'}>
                    {record.isOfficial ? 'Official' : 'Non-Official'}
                  </Badge>
                </TableCell>
                <TableCell>{record.isOfficial ? getTemplateName((record as OfficialMarkRecord).templateId) : getTypeName((record as NonOfficialMarkRecord).typeId)}</TableCell>
                <TableCell className="font-mono">{getScoreDisplay(record)}</TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell className="max-w-32 truncate">{record.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
