import { Link } from "wouter";
import { type NoteWithTags } from "@shared/schema";
import { formatRelativeTime, stripHtml, truncateText } from "@/lib/utils";
import { TagBadge } from "@/components/TagBadge";
import { 
  MoreVertical, 
  Star, 
  Clock, 
  Trash2, 
  RotateCcw,
  ArrowUpRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToggleFavorite, useDeleteNote, useRestoreNote } from "@/hooks/useNotes";

interface NoteCardProps {
  note: NoteWithTags;
  className?: string;
}

export function NoteCard({ note, className }: NoteCardProps) {
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: deleteNote } = useDeleteNote();
  const { mutate: restoreNote } = useRestoreNote();
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(note.id);
  };
  
  const handleDeleteNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNote(note.id);
  };
  
  const handleRestoreNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    restoreNote(note.id);
  };
  
  return (
    <div 
      className={cn(
        "note-card bg-[#262626] rounded-lg border border-gray-800 overflow-hidden shadow-lg animate-fade-in",
        "transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      <Link href={note.isDeleted ? "#" : `/notes/${note.id}`}>
        <div className="block p-5 cursor-pointer">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-lg text-white">{note.title || "Untitled"}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-400 hover:text-gray-300 p-1" onClick={(e) => e.preventDefault()}>
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!note.isDeleted ? (
                  <>
                    <DropdownMenuItem onClick={handleToggleFavorite}>
                      <Star className={cn("mr-2 h-4 w-4", note.isFavorite && "fill-yellow-400 text-yellow-400")} />
                      <span>{note.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/notes/${note.id}`} onClick={(e) => e.stopPropagation()}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        <span>Open note</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteNote} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Move to trash</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleRestoreNote}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span>Restore note</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
            {truncateText(stripHtml(note.content), 150) || "No content"}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {note.tags.slice(0, 3).map(tag => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{note.tags.length - 3} more</span>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2 flex items-center">
            <Clock className="mr-1" size={12} />
            <span>Edited {formatRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
