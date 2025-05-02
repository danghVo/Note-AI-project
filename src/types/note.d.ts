import type { ObjectId } from 'mongodb';

export type NotePriority = 'low' | 'medium' | 'high';

// Represents a Note object primarily used on the client-side
export interface Note {
  _id?: ObjectId | string; // Optional: MongoDB's primary key (can be ObjectId or string)
  id: string;           // Required: String identifier used consistently in the client (usually string version of _id)
  title: string;
  content: string;       // HTML content from rich text editor
  priority: NotePriority;
  createdAt: Date | string; // Can be Date object or ISO string representation
  // attachments: File[]; // Temporarily removed for simplicity
}

// Type for data sent TO the API routes (e.g., for creating/updating)
// Does not include `id` or `_id` as these are handled by the backend/database.
export interface NoteInputData {
  title: string;
  content: string;
  priority: NotePriority;
  createdAt: Date | string; // Accept Date or ISO string
   // attachments: any[]; // Define how attachments are sent if re-added
}
