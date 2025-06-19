import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useNoteById } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { TitleEditor } from "@/components/TitleEditor";
import { TagBadge } from "@/components/TagBadge";
import { useRemoveTagFromNote, useAddTagToNote } from "@/hooks/useTags";
import { formatRelativeTime } from "@/lib/utils";
import { 
  Alert,
  AlertDescription, 
  AlertTitle
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Clock, AlertCircle, Plus, Check } from "lucide-react";

export function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  
  // Debug logs
  console.log("NoteEditor rendered with id parameter:", id, "type:", typeof id);
  
  // Ensure the ID is a valid number
  let noteId: number | null = null;
  if (id) {
    try {
      noteId = parseInt(id, 10);
      if (isNaN(noteId)) {
        noteId = null;
        console.error("Invalid note ID (NaN):", id);
      } else {
        console.log("Converted id to noteId:", noteId, "type:", typeof noteId);
      }
    } catch (e) {
      console.error("Error parsing note ID:", e);
    }
  }
  
  // Only make the query if noteId is valid
  const { data: note, isLoading, error } = useNoteById(noteId);
  const { data: allTags = [] } = useTags();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const { mutate: removeTag } = useRemoveTagFromNote();
  const { mutate: addTag } = useAddTagToNote();
  
  // Redirect to home if note not found after loading
  useEffect(() => {
    if (!isLoading && !note && !error) {
      navigate("/");
    }
  }, [note, isLoading, error, navigate]);
  
  // Handle tag removal
  const handleRemoveTag = (tagId: number) => {
    if (noteId === null) {
      console.error("Cannot remove tag: noteId is null");
      return;
    }
    removeTag({ noteId, tagId });
  };
  
  // Handle tag addition
  const handleAddTag = (tagId: number) => {
    if (noteId === null) {
      console.error("Cannot add tag: noteId is null");
      return;
    }
    addTag({ noteId, tagId });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="border-b border-gray-800 bg-gray-800 p-2 flex items-center">
          <Skeleton className="h-8 w-40" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-4 w-40 mb-6" />
            <Skeleton className="h-24 w-full mb-3" />
            <Skeleton className="h-24 w-full mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => navigate("/")}
          >
            Back to notes
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!note) return null;
  
  const availableTags = allTags.filter(
    tag => !note.tags.some(t => t.id === tag.id)
  );
  
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <TipTapEditor content={note.content} noteId={note.id} note={note} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
          <div className="mb-3 flex items-center">
            <TitleEditor id={note.id} initialTitle={note.title} />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Clock size={14} />
              <span>Last edited: {formatRelativeTime(note.updatedAt)}</span>
            </div>
            <div className="h-4 w-px bg-gray-700 mx-1"></div>
            <div className="flex items-center gap-2">
              {note.tags.map(tag => (
                <TagBadge 
                  key={tag.id} 
                  tag={tag} 
                  removable 
                  onRemove={() => handleRemoveTag(tag.id)} 
                />
              ))}
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white">
                    <Plus size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium">Add tags</h4>
                    {availableTags.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTags.map(tag => (
                          <Button 
                            key={tag.id} 
                            variant="outline" 
                            size="sm"
                            className="justify-start"
                            onClick={() => handleAddTag(tag.id)}
                          >
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No more tags available</p>
                    )}
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setTagDialogOpen(true)}>
                      Manage Tags
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tag Management Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Applied Tags</h4>
              <div className="flex flex-wrap gap-2">
                {note.tags.length > 0 ? (
                  note.tags.map(tag => (
                    <div 
                      key={tag.id}
                      className="flex items-center px-3 py-1.5 rounded-md bg-gray-800"
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                      <button 
                        className="ml-2 text-gray-400 hover:text-white"
                        onClick={() => handleRemoveTag(tag.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                          <path d="M18 6 6 18"/>
                          <path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No tags applied</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Available Tags</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableTags.length > 0 ? (
                  availableTags.map(tag => (
                    <Button 
                      key={tag.id} 
                      variant="outline" 
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAddTag(tag.id)}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 col-span-2">No more tags available</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
