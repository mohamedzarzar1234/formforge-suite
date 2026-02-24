import { APP_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';
import type {
  StudentAbsence, StudentLate,
  TeacherAbsence, TeacherLate,
  ManagerAbsence, ManagerLate,
  AttendanceStats, AttendanceFilter,
} from '@/types/attendance';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));
let idCounter = 500;
const genId = (prefix: string) => `${prefix}-${++idCounter}`;

// In-memory stores
let studentAbsences: StudentAbsence[] = [
  { id: 'sa-1', studentId: 'stu-1', date: '2025-02-10', isJustified: true, reason: 'Medical appointment', createdAt: '2025-02-10T08:00:00Z' },
  { id: 'sa-2', studentId: 'stu-2', date: '2025-02-12', isJustified: false, createdAt: '2025-02-12T08:00:00Z' },
  { id: 'sa-3', studentId: 'stu-3', date: '2025-02-15', isJustified: true, reason: 'Family emergency', createdAt: '2025-02-15T08:00:00Z' },
  { id: 'sa-4', studentId: 'stu-1', date: '2025-02-18', isJustified: false, createdAt: '2025-02-18T08:00:00Z' },
];

let studentLates: StudentLate[] = [
  { id: 'sl-1', studentId: 'stu-1', date: '2025-02-11', isJustified: false, period: 15, createdAt: '2025-02-11T08:00:00Z' },
  { id: 'sl-2', studentId: 'stu-4', date: '2025-02-13', isJustified: true, reason: 'Bus delay', period: 5, createdAt: '2025-02-13T08:00:00Z' },
  { id: 'sl-3', studentId: 'stu-2', date: '2025-02-14', isJustified: false, period: 20, createdAt: '2025-02-14T08:00:00Z' },
];

let teacherAbsences: TeacherAbsence[] = [
  { id: 'ta-1', teacherId: 'tea-1', session: 'Session 1 - 08:00', date: '2025-02-10', isJustified: true, reason: 'Conference', createdAt: '2025-02-10T08:00:00Z' },
  { id: 'ta-2', teacherId: 'tea-2', session: 'Session 3 - 10:00', date: '2025-02-14', isJustified: false, createdAt: '2025-02-14T08:00:00Z' },
];

let teacherLates: TeacherLate[] = [
  { id: 'tl-1', teacherId: 'tea-1', session: 'Session 2 - 09:00', date: '2025-02-12', isJustified: false, period: 10, createdAt: '2025-02-12T08:00:00Z' },
  { id: 'tl-2', teacherId: 'tea-3', session: 'Session 1 - 08:00', date: '2025-02-16', isJustified: true, reason: 'Traffic', period: 5, createdAt: '2025-02-16T08:00:00Z' },
];

let managerAbsences: ManagerAbsence[] = [
  { id: 'ma-1', managerId: 'mgr-1', date: '2025-02-11', isJustified: true, reason: 'Sick leave', createdAt: '2025-02-11T08:00:00Z' },
];

let managerLates: ManagerLate[] = [
  { id: 'ml-1', managerId: 'mgr-2', date: '2025-02-13', isJustified: false, period: 10, createdAt: '2025-02-13T08:00:00Z' },
];

function applyDateFilter<T extends { date: string }>(items: T[], filter?: AttendanceFilter): T[] {
  if (!filter) return items;
  let result = items;
  if (filter.dateFrom) result = result.filter(i => i.date >= filter.dateFrom!);
  if (filter.dateTo) result = result.filter(i => i.date <= filter.dateTo!);
  if (filter.isJustified !== undefined) result = result.filter(i => (i as any).isJustified === filter.isJustified);
  return result;
}

function computeStats(absences: any[], lates: any[]): AttendanceStats {
  const totalLates = lates.length;
  return {
    totalAbsences: absences.length,
    justifiedAbsences: absences.filter((a: any) => a.isJustified).length,
    unjustifiedAbsences: absences.filter((a: any) => !a.isJustified).length,
    totalLates,
    justifiedLates: lates.filter((l: any) => l.isJustified).length,
    unjustifiedLates: lates.filter((l: any) => !l.isJustified).length,
    averageLatePeriod: totalLates > 0 ? Math.round(lates.reduce((s: number, l: any) => s + l.period, 0) / totalLates) : 0,
  };
}

