

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Trash2, CalendarIcon } from 'lucide-react'; // Added CalendarIcon
import type { Note } from '@/types/note'; // Import the Note type
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription, // Added DialogDescription
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NoteForm } from './note-form'; // Assuming NoteForm can handle editing
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
import { buttonVariants } from './ui/button'; // Ensure buttonVariants is imported


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
           <CardHeader>
             <div className="flex justify-between items-start">
               <CardTitle className="text-lg font-semibold mb-1">{note.title}</CardTitle>
               {/* Removed priority badge from header */}
             </div>
             <CardDescription className="flex items-center text-xs text-muted-foreground">
               <CalendarIcon className="h-3 w-3 mr-1" /> {/* Use Calendar Icon */}
               {/* Format date including time, ensure createdAt is a valid Date */}
               {note.createdAt instanceof Date ? format(note.createdAt, "PPP HH:mm") : 'Invalid date'}
               <span className="mx-1">·</span>
                <Clock className="h-3 w-3 mr-1" />
                {/* Display relative time */}
                {note.createdAt instanceof Date ? formatDistanceToNow(note.createdAt, { addSuffix: true }) : ''}
             </CardDescription>
           </CardHeader>
           <CardContent className="flex-grow prose prose-sm dark:prose-invert max-h-24 overflow-hidden text-ellipsis">
              {/* Render simplified content or an excerpt */}
              <div dangerouslySetInnerHTML={createMarkup(note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''))} />
           </CardContent>
           <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
             <div className="flex items-center gap-1">
               {/* Display number of attachments */}
               {note.attachments && note.attachments.length > 0 && (
                  <Badge variant="secondary" className="text-xs pointer-events-none">
                    <FileText className="h-3 w-3 mr-1" />
                    {note.attachments.length}
                  </Badge>
                )}
             </div>

             {/* Actions - Keep Delete button */}
             <div className="flex gap-1">
                 {/* Delete Button - wrapped in AlertDialog */}
                 <AlertDialog onOpenChange={(open) => { if (!open) return; /* Handle specific logic on open if needed */ }}>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 z-10" // Ensure delete button is clickable over card trigger
                        onClick={handleDeleteTriggerClick} // Stop propagation for the trigger click
                        aria-label="Delete Idea"
                        >
                            <Trash2 className="h-4 w-4" />
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
           </CardFooter>
         </Card>
       </DialogTrigger>
       {/* Edit Dialog Content */}
       <DialogContent className="sm:max-w-[600px]" onClick={handleDialogContentClick} onInteractOutside={(e) => {
                // Prevent closing dialog when interacting with calendar popover etc.
                // This might need adjustment based on specific popover implementations
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
