
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Trash2 } from 'lucide-react';
import type { Note } from '@/types/note'; // Import the Note type
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
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


interface NoteCardProps {
  note: Note;
  // Add onDelete callback prop
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  // Map priority to border color class
  const getPriorityBorderClass = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive'; // Red-like color from theme
      case 'medium':
        return 'border-l-[#fbde37]'; // Yellow
      case 'low':
        return 'border-l-[#007FFF]'; // Blue
      default:
        return 'border-l-transparent'; // Default no border color
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


  return (
    <Dialog>
       <DialogTrigger asChild>
         {/* Make the entire card the trigger, add priority border */}
         <Card className={cn(
            "flex flex-col h-full hover:shadow-lg transition-shadow duration-200 bg-card cursor-pointer border-l-4",
             getPriorityBorderClass(note.priority) // Apply dynamic border color
             )}>
           <CardHeader>
             <div className="flex justify-between items-start">
               <CardTitle className="text-lg font-semibold mb-1">{note.title}</CardTitle>
               {/* Removed priority badge */}
             </div>
             <CardDescription className="flex items-center text-xs text-muted-foreground">
               <Clock className="h-3 w-3 mr-1" />
               {/* Ensure createdAt is a valid Date object before formatting */}
               {note.createdAt instanceof Date ? formatDistanceToNow(note.createdAt, { addSuffix: true }) : 'Invalid date'}
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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
       {/* Edit Dialog Content - remains the same */}
       <DialogContent className="sm:max-w-[600px]" onClick={handleDialogContentClick}>
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
          </DialogHeader>
          {/* Pass a callback to close dialog on success */}
          <NoteForm existingNote={note} onSuccess={() => {
             // Potentially close the dialog here if needed,
             // might require Dialog state management lift-up or context
             console.log("Edit successful, potentially close dialog");
             // TODO: Trigger re-fetch or update list state
          }} />
       </DialogContent>
     </Dialog>
  );
}

// Add buttonVariants import if not already present
import { buttonVariants } from './ui/button';
