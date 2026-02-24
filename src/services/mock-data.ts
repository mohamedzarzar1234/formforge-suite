import type { TemplateConfig, Student, Teacher, Parent, Manager, SchoolClass, Level, Subject } from '@/types';

export const defaultTemplates: TemplateConfig = {
  student: {
    fields: [
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, order: 1, visible: true, editable: true, placeholder: '' },
      { name: 'gender', label: 'Gender', type: 'select', required: true, options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }], order: 2, visible: true, editable: true },
      { name: 'email', label: 'Email', type: 'email', required: false, order: 3, visible: true, editable: true, placeholder: 'student@school.com' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, order: 4, visible: true, editable: true, placeholder: '+1 234 567 890' },
      { name: 'address', label: 'Address', type: 'textarea', required: false, order: 5, visible: true, editable: true, placeholder: 'Full address' },
      { name: 'blood_group', label: 'Blood Group', type: 'select', required: false, options: [{ value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }], order: 6, visible: true, editable: true },
    ],
    version: 1,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
  teacher: {
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, order: 1, visible: true, editable: true, placeholder: 'teacher@school.com' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, order: 2, visible: true, editable: true },
      { name: 'qualification', label: 'Qualification', type: 'text', required: false, order: 3, visible: true, editable: true, placeholder: 'e.g. M.Ed, PhD' },
      { name: 'experience_years', label: 'Years of Experience', type: 'number', required: false, order: 4, visible: true, editable: true },
    ],
    version: 1,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
  manager: {
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, order: 1, visible: true, editable: true },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, order: 2, visible: true, editable: true },
      { name: 'department', label: 'Department', type: 'text', required: false, order: 3, visible: true, editable: true },
    ],
    version: 1,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
  parent: {
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, order: 1, visible: true, editable: true },
      { name: 'phone', label: 'Phone', type: 'phone', required: true, order: 2, visible: true, editable: true },
      { name: 'address', label: 'Address', type: 'textarea', required: false, order: 3, visible: true, editable: true },
      { name: 'occupation', label: 'Occupation', type: 'text', required: false, order: 4, visible: true, editable: true },
    ],
    version: 1,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
};

export const initialLevels: Level[] = [
  { id: 'lvl-1', name: 'Primary', description: 'Primary education level (Grades 1-5)' },
  { id: 'lvl-2', name: 'Middle', description: 'Middle school education (Grades 6-8)' },
  { id: 'lvl-3', name: 'High', description: 'High school education (Grades 9-12)' },
];

export const initialClasses: SchoolClass[] = [
  { id: 'cls-1', name: '1A', section: 'A', capacity: 30, levelId: 'lvl-1' },
  { id: 'cls-2', name: '1B', section: 'B', capacity: 30, levelId: 'lvl-1' },
  { id: 'cls-3', name: '6A', section: 'A', capacity: 25, levelId: 'lvl-2' },
  { id: 'cls-4', name: '6B', section: 'B', capacity: 25, levelId: 'lvl-2' },
  { id: 'cls-5', name: '9A', section: 'A', capacity: 20, levelId: 'lvl-3' },
  { id: 'cls-6', name: '9B', section: 'B', capacity: 20, levelId: 'lvl-3' },
];

export const initialSubjects: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', code: 'MATH', description: 'Core mathematics' },
  { id: 'sub-2', name: 'English', code: 'ENG', description: 'English language and literature' },
  { id: 'sub-3', name: 'Science', code: 'SCI', description: 'General science' },
  { id: 'sub-4', name: 'History', code: 'HIST', description: 'World history' },
  { id: 'sub-5', name: 'Art', code: 'ART', description: 'Visual arts' },
];

export const initialParents: Parent[] = [
  { id: 'par-1', firstname: 'Robert', lastname: 'Doe', studentIds: ['stu-1', 'stu-5'], dynamicFields: { email: 'robert.doe@email.com', phone: '+1 555 0101', address: '123 Oak Street', occupation: 'Engineer' }, createdAt: '2024-01-10T08:00:00Z' },
  { id: 'par-2', firstname: 'Sarah', lastname: 'Smith', studentIds: ['stu-2'], dynamicFields: { email: 'sarah.smith@email.com', phone: '+1 555 0102', occupation: 'Doctor' }, createdAt: '2024-01-10T08:00:00Z' },
  { id: 'par-3', firstname: 'Tom', lastname: 'Johnson', studentIds: ['stu-3'], dynamicFields: { email: 'tom.j@email.com', phone: '+1 555 0103', occupation: 'Teacher' }, createdAt: '2024-01-11T08:00:00Z' },
  { id: 'par-4', firstname: 'Lisa', lastname: 'Williams', studentIds: ['stu-4'], dynamicFields: { email: 'lisa.w@email.com', phone: '+1 555 0104', address: '789 Pine Road', occupation: 'Lawyer' }, createdAt: '2024-01-11T08:00:00Z' },
];

