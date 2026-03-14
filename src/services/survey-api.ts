import { APP_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';
import type { Survey, SurveyResponse, SurveyQuestion, SurveyNote } from '@/types/survey';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));
let idCounter = 900;
const genId = (prefix: string) => `${prefix}-${++idCounter}`;

let surveys: Survey[] = [
  {
    id: 'srv-1',
    title: 'Student Satisfaction Survey',
    targetType: 'class',
    targetIds: ['cls-1'],
    distribution: 'student_app',
    questions: [
      { id: 'sq-1', type: 'multiple_choice', text: 'How do you rate the teaching quality?', options: [{ id: 'o1', text: 'Excellent' }, { id: 'o2', text: 'Good' }, { id: 'o3', text: 'Average' }, { id: 'o4', text: 'Poor' }], order: 1 },
      { id: 'sq-2', type: 'rating', text: 'Rate your overall experience', order: 2 },
      { id: 'sq-3', type: 'text', text: 'What improvements would you suggest?', order: 3 },
      { id: 'sq-4', type: 'pros_cons', text: 'List the pros and cons of the current curriculum', order: 4 },
    ],
    notes: [
      { id: 'sn-1', text: 'Please answer all questions honestly. Your responses are anonymous.', color: 'info', position: 'beginning' },
      { id: 'sn-2', text: 'This survey will close on Friday.', color: 'warn', position: 'end' },
    ],
    status: 'active',
    createdAt: '2025-03-01T10:00:00Z',
    responsesCount: 12,
  },
  {
    id: 'srv-2',
    title: 'End of Term Feedback',
    targetType: 'level',
    targetIds: ['lvl-1'],
    distribution: 'link',
    questions: [
      { id: 'sq-5', type: 'rating', text: 'Rate the difficulty of exams', order: 1 },
      { id: 'sq-6', type: 'text', text: 'Any additional comments?', order: 2 },
    ],
    notes: [],
    status: 'draft',
    createdAt: '2025-03-05T08:00:00Z',
    responsesCount: 0,
  },
];

let responses: SurveyResponse[] = [
  { id: 'sr-1', surveyId: 'srv-1', studentId: 'stu-1', answers: { 'sq-1': 'o1', 'sq-2': 8, 'sq-3': 'More labs', 'sq-4': { pros: ['Great teachers'], cons: ['Too much homework'] } }, submittedAt: '2025-03-02T14:00:00Z' },
];

export const surveyApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<Survey[]>> => {
    await delay();
    let items = [...surveys];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(s => s.title.toLowerCase().includes(q));
    }
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },

  getById: async (id: string): Promise<ApiResponse<Survey>> => {
    await delay();
    const item = surveys.find(s => s.id === id);
    if (!item) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    return { data: { ...item }, message: 'Success', success: true, statusCode: 200 };
  },

  create: async (data: Omit<Survey, 'id' | 'createdAt' | 'responsesCount'>): Promise<ApiResponse<Survey>> => {
    await delay();
    const survey: Survey = {
      ...data,
      id: genId('srv'),
      createdAt: new Date().toISOString(),
      responsesCount: 0,
    };
    surveys = [...surveys, survey];
    return { data: survey, message: 'Survey created', success: true, statusCode: 201 };
  },

  update: async (id: string, data: Partial<Survey>): Promise<ApiResponse<Survey>> => {
    await delay();
    const idx = surveys.findIndex(s => s.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    surveys[idx] = { ...surveys[idx], ...data };
    surveys = [...surveys];
    return { data: surveys[idx], message: 'Updated', success: true, statusCode: 200 };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    surveys = surveys.filter(s => s.id !== id);
    responses = responses.filter(r => r.surveyId !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },

  getResponses: async (surveyId: string): Promise<ApiResponse<SurveyResponse[]>> => {
    await delay();
    return { data: responses.filter(r => r.surveyId === surveyId), message: 'Success', success: true, statusCode: 200 };
  },

  submitResponse: async (data: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<ApiResponse<SurveyResponse>> => {
    await delay();
    const resp: SurveyResponse = { ...data, id: genId('sr'), submittedAt: new Date().toISOString() };
    responses = [...responses, resp];
    const sIdx = surveys.findIndex(s => s.id === data.surveyId);
    if (sIdx !== -1) surveys[sIdx] = { ...surveys[sIdx], responsesCount: surveys[sIdx].responsesCount + 1 };
    return { data: resp, message: 'Response submitted', success: true, statusCode: 201 };
  },
};
