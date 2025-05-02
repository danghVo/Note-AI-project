
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
import { CalendarIcon, Loader2 } from "lucide-react";
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
import type { Note, NotePriority, NoteInputData } from '@/types/note'; // Import NoteInputData
import { cn } from '@/lib/utils';

// Zod schema for form validation (client-side)
const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  priority: z.enum(['low', 'medium', 'high']),
  content: z.string().min(1, 'Content cannot be empty'),
  createdAt: z.date({
    required_error: "A creation date is required.",
  }),
  // Attachments removed for now
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  existingNote?: Note;
  onSuccess?: (savedNote: Note) => void; // Callback after successful API save/update
  isSubmittingExternal?: boolean; // Should likely be removed if NoteForm handles its own state
}

// Basic Rich Text Editor Toolbar component (remains the same)
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


export function NoteForm({ existingNote, onSuccess }: NoteFormProps) { // Removed isSubmittingExternal
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]); // Keep state for potential future use
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false); // Form's own loading state
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '', // Initialize empty
      priority: 'medium',
      content: '',
      createdAt: new Date(),
    },
    mode: 'onChange', // Validate on change
  });

   // Effect to populate form when existingNote is provided or changes
   useEffect(() => {
        if (existingNote) {
            form.reset({
                title: existingNote.title,
                priority: existingNote.priority,
                content: existingNote.content,
                // Ensure createdAt is a Date object for the form field
                createdAt: existingNote.createdAt ? new Date(existingNote.createdAt) : new Date()
            });
            if (editorRef.current) {
                editorRef.current.innerHTML = existingNote.content;
            }
            // Handle attachments if re-enabled
            // setAttachments(existingNote.attachments || []);
        } else {
            // Reset form for creating a new note
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
   }, [existingNote, form]); // Rerun when existingNote or form instance changes


  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
     form.setValue('content', event.currentTarget.innerHTML, { shouldValidate: true, shouldDirty: true });
  };

  // File handling remains client-side for now
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
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

  // Main submit handler using API
  const onSubmit = async (data: NoteFormValues) => {
    setIsSaving(true);

    const noteApiData: NoteInputData = {
      title: data.title,
      priority: data.priority as NotePriority,
      content: data.content,
      createdAt: data.createdAt.toISOString(), // Send ISO string to API
      // attachments: [] // Handle attachments if sending data
    };

    const method = existingNote?._id ? 'PUT' : 'POST';
    const url = existingNote?._id ? `/api/notes/${existingNote.id}` : '/api/notes'; // Use string id

    try {
       const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteApiData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try parsing error
            throw new Error(errorData.message || `Failed to ${existingNote ? 'update' : 'create'} idea.`);
        }

        const savedNote: Note = await response.json();

        // Ensure createdAt is Date after response
        const finalNote = {
            ...savedNote,
            createdAt: new Date(savedNote.createdAt)
        };


       toast({
         title: existingNote ? "Idea Updated" : "Idea Created",
         description: `"${finalNote.title}" has been saved successfully.`,
       });

        // Only reset form if creating a new note
        if (!existingNote) {
            form.reset(); // Reset form fields
            setAttachments([]); // Clear attachments
            if (editorRef.current) editorRef.current.innerHTML = ''; // Clear editor
        }

       onSuccess?.(finalNote); // Call parent callback (e.g., close dialog, trigger list reload)

    } catch (error: any) {
         toast({
           title: "Error",
           description: error.message || "Failed to save the idea.",
           variant: "destructive",
         });
         console.error("Save error:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title and Priority Fields (remain the same) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input placeholder="Enter the idea title" {...field} disabled={isSaving} />
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
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSaving}>
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


        {/* Created At Field (remains the same) */}
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
                         disabled={isSaving}
                        >
                        {field.value ? (
                            format(field.value, "PPP HH:mm") // Format with time
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
                                const currentFieldValue = field.value || new Date();
                                const hours = currentFieldValue.getHours();
                                const minutes = currentFieldValue.getMinutes();
                                date.setHours(hours, minutes);
                                field.onChange(date);
                            } else {
                                field.onChange(undefined); // Allow clearing date
                            }
                        }}
                        disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    {/* TODO: Add Time Input Here if needed */}
                     <div className="p-3 border-t border-border">
                         <input
                            type="time"
                            className="w-full border border-input rounded-md px-2 py-1 text-sm"
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                             disabled={!field.value || isSaving}
                            onChange={(e) => {
                                if (field.value && e.target.value) {
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = new Date(field.value);
                                    newDate.setHours(hours, minutes);
                                    field.onChange(newDate);
                                }
                            }}
                            />
                     </div>
                    </PopoverContent>
                </Popover>
                <FormDescription>
                    The date and time this idea was recorded.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        {/* Content Field (Rich Text Editor - remains the same) */}
         <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
               <RichTextToolbar editorRef={editorRef} />
               <FormControl>
                <div
                  ref={editorRef}
                  contentEditable={!isSaving}
                  suppressContentEditableWarning={true}
                  onInput={handleContentChange}
                  dangerouslySetInnerHTML={{ __html: field.value || '' }}
                  className={cn(
                    "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                     form.formState.errors.content ? 'border-destructive' : '',
                     isSaving ? 'opacity-50 bg-muted cursor-not-allowed' : ''
                  )}
                  role="textbox"
                  aria-multiline="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attachments Field (remains the same, but not part of saved data yet) */}
        <FormItem>
          <FormLabel>Attachments (Coming Soon)</FormLabel>
          <FormControl>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                 className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors",
                    isSaving && "cursor-not-allowed opacity-50" // Disable visually when saving
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
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                   disabled={true} // Disabled until backend supports it
                   // disabled={isSaving} // Re-enable when supported
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
                        disabled={isSaving}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </li>
                 ))}
               </ul>
             </div>
           )}
           <FormDescription>
                Attachment uploads are currently disabled.
           </FormDescription>
        </FormItem>


        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !form.formState.isValid || !form.getValues('content')}>
             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : (existingNote ? 'Update Idea' : 'Create Idea')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

