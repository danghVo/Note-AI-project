import type { Binary, ObjectId } from "mongodb";

export type NotePriority = "low" | "medium" | "high";

export interface AttachmentFile extends File {
    _id?: string;
}

// Represents a Note object primarily used on the client-side
export interface Note {
    _id?: ObjectId | string; // Optional: MongoDB's primary key (can be ObjectId or string)
    id: string; // Required: String identifier used consistently in the client (usually string version of _id)
    title: string;
    content: string; // HTML content from rich text editor
    priority: NotePriority;
    createdAt: string; // Can be Date object or ISO string representation
    attachments: AttachmentFile[];
}

// Type for data sent TO the API routes (e.g., for creating/updating)
// Does not include `id` or `_id` as these are handled by the backend/database.
export interface NoteInputData {
    title: string;
    content: string;
    priority: NotePriority;
    createdAt: Date | string; // Accept Date or ISO string
    attachments?: { name: string; type: string; content: string }[]; // Define how attachments are sent if re-added
}

export interface Attachment {
    _id?: ObjectId | string;
    name: string;
    type: string;
    content: Binary;
}

export interface NoteStorage {
    _id?: ObjectId | string; // Optional: MongoDB's primary key (can be ObjectId or string)
    id: string; // Required: String identifier used consistently in the client (usually string version of _id)
    title: string;
    content: string; // HTML content from rich text editor
    priority: NotePriority;
    createdAt: Date | string; // Accept Date or ISO string
    attachments?: Attachment[]; // Define how attachments are sent if re-added
}

export interface NoteUpdateData extends NoteStorage {
    attachments?: Attachment[];
}
