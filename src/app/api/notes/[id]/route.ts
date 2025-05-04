import db from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { Binary, ObjectId } from "mongodb";
import type { Attachment, Note, NoteInputData, NoteUpdateData } from "@/types/note";
import { decode } from "base64-arraybuffer";

interface Params {
    id: string;
}

// PUT /api/notes/[id] - Update a specific note
export async function PUT(request: Request, { params }: { params: Params }) {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    try {
        const noteData = (await request.json()) as NoteInputData;

        // Basic validation (can be expanded with Zod)
        if (!noteData.title || !noteData.content || !noteData.priority || !noteData.createdAt) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const collection = db.collection<NoteUpdateData>("notes");

        const objectId = new ObjectId(id);

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
                    _id: new ObjectId().toString(), // Generate a new ID for each attachment
                    ...attachment,
                    content: new Binary(new Uint8Array(decode(attachment.content))),
                };
            });
        }

        // Prepare update data, ensuring createdAt is a Date
        const updateData: Omit<NoteUpdateData, "_id" | "id"> = {
            title: noteData.title,
            content: noteData.content,
            priority: noteData.priority,
            createdAt: new Date(noteData.createdAt).toISOString(),
            attachments: attachments.length > 0 ? attachments : undefined, // Handle attachments if re-adding
        };

        const result = await collection.updateOne({ _id: objectId }, { $set: updateData });

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            // Note found, but no changes were made (data was the same)
            // Fetch the existing note to return it
            const existingNote = await collection.findOne({ _id: objectId });
            if (!existingNote) {
                return NextResponse.json(
                    { message: "Note not found after update check" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                {
                    ...existingNote,
                    id: existingNote._id.toString(),
                    createdAt: new Date(existingNote.createdAt).toISOString(),
                    attachments:
                        existingNote.attachments?.map((attachment) => ({
                            ...attachment,
                            content: undefined,
                        })) || [],
                },
                { status: 200 }
            );
        }

        // Construct the updated note to return
        const updatedNote: NoteUpdateData = {
            _id: objectId,
            id: objectId.toString(),
            ...updateData,
            createdAt: updateData.createdAt, // Return ISO string
        };

        return NextResponse.json(updatedNote, { status: 200 });
    } catch (error) {
        console.error(`Failed to update note ${id}:`, error);
        if (
            error instanceof Error &&
            (error.message.includes("required fields") || error.message.includes("validation"))
        ) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: "Failed to update note" }, { status: 500 });
    }
}

// DELETE /api/notes/[id] - Delete a specific note
export async function DELETE(request: Request, { params }: { params: Params }) {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    try {
        const collection = db.collection<Note>("notes");

        const objectId = new ObjectId(id);

        const result = await collection.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 }); // Or 204 No Content
    } catch (error) {
        console.error(`Failed to delete note ${id}:`, error);
        return NextResponse.json({ message: "Failed to delete note" }, { status: 500 });
    }
}
