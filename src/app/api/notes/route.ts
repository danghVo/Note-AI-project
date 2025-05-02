// src/app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Note, NoteInputData } from '@/types/note';

// GET /api/notes - Fetch all notes (with optional search)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');

    const { db } = await connectToDatabase();
    const collection = db.collection<Note>('notes');

    let query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search
       // Basic text search on title and content (assumes content is stored as plain text or searchable HTML)
       // For more robust search on HTML, consider stripping tags before querying or using dedicated search features.
      query = {
        $or: [
          { title: { $regex: regex } },
          { content: { $regex: regex } } // Basic search on content string
        ],
      };
    }

    const notes = await collection.find(query).sort({ createdAt: -1 }).toArray();

     // Map _id to id for client-side consistency
    const notesWithId = notes.map(note => ({
        ...note,
        id: note._id.toString(),
        createdAt: new Date(note.createdAt).toISOString(), // Ensure consistent date format
    }));


    return NextResponse.json(notesWithId, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  try {
    const noteData = (await request.json()) as NoteInputData;

    // Basic validation (can be expanded with Zod)
    if (!noteData.title || !noteData.content || !noteData.priority || !noteData.createdAt) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<Note>('notes');

    // Ensure createdAt is a Date object
    const noteToInsert: Omit<Note, '_id' | 'id'> = {
        ...noteData,
        createdAt: new Date(noteData.createdAt),
        // attachments: [] // Initialize attachments if re-adding the feature
    };


    const result = await collection.insertOne(noteToInsert as Note); // Cast needed as insertOne expects full Note type

    if (!result.insertedId) {
         throw new Error('Failed to insert note');
    }

     const insertedNote: Note = {
        ...noteToInsert,
        _id: result.insertedId,
        id: result.insertedId.toString(), // Add string id for client
        createdAt: noteToInsert.createdAt.toISOString(), // Return ISO string
    };

    return NextResponse.json(insertedNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
     // Check if the error is a validation error or other server error
    if (error instanceof Error && (error.message.includes('required fields') || error.message.includes('validation'))) {
       return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create note' }, { status: 500 });
  }
}
