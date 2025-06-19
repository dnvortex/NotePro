import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { NotesList } from "@/components/NotesList";
import { Welcome } from "@/components/Welcome";
import { useNotes } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { type NoteWithTags } from "@shared/schema";
import { useNoteContext } from "@/context/NoteContext";

export default function Home() {
  const params = useParams();
  const [location] = useLocation();
  const { isMenuOpen } = useNoteContext();
  const [searchResults, setSearchResults] = useState<NoteWithTags[] | null>(null);
  
  // Determine the current filter type based on URL
  const filterType = useMemo(() => {
    if (location.includes('/notes/favorites')) return 'favorites';
    if (location.includes('/notes/trash')) return 'trash';
    if (location.includes('/notes/recent')) return 'recent';
    return undefined;
  }, [location]);
  
  // Extract tag ID from URL if we're on a tag page
  const tagId = useMemo(() => {
    if (location.includes('/notes/tag/') && params?.tag) {
      return parseInt(params.tag, 10);
    }
    return undefined;
  }, [location, params]);
  
  // Fetch notes and tags data
  const { data: notes = [], isLoading, error } = useNotes(filterType === 'trash');
  const { data: tags = [] } = useTags();
  
  // Handle search results
  const handleSearch = (results: NoteWithTags[]) => {
    setSearchResults(results.length > 0 ? results : null);
  };
  
  // Calculate filtered notes and page title
  const notesData = useMemo(() => {
    if (!notes.length) {
      return { filtered: [], title: "All Notes" };
    }
    
    let filtered = [...notes];
    let title = "All Notes";
    
    if (filterType === 'favorites') {
      filtered = notes.filter(note => note.isFavorite && !note.isDeleted);
      title = "Favorites";
    } else if (filterType === 'trash') {
      filtered = notes.filter(note => note.isDeleted);
      title = "Trash";
    } else if (filterType === 'recent') {
      filtered = notes
        .filter(note => !note.isDeleted)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
      title = "Recent Notes";
    } else if (tagId) {
      const tag = tags.find(t => t.id === tagId);
      filtered = notes.filter(note => 
        note.tags.some(t => t.id === tagId) && !note.isDeleted
      );
      title = tag ? `Tag: ${tag.name}` : "Tagged Notes";
    } else {
      filtered = notes.filter(note => !note.isDeleted);
    }
    
    return { filtered, title };
  }, [notes, filterType, tagId, tags]);
  
  // Determine final notes to display and title
  const displayNotes = searchResults || notesData.filtered;
  const showNotesList = displayNotes.length > 0 || searchResults !== null;
  const title = searchResults ? "Search Results" : notesData.title;
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isMenuOpen ? 'md:pl-0' : 'md:pl-0'}`}>
        <Header onSearch={handleSearch} />
        
        <main className="flex-1 overflow-y-auto">
          {showNotesList ? (
            <NotesList 
              notes={displayNotes} 
              title={title} 
              loading={isLoading} 
              error={error instanceof Error ? error : null} 
            />
          ) : (
            <Welcome />
          )}
        </main>
      </div>
    </div>
  );
}
