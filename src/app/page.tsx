
'use client'; // Ensure this is a client component

import { useState } from 'react'; // Import useState for dialog control
import { Header } from '@/components/header';
import { NoteList } from '@/components/note-list';
import { NoteForm } from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Import DialogDescription
} from "@/components/ui/dialog";
import type { Note } from '@/types/note'; // Import Note type

export default function Home() {
  // State to control the "New Idea" dialog visibility
  const [newIdeaDialogOpen, setNewIdeaDialogOpen] = useState(false);

  // Placeholder function to handle saving new notes (needs implementation in NoteList or parent state)
  // This function will be passed to the NoteForm inside the "New Idea" dialog.
  // It needs to eventually trigger an update in the NoteList's data source.
  const handleNewNoteSave = (newNote: Note) => {
    console.log("New Note Saved (Placeholder):", newNote);
    // TODO: Implement logic to add the newNote to the actual data source
    // This might involve lifting state up, using context, or triggering a refetch in NoteList.
    // For now, we'll just close the dialog.
    setNewIdeaDialogOpen(false);
    // Ideally, after saving, we'd trigger a refresh of the NoteList.
    // This could be done via a shared state management or passing a refresh callback.
    // For simplicity now, we assume NoteList might refetch based on some event or prop change.
    // A simple (but not ideal) way is to force a reload, but better patterns exist.
    // window.location.reload(); // Avoid this in production

     // If NoteList exposes a refresh function or uses a context/store, call it here.
     // Example: refreshNoteList();
  };


  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">My Ideas</h1>
             <Dialog open={newIdeaDialogOpen} onOpenChange={setNewIdeaDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" /> New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Idea</DialogTitle>
                   <DialogDescription>
                     Capture your new idea's details below.
                   </DialogDescription>
                </DialogHeader>
                 {/* Pass the save handler to the NoteForm for creating new notes */}
                 {/* We pass undefined for existingNote to indicate it's a new note form */}
                <NoteForm onSuccess={handleNewNoteSave} />
              </DialogContent>
            </Dialog>
          </div>
           {/* NoteList will fetch and display notes. It needs a way to refresh when a new note is added. */}
          <NoteList />
        </div>
      </main>
    </div>
  );
}
