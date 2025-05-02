import { Header } from '@/components/header';
import { NoteList } from '@/components/note-list';
import { NoteForm } from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">My Ideas</h1>
             <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" /> New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Idea</DialogTitle>
                </DialogHeader>
                <NoteForm />
              </DialogContent>
            </Dialog>
          </div>
          <NoteList />
        </div>
      </main>
    </div>
  );
}
