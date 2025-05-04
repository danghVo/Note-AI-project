import { NextResponse } from "next/server";
import db from "@/lib/mongodb";
import { Binary, ObjectId } from "mongodb";
import type { Attachment, Note, NoteInputData, NoteStorage } from "@/types/note";
import { decode } from "base64-arraybuffer";

// GET /api/notes - Fetch all notes (with optional search)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get("search");

        const collection = db.collection<NoteStorage>("notes");

        let query = {};
        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // Case-insensitive search

            query = {
                $or: [
                    { title: { $regex: regex } },
                    { content: { $regex: regex } }, // Basic search on content string
                ],
            };
        }

        const notes = await collection.find(query).sort({ createdAt: -1 }).toArray();

        // Map _id to id for client-side consistency
        const notesWithId = notes.map((note) => ({
            ...note,
            id: note._id.toString(),
            createdAt: new Date(note.createdAt).toISOString(), 
            attachments: note.attachments?.map((attachment) => ({
               ...attachment,
                content: undefined
            })) || [],
        }));

        return NextResponse.json(notesWithId, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return NextResponse.json({ message: "Failed to fetch notes" }, { status: 500 });
    }
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
    try {
        const noteData = (await request.json()) as NoteInputData;

        // Basic validation (can be expanded with Zod)
        if (!noteData.title || !noteData.content || !noteData.priority || !noteData.createdAt) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const collection = db.collection<NoteStorage>("notes");

        let attachments: Attachment[] = [];
        if (noteData.attachments) {
            if (!Array.isArray(noteData.attachments)) {
                return NextResponse.json(
                    { message: "Invalid attachments format" },
                    { status: 400 }
                );
            }

            attachments = noteData.attachments.map((attachment) => {
                return {
                    _id: new ObjectId().toString(),
                    ...attachment,
                    content: new Binary(new Uint8Array(decode(attachment.content))),
                };
            });
        }

        // Ensure createdAt is a Date object
        const noteToInsert: Omit<NoteStorage, "_id" | "id"> = {
            ...noteData,
            createdAt: new Date(noteData.createdAt).toISOString(),
            attachments,
        };

        const result = await collection.insertOne(noteToInsert as NoteStorage); // Cast needed as insertOne expects full Note type

        if (!result.insertedId) {
            throw new Error("Failed to insert note");
        }

        return NextResponse.json(
            {
                ...noteToInsert,
                _id: result.insertedId,
                id: result.insertedId.toString(), // Add string id for client
                createdAt: noteToInsert.createdAt, // Return ISO string
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create note:", error);
        // Check if the error is a validation error or other server error
        if (
            error instanceof Error &&
            (error.message.includes("required fields") || error.message.includes("validation"))
        ) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: "Failed to create note" }, { status: 500 });
    }
}
