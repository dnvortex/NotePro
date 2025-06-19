import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/hooks/useNotes";
import { useLocation } from "wouter";
import { PenLine, Plus } from "lucide-react";

export function Welcome() {
  const [_, navigate] = useLocation();
  const { mutate: createNote } = useCreateNote();
  
  const handleCreateNote = () => {
    createNote({ title: "Untitled", content: "" }, {
      onSuccess: (newNote) => {
        navigate(`/notes/${newNote.id}`);
      }
    });
  };
  
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      <div className="rounded-full bg-purple-600/10 w-24 h-24 flex items-center justify-center mb-6">
        <PenLine className="text-5xl text-purple-500" size={48} />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-white">Welcome to NotesMaster</h2>
      <p className="text-gray-400 mb-8 max-w-md">Create and organize your notes with a powerful editor and easy organization tools.</p>
      <Button
        onClick={handleCreateNote}
        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus size={18} />
        <span>Create Your First Note</span>
      </Button>
    </div>
  );
}
