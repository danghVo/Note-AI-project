'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Note, NotePriority } from '@/types/note';
import { cn } from '@/lib/utils';

// Define Zod schema for validation
const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  priority: z.enum(['low', 'medium', 'high']),
  content: z.string().min(1, 'Content cannot be empty'),
  // Attachments will be handled separately
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  existingNote?: Note; // Optional prop for editing
  onSuccess?: () => void; // Optional callback after successful submission
}

// Basic Rich Text Editor Toolbar component
const RichTextToolbar = ({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) => {
  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="flex flex-wrap gap-1 border-b mb-2 pb-2">
      <Button type="button" variant="outline" size="sm" onClick={() => execCmd('bold')} aria-label="Bold">B</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => execCmd('italic')} aria-label="Italic">I</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => execCmd('underline')} aria-label="Underline">U</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => execCmd('insertUnorderedList')} aria-label="Unordered List">•</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => execCmd('insertOrderedList')} aria-label="Ordered List">1.</Button>
       {/* Add more buttons as needed (headings, links, etc.) */}
    </div>
  );
};


export function NoteForm({ existingNote, onSuccess }: NoteFormProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<File[]>(existingNote?.attachments || []);
  const editorRef = useRef<HTMLDivElement>(null);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: existingNote?.title || '',
      priority: existingNote?.priority || 'medium',
      content: existingNote?.content || '',
    },
    mode: 'onChange', // Validate on change
  });

   // Effect to set initial content in the div editor when editing
   useEffect(() => {
    if (existingNote?.content && editorRef.current) {
      editorRef.current.innerHTML = existingNote.content;
    }
  }, [existingNote]);


  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
     form.setValue('content', event.currentTarget.innerHTML, { shouldValidate: true });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Basic validation (e.g., file size, type - add more robust validation)
      const validFiles = newFiles.filter(file => file.size < 5 * 1024 * 1024); // Max 5MB
      if (validFiles.length !== newFiles.length) {
         toast({
            title: "Upload Error",
            description: "Some files were too large (max 5MB).",
            variant: "destructive",
          });
      }
      setAttachments((prev) => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: NoteFormValues) => {
    // Simulate saving the note (replace with actual logic)
    console.log('Form Data:', data);
    console.log('Attachments:', attachments);

    const newNote: Note = {
      id: existingNote?.id || Date.now().toString(), // Generate new ID or use existing
      title: data.title,
      priority: data.priority as NotePriority,
      content: data.content,
      attachments: attachments,
      createdAt: existingNote?.createdAt || new Date(), // Preserve original date or set new
    };

    // --- Replace with your actual saving logic ---
    // Example: Save to localStorage or call API
    try {
       // Simulate API call
       console.log("Saving note:", newNote);
       // In a real app, you'd update your global state/store here
       toast({
         title: existingNote ? "Idea Updated" : "Idea Created",
         description: `"${data.title}" has been saved.`,
       });
       form.reset(); // Reset form fields
       setAttachments([]); // Clear attachments
       if (editorRef.current) editorRef.current.innerHTML = ''; // Clear editor
       onSuccess?.(); // Call success callback if provided (e.g., to close a dialog)

    } catch (error) {
         toast({
           title: "Error",
           description: "Failed to save the idea.",
           variant: "destructive",
         });
         console.error("Save error:", error);
    }
     // --- End of saving logic ---
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter the idea title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
               <RichTextToolbar editorRef={editorRef} />
               <FormControl>
                 {/* Use contentEditable div instead of Textarea */}
                <div
                  ref={editorRef}
                  contentEditable={true}
                  onInput={handleContentChange} // Use onInput for contentEditable
                  className={cn(
                    "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                     form.formState.errors.content ? 'border-destructive' : ''
                  )}
                  role="textbox"
                  aria-multiline="true"
                  // We handle value setting via useEffect and initial state
                  // No `value` or `defaultValue` prop needed here
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Attachments</FormLabel>
          <FormControl>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Max 5MB per file</p>
                </div>
                <Input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.txt" // Example accepted types
                />
              </label>
            </div>
          </FormControl>
           {attachments.length > 0 && (
             <div className="mt-4 space-y-2">
               <p className="text-sm font-medium">Uploaded files:</p>
               <ul className="list-none p-0 m-0 space-y-1">
                 {attachments.map((file, index) => (
                   <li key={index} className="flex items-center justify-between text-sm p-2 border rounded-md bg-secondary/50">
                     <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                     </div>
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       className="h-6 w-6 text-muted-foreground hover:text-destructive"
                       onClick={() => removeAttachment(index)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </FormItem>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
            {form.formState.isSubmitting ? 'Saving...' : (existingNote ? 'Update Idea' : 'Create Idea')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
