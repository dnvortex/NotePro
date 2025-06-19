import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { NoteEditor } from "@/components/NoteEditor";
import { useNoteContext } from "@/context/NoteContext";
import { useEffect } from "react";
import { useParams } from "wouter";

export default function EditNote() {
  const { isMenuOpen } = useNoteContext();
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    console.log("EditNote component rendered with id:", id);
  }, [id]);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isMenuOpen ? 'md:pl-0' : 'md:pl-0'}`}>
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <NoteEditor />
        </main>
      </div>
    </div>
  );
}
