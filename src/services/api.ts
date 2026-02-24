import { APP_CONFIG } from '@/config';
import type { ApiResponse, PaginatedResponse, PaginationParams, Student, Teacher, Parent, Manager, SchoolClass, Level, Subject, TemplateConfig, EntityType, EntityTemplateConfig } from '@/types';
import { defaultTemplates, initialStudents, initialTeachers, initialParents, initialManagers, initialClasses, initialLevels, initialSubjects } from './mock-data';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));
let idCounter = 100;
const genId = (prefix: string) => `${prefix}-${++idCounter}`;

// In-memory stores
let store: Record<string, any[]> = {
  students: [...initialStudents],
  teachers: [...initialTeachers],
  parents: [...initialParents],
  managers: [...initialManagers],
  classes: [...initialClasses],
  levels: [...initialLevels],
  subjects: [...initialSubjects],
};
let templates: TemplateConfig = JSON.parse(JSON.stringify(defaultTemplates));

function searchFilter<T extends Record<string, any>>(items: T[], search?: string): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(item =>
    Object.values(item).some(val => {
      if (typeof val === 'string') return val.toLowerCase().includes(q);
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return Object.values(val).some(v => typeof v === 'string' && (v as string).toLowerCase().includes(q));
      }
      return false;
    })
  );
}

function sortItems<T extends Record<string, any>>(items: T[], sortBy?: string, sortOrder?: 'asc' | 'desc'): T[] {
  if (!sortBy) return items;
  return [...items].sort((a, b) => {
    const aVal = String(a[sortBy] ?? a.dynamicFields?.[sortBy] ?? '');
    const bVal = String(b[sortBy] ?? b.dynamicFields?.[sortBy] ?? '');
    return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
  });
}

function createCrudService<T extends { id: string }>(key: string, prefix: string) {
  return {
    getAll: async (params: PaginationParams): Promise<PaginatedResponse<T>> => {
      await delay();
      let items = searchFilter(store[key] as T[], params.search);
      items = sortItems(items, params.sortBy, params.sortOrder);
      const total = items.length;
      const totalPages = Math.ceil(total / params.limit);
      const start = (params.page - 1) * params.limit;
      const data = items.slice(start, start + params.limit);
      return { data, total, page: params.page, limit: params.limit, totalPages, message: 'Success', success: true, statusCode: 200 };
    },
    getById: async (id: string): Promise<ApiResponse<T | null>> => {
      await delay();
      const item = (store[key] as T[]).find(i => i.id === id) || null;
      return { data: item, message: item ? 'Success' : 'Not found', success: !!item, statusCode: item ? 200 : 404 };
    },
    create: async (data: Partial<T>): Promise<ApiResponse<T>> => {
      await delay();
      const newItem = { ...data, id: genId(prefix), createdAt: new Date().toISOString() } as unknown as T;
      store[key] = [...store[key], newItem];
      return { data: newItem, message: 'Created successfully', success: true, statusCode: 201 };
    },
    update: async (id: string, data: Partial<T>): Promise<ApiResponse<T>> => {
      await delay();
      const items = store[key] as T[];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return { data: null as any, message: 'Not found', success: false, statusCode: 404 };
      items[idx] = { ...items[idx], ...data };
      store[key] = [...items];
      return { data: items[idx], message: 'Updated successfully', success: true, statusCode: 200 };
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      await delay();
      store[key] = (store[key] as T[]).filter(i => i.id !== id);
      return { data: null, message: 'Deleted successfully', success: true, statusCode: 200 };
    },
  };
}

export const studentApi = createCrudService<Student>('students', 'stu');
export const teacherApi = createCrudService<Teacher>('teachers', 'tea');
export const parentApi = createCrudService<Parent>('parents', 'par');
export const managerApi = createCrudService<Manager>('managers', 'mgr');
export const classApi = createCrudService<SchoolClass>('classes', 'cls');
export const levelApi = createCrudService<Level>('levels', 'lvl');
export const subjectApi = createCrudService<Subject>('subjects', 'sub');

export const templateApi = {
  get: async (): Promise<ApiResponse<TemplateConfig>> => {
    await delay();
    return { data: JSON.parse(JSON.stringify(templates)), message: 'Success', success: true, statusCode: 200 };
  },
  update: async (entityType: EntityType, config: EntityTemplateConfig): Promise<ApiResponse<EntityTemplateConfig>> => {
    await delay();
    templates[entityType] = { ...config, version: config.version + 1, lastUpdated: new Date().toISOString() };
    return { data: templates[entityType], message: 'Template updated', success: true, statusCode: 200 };
  },
  reset: async (entityType: EntityType): Promise<ApiResponse<EntityTemplateConfig>> => {
    await delay();
    templates[entityType] = JSON.parse(JSON.stringify(defaultTemplates[entityType]));
    return { data: templates[entityType], message: 'Template reset', success: true, statusCode: 200 };
  },
};
