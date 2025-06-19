import { useState, useEffect } from "react";
import { useUpdateNote } from "@/hooks/useNotes";
import { debounce } from "@/lib/utils";

interface TitleEditorProps {
  id: number;
  initialTitle: string;
}

export function TitleEditor({ id, initialTitle }: TitleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const { mutate: updateNote } = useUpdateNote();
  
  // Save title after typing stops
  const debouncedUpdateTitle = debounce((newTitle: string) => {
    updateNote({ id, note: { title: newTitle } });
  }, 800);
  
  // Update title when prop changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdateTitle(newTitle);
  };
  
  return (
    <input 
      type="text" 
      className="text-3xl font-bold bg-transparent w-full focus:outline-none focus:ring-0 text-white" 
      value={title}
      onChange={handleTitleChange}
      placeholder="Note Title"
    />
  );
}
