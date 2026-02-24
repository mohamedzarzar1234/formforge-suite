export type FieldType = 'text' | 'date' | 'select' | 'multi-select' | 'file' | 'number' | 'email' | 'phone' | 'textarea';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
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

export interface TemplateConfig {
  student: EntityTemplateConfig;
  teacher: EntityTemplateConfig;
  manager: EntityTemplateConfig;
  parent: EntityTemplateConfig;
}

export type EntityType = 'student' | 'teacher' | 'manager' | 'parent';

export interface Student {
  id: string;
  firstname: string;
  lastname: string;
  parentIds: string[];
  defaultParentId?: string;
  classId?: string;
  levelId: string;
  dynamicFields: Record<string, any>;
  createdAt: string;
}

export interface ClassAssignment {
  classId: string;
  subjectIds: string[];
}

export interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
  subjectIds: string[];
  classAssignments: ClassAssignment[];
  dynamicFields: Record<string, any>;
  createdAt: string;
}

export interface Parent {
  id: string;
  firstname: string;
  lastname: string;
  studentIds: string[];
  dynamicFields: Record<string, any>;
  createdAt: string;
}

export interface Manager {
  id: string;
  firstname: string;
  lastname: string;
  classIds: string[];
  dynamicFields: Record<string, any>;
  createdAt: string;
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
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  message: string;
  success: boolean;
  statusCode: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
