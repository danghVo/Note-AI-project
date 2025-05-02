

'use client'; // Ensure this is a client component

import { useState } from 'react'; // Import useState for dialog control
import { Header } from '@/components/header';
import { NoteList } from '@/components/note-list';
import { NoteForm } from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react'; // Import Loader2
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
  // State to track loading state for the new idea form
  const [isCreatingNewIdea, setIsCreatingNewIdea] = useState(false);
  // State to trigger reload in NoteList (could be a counter or boolean)
  const [reloadCounter, setReloadCounter] = useState(0);


  // This function will be passed to the NoteForm inside the "New Idea" dialog.
  // It handles the submission initiated by NoteForm's internal onSubmit.
  // NoteForm calls this onSuccess callback *after* its own internal simulated save/toast.
  const handleNewNoteSaveSuccess = () => {
    setIsCreatingNewIdea(true); // Indicate loading state starts
    // Simulate async operation like waiting for data propagation or API confirmation
    setTimeout(() => {
      console.log("New Note save process complete on Home page.");
      setNewIdeaDialogOpen(false); // Close the dialog
      // Trigger a refresh in NoteList by changing the key or passing a signal
      setReloadCounter(prev => prev + 1);
      setIsCreatingNewIdea(false); // Reset loading state
    }, 500); // Simulate delay matching NoteList fetch/delete
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
                <Button variant="default" disabled={isCreatingNewIdea}>
                 {isCreatingNewIdea ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
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
                 {/* Pass the success handler to the NoteForm for creating new notes */}
                 {/* NoteForm handles its own submission state, but calls this upon success */}
                <NoteForm onSuccess={handleNewNoteSaveSuccess} isSubmittingExternal={isCreatingNewIdea} />
              </DialogContent>
            </Dialog>
          </div>
           {/* NoteList will fetch and display notes. Pass reloadCounter as key to force re-render/re-fetch */}
          <NoteList key={reloadCounter} />
        </div>
      </main>
    </div>
  );
}
