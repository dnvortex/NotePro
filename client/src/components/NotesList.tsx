import { useState, useEffect } from "react";
import { NoteCard } from "@/components/NoteCard";
import { type NoteWithTags } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Grid, 
  List, 
  Plus, 
  AlertCircle 
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
} from "@/components/ui/select";
import { useCreateNote } from "@/hooks/useNotes";

interface NotesListProps {
  notes: NoteWithTags[];
  title: string;
  loading?: boolean;
  error?: Error | null;
}

type SortOption = "updated" | "created" | "title-asc" | "title-desc";

export function NotesList({ notes, title, loading = false, error = null }: NotesListProps) {
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SortOption>("updated");
  const [sortedNotes, setSortedNotes] = useState<NoteWithTags[]>(notes);
  const { mutate: createNote } = useCreateNote();
  
  // Sort notes when sort option changes or notes change
  useEffect(() => {
    if (!notes) return;
    
    const sorted = [...notes];
    
    switch (sortOption) {
      case "updated":
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "created":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    
    setSortedNotes(sorted);
  }, [notes, sortOption]);
  
  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
  };
  
  const handleCreateNote = () => {
    createNote({ title: "Untitled", content: "" });
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading notes</h3>
        <p className="text-gray-400 mb-4">{error.message}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  if (notes.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first note</p>
          <Button onClick={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" />
            Create a note
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <Select onValueChange={handleSortChange} defaultValue={sortOption}>
            <SelectTrigger className="bg-gray-800 text-gray-200 border border-gray-700 rounded-md w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="updated">Last edited</SelectItem>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <button 
            className={`p-1.5 rounded-md hover:bg-gray-800 transition-colors ${viewType === 'grid' ? 'text-purple-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setViewType("grid")}
          >
            <Grid size={18} />
          </button>
          <button 
            className={`p-1.5 rounded-md hover:bg-gray-800 transition-colors ${viewType === 'list' ? 'text-purple-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setViewType("list")}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      <div className={viewType === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-3"
      }>
        {sortedNotes.map(note => (
          <NoteCard 
            key={note.id} 
            note={note} 
            className={viewType === 'list' ? "max-w-none" : ""}
          />
        ))}
      </div>
      
      <Button 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center shadow-lg"
        onClick={handleCreateNote}
      >
        <Plus size={24} />
      </Button>
    </div>
  );
}
