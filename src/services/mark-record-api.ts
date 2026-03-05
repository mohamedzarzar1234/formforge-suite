import { APP_CONFIG } from '@/config';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type { MarkRecord, MarkRecordSettings, MarkRecordType, OfficialTemplate, NonOfficialMarkRecord, OfficialMarkRecord } from '@/types/mark-record';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));
let idCounter = 500;
const genId = (prefix: string) => `${prefix}-${++idCounter}`;

let markRecordSettings: MarkRecordSettings = {
  types: [
    { id: 'mrt-1', name: 'Recitation' },
    { id: 'mrt-2', name: 'Testing' },
    { id: 'mrt-3', name: 'Memorization' },
    { id: 'mrt-4', name: 'Homework' },
  ],
  officialTemplates: [
    {
      id: 'otpl-1',
      name: 'Standard Report Card',
      levelId: 'lvl-1',
      columns: [
        { id: 'col-1', name: 'Written Exam', maxScore: 40, order: 1 },
        { id: 'col-2', name: 'Oral Exam', maxScore: 20, order: 2 },
        { id: 'col-3', name: 'Participation', maxScore: 10, order: 3 },
        { id: 'col-4', name: 'Final Exam', maxScore: 30, order: 4 },
      ],
    },
  ],
};

let markRecords: MarkRecord[] = [
  { id: 'mr-1', studentId: 'stu-1', subjectId: 'sub-1', levelId: 'lvl-1', classId: 'cls-1', typeId: 'mrt-1', score: 85, maxScore: 100, date: '2024-03-15', notes: 'Good recitation', isOfficial: false, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'mr-2', studentId: 'stu-2', subjectId: 'sub-2', levelId: 'lvl-1', classId: 'cls-2', typeId: 'mrt-2', score: 90, maxScore: 100, date: '2024-03-16', notes: '', isOfficial: false, createdAt: '2024-03-16T10:00:00Z' },
  { id: 'mr-3', studentId: 'stu-1', subjectId: 'sub-1', levelId: 'lvl-1', classId: 'cls-1', templateId: 'otpl-1', scores: { 'col-1': 35, 'col-2': 18, 'col-3': 9, 'col-4': 25 }, date: '2024-04-01', notes: 'Semester 1', isOfficial: true, createdAt: '2024-04-01T10:00:00Z' },
  { id: 'mr-4', studentId: 'stu-3', subjectId: 'sub-3', levelId: 'lvl-2', classId: 'cls-3', typeId: 'mrt-3', score: 75, maxScore: 100, date: '2024-03-20', notes: 'Needs improvement', isOfficial: false, createdAt: '2024-03-20T10:00:00Z' },
];

interface MarkRecordFilters {
  page: number;
  limit: number;
  search?: string;
  isOfficial?: boolean | null;
  typeId?: string;
  levelId?: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const markRecordApi = {
  getAll: async (params: MarkRecordFilters): Promise<PaginatedResponse<MarkRecord>> => {
    await delay();
    let items = [...markRecords];
    if (params.isOfficial !== null && params.isOfficial !== undefined) {
      items = items.filter(r => r.isOfficial === params.isOfficial);
    }
    if (params.typeId) items = items.filter(r => !r.isOfficial && (r as NonOfficialMarkRecord).typeId === params.typeId);
    if (params.levelId) items = items.filter(r => r.levelId === params.levelId);
    if (params.classId) items = items.filter(r => r.classId === params.classId);
    if (params.subjectId) items = items.filter(r => r.subjectId === params.subjectId);
    if (params.studentId) items = items.filter(r => r.studentId === params.studentId);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(r => r.notes.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (params.dateFrom) items = items.filter(r => r.date >= params.dateFrom!);
    if (params.dateTo) items = items.filter(r => r.date <= params.dateTo!);
    const total = items.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const data = items.slice(start, start + params.limit);
    return { data, total, page: params.page, limit: params.limit, totalPages, message: 'Success', success: true, statusCode: 200 };
  },

  getById: async (id: string): Promise<ApiResponse<MarkRecord | null>> => {
    await delay();
    const item = markRecords.find(r => r.id === id) || null;
    return { data: item, message: item ? 'Success' : 'Not found', success: !!item, statusCode: item ? 200 : 404 };
  },

  // Find existing official record for a student+subject combo
  findOfficialRecord: async (studentId: string, subjectId: string): Promise<ApiResponse<OfficialMarkRecord | null>> => {
    await delay();
    const item = markRecords.find(r => r.isOfficial && r.studentId === studentId && r.subjectId === subjectId) as OfficialMarkRecord | undefined;
    return { data: item || null, message: 'Success', success: true, statusCode: 200 };
  },

  // Upsert official record: create if not exists, update if exists
  upsertOfficial: async (data: Omit<OfficialMarkRecord, 'id' | 'createdAt'>): Promise<ApiResponse<OfficialMarkRecord>> => {
    await delay();
    const existing = markRecords.find(r => r.isOfficial && r.studentId === data.studentId && r.subjectId === data.subjectId);
    if (existing) {
      const updated = { ...existing, ...data } as OfficialMarkRecord;
      markRecords = markRecords.map(r => r.id === existing.id ? updated : r);
      return { data: updated, message: 'Updated', success: true, statusCode: 200 };
    } else {
      const newItem = { ...data, id: genId('mr'), createdAt: new Date().toISOString() } as OfficialMarkRecord;
      markRecords = [...markRecords, newItem];
      return { data: newItem, message: 'Created', success: true, statusCode: 201 };
    }
  },

  create: async (data: Omit<MarkRecord, 'id' | 'createdAt'>): Promise<ApiResponse<MarkRecord>> => {
    await delay();
    const newItem = { ...data, id: genId('mr'), createdAt: new Date().toISOString() } as MarkRecord;
    markRecords = [...markRecords, newItem];
    return { data: newItem, message: 'Created', success: true, statusCode: 201 };
  },

  bulkCreate: async (items: Omit<MarkRecord, 'id' | 'createdAt'>[]): Promise<ApiResponse<MarkRecord[]>> => {
    await delay();
    const created = items.map(d => ({ ...d, id: genId('mr'), createdAt: new Date().toISOString() }) as MarkRecord);
    markRecords = [...markRecords, ...created];
    return { data: created, message: `${created.length} records created`, success: true, statusCode: 201 };
  },

  update: async (id: string, data: Partial<MarkRecord>): Promise<ApiResponse<MarkRecord>> => {
    await delay();
    const idx = markRecords.findIndex(r => r.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    markRecords[idx] = { ...markRecords[idx], ...data } as MarkRecord;
    markRecords = [...markRecords];
    return { data: markRecords[idx], message: 'Updated', success: true, statusCode: 200 };
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    markRecords = markRecords.filter(r => r.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },

  // Settings
  getSettings: async (): Promise<ApiResponse<MarkRecordSettings>> => {
    await delay();
    return { data: JSON.parse(JSON.stringify(markRecordSettings)), message: 'Success', success: true, statusCode: 200 };
  },

  updateSettings: async (settings: MarkRecordSettings): Promise<ApiResponse<MarkRecordSettings>> => {
    await delay();
    markRecordSettings = JSON.parse(JSON.stringify(settings));
    return { data: markRecordSettings, message: 'Settings updated', success: true, statusCode: 200 };
  },

  getTypes: (): MarkRecordType[] => markRecordSettings.types,
  getTemplates: (): OfficialTemplate[] => markRecordSettings.officialTemplates,
  getTemplateForLevel: (levelId: string): OfficialTemplate | undefined => markRecordSettings.officialTemplates.find(t => t.levelId === levelId),
};
