import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examApi, lessonApi, questionApi } from '@/services/exam-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Play, FileText, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Exam, ExamConfig, Question } from '@/types/exam';

export default function Exams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('auto');

  // Form state
  const [examName, setExamName] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(3);
  const [hardCount, setHardCount] = useState(2);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const { data: lessonsRes } = useQuery({ queryKey: ['lessons-flat'], queryFn: () => lessonApi.getAllFlat() });
  const allLessons = lessonsRes?.data ?? [];

  const { data: examsRes, isLoading } = useQuery({
    queryKey: ['exams', page, search],
    queryFn: () => examApi.getAll({ page, limit: 10, search }),
  });

  // Fetch questions for selected lessons (for manual mode)
  const { data: poolRes } = useQuery({
    queryKey: ['questions-pool', selectedLessons],
    queryFn: () => questionApi.getByLessonIds(selectedLessons),
    enabled: selectedLessons.length > 0,
  });
  const questionPool = poolRes?.data ?? [];

  const generateMut = useMutation({
    mutationFn: (config: ExamConfig) => examApi.generate(config),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); toast({ title: 'Exam generated!' }); setDialogOpen(false); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => examApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); toast({ title: 'Exam deleted' }); },
  });

  const openGenerate = () => {
    setExamName(''); setSelectedLessons([]); setSelectedQuestions([]);
    setEasyCount(3); setMediumCount(3); setHardCount(2); setMode('auto');
    setDialogOpen(true);
  };

  const toggleLesson = (id: string) => {
    setSelectedLessons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setSelectedQuestions([]);
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerate = () => {
    if (!examName.trim()) { toast({ title: 'Enter exam name', variant: 'destructive' }); return; }
    if (!selectedLessons.length) { toast({ title: 'Select at least one lesson', variant: 'destructive' }); return; }
    if (mode === 'manual' && !selectedQuestions.length) { toast({ title: 'Select at least one question', variant: 'destructive' }); return; }

    const config: ExamConfig = {
      name: examName,
      lessonIds: selectedLessons,
      mode,
      ...(mode === 'auto' ? { easyCount, mediumCount, hardCount } : { questionIds: selectedQuestions }),
    };
    generateMut.mutate(config);
  };

  const getLessonName = (id: string) => allLessons.find(l => l.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground">Generate and manage exams</p>
        </div>
        <Button onClick={openGenerate}><Plus className="h-4 w-4 mr-2" /> Generate Exam</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search exams..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !examsRes?.data?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No exams yet. Generate one!</TableCell></TableRow>
              ) : examsRes.data.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium text-foreground">{exam.name}</TableCell>
                  <TableCell>{exam.questionIds.length}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exam.lessonIds.map(lid => <Badge key={lid} variant="secondary" className="text-xs">{getLessonName(lid)}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={exam.status === 'published' ? 'default' : 'outline'}>{exam.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/exams/${exam.id}/take`)}><Play className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(exam.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Exam Name *</Label><Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Math Quiz - Chapter 1" /></div>

            <div>
              <Label>Select Lessons *</Label>
              <div className="border rounded-md p-3 mt-1 max-h-40 overflow-y-auto space-y-2">
                {allLessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons available</p>}
                {allLessons.map(l => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedLessons.includes(l.id)} onCheckedChange={() => toggleLesson(l.id)} id={`lesson-${l.id}`} />
                    <Label htmlFor={`lesson-${l.id}`} className="cursor-pointer text-sm">{l.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Tabs value={mode} onValueChange={v => setMode(v as 'manual' | 'auto')}>
              <TabsList className="w-full">
                <TabsTrigger value="auto" className="flex-1">Auto Generate</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">Manual Select</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-3 mt-3">
                <p className="text-sm text-muted-foreground">Set how many questions per difficulty level</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-green-600">Easy</Label><Input type="number" min={0} value={easyCount} onChange={e => setEasyCount(parseInt(e.target.value) || 0)} /></div>
                  <div><Label className="text-yellow-600">Medium</Label><Input type="number" min={0} value={mediumCount} onChange={e => setMediumCount(parseInt(e.target.value) || 0)} /></div>
                  <div><Label className="text-red-600">Hard</Label><Input type="number" min={0} value={hardCount} onChange={e => setHardCount(parseInt(e.target.value) || 0)} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Total: {easyCount + mediumCount + hardCount} questions (from {questionPool.length} available)</p>
              </TabsContent>

              <TabsContent value="manual" className="mt-3">
                {selectedLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Select lessons first to see available questions</p>
                ) : questionPool.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions in selected lessons</p>
                ) : (
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                    {questionPool.map(q => (
                      <div key={q.id} className="flex items-center gap-2">
                        <Checkbox checked={selectedQuestions.includes(q.id)} onCheckedChange={() => toggleQuestion(q.id)} id={`q-${q.id}`} />
                        <Label htmlFor={`q-${q.id}`} className="cursor-pointer text-sm flex-1">{q.text}</Label>
                        <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">{selectedQuestions.length} selected</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateMut.isPending}>Generate Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
