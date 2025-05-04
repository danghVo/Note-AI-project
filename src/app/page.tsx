"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react"; // Import useRef and useCallback
import { Header } from "@/components/header";
import { NoteList } from "@/components/note-list";
import { NoteForm } from "@/components/note-form";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import type { Note } from "@/types/note";

export default function Home() {
    const [newIdeaDialogOpen, setNewNoteDialogOpen] = useState(false);
    const [stats, setStats] = useState<{
        db: string;
        storageSize: number;
        indexSize: number;
        dataSize: number;
    }>({
        db: "loading...",
        storageSize: 0,
        indexSize: 0,
        dataSize: 0,
    });
    // We can potentially remove isCreatingNewIdea if NoteForm manages its own state fully
    // const [isCreatingNewIdea, setIsCreatingNewIdea] = useState(false);

    // Ref to hold a function that triggers reload in NoteList
    const reloadNoteListRef = useRef<(() => Promise<void>) | null>(null);

    const loadDbStats = useCallback(async () => {
        const response = await fetch("/api/db/stats");
        const { stats } = await response.json();

        setStats(stats);
    }, []);

    useEffect(() => {
        loadDbStats();
    }, []);

    // Callback passed to NoteForm, called after successful API save/update
    const handleNoteSaveSuccess = () => {
        setNewNoteDialogOpen(false);
        reloadNoteListRef.current?.();
    };

    // Callback passed to NoteList to register its reload function
    const registerReloadHandler = useCallback((reloadFn: () => Promise<void>) => {
        reloadNoteListRef.current = reloadFn;
    }, []);

    return (
        <Suspense>
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <main className="flex-grow p-4 md:p-8">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-2xl font-semibold pb-5">
                            Storage Used: {Math.round((stats.dataSize * 100) / 1024) / 100} MB
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold text-foreground">My notes</h1>
                            <Dialog open={newIdeaDialogOpen} onOpenChange={setNewNoteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Note
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Create New Note</DialogTitle>
                                        <DialogDescription>
                                            Capture your new note's details below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <NoteForm onSuccess={handleNoteSaveSuccess} />
                                </DialogContent>
                            </Dialog>
                        </div>
                        {/* Pass the register function to NoteList */}
                        <NoteList onRegisterReload={registerReloadHandler} />
                    </div>
                </main>
            </div>
        </Suspense>
    );
}
