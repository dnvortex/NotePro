import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useUpdateNote } from '@/hooks/useNotes';
import { debounce } from '@/lib/utils';
import { Toolbar } from './Toolbar';
import { VoiceDictation } from '@/components/VoiceDictation';
import { NoteWithTags } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { saveOfflineNote } from '@/lib/offlineStorage';

interface TipTapEditorProps {
  content: string;
  noteId: number;
  note: NoteWithTags | null;
}

export function TipTapEditor({ content, noteId, note }: TipTapEditorProps) {
  const [isSaved, setIsSaved] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const { mutate: updateNote } = useUpdateNote();
  const { voiceSettings } = useSettings();
  const autoSaveEnabled = voiceSettings.autoSave;
  const lastSavedContent = useRef(content);
  const autoSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce((newContent: string) => {
      if (newContent === lastSavedContent.current) return;
      
      // Save to server
      updateNote(
        { id: noteId, note: { content: newContent } },
        {
          onSuccess: () => {
            setIsSaved(true);
            lastSavedContent.current = newContent;
            toast({
              title: "Auto-saved",
              description: "Your note has been automatically saved",
              variant: "default",
              duration: 2000
            });
          },
          onError: (error) => {
            console.error('Failed to save note:', error);
            
            // Save offline if online save fails
            if (note) {
              try {
                saveOfflineNote({
                  ...note,
                  content: newContent,
                  updatedAt: new Date(),
                });
                toast({
                  title: "Saved offline",
                  description: "Your note has been saved offline",
                  variant: "default",
                  duration: 2000
                });
              } catch (offlineError) {
                console.error('Failed to save note offline:', offlineError);
                toast({
                  title: "Failed to save",
                  description: "Could not save your note. Please try again.",
                  variant: "destructive"
                });
              }
            }
          }
        }
      );
    }, 1000),
    [noteId, note]
  );
  
  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setIsSaved(false);
      const newContent = editor.getHTML();
      debouncedSave(newContent);
    },
    autofocus: 'end',
  });
  
  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
      setIsSaved(true);
      lastSavedContent.current = content;
    }
  }, [editor, content]);
  
  // Set up auto-save interval
  useEffect(() => {
    // Clear any existing interval
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
      autoSaveInterval.current = null;
    }
    
    // If auto-save is enabled and we have an editor, set up the interval
    if (autoSaveEnabled && editor) {
      autoSaveInterval.current = setInterval(() => {
        const currentContent = editor.getHTML();
        
        // Only save if content has changed and is not empty
        if (currentContent && currentContent !== lastSavedContent.current) {
          console.log('Auto-saving note...');
          updateNote(
            { id: noteId, note: { content: currentContent } },
            {
              onSuccess: () => {
                setIsSaved(true);
                lastSavedContent.current = currentContent;
                toast({
                  title: "Auto-saved",
                  description: "Your note has been automatically saved",
                  variant: "default",
                  duration: 2000
                });
              },
              onError: (error) => {
                console.error('Auto-save failed:', error);
                
                // Save offline if online save fails
                if (note) {
                  try {
                    saveOfflineNote({
                      ...note,
                      content: currentContent,
                      updatedAt: new Date(),
                    });
                    toast({
                      title: "Saved offline",
                      description: "Your note has been saved offline",
                      variant: "default",
                      duration: 2000
                    });
                  } catch (offlineError) {
                    console.error('Failed to save note offline:', offlineError);
                  }
                }
              }
            }
          );
        }
      }, 30000); // Auto-save every 30 seconds
    }
    
    // Clean up interval on unmount
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [autoSaveEnabled, editor, noteId, note, updateNote]);

  // Handle voice transcription
  const handleTranscript = (transcript: string) => {
    if (editor) {
      // Insert the transcribed text at the current cursor position
      const currentPosition = editor.state.selection.from;
      editor.chain().focus().insertContentAt(currentPosition, transcript).run();
      
      // Save the content
      const newContent = editor.getHTML();
      setIsSaved(false);
      debouncedSave(newContent);
    }
  };

  // Toggle Markdown mode
  const toggleMarkdownMode = () => {
    setIsMarkdownMode(!isMarkdownMode);
  };
  
  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        editor={editor} 
        noteId={noteId} 
        note={note} 
        isSaved={isSaved}
        isMarkdownMode={isMarkdownMode}
        toggleMarkdownMode={toggleMarkdownMode}
        voiceDictation={
          <VoiceDictation 
            onTranscript={handleTranscript}
            isListening={isListening}
            setIsListening={setIsListening}
          />
        }
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
          {/* Editor content with syntax highlighting styles */}
          <div className={`markdown-editor ${isMarkdownMode ? 'markdown-mode' : ''}`}>
            <EditorContent editor={editor} className="min-h-[300px]" />
          </div>
          
          {isListening && (
            <div className="mt-4 p-3 bg-purple-600/20 rounded-md border border-purple-600 text-purple-100 text-sm">
              <span className="font-medium">🎤 Voice dictation active</span>
              <span className="ml-2">Speak clearly to add text to your note. Say "period" for a full stop.</span>
            </div>
          )}
          
          {isMarkdownMode && (
            <div className="mt-4 p-3 bg-blue-600/20 rounded-md border border-blue-600 text-blue-100 text-sm">
              <span className="font-medium">Markdown mode active</span>
              <span className="ml-2">You're editing in Markdown mode. Use Markdown syntax for formatting.</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Add styles for code blocks with syntax highlighting */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror pre {
          background-color: #282c34;
          color: #abb2bf;
          font-family: 'Menlo', Monaco, 'Courier New', monospace;
          padding: 0.75em 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
        
        .ProseMirror code {
          background-color: #282c34;
          color: #abb2bf;
          font-family: 'Menlo', Monaco, 'Courier New', monospace;
          padding: 0.1em 0.3em;
          border-radius: 0.3em;
        }
        
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .markdown-mode .ProseMirror {
          font-family: 'Menlo', Monaco, 'Courier New', monospace;
        }
      `}} />
    </div>
  );
}
