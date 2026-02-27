import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { examApi, questionApi, attemptApi } from '@/services/exam-api';
import { studentApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, XCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Question, ExamAttempt } from '@/types/exam';

export default function TakeExam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentId, setStudentId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [showReview, setShowReview] = useState(false);

  const { data: examRes } = useQuery({ queryKey: ['exam', id], queryFn: () => examApi.getById(id!) });
  const exam = examRes?.data;

  const { data: studentsRes } = useQuery({ queryKey: ['students-all'], queryFn: () => studentApi.getAll({ page: 1, limit: 100 }) });
  const students = studentsRes?.data ?? [];

  const { data: questionsRes } = useQuery({
    queryKey: ['exam-questions', exam?.questionIds],
    queryFn: async () => {
      if (!exam) return { data: [], message: '', success: true, statusCode: 200 };
      const allQ = await questionApi.getByLessonIds(exam.lessonIds);
      return { ...allQ, data: allQ.data.filter(q => exam.questionIds.includes(q.id)) };
    },
    enabled: !!exam,
  });
  const examQuestions: Question[] = questionsRes?.data ?? [];

  const submitMut = useMutation({
    mutationFn: () => attemptApi.submit(id!, studentId, answers),
    onSuccess: (res) => {
      setResult(res.data);
      toast({ title: `Score: ${res.data.score}/${res.data.totalQuestions}` });
    },
  });

  const handleSubmit = () => {
    if (!studentId) { toast({ title: 'Select a student', variant: 'destructive' }); return; }
    if (Object.keys(answers).length < examQuestions.length) {
      toast({ title: 'Please answer all questions', variant: 'destructive' }); return;
    }
    submitMut.mutate();
  };

  const answeredCount = Object.keys(answers).length;
  const progress = examQuestions.length > 0 ? (answeredCount / examQuestions.length) * 100 : 0;

  if (!exam) return <div className="text-center py-12 text-muted-foreground">Loading exam...</div>;

  if (result) {
    const percentage = Math.round((result.score / result.totalQuestions) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/exams')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams</Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Exam Results</CardTitle>
            <CardDescription>{exam.name}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-5xl font-bold text-primary">{percentage}%</div>
            <p className="text-lg text-foreground">{result.score} / {result.totalQuestions} correct</p>
            <Progress value={percentage} className="h-3" />
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowReview(!showReview)}>
                {showReview ? 'Hide Review' : 'Review Answers'}
              </Button>
              <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
            </div>
          </CardContent>
        </Card>

        {showReview && examQuestions.map((q, i) => {
          const isCorrect = answers[q.id] === q.correctAnswerId;
          return (
            <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                  <p className="font-medium text-foreground">{i + 1}. {q.text}</p>
                </div>
                <div className="ml-7 space-y-1">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id] === opt.id;
                    const isAnswer = q.correctAnswerId === opt.id;
                    return (
                      <div key={opt.id} className={`text-sm py-1 px-2 rounded ${isAnswer ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium' : isSelected && !isAnswer ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : 'text-muted-foreground'}`}>
                        {opt.text} {isAnswer && '✓'} {isSelected && !isAnswer && '✗'}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/exams')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams</Button>

      <Card>
        <CardHeader>
          <CardTitle>{exam.name}</CardTitle>
          <CardDescription>{examQuestions.length} questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Student *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstname} {s.lastname}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">{answeredCount}/{examQuestions.length}</span>
          </div>
        </CardContent>
      </Card>

      {examQuestions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <p className="font-medium text-foreground">{i + 1}. {q.text}</p>
              <Badge variant="outline" className="shrink-0 ml-2">{q.difficulty}</Badge>
            </div>
            <RadioGroup value={answers[q.id] || ''} onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}>
              {q.options.map(opt => (
                <div key={opt.id} className="flex items-center gap-2 py-1">
                  <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                  <Label htmlFor={`${q.id}-${opt.id}`} className="cursor-pointer">{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      {examQuestions.length > 0 && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={submitMut.isPending}>
            <Send className="h-4 w-4 mr-2" /> Submit Exam
          </Button>
        </div>
      )}
    </div>
  );
}