// ==================== DUPLICATE CHECKS ====================
// Student/Manager: one per entity per day
function hasDuplicateStudentAbs(studentId: string, date: string, excludeId?: string): boolean {
  return studentAbsences.some(a => a.studentId === studentId && a.date === date && a.id !== excludeId);
}
function hasDuplicateStudentLate(studentId: string, date: string, excludeId?: string): boolean {
  return studentLates.some(l => l.studentId === studentId && l.date === date && l.id !== excludeId);
}
function hasDuplicateManagerAbs(managerId: string, date: string, excludeId?: string): boolean {
  return managerAbsences.some(a => a.managerId === managerId && a.date === date && a.id !== excludeId);
}
function hasDuplicateManagerLate(managerId: string, date: string, excludeId?: string): boolean {
  return managerLates.some(l => l.managerId === managerId && l.date === date && l.id !== excludeId);
}
// Teacher: one per session per day
function hasDuplicateTeacherAbs(teacherId: string, session: string, date: string, excludeId?: string): boolean {
  return teacherAbsences.some(a => a.teacherId === teacherId && a.session === session && a.date === date && a.id !== excludeId);
}
function hasDuplicateTeacherLate(teacherId: string, session: string, date: string, excludeId?: string): boolean {
  return teacherLates.some(l => l.teacherId === teacherId && l.session === session && l.date === date && l.id !== excludeId);
}

