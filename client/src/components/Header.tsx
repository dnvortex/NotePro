import { useState } from 'react';
import { Link } from 'wouter';
import { Search, Plus, Settings as SettingsIcon, CheckCircle, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateNote, useSearchNotes } from '@/hooks/useNotes';
import { NoteWithTags } from '@shared/schema';
import { useNoteContext } from '@/context/NoteContext';
import { useAuth } from '@/context/AuthContext';
import { Settings } from '@/components/Settings';
import { InstallPWA } from '@/components/InstallPWA';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generatePlaceholderInitials } from '@/lib/utils';

interface HeaderProps {
  onSearch?: (results: NoteWithTags[]) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { mutate: createNote } = useCreateNote();
  const { mutateAsync: searchNotes } = useSearchNotes();
  const { toggleMenu } = useNoteContext();
  const { currentUser, login, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const handleNewNote = () => {
    createNote(
      { title: "Untitled", content: "" },
      {
        onSuccess: (note) => {
          window.location.href = `/notes/${note.id}`;
        }
      }
    );
  };
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    
    if (!query.trim()) return;
    
    try {
      const results = await searchNotes(query);
      if (onSearch) {
        onSearch(results);
      }
    } catch (error) {
      console.error('Error searching notes:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add keyboard shortcuts here if needed
  };
  
  return (
    <header className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button 
            className="md:hidden p-2 text-gray-400 rounded-md hover:text-gray-300 hover:bg-gray-800 mr-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link href="/" className="text-xl font-bold text-white flex items-center">
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-2 rounded-lg mr-2">
              NM
            </span>
            <span className="hidden sm:inline">Note Master</span>
          </Link>
        </div>
        
        <form onSubmit={handleSearch} className="mx-4 flex-1 max-w-md hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search notes..."
              name="q"
              className="pl-9 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 w-full"
              onKeyDown={handleKeyDown}
            />
          </div>
        </form>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleNewNote} 
            size="sm" 
            variant="outline"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-none"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
          
          <InstallPWA />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            className="text-gray-400 hover:text-gray-300"
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
          
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {currentUser.photoURL ? (
                      <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500">
                        {generatePlaceholderInitials(currentUser.displayName || currentUser.email || 'User')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CheckCircle className="h-3 w-3 absolute right-0 bottom-0 text-green-500 bg-gray-900 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {currentUser.displayName && (
                      <p className="font-medium">{currentUser.displayName}</p>
                    )}
                    {currentUser.email && (
                      <p className="text-sm text-gray-400">{currentUser.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={login}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <UserCircle2 className="h-4 w-4 mr-1" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
      
      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}