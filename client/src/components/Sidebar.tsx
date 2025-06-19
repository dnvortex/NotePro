import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useNotes } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { useCreateNote } from "@/hooks/useNotes";
import { useNoteContext } from "@/context/NoteContext";
import { useAuth } from "@/context/AuthContext";
import { generatePlaceholderInitials } from "@/lib/utils";
import { Settings as SettingsDialog } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  PenLine, 
  Plus, 
  FileText, 
  Star, 
  Clock, 
  Trash2, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { isMenuOpen, toggleMenu } = useNoteContext();
  const { currentUser, logout } = useAuth();
  const { data: tags = [] } = useTags();
  const { data: notes = [] } = useNotes();
  const { mutate: createNote } = useCreateNote();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const favoriteNotes = notes.filter(note => note.isFavorite && !note.isDeleted);
  const trashNotes = notes.filter(note => note.isDeleted);
  const recentNotes = notes.filter(note => !note.isDeleted);

  const handleCreateNote = () => {
    createNote({ title: "Untitled", content: "" }, {
      onSuccess: (newNote) => {
        navigate(`/notes/${newNote.id}`);
      }
    });
  };

  return (
    <>
    <SettingsDialog 
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
    />
    <aside className={cn(
      "flex flex-col w-64 bg-dark-surface border-r border-gray-800",
      "transition-transform duration-300 ease-in-out",
      isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      "fixed inset-y-0 left-0 z-30 md:relative",
      className
    )}>
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center">
          <PenLine className="mr-2 text-purple-500" />
          <span>NotesMaster</span>
        </h1>
        <button 
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white md:hidden"
          onClick={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <Button 
          className="flex items-center gap-2 text-left w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700"
          onClick={handleCreateNote}
        >
          <Plus size={18} />
          <span>New Note</span>
        </Button>
        
        <nav className="mt-4 space-y-1 flex-1">
          <Link href="/">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md hover:bg-gray-800 transition-colors text-white cursor-pointer",
              location === "/" && "bg-gray-800"
            )}>
              <FileText size={18} />
              <span>All Notes</span>
              <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded-md">
                {notes.filter(note => !note.isDeleted).length}
              </span>
            </div>
          </Link>
          <Link href="/notes/favorites">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md hover:bg-gray-800 transition-colors text-white cursor-pointer",
              location === "/notes/favorites" && "bg-gray-800"
            )}>
              <Star size={18} />
              <span>Favorites</span>
              <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded-md">
                {favoriteNotes.length}
              </span>
            </div>
          </Link>
          <Link href="/notes/recent">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md hover:bg-gray-800 transition-colors text-white cursor-pointer",
              location === "/notes/recent" && "bg-gray-800"
            )}>
              <Clock size={18} />
              <span>Recent</span>
            </div>
          </Link>
          <Link href="/notes/trash">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md hover:bg-gray-800 transition-colors text-white cursor-pointer",
              location === "/notes/trash" && "bg-gray-800"
            )}>
              <Trash2 size={18} />
              <span>Trash</span>
              {trashNotes.length > 0 && (
                <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded-md">
                  {trashNotes.length}
                </span>
              )}
            </div>
          </Link>
        </nav>
        
        <div className="mt-2">
          <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</h3>
          <div className="space-y-1 mt-1">
            {tags.map(tag => (
              <Link key={tag.id} href={`/notes/tag/${tag.id}`}>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-white cursor-pointer",
                  location === `/notes/tag/${tag.id}` && "bg-gray-800"
                )}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded-md">
                    {notes.filter(note => 
                      note.tags.some(t => t.id === tag.id) && !note.isDeleted
                    ).length}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* User section */}
      <div className="px-4 py-3 border-t border-gray-800 flex items-center">
        {currentUser ? (
          <>
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "User"} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-500">
                <span className="font-medium">{generatePlaceholderInitials(currentUser.displayName || "User")}</span>
              </div>
            )}
            <div className="ml-3">
              <div className="text-sm font-medium text-white">{currentUser.displayName || "User"}</div>
              <div className="text-xs text-gray-400">{currentUser.email || ""}</div>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="ml-auto p-1.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              <Settings size={16} className="text-gray-400" />
            </button>
          </>
        ) : (
          <div className="flex-1 flex justify-center">
            <Button 
              onClick={() => navigate("/login")}
              variant="outline" 
              className="text-sm"
            >
              Login
            </Button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
