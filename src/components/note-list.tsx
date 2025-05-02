
'use client';

import { useState, useEffect } from 'react';
import { NoteCard } from './note-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileWarning, SwitchCamera } from 'lucide-react'; // Import SwitchCamera
import { useSearchParams } from 'next/navigation';
import type { Note } from '@/types/note';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button'; // Import Button


// API fetching function
async function fetchNotes(searchTerm?: string | null): Promise<Note[]> {
  const url = searchTerm ? `/api/notes?search=${encodeURIComponent(searchTerm)}` : '/api/notes';
  const response = await fetch(url, { cache: 'no-store' }); // Disable caching for dynamic data

  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.statusText}`);
  }
  const notes = await response.json();

  // Ensure createdAt is a Date object after fetching
  return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt) // Convert ISO string back to Date
  })).sort((a: Note, b: Note) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
}

// API delete function
async function deleteNoteById(id: string): Promise<boolean> {
    const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        // Handle specific errors based on status code if needed
        const errorData = await response.json().catch(() => ({})); // Try to parse error body
        console.error('Deletion failed:', response.status, errorData.message);
        throw new Error(errorData.message || `Failed to delete note: ${response.statusText}`);
    }
    return response.ok; // Or check status === 200 or 204
}

// API save/update function (combined for simplicity, called from NoteForm success)
// Note: NoteForm will handle the actual PUT/POST request logic.
// This function in NoteList might just trigger a reload.
// However, keeping a local update function might be useful for optimistic UI.
async function saveOrUpdateNoteAPI(noteData: Note) {
     const method = noteData._id ? 'PUT' : 'POST'; // Use _id presence to determine PUT or POST
     const url = noteData._id ? `/api/notes/${noteData.id}` : '/api/notes';

     // Convert File objects to something serializable if needed (e.g., upload logic first)
     // For now, attachments are removed from the type/logic

     const body = JSON.stringify({
         title: noteData.title,
         content: noteData.content,
         priority: noteData.priority,
         createdAt: noteData.createdAt instanceof Date ? noteData.createdAt.toISOString() : noteData.createdAt, // Send ISO string
         // attachments: [] // Handle attachments serialization if needed
     });


     const response = await fetch(url, {
         method: method,
         headers: {
             'Content-Type': 'application/json',
         },
         body: body,
     });

     if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         console.error('Save/Update failed:', response.status, errorData.message);
         throw new Error(errorData.message || `Failed to ${method === 'PUT' ? 'update' : 'create'} note: ${response.statusText}`);
     }

     const savedNote = await response.json();
     // Ensure createdAt is a Date object after API response
     return {
         ...savedNote,
         createdAt: new Date(savedNote.createdAt)
     };
 }


export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');
  const { toast } = useToast();
  const [isSwapping, setIsSwapping] = useState(false); // State for swap loading

  const loadNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedNotes = await fetchNotes(searchTerm);
        setNotes(fetchedNotes);
      } catch (err: any) {
        setError(err.message || 'Failed to load ideas. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadNotes();
  }, [searchTerm]); // Re-fetch when searchTerm changes or component mounts

  const handleDeleteNote = async (id: string) => {
      if (!id) {
        console.error("Attempted to delete note with invalid ID:", id);
        toast({ title: "Error", description: "Invalid note ID.", variant: "destructive" });
        return;
      }
      setDeletingNoteId(id);
      try {
          const success = await deleteNoteById(id);
          if (success) {
              toast({
                  title: "Idea Deleted",
                  description: "The idea has been successfully removed.",
              });
              // Refresh the list after deletion
              await loadNotes();
          } else {
               // This case might not be reached if deleteNoteById throws on failure
               toast({
                  title: "Deletion Failed",
                  description: "Could not find or delete the idea.",
                  variant: "destructive",
              });
          }
      } catch (err: any) {
           toast({
              title: "Error Deleting",
              description: err.message || "An error occurred while deleting the idea.",
              variant: "destructive",
          });
          console.error("Deletion error:", err);
      } finally {
           setDeletingNoteId(null);
      }
  };

  // This function is now called by NoteForm's onSuccess callback
  // It primarily triggers a reload of the list.
  const handleNoteSaveOrUpdateSuccess = async () => {
    // Optional: Optimistic update can be done here before reloading
    // For simplicity, just reload the list from the server
    await loadNotes();
  };

  // --- Swap Logic ---
  const handleSwapNotes = async (note1Id: string, note2Id: string) => {
       if (!note1Id || !note2Id || note1Id === note2Id) return;

       setIsSwapping(true);
       const note1Index = notes.findIndex(n => n.id === note1Id);
       const note2Index = notes.findIndex(n => n.id === note2Id);

       if (note1Index === -1 || note2Index === -1) {
           toast({ title: "Swap Error", description: "Could not find notes to swap.", variant: "destructive" });
           setIsSwapping(false);
           return;
       }

       // Get the full note objects
       const note1 = notes[note1Index];
       const note2 = notes[note2Index];


       try {
            // Prepare data for API update (only swap necessary fields, keep IDs the same)
            // We swap the content, title, priority, etc. but keep the original _id and createdAt
            // In a real scenario, you might just swap a 'position' or 'order' field.
            // Here, we'll swap all editable fields for demonstration.

            const updateNote1Data: Note = { ...note1, title: note2.title, content: note2.content, priority: note2.priority };
            const updateNote2Data: Note = { ...note2, title: note1.title, content: note1.content, priority: note1.priority };


            // Update both notes via API
            await Promise.all([
                saveOrUpdateNoteAPI(updateNote1Data),
                saveOrUpdateNoteAPI(updateNote2Data)
            ]);


            toast({ title: "Swap Successful", description: "Notes have been swapped." });

            // Reload the list to reflect the changes from the server
            await loadNotes();

       } catch (err: any) {
            toast({ title: "Swap Failed", description: err.message || "An error occurred during the swap.", variant: "destructive" });
            // Optionally revert local state if optimistic update was done
       } finally {
            setIsSwapping(false);
       }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.dataTransfer.setData("noteId", id);
      e.currentTarget.style.opacity = '0.4'; // Visual feedback
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.opacity = '1'; // Reset visual feedback
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Necessary to allow drop
       e.currentTarget.classList.add('bg-accent/20'); // Highlight drop target
  };

   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
       e.currentTarget.classList.remove('bg-accent/20'); // Remove highlight
   };


  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
       e.currentTarget.classList.remove('bg-accent/20'); // Remove highlight
      const sourceId = e.dataTransfer.getData("noteId");
      if (sourceId && sourceId !== targetId) {
          handleSwapNotes(sourceId, targetId);
      }
  };

  // --- Render Logic ---

  if (loading && notes.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[130px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
        <FileWarning className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!loading && notes.length === 0) {
    return (
       <div className="text-center py-10">
         <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">
          {searchTerm ? `No ideas found matching "${searchTerm}".` : "You haven't sparked any ideas yet. Create one!"}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${loading || isSwapping ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {notes.map((note) => (
        <div
           key={note.id}
           draggable
           onDragStart={(e) => handleDragStart(e, note.id!)}
           onDragEnd={handleDragEnd}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           onDrop={(e) => handleDrop(e, note.id!)}
           className="transition-all duration-150 ease-in-out rounded-lg" // Added rounding for highlight effect
           >
            <NoteCard
                note={note}
                onDelete={handleDeleteNote}
                onSaveSuccess={handleNoteSaveOrUpdateSuccess} // Trigger reload on save
                isDeleting={deletingNoteId === note.id}
            />
         </div>
      ))}
      {isSwapping && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <SwitchCamera className="h-16 w-16 text-white animate-spin" />
          </div>
      )}
    </div>
  );
}

