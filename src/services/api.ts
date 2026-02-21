import { API_CONFIG } from '@/config';
import { mockStore, generateId } from './mock-data';
import { EntityType, FieldDefinition, EntityTemplateConfig, Level, SchoolClass, Subject } from '@/types';

const delay = () => new Promise(r => setTimeout(r, API_CONFIG.MOCK_DELAY));

// ─── Templates ───
export async function getTemplate(entityType: EntityType): Promise<EntityTemplateConfig> {
  await delay();
  return JSON.parse(JSON.stringify(mockStore.templates[entityType]));
}

export async function updateTemplate(entityType: EntityType, fields: FieldDefinition[]): Promise<EntityTemplateConfig> {
  await delay();
  mockStore.templates[entityType] = {
    fields,
    version: mockStore.templates[entityType].version + 1,
    lastUpdated: new Date().toISOString(),
  };
  return JSON.parse(JSON.stringify(mockStore.templates[entityType]));
}

// ─── Generic Entity CRUD ───
type StoreKey = 'students' | 'teachers' | 'parents' | 'managers';
const entityStoreMap: Record<EntityType, StoreKey> = {
  student: 'students', teacher: 'teachers', parent: 'parents', manager: 'managers',
};

export async function getEntities(type: EntityType) {
  await delay();
  return JSON.parse(JSON.stringify(mockStore[entityStoreMap[type]]));
}

export async function getEntityById(type: EntityType, id: string) {
  await delay();
  const store = mockStore[entityStoreMap[type]];
  const entity = store.find((e: any) => e.id === id);
  if (!entity) throw new Error(`${type} not found`);
  return JSON.parse(JSON.stringify(entity));
}

export async function createEntity(type: EntityType, data: any) {
  await delay();
  const now = new Date().toISOString();
  const store = mockStore[entityStoreMap[type]] as any[];
  const id = type === 'student' ? `STU${String(store.length + 1).padStart(3, '0')}` : generateId();
  const entity = { ...data, id, createdAt: now, updatedAt: now };
  store.push(entity);
  return JSON.parse(JSON.stringify(entity));
}

export async function updateEntity(type: EntityType, id: string, data: any) {
  await delay();
  const store = mockStore[entityStoreMap[type]] as any[];
  const idx = store.findIndex((e: any) => e.id === id);
  if (idx === -1) throw new Error(`${type} not found`);
  store[idx] = { ...store[idx], ...data, updatedAt: new Date().toISOString() };
  return JSON.parse(JSON.stringify(store[idx]));
}

export async function deleteEntity(type: EntityType, id: string) {
  await delay();
  const key = entityStoreMap[type];
  const store = mockStore[key] as any[];
  const idx = store.findIndex((e: any) => e.id === id);
  if (idx === -1) throw new Error(`${type} not found`);
  store.splice(idx, 1);
  return { success: true };
}

// ─── Levels ───
export async function getLevels(): Promise<Level[]> {
  await delay();
  return JSON.parse(JSON.stringify(mockStore.levels));
}

export async function createLevel(data: Omit<Level, 'id'>): Promise<Level> {
  await delay();
  const level = { ...data, id: generateId() };
  mockStore.levels.push(level);
  return JSON.parse(JSON.stringify(level));
}

export async function updateLevel(id: string, data: Partial<Level>): Promise<Level> {
  await delay();
  const idx = mockStore.levels.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('Level not found');
  mockStore.levels[idx] = { ...mockStore.levels[idx], ...data };
  return JSON.parse(JSON.stringify(mockStore.levels[idx]));
}

export async function deleteLevel(id: string) {
  await delay();
  const idx = mockStore.levels.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('Level not found');
  mockStore.levels.splice(idx, 1);
  return { success: true };
}

// ─── Classes ───
export async function getClasses(): Promise<SchoolClass[]> {
  await delay();
  return JSON.parse(JSON.stringify(mockStore.classes));
}

export async function createClass(data: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
  await delay();
  const cls = { ...data, id: generateId() };
  mockStore.classes.push(cls);
  return JSON.parse(JSON.stringify(cls));
}

export async function updateClass(id: string, data: Partial<SchoolClass>): Promise<SchoolClass> {
  await delay();
  const idx = mockStore.classes.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Class not found');
  mockStore.classes[idx] = { ...mockStore.classes[idx], ...data };
  return JSON.parse(JSON.stringify(mockStore.classes[idx]));
}

export async function deleteClass(id: string) {
  await delay();
  const idx = mockStore.classes.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Class not found');
  mockStore.classes.splice(idx, 1);
  return { success: true };
}

// ─── Subjects ───
export async function getSubjects(): Promise<Subject[]> {
  await delay();
  return JSON.parse(JSON.stringify(mockStore.subjects));
}

export async function createSubject(data: Omit<Subject, 'id'>): Promise<Subject> {
  await delay();
  const subj = { ...data, id: generateId() };
  mockStore.subjects.push(subj);
  return JSON.parse(JSON.stringify(subj));
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  await delay();
  const idx = mockStore.subjects.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Subject not found');
  mockStore.subjects[idx] = { ...mockStore.subjects[idx], ...data };
  return JSON.parse(JSON.stringify(mockStore.subjects[idx]));
}

export async function deleteSubject(id: string) {
  await delay();
  const idx = mockStore.subjects.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Subject not found');
  mockStore.subjects.splice(idx, 1);
  return { success: true };
}

// ─── Search ───
export async function globalSearch(query: string) {
  await delay();
  const q = query.toLowerCase();
  const results: { type: EntityType; id: string; name: string; extra?: string }[] = [];

  mockStore.students.forEach(s => {
    if (`${s.firstname} ${s.lastname}`.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) {
      results.push({ type: 'student', id: s.id, name: `${s.firstname} ${s.lastname}`, extra: s.id });
    }
  });
  mockStore.teachers.forEach(t => {
    if (`${t.firstname} ${t.lastname}`.toLowerCase().includes(q)) {
      results.push({ type: 'teacher', id: t.id, name: `${t.firstname} ${t.lastname}` });
    }
  });
  mockStore.managers.forEach(m => {
    if (`${m.firstname} ${m.lastname}`.toLowerCase().includes(q)) {
      results.push({ type: 'manager', id: m.id, name: `${m.firstname} ${m.lastname}` });
    }
  });

  return results;
}

// ─── Stats ───
export async function getDashboardStats() {
  await delay();
  return {
    students: mockStore.students.length,
    teachers: mockStore.teachers.length,
    parents: mockStore.parents.length,
    managers: mockStore.managers.length,
    classes: mockStore.classes.length,
    levels: mockStore.levels.length,
    subjects: mockStore.subjects.length,
  };
}
