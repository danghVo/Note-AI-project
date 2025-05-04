import db from "@/lib/mongodb";
import { Attachment, NoteStorage } from "@/types/note";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// https://developer.mozilla.org/docs/Web/API/ReadableStream#convert_async_iterator_to_stream
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
 
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}
 

interface Params {
    id: string;
}

// GET /api/attachments - Get all attachments
export async function GET(_: Request, { params }: { params: Params }) {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    try {
        const collection = db.collection<NoteStorage>("notes");

        const [note] = await collection
            .find<NoteStorage>({
                "attachments._id": id,
            })
            .project({
                "attachments.$": 1,
            })
            .toArray();

        if (!note) {
            return NextResponse.json({ message: "Attachment not found" }, { status: 404 });
        }
        const attachment = note.attachments[0];

        return new NextResponse(iteratorToStream(attachment.content.buffer.values()), {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${attachment.name}"`,
            },
        });
    } catch (error) {
        console.error("Error fetching attachment:", error);
        return NextResponse.json({ message: "Failed to fetch attachment" }, { status: 500 });
    }
}
