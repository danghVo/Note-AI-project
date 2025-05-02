
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Trash2, CalendarIcon, Loader2 } from 'lucide-react'; // Added CalendarIcon and Loader2
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
  onSaveSuccess: () => void; // Modified: Parent only needs to know success happened to trigger reload
  isDeleting?: boolean;
}

export function NoteCard({ note, onDelete, onSaveSuccess, isDeleting = false }: NoteCardProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false);

  // Ensure createdAt is a Date object before formatting
  const createdAtDate = React.useMemo(() => {
      if (!note.createdAt) return null;
      return note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt);
  }, [note.createdAt]);


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

  const createMarkup = (htmlContent: string) => {
    const cleanHtml = htmlContent.replace(/<script.*?>.*?<\/script>/gi, '');
    return { __html: cleanHtml };
  };

   const handleDeleteConfirm = (e: React.MouseEvent) => {
     e.stopPropagation();
     if (!isDeleting && note.id) { // Check if note.id exists
        onDelete(note.id); // Use string id
     }
   };

   const handleDeleteTriggerClick = (e: React.MouseEvent) => {
     e.stopPropagation();
   };

    const handleDialogContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Callback for NoteForm success
    const handleFormSuccess = (savedNote: Note) => {
        setDialogOpen(false); // Close the dialog
        onSaveSuccess(); // Just notify parent that save succeeded
    };


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
       <DialogTrigger asChild>
         <Card className={cn(
            "flex flex-col h-full hover:shadow-lg transition-shadow duration-200 bg-card cursor-pointer border-2",
             getPriorityBorderClass(note.priority)
             )}>
           <CardHeader className="p-4 flex-row items-start justify-between gap-2">
             <div className="flex-grow overflow-hidden">
               <CardTitle className="text-base font-semibold mb-1 break-words line-clamp-1">{note.title}</CardTitle>
               <CardDescription className="flex items-center text-[11px] text-muted-foreground mt-1">
                 <CalendarIcon className="h-2.5 w-2.5 mr-1" />
                  {createdAtDate ? format(createdAtDate, "PP H:mm") : 'No date'}
                 <span className="mx-1">·</span>
                 <Clock className="h-2.5 w-2.5 mr-1" />
                  {createdAtDate ? formatDistanceToNow(createdAtDate, { addSuffix: true }) : ''}
               </CardDescription>
                {/* Attachments display removed for now
                {note.attachments && note.attachments.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 pointer-events-none mt-2">
                        <FileText className="h-2.5 w-2.5 mr-1" />
                        {note.attachments.length} attachment{note.attachments.length !== 1 ? 's' : ''}
                    </Badge>
                )} */}
             </div>
             <div className="flex-shrink-0">
                 <AlertDialog onOpenChange={(open) => { /* Handle open if needed */ }}>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        size="icon"
                         className={cn(
                             "h-6 w-6 text-destructive hover:bg-destructive/10 z-10",
                             isDeleting && "cursor-not-allowed opacity-50"
                             )}
                        onClick={handleDeleteTriggerClick}
                        aria-label="Delete Idea"
                        disabled={isDeleting || !note.id} // Disable if no ID
                        >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            <span className="sr-only">Delete Idea</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={handleDialogContentClick} >
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the idea
                            "{note.title}".
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()} disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({ variant: "destructive" })} disabled={isDeleting}>
                             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                             {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
             </div>
           </CardHeader>
           <CardContent className="flex-grow prose prose-sm dark:prose-invert max-h-[3rem] overflow-hidden text-ellipsis p-4 pt-0 pb-4">
              <div dangerouslySetInnerHTML={createMarkup(note.content)} className="line-clamp-2 mb-0" />
           </CardContent>
         </Card>
       </DialogTrigger>
       <DialogContent className="sm:max-w-[600px]" onClick={handleDialogContentClick} onInteractOutside={(e) => {
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
          {/* Pass the success handler */}
          <NoteForm existingNote={note} onSuccess={handleFormSuccess} />
       </DialogContent>
     </Dialog>
  );
}

