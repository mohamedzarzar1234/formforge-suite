import { FieldDefinition, Student, Teacher, Parent, Manager, SchoolClass, Level, Subject, EntityTemplateConfig } from '@/types';

let idCounter = 100;
export const generateId = () => String(++idCounter);

const studentFields: FieldDefinition[] = [
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, order: 1, visible: true, editable: true },
  { name: 'gender', label: 'Gender', type: 'select', required: true, options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], order: 2, visible: true, editable: true },
  { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'student@school.com', order: 3, visible: true, editable: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '+1 234 567 8900', order: 4, visible: true, editable: true },
  { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Full address', order: 5, visible: true, editable: true },
  { name: 'bloodType', label: 'Blood Type', type: 'select', required: false, options: [
    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
  ], order: 6, visible: true, editable: true },
];

const teacherFields: FieldDefinition[] = [
  { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'teacher@school.com', order: 1, visible: true, editable: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '+1 234 567 8900', order: 2, visible: true, editable: true },
  { name: 'qualification', label: 'Qualification', type: 'text', required: false, placeholder: 'e.g. M.Ed, B.Sc', order: 3, visible: true, editable: true },
  { name: 'experience', label: 'Years of Experience', type: 'number', required: false, placeholder: '0', order: 4, visible: true, editable: true },
];

