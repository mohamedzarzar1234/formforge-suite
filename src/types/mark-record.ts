export interface MarkRecordType {
  id: string;
  name: string;
  // e.g. "Recitation", "Testing", "Memorization"
}

export interface OfficialTemplateColumn {
  id: string;
  name: string;
  maxScore: number;
  order: number;
}

export interface OfficialTemplate {
  id: string;
  name: string;
  columns: OfficialTemplateColumn[];
}

// A non-official mark record: one row per student per entry
export interface NonOfficialMarkRecord {
  id: string;
  studentId: string;
  subjectId: string;
  levelId: string;
  classId: string;
  typeId: string; // references MarkRecordType.id
  score: number;
  date: string;
  notes: string;
  isOfficial: false;
  createdAt: string;
}

// An official mark record: one row per student, scores per template column
export interface OfficialMarkRecord {
  id: string;
  studentId: string;
  subjectId: string;
  levelId: string;
  classId: string;
  templateId: string; // references OfficialTemplate.id
  scores: Record<string, number>; // columnId -> score
  date: string;
  notes: string;
  isOfficial: true;
  createdAt: string;
}

export type MarkRecord = NonOfficialMarkRecord | OfficialMarkRecord;

export interface MarkRecordSettings {
  types: MarkRecordType[];
  officialTemplates: OfficialTemplate[];
}
