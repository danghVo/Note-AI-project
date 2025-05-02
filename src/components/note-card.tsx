

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Trash2, CalendarIcon } from 'lucide-react'; // Added CalendarIcon
import type { Note } from '@/types/note';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NoteForm } from './note-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { buttonVariants } from './ui/button';
import { Badge } from './ui/badge'; // Import Badge


interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onSaveSuccess: (note: Note) => void; // Callback for successful save/update
}

export function NoteCard({ note, onDelete, onSaveSuccess }: NoteCardProps) {
    // State to control dialog visibility
    const [dialogOpen, setDialogOpen] = React.useState(false);

  // Map priority to border color class for the full card
  const getPriorityBorderClass = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'border-destructive'; // Red-like color from theme
      case 'medium':
        return 'border-[#fbde37]'; // Yellow
      case 'low':
        return 'border-[#007FFF]'; // Blue
      default:
        return 'border-border'; // Default border color from theme
    }
  };

  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    // Basic sanitization (consider a more robust library like DOMPurify for production)
    const cleanHtml = htmlContent.replace(/<script.*?>.*?<\/script>/gi, '');
    return { __html: cleanHtml };
  };

   const handleDeleteConfirm = (e: React.MouseEvent) => {
     // Prevent card click trigger when confirming delete
     e.stopPropagation();
     onDelete(note.id); // Call the onDelete prop passed from NoteList
   };

   const handleDeleteTriggerClick = (e: React.MouseEvent) => {
     // Prevent the dialog trigger when clicking the delete button itself
     e.stopPropagation();
   };

    const handleDialogContentClick = (e: React.MouseEvent) => {
        // Prevent card click trigger when interacting with dialog/alert content
        e.stopPropagation();
    };

    // Callback for NoteForm success, closes dialog and calls parent handler
    const handleFormSuccess = (savedNote: Note) => {
        setDialogOpen(false); // Close the dialog
        onSaveSuccess(savedNote); // Propagate success to parent (NoteList)
    };


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
       <DialogTrigger asChild>
         {/* Make the entire card the trigger, add priority border */}
         <Card className={cn(
            "flex flex-col h-full hover:shadow-lg transition-shadow duration-200 bg-card cursor-pointer border-2", // Use border-2 for thickness
             getPriorityBorderClass(note.priority) // Apply dynamic border color to the whole card
             )}>
           {/* Reduced padding in header p-4 */}
           <CardHeader className="p-4 flex-row items-start justify-between gap-2">
             <div className="flex-grow overflow-hidden"> {/* Added overflow-hidden */}
               {/* Reduced title size text-base, added break-words */}
               <CardTitle className="text-base font-semibold mb-1 break-words">{note.title}</CardTitle>
               {/* Reduced description size text-[11px], reduced icon size */}
               <CardDescription className="flex items-center text-[11px] text-muted-foreground mt-1">
                 <CalendarIcon className="h-2.5 w-2.5 mr-1" /> {/* Use Calendar Icon */}
                 {/* Format date including time */}
                 {note.createdAt instanceof Date ? format(note.createdAt, "PP H:mm") : 'Invalid date'}
                 <span className="mx-1">·</span>
                 <Clock className="h-2.5 w-2.5 mr-1" />
                 {/* Display relative time */}
                 {note.createdAt instanceof Date ? formatDistanceToNow(note.createdAt, { addSuffix: true }) : ''}
               </CardDescription>
                {/* Display number of attachments, reduced icon size */}
                {note.attachments && note.attachments.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 pointer-events-none mt-2">
                        <FileText className="h-2.5 w-2.5 mr-1" />
                        {note.attachments.length} attachment{note.attachments.length !== 1 ? 's' : ''}
                    </Badge>
                )}
             </div>
              {/* Actions - Delete Button */}
             <div className="flex-shrink-0">
                 {/* Delete Button - wrapped in AlertDialog */}
                 <AlertDialog onOpenChange={(open) => { if (!open) return; /* Handle specific logic on open if needed */ }}>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        size="icon"
                         className="h-6 w-6 text-destructive hover:bg-destructive/10 z-10" // Reduced button size
                        onClick={handleDeleteTriggerClick} // Stop propagation for the trigger click
                        aria-label="Delete Idea"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> {/* Reduced icon size */}
                            <span className="sr-only">Delete Idea</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={handleDialogContentClick} /* Prevent dialog close on content click */ >
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the idea
                            "{note.title}".
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        {/* Use standard destructive variant for action */}
                        <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({ variant: "destructive" })}>
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
             </div>
           </CardHeader>
           {/* Reduced padding in content p-4 pt-0, adjusted max-height and overflow */}
           <CardContent className="flex-grow prose prose-sm dark:prose-invert max-h-[3rem] overflow-hidden text-ellipsis p-4 pt-0"> {/* Adjusted max-h slightly */}
              {/* Render simplified content or an excerpt */}
              {/* Use line-clamp-2 for better multi-line ellipsis */}
              <div dangerouslySetInnerHTML={createMarkup(note.content)} className="line-clamp-2" />
           </CardContent>
           {/* CardFooter removed */}
         </Card>
       </DialogTrigger>
       {/* Edit Dialog Content */}
       <DialogContent className="sm:max-w-[600px]" onClick={handleDialogContentClick} onInteractOutside={(e) => {
                // Prevent closing dialog when interacting with calendar popover etc.
                if ((e.target as HTMLElement)?.closest('[data-radix-popper-content-wrapper]')) {
                    e.preventDefault();
                }
            }}>
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
             <DialogDescription>
                Make changes to your idea here. Click save when you're done.
             </DialogDescription>
          </DialogHeader>
          {/* Pass the handleFormSuccess callback to NoteForm */}
          <NoteForm existingNote={note} onSuccess={handleFormSuccess} />
       </DialogContent>
     </Dialog>
  );
}