// ==================== STUDENT ====================
export const studentAttendanceApi = {
  getAbsences: async (filter?: AttendanceFilter): Promise<ApiResponse<StudentAbsence[]>> => {
    await delay();
    let items = [...studentAbsences];
    if (filter?.entityId) items = items.filter(i => i.studentId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  getLates: async (filter?: AttendanceFilter): Promise<ApiResponse<StudentLate[]>> => {
    await delay();
    let items = [...studentLates];
    if (filter?.entityId) items = items.filter(i => i.studentId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  createAbsence: async (data: Omit<StudentAbsence, 'id' | 'createdAt'>): Promise<ApiResponse<StudentAbsence>> => {
    await delay();
    if (hasDuplicateStudentAbs(data.studentId, data.date)) {
      return { data: null as any, message: 'Absence already exists for this student on this date', success: false, statusCode: 409 };
    }
    const item: StudentAbsence = { ...data, id: genId('sa'), createdAt: new Date().toISOString() };
    studentAbsences.push(item);
    return { data: item, message: 'Absence added', success: true, statusCode: 201 };
  },
  createAbsenceBulk: async (records: Omit<StudentAbsence, 'id' | 'createdAt'>[]): Promise<ApiResponse<StudentAbsence[]>> => {
    await delay();
    const items: StudentAbsence[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateStudentAbs(r.studentId, r.date) || items.some(i => i.studentId === r.studentId && i.date === r.date)) {
        skipped.push(`${r.studentId} on ${r.date}`);
        continue;
      }
      const item: StudentAbsence = { ...r, id: genId('sa'), createdAt: new Date().toISOString() };
      items.push(item);
    }
    studentAbsences.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} absences added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateAbsence: async (id: string, data: Partial<StudentAbsence>): Promise<ApiResponse<StudentAbsence>> => {
    await delay();
    const idx = studentAbsences.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    studentAbsences[idx] = { ...studentAbsences[idx], ...data };
    return { data: studentAbsences[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteAbsence: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    studentAbsences = studentAbsences.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  createLate: async (data: Omit<StudentLate, 'id' | 'createdAt'>): Promise<ApiResponse<StudentLate>> => {
    await delay();
    if (hasDuplicateStudentLate(data.studentId, data.date)) {
      return { data: null as any, message: 'Late already exists for this student on this date', success: false, statusCode: 409 };
    }
    const item: StudentLate = { ...data, id: genId('sl'), createdAt: new Date().toISOString() };
    studentLates.push(item);
    return { data: item, message: 'Late added', success: true, statusCode: 201 };
  },
  createLateBulk: async (records: Omit<StudentLate, 'id' | 'createdAt'>[]): Promise<ApiResponse<StudentLate[]>> => {
    await delay();
    const items: StudentLate[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateStudentLate(r.studentId, r.date) || items.some(i => i.studentId === r.studentId && i.date === r.date)) {
        skipped.push(`${r.studentId} on ${r.date}`);
        continue;
      }
      const item: StudentLate = { ...r, id: genId('sl'), createdAt: new Date().toISOString() };
      items.push(item);
    }
    studentLates.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} lates added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateLate: async (id: string, data: Partial<StudentLate>): Promise<ApiResponse<StudentLate>> => {
    await delay();
    const idx = studentLates.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    studentLates[idx] = { ...studentLates[idx], ...data };
    return { data: studentLates[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteLate: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    studentLates = studentLates.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  getStats: async (filter?: AttendanceFilter): Promise<ApiResponse<AttendanceStats>> => {
    await delay();
    let abs = [...studentAbsences]; let lts = [...studentLates];
    if (filter?.entityId) { abs = abs.filter(i => i.studentId === filter.entityId); lts = lts.filter(i => i.studentId === filter.entityId); }
    abs = applyDateFilter(abs, filter); lts = applyDateFilter(lts, filter);
    return { data: computeStats(abs, lts), message: 'Success', success: true, statusCode: 200 };
  },
};

// ==================== TEACHER ====================
export const teacherAttendanceApi = {
  getAbsences: async (filter?: AttendanceFilter): Promise<ApiResponse<TeacherAbsence[]>> => {
    await delay();
    let items = [...teacherAbsences];
    if (filter?.entityId) items = items.filter(i => i.teacherId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  getLates: async (filter?: AttendanceFilter): Promise<ApiResponse<TeacherLate[]>> => {
    await delay();
    let items = [...teacherLates];
    if (filter?.entityId) items = items.filter(i => i.teacherId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  createAbsence: async (data: Omit<TeacherAbsence, 'id' | 'createdAt'>): Promise<ApiResponse<TeacherAbsence>> => {
    await delay();
    if (hasDuplicateTeacherAbs(data.teacherId, data.session, data.date)) {
      return { data: null as any, message: 'Absence already exists for this teacher on this session/date', success: false, statusCode: 409 };
    }
    const item: TeacherAbsence = { ...data, id: genId('ta'), createdAt: new Date().toISOString() };
    teacherAbsences.push(item);
    return { data: item, message: 'Absence added', success: true, statusCode: 201 };
  },
  createAbsenceBulk: async (records: Omit<TeacherAbsence, 'id' | 'createdAt'>[]): Promise<ApiResponse<TeacherAbsence[]>> => {
    await delay();
    const items: TeacherAbsence[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateTeacherAbs(r.teacherId, r.session, r.date) || items.some(i => i.teacherId === r.teacherId && i.session === r.session && i.date === r.date)) {
        skipped.push(`${r.teacherId} ${r.session} on ${r.date}`);
        continue;
      }
      items.push({ ...r, id: genId('ta'), createdAt: new Date().toISOString() });
    }
    teacherAbsences.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} absences added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateAbsence: async (id: string, data: Partial<TeacherAbsence>): Promise<ApiResponse<TeacherAbsence>> => {
    await delay();
    const idx = teacherAbsences.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    teacherAbsences[idx] = { ...teacherAbsences[idx], ...data };
    return { data: teacherAbsences[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteAbsence: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    teacherAbsences = teacherAbsences.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  createLate: async (data: Omit<TeacherLate, 'id' | 'createdAt'>): Promise<ApiResponse<TeacherLate>> => {
    await delay();
    if (hasDuplicateTeacherLate(data.teacherId, data.session, data.date)) {
      return { data: null as any, message: 'Late already exists for this teacher on this session/date', success: false, statusCode: 409 };
    }
    const item: TeacherLate = { ...data, id: genId('tl'), createdAt: new Date().toISOString() };
    teacherLates.push(item);
    return { data: item, message: 'Late added', success: true, statusCode: 201 };
  },
  createLateBulk: async (records: Omit<TeacherLate, 'id' | 'createdAt'>[]): Promise<ApiResponse<TeacherLate[]>> => {
    await delay();
    const items: TeacherLate[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateTeacherLate(r.teacherId, r.session, r.date) || items.some(i => i.teacherId === r.teacherId && i.session === r.session && i.date === r.date)) {
        skipped.push(`${r.teacherId} ${r.session} on ${r.date}`);
        continue;
      }
      items.push({ ...r, id: genId('tl'), createdAt: new Date().toISOString() });
    }
    teacherLates.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} lates added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateLate: async (id: string, data: Partial<TeacherLate>): Promise<ApiResponse<TeacherLate>> => {
    await delay();
    const idx = teacherLates.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    teacherLates[idx] = { ...teacherLates[idx], ...data };
    return { data: teacherLates[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteLate: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    teacherLates = teacherLates.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  getStats: async (filter?: AttendanceFilter): Promise<ApiResponse<AttendanceStats>> => {
    await delay();
    let abs = [...teacherAbsences]; let lts = [...teacherLates];
    if (filter?.entityId) { abs = abs.filter(i => i.teacherId === filter.entityId); lts = lts.filter(i => i.teacherId === filter.entityId); }
    abs = applyDateFilter(abs, filter); lts = applyDateFilter(lts, filter);
    return { data: computeStats(abs, lts), message: 'Success', success: true, statusCode: 200 };
  },
};

// ==================== MANAGER ====================
export const managerAttendanceApi = {
  getAbsences: async (filter?: AttendanceFilter): Promise<ApiResponse<ManagerAbsence[]>> => {
    await delay();
    let items = [...managerAbsences];
    if (filter?.entityId) items = items.filter(i => i.managerId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  getLates: async (filter?: AttendanceFilter): Promise<ApiResponse<ManagerLate[]>> => {
    await delay();
    let items = [...managerLates];
    if (filter?.entityId) items = items.filter(i => i.managerId === filter.entityId);
    items = applyDateFilter(items, filter);
    return { data: items, message: 'Success', success: true, statusCode: 200 };
  },
  createAbsence: async (data: Omit<ManagerAbsence, 'id' | 'createdAt'>): Promise<ApiResponse<ManagerAbsence>> => {
    await delay();
    if (hasDuplicateManagerAbs(data.managerId, data.date)) {
      return { data: null as any, message: 'Absence already exists for this manager on this date', success: false, statusCode: 409 };
    }
    const item: ManagerAbsence = { ...data, id: genId('ma'), createdAt: new Date().toISOString() };
    managerAbsences.push(item);
    return { data: item, message: 'Absence added', success: true, statusCode: 201 };
  },
  createAbsenceBulk: async (records: Omit<ManagerAbsence, 'id' | 'createdAt'>[]): Promise<ApiResponse<ManagerAbsence[]>> => {
    await delay();
    const items: ManagerAbsence[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateManagerAbs(r.managerId, r.date) || items.some(i => i.managerId === r.managerId && i.date === r.date)) {
        skipped.push(`${r.managerId} on ${r.date}`);
        continue;
      }
      items.push({ ...r, id: genId('ma'), createdAt: new Date().toISOString() });
    }
    managerAbsences.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} absences added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateAbsence: async (id: string, data: Partial<ManagerAbsence>): Promise<ApiResponse<ManagerAbsence>> => {
    await delay();
    const idx = managerAbsences.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    managerAbsences[idx] = { ...managerAbsences[idx], ...data };
    return { data: managerAbsences[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteAbsence: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    managerAbsences = managerAbsences.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  createLate: async (data: Omit<ManagerLate, 'id' | 'createdAt'>): Promise<ApiResponse<ManagerLate>> => {
    await delay();
    if (hasDuplicateManagerLate(data.managerId, data.date)) {
      return { data: null as any, message: 'Late already exists for this manager on this date', success: false, statusCode: 409 };
    }
    const item: ManagerLate = { ...data, id: genId('ml'), createdAt: new Date().toISOString() };
    managerLates.push(item);
    return { data: item, message: 'Late added', success: true, statusCode: 201 };
  },
  createLateBulk: async (records: Omit<ManagerLate, 'id' | 'createdAt'>[]): Promise<ApiResponse<ManagerLate[]>> => {
    await delay();
    const items: ManagerLate[] = [];
    const skipped: string[] = [];
    for (const r of records) {
      if (hasDuplicateManagerLate(r.managerId, r.date) || items.some(i => i.managerId === r.managerId && i.date === r.date)) {
        skipped.push(`${r.managerId} on ${r.date}`);
        continue;
      }
      items.push({ ...r, id: genId('ml'), createdAt: new Date().toISOString() });
    }
    managerLates.push(...items);
    const msg = skipped.length ? `${items.length} added, ${skipped.length} duplicates skipped` : `${items.length} lates added`;
    return { data: items, message: msg, success: true, statusCode: 201 };
  },
  updateLate: async (id: string, data: Partial<ManagerLate>): Promise<ApiResponse<ManagerLate>> => {
    await delay();
    const idx = managerLates.findIndex(i => i.id === id);
    if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
    managerLates[idx] = { ...managerLates[idx], ...data };
    return { data: managerLates[idx], message: 'Updated', success: true, statusCode: 200 };
  },
  deleteLate: async (id: string): Promise<ApiResponse<null>> => {
    await delay();
    managerLates = managerLates.filter(i => i.id !== id);
    return { data: null, message: 'Deleted', success: true, statusCode: 200 };
  },
  getStats: async (filter?: AttendanceFilter): Promise<ApiResponse<AttendanceStats>> => {
    await delay();
    let abs = [...managerAbsences]; let lts = [...managerLates];
    if (filter?.entityId) { abs = abs.filter(i => i.managerId === filter.entityId); lts = lts.filter(i => i.managerId === filter.entityId); }
    abs = applyDateFilter(abs, filter); lts = applyDateFilter(lts, filter);
    return { data: computeStats(abs, lts), message: 'Success', success: true, statusCode: 200 };
  },
};

export { getSessionOptions } from './settings-api';

