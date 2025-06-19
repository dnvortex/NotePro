import { createContext, useContext, useState, ReactNode } from "react";
import { type NoteWithTags } from "@shared/schema";

interface NoteContextType {
  activeNoteId: number | null;
  setActiveNoteId: (id: number | null) => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  return (
    <NoteContext.Provider value={{ 
      activeNoteId, 
      setActiveNoteId,
      isMenuOpen,
      toggleMenu 
    }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
}
