import { Editor } from "@tiptap/react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Link, 
  Image, 
  Code, 
  Table, 
  Star, 
  Share, 
  MoreVertical,
  FileText,
  TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleFavorite, useExportNote } from "@/hooks/useNotes";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { NoteWithTags } from "@shared/schema";

interface ToolbarProps {
  editor: Editor | null;
  noteId: number;
  note: NoteWithTags | null;
  isSaved: boolean;
  isMarkdownMode?: boolean;
  toggleMarkdownMode?: () => void;
  voiceDictation?: React.ReactNode;
}

export function Toolbar({ 
  editor, 
  noteId, 
  note, 
  isSaved, 
  isMarkdownMode = false,
  toggleMarkdownMode,
  voiceDictation 
}: ToolbarProps) {
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { exportNote } = useExportNote();
  
  if (!editor) {
    return null;
  }

  const addCodeBlock = (language: string = 'plaintext') => {
    editor.chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: { language },
        content: [{ type: 'text', text: '' }]
      })
      .run();
  };
  
  return (
    <div className="border-b border-gray-800 bg-[#323232] p-2 flex items-center editor-toolbar">
      <div className="flex items-center space-x-1 mr-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("bold") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("italic") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("underline") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("strike") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>
      
      <div className="h-5 w-px bg-gray-700 mx-2"></div>
      
      <div className="flex items-center space-x-1 mr-2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("heading", { level: 1 }) ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("bulletList") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("orderedList") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("taskList") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Check list"
        >
          <CheckSquare size={16} />
        </button>
      </div>
      
      <div className="h-5 w-px bg-gray-700 mx-2"></div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("link") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Link"
        >
          <Link size={16} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Image URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="p-2 rounded hover:bg-gray-700 transition-colors text-gray-400"
          title="Image"
        >
          <Image size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "p-2 rounded hover:bg-gray-700 transition-colors",
            editor.isActive("codeBlock") ? "bg-gray-700 text-purple-500" : "text-gray-400"
          )}
          title="Code block"
        >
          <Code size={16} />
        </button>
        
        {/* Code block dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded hover:bg-gray-700 transition-colors text-gray-400"
              title="Add code block with language"
            >
              <TerminalSquare size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => addCodeBlock('javascript')}>
              JavaScript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('typescript')}>
              TypeScript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('html')}>
              HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('css')}>
              CSS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('python')}>
              Python
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('bash')}>
              Bash
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('json')}>
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addCodeBlock('markdown')}>
              Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-2 rounded hover:bg-gray-700 transition-colors text-gray-400"
          title="Table"
        >
          <Table size={16} />
        </button>
      </div>
      
      <div className="ml-auto flex items-center gap-3">
        {voiceDictation && (
          <>
            {voiceDictation}
            <div className="h-5 w-px bg-gray-700 mx-2"></div>
          </>
        )}

        {/* Markdown mode toggle */}
        {toggleMarkdownMode && (
          <>
            <button
              onClick={toggleMarkdownMode}
              className={cn(
                "p-1.5 rounded-md hover:bg-gray-700 transition-colors",
                isMarkdownMode ? "bg-blue-700/80 text-white" : "text-gray-400 hover:text-white"
              )}
              title={isMarkdownMode ? "Disable Markdown mode" : "Enable Markdown mode"}
            >
              <FileText size={16} />
              <span className="sr-only">Markdown Mode</span>
            </button>
            <div className="h-5 w-px bg-gray-700 mx-2"></div>
          </>
        )}
        
        <span className="text-xs text-gray-400">
          {isSaved ? "Saved" : "Saving..."}
        </span>
        <div className="flex items-center gap-2">
          <button 
            className={cn(
              "p-1.5 rounded-md hover:bg-gray-700 transition-colors",
              note?.isFavorite ? "text-yellow-400" : "text-gray-400 hover:text-white"
            )}
            onClick={() => toggleFavorite(noteId)}
            title={note?.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={16} className={note?.isFavorite ? "fill-yellow-400" : ""} />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            title="Share note"
          >
            <Share size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportNote(noteId, 'text')}>
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportNote(noteId, 'markdown')}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportNote(noteId, 'json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().clearContent().run()}>
                Clear Content
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
