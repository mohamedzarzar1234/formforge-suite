export type AttendanceEntityType = 'student' | 'teacher' | 'manager';
export type AttendanceRecordType = 'absence' | 'late';

export interface StudentAbsence {
  id: string;
  studentId: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  createdAt: string;
}

export interface StudentLate {
  id: string;
  studentId: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  period: number; // minutes
  createdAt: string;
}

export interface TeacherAbsence {
  id: string;
  teacherId: string;
  session: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  createdAt: string;
}

export interface TeacherLate {
  id: string;
  teacherId: string;
  session: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  period: number;
  createdAt: string;
}

export interface ManagerAbsence {
  id: string;
  managerId: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  createdAt: string;
}

export interface ManagerLate {
  id: string;
  managerId: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  period: number;
  createdAt: string;
}

export interface AttendanceStats {
  totalAbsences: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  totalLates: number;
  justifiedLates: number;
  unjustifiedLates: number;
  averageLatePeriod: number;
}

export interface AttendanceFilter {
  dateFrom?: string;
  dateTo?: string;
  classId?: string;
  levelId?: string;
  entityId?: string;
  isJustified?: boolean;
}
