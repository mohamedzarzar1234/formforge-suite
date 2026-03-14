import { APP_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';
import type { NoteTemplate, Note, PointRecord } from '@/types/note-point';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));
let idCounter = 800;
const genId = (prefix: string) => `${prefix}-${++idCounter}`;

// In-memory stores
let noteTemplates: NoteTemplate[] = [
  { id: 'ntpl-1', title: 'Good Behavior', type: 'positive', isPointEffect: true, pointEffect: 5, isSendNotification: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ntpl-2', title: 'Homework Not Done', type: 'negative', isPointEffect: true, pointEffect: 3, isSendNotification: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ntpl-3', title: 'Class Participation', type: 'positive', isPointEffect: true, pointEffect: 2, isSendNotification: false, createdAt: '2025-01-02T00:00:00Z' },
  { id: 'ntpl-4', title: 'Disruptive Behavior', type: 'negative', isPointEffect: true, pointEffect: 5, isSendNotification: true, createdAt: '2025-01-02T00:00:00Z' },
  { id: 'ntpl-5', title: 'General Observation', type: 'positive', isPointEffect: false, pointEffect: 0, isSendNotification: false, createdAt: '2025-01-03T00:00:00Z' },
];

let notes: Note[] = [
  { id: 'note-1', templateId: 'ntpl-1', studentIds: ['stu-1'], date: '2025-02-10', description: 'Helped classmates with math assignment', createdAt: '2025-02-10T10:00:00Z' },
  { id: 'note-2', templateId: 'ntpl-2', studentIds: ['stu-2', 'stu-3'], date: '2025-02-12', description: 'Did not submit homework', createdAt: '2025-02-12T08:00:00Z' },
];

let points: PointRecord[] = [
  { id: 'pt-1', studentId: 'stu-1', type: 'positive', amount: 5, date: '2025-02-10', sourceNoteId: 'note-1', createdAt: '2025-02-10T10:00:00Z' },
  { id: 'pt-2', studentId: 'stu-2', type: 'negative', amount: 3, date: '2025-02-12', sourceNoteId: 'note-2', createdAt: '2025-02-12T08:00:00Z' },
  { id: 'pt-3', studentId: 'stu-3', type: 'negative', amount: 3, date: '2025-02-12', sourceNoteId: 'note-2', createdAt: '2025-02-12T08:00:00Z' },
];

