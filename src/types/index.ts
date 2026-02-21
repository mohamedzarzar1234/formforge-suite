export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'multi-select' | 'file' | 'number' | 'email' | 'phone' | 'textarea';
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: { min?: number; max?: number; pattern?: string; customMessage?: string };
  placeholder?: string;
  defaultValue?: any;
  order: number;
  visible: boolean;
  editable: boolean;
}

export interface EntityTemplateConfig {
  fields: FieldDefinition[];
  version: number;
  lastUpdated: string;
}

export type EntityType = 'student' | 'teacher' | 'parent' | 'manager';

export interface BaseEntity {
  id: string;
  firstname: string;
  lastname: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Student extends BaseEntity {
  levelId?: string;
  classId?: string;
  parentIds: string[];
  defaultParentId?: string;
}

export interface Teacher extends BaseEntity {
  subjectIds: string[];
  classIds: string[];
  photo?: string;
}

export interface Parent extends BaseEntity {
  studentIds: string[];
}

export interface Manager extends BaseEntity {
  classIds: string[];
  photo?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  section: string;
  capacity: number;
  levelId: string;
}

export interface Level {
  id: string;
  name: string;
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
