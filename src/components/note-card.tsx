import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Edit, Trash2 } from 'lucide-react';
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


interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const getPriorityBadgeVariant = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    // Basic sanitization (consider a more robust library like DOMPurify for production)
    const cleanHtml = htmlContent.replace(/<script.*?>.*?<\/script>/gi, '');
    return { __html: cleanHtml };
  };

  const handleDelete = () => {
    // Implement deletion logic here (e.g., update state, call API)
    console.log('Deleting note:', note.id);
    // Typically, you'd lift state up or use a context/store to manage notes
    // and trigger a re-render of NoteList after deletion.
    // Example: onDelete(note.id);
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200 bg-card">
      <CardHeader>
        <div className="flex justify-between items-start">
           <CardTitle className="text-lg font-semibold mb-1">{note.title}</CardTitle>
           <Badge variant={getPriorityBadgeVariant(note.priority)} className="capitalize text-xs">
             {note.priority}
           </Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatDistanceToNow(note.createdAt, { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow prose prose-sm dark:prose-invert max-h-24 overflow-hidden text-ellipsis">
         {/* Render simplified content or an excerpt */}
         <div dangerouslySetInnerHTML={createMarkup(note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''))} />
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
        <div className="flex items-center gap-1">
           {note.attachments && note.attachments.length > 0 && (
             <Badge variant="secondary" className="text-xs">
               {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
             </Badge>
           )}
        </div>

        <div className="flex gap-1">
            <Dialog>
              <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                   <Edit className="h-4 w-4" />
                   <span className="sr-only">Edit Idea</span>
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                 <DialogHeader>
                   <DialogTitle>Edit Idea</DialogTitle>
                 </DialogHeader>
                 <NoteForm existingNote={note} />
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Idea</span>
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the idea
                    "{note.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className={getPriorityBadgeVariant('destructive')}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         </div>
      </CardFooter>
    </Card>
  );
}
