

'use client';

import { useState, useEffect } from 'react';
import { NoteCard } from './note-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileWarning } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Note } from '@/types/note'; // Import the Note type
import { useToast } from '@/hooks/use-toast'; // Import useToast

// --- Mock Data Storage (Replace with actual backend/localStorage logic) ---
// Ensure createdAt properties are actual Date objects or valid date strings
let mockNotes: Note[] = [
    { id: '1', title: 'My First Brilliant Idea', content: '<p>This is the content of my first idea. It involves <strong>bold text</strong> and <em>italics</em>.</p>', priority: 'high', createdAt: new Date(2023, 10, 15, 10, 30), attachments: [] },
    { id: '2', title: 'Another Concept', content: '<p>A second idea with some basic details.</p>', priority: 'medium', createdAt: new Date(2023, 10, 16, 14, 0), attachments: [] },
    { id: '3', title: 'Quick Note', content: '<p>Just a quick thought.</p>', priority: 'low', createdAt: new Date(2023, 10, 17, 9, 15), attachments: [] },
    { id: '4', title: 'Project Brainstorm', content: '<p>Let\'s brainstorm for the new project. <ul><li>Feature A</li><li>Feature B</li></ul></p>', priority: 'high', createdAt: new Date(2023, 10, 18, 11, 0), attachments: [] },
    { id: '5', title: 'Marketing Strategy', content: '<p>Ideas for the upcoming marketing campaign. <ol><li>Social Media Push</li><li>Email Newsletter</li></ol></p>', priority: 'medium', createdAt: new Date(2023, 10, 19, 16, 45), attachments: [] },
];

// Function to update or add a note in the mock data
function saveOrUpdateMockNote(noteToSave: Note): void {
    const existingIndex = mockNotes.findIndex(note => note.id === noteToSave.id);
    if (existingIndex > -1) {
        // Update existing note
        mockNotes[existingIndex] = noteToSave;
    } else {
        // Add new note
        mockNotes.push(noteToSave);
    }
     // Ensure createdAt is always a Date object after update/add
    mockNotes = mockNotes.map(note => ({
        ...note,
        createdAt: note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt)
    }));

    // Re-sort after adding/updating
    mockNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}


// Mock data fetching function
async function fetchNotes(searchTerm?: string | null): Promise<Note[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

  let notesToReturn = [...mockNotes]; // Work with a copy

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    notesToReturn = notesToReturn.filter(note =>
      note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  // Ensure createdAt is always a Date object before returning
  notesToReturn = notesToReturn.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt) // Convert string dates if necessary
  }));

  return notesToReturn.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
}

// Mock delete function
async function deleteNoteById(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    const initialLength = mockNotes.length;
    mockNotes = mockNotes.filter(note => note.id !== id);
    return mockNotes.length < initialLength; // Return true if deletion happened
}
// --- End Mock Data Logic ---


export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true); // Loading state for initial fetch and subsequent reloads
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null); // State to track which note is being deleted
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');
  const { toast } = useToast(); // Use toast for feedback


  const loadNotes = async () => {
      setLoading(true); // Set loading true at the beginning
      setError(null);
      try {
        const fetchedNotes = await fetchNotes(searchTerm);
        setNotes(fetchedNotes);
      } catch (err) {
        setError('Failed to load ideas. Please try again.');
        console.error(err);
      } finally {
        setLoading(false); // Set loading false after fetching (success or error)
      }
    };

  useEffect(() => {
    loadNotes();
  }, [searchTerm]); // Re-fetch when searchTerm changes

  const handleDeleteNote = async (id: string) => {
      setDeletingNoteId(id); // Set deleting state for the specific note
      try {
          const success = await deleteNoteById(id);
          if (success) {
              toast({
                  title: "Idea Deleted",
                  description: "The idea has been successfully removed.",
              });
              // No need to call loadNotes immediately if we filter locally
              // setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
              // Or reload from source:
              await loadNotes(); // Reload notes to reflect the deletion
          } else {
               toast({
                  title: "Deletion Failed",
                  description: "Could not find the idea to delete.",
                  variant: "destructive",
              });
          }
      } catch (err) {
           toast({
              title: "Error Deleting",
              description: "An error occurred while deleting the idea.",
              variant: "destructive",
          });
          console.error("Deletion error:", err);
      } finally {
           setDeletingNoteId(null); // Reset deleting state regardless of outcome
           // Ensure loading is false if loadNotes wasn't called on success
           // setLoading(false);
      }
  };

  // Function to handle updates or additions (called from NoteForm onSuccess)
  const handleNoteSaveOrUpdate = (savedNote: Note) => {
    setLoading(true); // Show loading indicator while saving/updating and refetching
    saveOrUpdateMockNote(savedNote); // Update the mock data source
    loadNotes(); // Reload notes from the updated source to refresh the UI
  };


  if (loading && notes.length === 0) { // Show skeletons only on initial load or full reload
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => ( // Show more skeletons
          <Skeleton key={i} className="h-[130px] rounded-lg" /> // Match card height
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

  if (!loading && notes.length === 0) { // Show no ideas message only when not loading and notes are empty
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
    // Add opacity transition for loading state overlay effect
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
      {notes.map((note) => (
        <NoteCard
            key={note.id}
            note={note}
            onDelete={handleDeleteNote}
            onSaveSuccess={handleNoteSaveOrUpdate} // Pass the update handler
            isDeleting={deletingNoteId === note.id} // Pass deleting state
            />
      ))}
    </div>
  );
}
