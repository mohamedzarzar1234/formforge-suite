export interface NoteTemplate {
  id: string;
  title: string;
  type: 'positive' | 'negative';
  isPointEffect: boolean;
  pointEffect: number; // how many points to add/deduct
  isSendNotification: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  templateId: string;
  studentIds: string[];
  date: string;
  description?: string;
  createdAt: string;
}

export interface PointRecord {
  id: string;
  studentId: string;
  type: 'positive' | 'negative';
  amount: number;
  date: string;
  sourceNoteId?: string;
  createdAt: string;
}
