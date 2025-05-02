
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react"; // Import Loader2
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
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
  createdAt: z.date({
    required_error: "A creation date is required.",
  }), // Add createdAt field
  // Attachments will be handled separately
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  existingNote?: Note; // Optional prop for editing
  onSuccess?: (savedNote: Note) => void; // Callback after successful internal save simulation
  isSubmittingExternal?: boolean; // Optional prop to indicate parent component loading state
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


export function NoteForm({ existingNote, onSuccess, isSubmittingExternal = false }: NoteFormProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]); // Keep attachments separate for now
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false); // Internal saving state for the form itself
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: existingNote?.title || '',
      priority: existingNote?.priority || 'medium',
      content: existingNote?.content || '',
      createdAt: existingNote?.createdAt ? new Date(existingNote.createdAt) : new Date(), // Initialize createdAt
    },
    mode: 'onChange', // Validate on change
  });

   // Effect to set initial content in the div editor when editing
   useEffect(() => {
    if (existingNote?.content && editorRef.current) {
      editorRef.current.innerHTML = existingNote.content;
      // Ensure form state is updated if content is set externally
      form.setValue('content', existingNote.content, { shouldValidate: true, shouldDirty: true });
    }
     // Set initial attachments when editing
     if (existingNote?.attachments) {
        // If attachments are Files already, use them, otherwise, you might need to fetch/recreate File objects if they are just URLs/references
        setAttachments(existingNote.attachments);
     }
    // Reset form when existingNote changes (e.g., opening edit dialog for different note)
    if (existingNote) {
        form.reset({
            title: existingNote.title,
            priority: existingNote.priority,
            content: existingNote.content,
            createdAt: new Date(existingNote.createdAt)
        });
        if (editorRef.current) {
            editorRef.current.innerHTML = existingNote.content;
        }
    } else {
        // Reset for new note form
        form.reset({
            title: '',
            priority: 'medium',
            content: '',
            createdAt: new Date()
        });
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
        setAttachments([]);
    }

  }, [existingNote, form]); // Depend on existingNote and form instance


  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
     form.setValue('content', event.currentTarget.innerHTML, { shouldValidate: true, shouldDirty: true });
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
      // Update form value if needed, although attachments aren't part of the zod schema yet
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
     // Update form value if needed
  };

  const onSubmit = async (data: NoteFormValues) => {
    setIsSaving(true); // Start internal saving indicator

    const noteToSave: Note = {
      id: existingNote?.id || Date.now().toString(), // Generate new ID or use existing
      title: data.title,
      priority: data.priority as NotePriority,
      content: data.content,
      attachments: attachments, // Include attachments
      createdAt: data.createdAt, // Use date from form
    };

    // Simulate API call/update local state with a delay
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async save

    try {
       console.log("Simulating save for note:", noteToSave);
       // In a real app, this is where you'd call your API or update global state

       toast({
         title: existingNote ? "Idea Updated" : "Idea Created",
         description: `"${data.title}" has been saved locally (simulation).`,
       });

       // Only reset form if it's NOT an existing note being edited
       // Keep fields populated for edit until dialog is closed by parent
       if (!existingNote) {
            form.reset(); // Reset form fields for new note
            setAttachments([]); // Clear attachments for new note
            if (editorRef.current) editorRef.current.innerHTML = ''; // Clear editor for new note
       }

       onSuccess?.(noteToSave); // Call success callback if provided (e.g., to close dialog and trigger parent loading/refetch)

    } catch (error) {
         toast({
           title: "Error",
           description: "Failed to save the idea (simulation).",
           variant: "destructive",
         });
         console.error("Save error:", error);
    } finally {
        setIsSaving(false); // Stop internal saving indicator
    }
  };

  // Combine internal and external submitting states for the button's disabled status
  const isSubmitting = isSaving || isSubmittingExternal;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input placeholder="Enter the idea title" {...field} disabled={isSubmitting} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
        </div>

         <FormField
            control={form.control}
            name="createdAt"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Creation Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                         disabled={isSubmitting}
                        >
                        {field.value ? (
                            format(field.value, "PPP HH:mm") // Format with time (adjust as needed)
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            if (date) {
                                // Preserve time if existing, otherwise set to current time
                                const hours = field.value?.getHours() ?? new Date().getHours();
                                const minutes = field.value?.getMinutes() ?? new Date().getMinutes();
                                date.setHours(hours, minutes);
                                field.onChange(date);
                            }
                        }}
                        disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    {/* Optional: Add Time Input Here */}
                    </PopoverContent>
                </Popover>
                <FormDescription>
                    The date and time this idea was recorded.
                </FormDescription>
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
                  contentEditable={!isSubmitting} // Disable editing when submitting
                  suppressContentEditableWarning={true} // Suppress warning for controlled contentEditable
                  onInput={handleContentChange} // Use onInput for contentEditable
                  // Set initial content via useEffect
                  dangerouslySetInnerHTML={{ __html: field.value || '' }}
                  className={cn(
                    "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                     form.formState.errors.content ? 'border-destructive' : '',
                     isSubmitting ? 'opacity-50 bg-muted cursor-not-allowed' : '' // Style when disabled
                  )}
                  role="textbox"
                  aria-multiline="true"
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
                 className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors",
                    isSubmitting && "cursor-not-allowed opacity-50"
                 )}
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
                   disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
          {/* Disable button if internal saving, external submitting, form is invalid OR if content is empty (extra check) */}
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid || !form.getValues('content')}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : (isSubmittingExternal ? 'Processing...' : (existingNote ? 'Update Idea' : 'Create Idea'))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
