'use client';

import { useState, useEffect } from 'react';
import { NoteCard } from './note-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileWarning } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Note } from '@/types/note'; // Import the Note type

// Mock data fetching function - replace with your actual data fetching logic
async function fetchNotes(searchTerm?: string | null): Promise<Note[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Sample notes - replace with actual data source (e.g., localStorage, API)
  const notes: Note[] = [
    { id: '1', title: 'My First Brilliant Idea', content: '<p>This is the content of my first idea. It involves <strong>bold text</strong> and <em>italics</em>.</p>', priority: 'high', createdAt: new Date(2023, 10, 15, 10, 30), attachments: [] },
    { id: '2', title: 'Another Concept', content: '<p>A second idea with some basic details.</p>', priority: 'medium', createdAt: new Date(2023, 10, 16, 14, 0), attachments: [] },
    { id: '3', title: 'Quick Note', content: '<p>Just a quick thought.</p>', priority: 'low', createdAt: new Date(2023, 10, 17, 9, 15), attachments: [] },
     { id: '4', title: 'Project Brainstorm', content: '<p>Let\'s brainstorm for the new project. <ul><li>Feature A</li><li>Feature B</li></ul></p>', priority: 'high', createdAt: new Date(2023, 10, 18, 11, 0), attachments: [] },
     { id: '5', title: 'Marketing Strategy', content: '<p>Ideas for the upcoming marketing campaign. <ol><li>Social Media Push</li><li>Email Newsletter</li></ol></p>', priority: 'medium', createdAt: new Date(2023, 10, 19, 16, 45), attachments: [] },
  ];

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      // Basic content search (remove HTML tags for better matching)
      note.content.replace(/<[^>]*>/g, '').toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
}


export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');

  useEffect(() => {
    async function loadNotes() {
      setLoading(true);
      setError(null);
      try {
        const fetchedNotes = await fetchNotes(searchTerm);
        // Simulate getting notes from localStorage or a backend
        // For now, we use the fetchedNotes directly
        setNotes(fetchedNotes);
      } catch (err) {
        setError('Failed to load ideas. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, [searchTerm]); // Re-fetch when searchTerm changes

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
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

  if (notes.length === 0) {
    return (
       <div className="text-center py-10">
        <p className="text-muted-foreground">
          {searchTerm ? `No ideas found matching "${searchTerm}".` : "You haven't sparked any ideas yet. Create one!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
