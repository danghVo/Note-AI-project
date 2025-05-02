
'use client';

import { useState, useRef, useCallback } from 'react'; // Import useRef and useCallback
import { Header } from '@/components/header';
import { NoteList } from '@/components/note-list';
import { NoteForm } from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Note } from '@/types/note';

export default function Home() {
  const [newIdeaDialogOpen, setNewIdeaDialogOpen] = useState(false);
  // We can potentially remove isCreatingNewIdea if NoteForm manages its own state fully
  // const [isCreatingNewIdea, setIsCreatingNewIdea] = useState(false);

  // Ref to hold a function that triggers reload in NoteList
  const reloadNoteListRef = useRef<(() => Promise<void>) | null>(null);


  // Callback passed to NoteForm, called after successful API save/update
  const handleNoteSaveSuccess = (savedNote: Note) => {
    console.log("Note save successful on Home page, closing dialog & refreshing list.");
    setNewIdeaDialogOpen(false); // Close the dialog

    // Trigger reload in NoteList using the ref
    reloadNoteListRef.current?.();
  };

   // Callback passed to NoteList to register its reload function
   const registerReloadHandler = useCallback((reloadFn: () => Promise<void>) => {
       reloadNoteListRef.current = reloadFn;
   }, []);


  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">My Ideas</h1>
             <Dialog open={newIdeaDialogOpen} onOpenChange={setNewIdeaDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default"> {/* Removed disabled state based on isCreatingNewIdea */}
                 {/* Consider if loading state here is still needed or handled within NoteForm button */}
                 {/* {isCreatingNewIdea ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : ( */}
                    <Plus className="mr-2 h-4 w-4" />
                  {/* )} */}
                   New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Idea</DialogTitle>
                   <DialogDescription>
                     Capture your new idea's details below.
                   </DialogDescription>
                </DialogHeader>
                {/* Pass the success handler to NoteForm */}
                {/* NoteForm handles its own API call and loading state */}
                <NoteForm onSuccess={handleNoteSaveSuccess} />
              </DialogContent>
            </Dialog>
          </div>
           {/* Pass the register function to NoteList */}
          <NoteList onRegisterReload={registerReloadHandler} />
        </div>
      </main>
    </div>
  );
}
