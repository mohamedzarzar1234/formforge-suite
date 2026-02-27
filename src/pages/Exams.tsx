import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examApi, lessonApi, questionApi } from '@/services/exam-api';
import { levelApi, subjectApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Play, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { ExamConfig, Question } from '@/types/exam';

export default function Exams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [examName, setExamName] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [maxScore, setMaxScore] = useState(100);
  const [mode, setMode] = useState<'manual' | 'auto'>('auto');
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(3);
  const [hardCount, setHardCount] = useState(2);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Queries
  const { data: levelsRes } = useQuery({ queryKey: ['levels-all'], queryFn: () => levelApi.getAll({ page: 1, limit: 100 }) });
  const { data: subjectsRes } = useQuery({ queryKey: ['subjects-all'], queryFn: () => subjectApi.getAll({ page: 1, limit: 100 }) });
  const { data: allLessonsRes } = useQuery({ queryKey: ['lessons-flat'], queryFn: () => lessonApi.getAllFlat() });

  const levels = levelsRes?.data ?? [];
  const allSubjects = subjectsRes?.data ?? [];
  const allLessonsFlat = allLessonsRes?.data ?? [];

  // Filter subjects that have lessons in the selected level
  const filteredSubjects = useMemo(() => {
    if (!selectedLevelId) return [];
    const subjectIds = new Set(allLessonsFlat.filter(l => l.levelId === selectedLevelId).map(l => l.subjectId));
    return allSubjects.filter(s => subjectIds.has(s.id));
  }, [allSubjects, allLessonsFlat, selectedLevelId]);

  // Filter lessons by selected level + subject
  const filteredLessons = useMemo(() => {
    if (!selectedLevelId || !selectedSubjectId) return [];
    return allLessonsFlat.filter(l => l.levelId === selectedLevelId && l.subjectId === selectedSubjectId);
  }, [allLessonsFlat, selectedLevelId, selectedSubjectId]);

  const { data: examsRes, isLoading } = useQuery({
    queryKey: ['exams', page, search],
    queryFn: () => examApi.getAll({ page, limit: 10, search }),
  });

  // Questions for selected lessons
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
    setExamName(''); setSelectedLevelId(''); setSelectedSubjectId('');
    setSelectedLessons([]); setSelectedQuestions([]);
    setMaxScore(100); setEasyCount(3); setMediumCount(3); setHardCount(2);
    setMode('auto'); setDialogOpen(true);
  };

  const handleLevelChange = (levelId: string) => {
    setSelectedLevelId(levelId);
    setSelectedSubjectId('');
    setSelectedLessons([]);
    setSelectedQuestions([]);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedLessons([]);
    setSelectedQuestions([]);
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
    if (!selectedLevelId) { toast({ title: 'Select a level', variant: 'destructive' }); return; }
    if (!selectedSubjectId) { toast({ title: 'Select a subject', variant: 'destructive' }); return; }
    if (!selectedLessons.length) { toast({ title: 'Select at least one lesson', variant: 'destructive' }); return; }
    if (mode === 'manual' && !selectedQuestions.length) { toast({ title: 'Select at least one question', variant: 'destructive' }); return; }

    const config: ExamConfig = {
      name: examName,
      levelId: selectedLevelId,
      subjectId: selectedSubjectId,
      lessonIds: selectedLessons,
      maxScore,
      mode,
      ...(mode === 'auto' ? { easyCount, mediumCount, hardCount } : { questionIds: selectedQuestions }),
    };
    generateMut.mutate(config);
  };

  const getLessonName = (id: string) => allLessonsFlat.find(l => l.id === id)?.name ?? id;
  const getLevelName = (id: string) => levels.find(l => l.id === id)?.name ?? id;
  const getSubjectName = (id: string) => allSubjects.find(s => s.id === id)?.name ?? id;

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
                <TableHead>Level / Subject</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Max Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !examsRes?.data?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No exams yet. Generate one!</TableCell></TableRow>
              ) : examsRes.data.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium text-foreground">{exam.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">{getLevelName(exam.levelId)}</Badge>
                      <Badge variant="secondary" className="text-xs">{getSubjectName(exam.subjectId)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{exam.questionIds.length}</TableCell>
                  <TableCell>{exam.maxScore}</TableCell>
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
            <div>
              <Label>Exam Name *</Label>
              <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Math Quiz - Chapter 1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Level *</Label>
                <Select value={selectedLevelId} onValueChange={handleLevelChange}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject *</Label>
                <Select value={selectedSubjectId} onValueChange={handleSubjectChange} disabled={!selectedLevelId}>
                  <SelectTrigger><SelectValue placeholder={selectedLevelId ? "Select subject" : "Select level first"} /></SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Select Lessons *</Label>
              <div className="border rounded-md p-3 mt-1 max-h-40 overflow-y-auto space-y-2">
                {!selectedSubjectId ? (
                  <p className="text-sm text-muted-foreground">Select level and subject first</p>
                ) : filteredLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons available for this selection</p>
                ) : filteredLessons.map(l => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedLessons.includes(l.id)} onCheckedChange={() => toggleLesson(l.id)} id={`lesson-${l.id}`} />
                    <Label htmlFor={`lesson-${l.id}`} className="cursor-pointer text-sm">{l.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Max Score</Label>
              <Input type="number" min={1} value={maxScore} onChange={e => setMaxScore(parseInt(e.target.value) || 100)} />
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