const parentFields: FieldDefinition[] = [
  { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'parent@email.com', order: 1, visible: true, editable: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: true, placeholder: '+1 234 567 8900', order: 2, visible: true, editable: true },
  { name: 'occupation', label: 'Occupation', type: 'text', required: false, placeholder: 'e.g. Engineer', order: 3, visible: true, editable: true },
  { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Full address', order: 4, visible: true, editable: true },
];

const managerFields: FieldDefinition[] = [
  { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'manager@school.com', order: 1, visible: true, editable: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '+1 234 567 8900', order: 2, visible: true, editable: true },
  { name: 'department', label: 'Department', type: 'text', required: false, placeholder: 'e.g. Administration', order: 3, visible: true, editable: true },
  { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'e.g. Vice Principal', order: 4, visible: true, editable: true },
];

const now = new Date().toISOString();

export const mockStore = {
  templates: {
    student: { fields: studentFields, version: 1, lastUpdated: now } as EntityTemplateConfig,
    teacher: { fields: teacherFields, version: 1, lastUpdated: now } as EntityTemplateConfig,
    parent: { fields: parentFields, version: 1, lastUpdated: now } as EntityTemplateConfig,
    manager: { fields: managerFields, version: 1, lastUpdated: now } as EntityTemplateConfig,
  },
  levels: [
    { id: '1', name: 'Grade 1', description: 'First grade primary' },
    { id: '2', name: 'Grade 2', description: 'Second grade primary' },
    { id: '3', name: 'Grade 3', description: 'Third grade primary' },
  ] as Level[],
  classes: [
    { id: '1', name: 'G1-A', section: 'A', capacity: 30, levelId: '1' },
    { id: '2', name: 'G1-B', section: 'B', capacity: 30, levelId: '1' },
    { id: '3', name: 'G2-A', section: 'A', capacity: 28, levelId: '2' },
    { id: '4', name: 'G2-B', section: 'B', capacity: 28, levelId: '2' },
    { id: '5', name: 'G3-A', section: 'A', capacity: 25, levelId: '3' },
    { id: '6', name: 'G3-B', section: 'B', capacity: 25, levelId: '3' },
  ] as SchoolClass[],
  subjects: [
    { id: '1', name: 'Mathematics', code: 'MATH', description: 'Core mathematics' },
    { id: '2', name: 'English', code: 'ENG', description: 'English language and literature' },
    { id: '3', name: 'Science', code: 'SCI', description: 'General science' },
    { id: '4', name: 'History', code: 'HIST', description: 'World and national history' },
    { id: '5', name: 'Art', code: 'ART', description: 'Visual arts and crafts' },
  ] as Subject[],
  students: [
    { id: 'STU001', firstname: 'Emma', lastname: 'Johnson', levelId: '1', classId: '1', parentIds: ['1'], defaultParentId: '1', dateOfBirth: '2017-03-15', gender: 'female', email: '', phone: '', address: '123 Oak St', bloodType: 'A+', createdAt: now, updatedAt: now },
    { id: 'STU002', firstname: 'Liam', lastname: 'Smith', levelId: '1', classId: '1', parentIds: ['2'], defaultParentId: '2', dateOfBirth: '2017-06-22', gender: 'male', email: '', phone: '', address: '456 Elm St', bloodType: 'B+', createdAt: now, updatedAt: now },
    { id: 'STU003', firstname: 'Sophia', lastname: 'Williams', levelId: '1', classId: '2', parentIds: ['3'], defaultParentId: '3', dateOfBirth: '2017-01-10', gender: 'female', email: '', phone: '', address: '789 Pine Ave', bloodType: 'O+', createdAt: now, updatedAt: now },
    { id: 'STU004', firstname: 'Noah', lastname: 'Brown', levelId: '2', classId: '3', parentIds: ['1'], defaultParentId: '1', dateOfBirth: '2016-09-05', gender: 'male', email: '', phone: '', address: '321 Maple Dr', bloodType: 'AB+', createdAt: now, updatedAt: now },
    { id: 'STU005', firstname: 'Olivia', lastname: 'Davis', levelId: '2', classId: '4', parentIds: ['4'], defaultParentId: '4', dateOfBirth: '2016-11-30', gender: 'female', email: '', phone: '', address: '654 Cedar Ln', bloodType: 'A-', createdAt: now, updatedAt: now },
    { id: 'STU006', firstname: 'James', lastname: 'Wilson', levelId: '3', classId: '5', parentIds: ['5'], defaultParentId: '5', dateOfBirth: '2015-04-18', gender: 'male', email: '', phone: '', address: '987 Birch Rd', bloodType: 'O+', createdAt: now, updatedAt: now },
  ] as Student[],
  teachers: [
    { id: '1', firstname: 'Sarah', lastname: 'Anderson', subjectIds: ['1', '3'], classIds: ['1', '3'], email: 'sarah.a@school.com', phone: '+1 555 0101', qualification: 'M.Ed Mathematics', experience: 8, createdAt: now, updatedAt: now },
    { id: '2', firstname: 'Michael', lastname: 'Chen', subjectIds: ['2'], classIds: ['1', '2'], email: 'michael.c@school.com', phone: '+1 555 0102', qualification: 'B.A. English Lit.', experience: 5, createdAt: now, updatedAt: now },
    { id: '3', firstname: 'Rachel', lastname: 'Torres', subjectIds: ['3', '4'], classIds: ['3', '4'], email: 'rachel.t@school.com', phone: '+1 555 0103', qualification: 'M.Sc Biology', experience: 12, createdAt: now, updatedAt: now },
    { id: '4', firstname: 'David', lastname: 'Kim', subjectIds: ['5'], classIds: ['5', '6'], email: 'david.k@school.com', phone: '+1 555 0104', qualification: 'B.F.A.', experience: 3, createdAt: now, updatedAt: now },
  ] as Teacher[],
  parents: [
    { id: '1', firstname: 'Robert', lastname: 'Johnson', studentIds: ['STU001', 'STU004'], email: 'robert.j@email.com', phone: '+1 555 0201', occupation: 'Engineer', address: '123 Oak St', createdAt: now, updatedAt: now },
    { id: '2', firstname: 'Linda', lastname: 'Smith', studentIds: ['STU002'], email: 'linda.s@email.com', phone: '+1 555 0202', occupation: 'Doctor', address: '456 Elm St', createdAt: now, updatedAt: now },
    { id: '3', firstname: 'Patricia', lastname: 'Williams', studentIds: ['STU003'], email: 'patricia.w@email.com', phone: '+1 555 0203', occupation: 'Lawyer', address: '789 Pine Ave', createdAt: now, updatedAt: now },
    { id: '4', firstname: 'James', lastname: 'Davis', studentIds: ['STU005'], email: 'james.d@email.com', phone: '+1 555 0204', occupation: 'Accountant', address: '654 Cedar Ln', createdAt: now, updatedAt: now },
    { id: '5', firstname: 'Mary', lastname: 'Wilson', studentIds: ['STU006'], email: 'mary.w@email.com', phone: '+1 555 0205', occupation: 'Teacher', address: '987 Birch Rd', createdAt: now, updatedAt: now },
  ] as Parent[],
  managers: [
    { id: '1', firstname: 'William', lastname: 'Harris', classIds: ['1', '2', '3'], email: 'william.h@school.com', phone: '+1 555 0301', department: 'Administration', position: 'Principal', createdAt: now, updatedAt: now },
    { id: '2', firstname: 'Elizabeth', lastname: 'Martin', classIds: ['4', '5', '6'], email: 'elizabeth.m@school.com', phone: '+1 555 0302', department: 'Academic', position: 'Vice Principal', createdAt: now, updatedAt: now },
    { id: '3', firstname: 'Thomas', lastname: 'Garcia', classIds: ['1', '3', '5'], email: 'thomas.g@school.com', phone: '+1 555 0303', department: 'Student Affairs', position: 'Dean of Students', createdAt: now, updatedAt: now },
  ] as Manager[],
};