// ===================== NOTE TEMPLATES =====================
export const noteTemplateApi = {
  getAll: async (): Promise<ApiResponse<NoteTemplate[]>> => {
    await delay();
    return { data: [...noteTemplates], message: 'Success', success: true, statusCode: 200 };
  },
  create: async (data: Omit<NoteTemplate, 'id' | 'createdAt'>): Promise<ApiResponse<NoteTemplate>> => {
    await delay();
    const item: NoteTemplate = { ...data, id: genId('ntpl'), createdAt: new Date().toISOString() };
    noteTemplates = [...noteTemplates, item];
    return { data: item, message: 'Template created', success: true, statusCode: 201 };
  },
  update: async (id: string, data: Partial<NoteTemplate>): Promise<ApiResponse<NoteTemplate>> => {
    await delay();
    const idx = noteTemplates.findIndex(t => t.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    noteTemplates[idx] = { ...noteTemplates[idx], ...data };
    noteTemplates = [...noteTemplates];
    return { data: noteTemplates[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    noteTemplates = noteTemplates.filter(t => t.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
};

// ===================== NOTES =====================
export const noteApi = {
  getAll: async (filter?: { studentId?: string; templateId?: string; dateFrom?: string; dateTo?: string }): Promise<ApiResponse<Note[]>> => {
    await delay();
    let items = [...notes];
    if (filter?.studentId) items = items.filter(n => n.studentIds.includes(filter.studentId!));
    if (filter?.templateId) items = items.filter(n => n.templateId === filter.templateId);
    if (filter?.dateFrom) items = items.filter(n => n.date >= filter.dateFrom!);
    if (filter?.dateTo) items = items.filter(n => n.date <= filter.dateTo!);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  create: async (data: Omit<Note, 'id' | 'createdAt'>): Promise<ApiResponse<Note>> => {
    await delay();
    const note: Note = { ...data, id: genId('note'), createdAt: new Date().toISOString() };
    notes = [...notes, note];
    // Auto-create point records if template has point effect
    const tpl = noteTemplates.find(t => t.id === data.templateId);
    if (tpl?.isPointEffect) {
      for (const studentId of data.studentIds) {
        const pt: PointRecord = {
          id: genId('pt'),
          studentId,
          type: tpl.type,
          amount: tpl.pointEffect,
          date: data.date,
          sourceNoteId: note.id,
          createdAt: new Date().toISOString(),
        };
        points = [...points, pt];
      }
    }
    return { data: note, message: 'Note created', success: true, statusCode: 201 };
  },
  createBulk: async (items: Omit<Note, 'id' | 'createdAt'>[]): Promise<ApiResponse<Note[]>> => {
    await delay();
    const created: Note[] = [];
    for (const data of items) {
      const note: Note = { ...data, id: genId('note'), createdAt: new Date().toISOString() };
      notes = [...notes, note];
      created.push(note);
      const tpl = noteTemplates.find(t => t.id === data.templateId);
      if (tpl?.isPointEffect) {
        for (const studentId of data.studentIds) {
          const pt: PointRecord = {
            id: genId('pt'),
            studentId,
            type: tpl.type,
            amount: tpl.pointEffect,
            date: data.date,
            sourceNoteId: note.id,
            createdAt: new Date().toISOString(),
          };
          points = [...points, pt];
        }
      }
    }
    return { data: created, message: `${created.length} notes created`, success: true, statusCode: 201 };
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    // Also remove associated points
    points = points.filter(p => p.sourceNoteId !== id);
    notes = notes.filter(n => n.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
};

// ===================== POINTS =====================
export const pointApi = {
  getAll: async (filter?: { studentId?: string; type?: 'positive' | 'negative'; dateFrom?: string; dateTo?: string }): Promise<ApiResponse<PointRecord[]>> => {
    await delay();
    let items = [...points];
    if (filter?.studentId) items = items.filter(p => p.studentId === filter.studentId);
    if (filter?.type) items = items.filter(p => p.type === filter.type);
    if (filter?.dateFrom) items = items.filter(p => p.date >= filter.dateFrom!);
    if (filter?.dateTo) items = items.filter(p => p.date <= filter.dateTo!);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  getStudentTotal: async (studentId: string): Promise<ApiResponse<{ positive: number; negative: number; net: number }>> => {
    await delay();
    const studentPts = points.filter(p => p.studentId === studentId);
    const positive = studentPts.filter(p => p.type === 'positive').reduce((s, p) => s + p.amount, 0);
    const negative = studentPts.filter(p => p.type === 'negative').reduce((s, p) => s + p.amount, 0);
    return { data: { positive, negative, net: positive - negative }, message: 'Success', success: true, statusCode: 200 };
  },
  create: async (data: { studentId: string; type: 'positive' | 'negative'; amount: number; date: string }): Promise<ApiResponse<PointRecord>> => {
    await delay();
    const pt: PointRecord = { ...data, id: genId('pt'), createdAt: new Date().toISOString() };
    points = [...points, pt];
    return { data: pt, message: 'Point created', success: true, statusCode: 201 };
  },
  createBulk: async (items: { studentId: string; type: 'positive' | 'negative'; amount: number; date: string }[]): Promise<ApiResponse<PointRecord[]>> => {
    await delay();
    const created: PointRecord[] = [];
    for (const data of items) {
      const pt: PointRecord = { ...data, id: genId('pt'), createdAt: new Date().toISOString() };
      points = [...points, pt];
      created.push(pt);
    }
    return { data: created, message: `${created.length} points created`, success: true, statusCode: 201 };
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    points = points.filter(p => p.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
};
