import db from "@/lib/mongodb";
import { NextResponse } from "next/server";

// GET /api/notes - Fetch all notes (with optional search)
export async function GET(_: Request) {
    try {
        return NextResponse.json(
            {
                stats: await db.stats(),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to fetch db stats:", error);
        return NextResponse.json({ message: "Failed to fetch db stats" }, { status: 500 });
    }
}
