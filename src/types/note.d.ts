export type NotePriority = 'low' | 'medium' | 'high';

export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from rich text editor
  priority: NotePriority;
  createdAt: Date;
  attachments: File[]; // Store File objects directly or URLs/references if uploaded
}