export const initialStudents: Student[] = [
  { id: 'stu-1', firstname: 'John', lastname: 'Doe', parentIds: ['par-1'], defaultParentId: 'par-1', classId: 'cls-1', levelId: 'lvl-1', dynamicFields: { date_of_birth: '2015-05-15', gender: 'male', email: 'john.doe@school.com', blood_group: 'A+' }, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'stu-2', firstname: 'Jane', lastname: 'Smith', parentIds: ['par-2'], defaultParentId: 'par-2', classId: 'cls-2', levelId: 'lvl-1', dynamicFields: { date_of_birth: '2015-08-22', gender: 'female', blood_group: 'B+' }, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'stu-3', firstname: 'Mike', lastname: 'Johnson', parentIds: ['par-3'], defaultParentId: 'par-3', classId: 'cls-3', levelId: 'lvl-2', dynamicFields: { date_of_birth: '2012-03-10', gender: 'male', blood_group: 'O+' }, createdAt: '2024-02-01T10:00:00Z' },
  { id: 'stu-4', firstname: 'Emily', lastname: 'Williams', parentIds: ['par-4'], defaultParentId: 'par-4', classId: 'cls-4', levelId: 'lvl-2', dynamicFields: { date_of_birth: '2012-11-05', gender: 'female', address: '789 Pine Road' }, createdAt: '2024-02-01T10:00:00Z' },
  { id: 'stu-5', firstname: 'David', lastname: 'Brown', parentIds: ['par-1'], defaultParentId: 'par-1', classId: 'cls-5', levelId: 'lvl-3', dynamicFields: { date_of_birth: '2009-07-20', gender: 'male', phone: '+1 555 9999' }, createdAt: '2024-02-15T10:00:00Z' },
];

export const initialTeachers: Teacher[] = [
  { id: 'tea-1', firstname: 'Alice', lastname: 'Cooper', subjectIds: ['sub-1', 'sub-2'], classAssignments: [{ classId: 'cls-1', subjectIds: ['sub-1'] }, { classId: 'cls-2', subjectIds: ['sub-1', 'sub-2'] }], dynamicFields: { email: 'alice.cooper@school.com', phone: '+1 555 1001', qualification: 'M.Ed Mathematics', experience_years: '8' }, createdAt: '2024-01-05T08:00:00Z' },
  { id: 'tea-2', firstname: 'Bob', lastname: 'Martin', subjectIds: ['sub-3'], classAssignments: [{ classId: 'cls-3', subjectIds: ['sub-3'] }, { classId: 'cls-4', subjectIds: ['sub-3'] }], dynamicFields: { email: 'bob.martin@school.com', qualification: 'PhD Science', experience_years: '12' }, createdAt: '2024-01-05T08:00:00Z' },
  { id: 'tea-3', firstname: 'Carol', lastname: 'Davis', subjectIds: ['sub-4', 'sub-5'], classAssignments: [{ classId: 'cls-5', subjectIds: ['sub-4'] }, { classId: 'cls-6', subjectIds: ['sub-4', 'sub-5'] }], dynamicFields: { email: 'carol.davis@school.com', phone: '+1 555 1003', experience_years: '5' }, createdAt: '2024-01-06T08:00:00Z' },
];

export const initialManagers: Manager[] = [
  { id: 'mgr-1', firstname: 'Frank', lastname: 'Wilson', classIds: ['cls-1', 'cls-2', 'cls-3'], dynamicFields: { email: 'frank.w@school.com', phone: '+1 555 2001', department: 'Academic Affairs' }, createdAt: '2024-01-03T08:00:00Z' },
  { id: 'mgr-2', firstname: 'Grace', lastname: 'Taylor', classIds: ['cls-4', 'cls-5', 'cls-6'], dynamicFields: { email: 'grace.t@school.com', phone: '+1 555 2002', department: 'Administration' }, createdAt: '2024-01-03T08:00:00Z' },
];
