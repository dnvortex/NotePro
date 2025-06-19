import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertNoteSchema, 
  insertTagSchema, 
  type Note, 
  type Tag,
  type NoteWithTags
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Notes API
  apiRouter.get("/notes", async (req: Request, res: Response) => {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const notes = await storage.getNotesWithTags(includeDeleted);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  
  apiRouter.get("/notes/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const notes = await storage.searchNotes(query);
      res.json(notes);
    } catch (error) {
      console.error("Error searching notes:", error);
      res.status(500).json({ message: "Failed to search notes" });
    }
  });
  
  apiRouter.get("/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const note = await storage.getNoteWithTags(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });
  
  apiRouter.post("/notes", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      
      // Handle tags if provided
      if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
        for (const tagId of req.body.tagIds) {
          await storage.addTagToNote(note.id, tagId);
        }
      }
      
      const noteWithTags = await storage.getNoteWithTags(note.id);
      res.status(201).json(noteWithTags);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  
  apiRouter.put("/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Validate only the fields that are present in the request body
      const partialNoteSchema = insertNoteSchema.partial();
      const validatedData = partialNoteSchema.parse(req.body);
      
      const updatedNote = await storage.updateNote(id, validatedData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Handle tags if provided
      if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
        // Get current tags
        const currentTags = await storage.getTagsForNote(id);
        const currentTagIds = currentTags.map(tag => tag.id);
        
        // Remove tags that are no longer associated
        for (const tagId of currentTagIds) {
          if (!req.body.tagIds.includes(tagId)) {
            await storage.removeTagFromNote(id, tagId);
          }
        }
        
        // Add new tags
        for (const tagId of req.body.tagIds) {
          if (!currentTagIds.includes(tagId)) {
            await storage.addTagToNote(id, tagId);
          }
        }
      }
      
      const noteWithTags = await storage.getNoteWithTags(id);
      res.json(noteWithTags);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });
  
  apiRouter.delete("/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteNote(id);
      
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });
  
  apiRouter.post("/notes/:id/restore", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const restoredNote = await storage.restoreNote(id);
      
      if (!restoredNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const noteWithTags = await storage.getNoteWithTags(id);
      res.json(noteWithTags);
    } catch (error) {
      console.error("Error restoring note:", error);
      res.status(500).json({ message: "Failed to restore note" });
    }
  });
  
  apiRouter.post("/notes/:id/toggle-favorite", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updatedNote = await storage.toggleFavorite(id);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const noteWithTags = await storage.getNoteWithTags(id);
      res.json(noteWithTags);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });
  
  // Tags API
  apiRouter.get("/tags", async (_req: Request, res: Response) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });
  
  apiRouter.post("/tags", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });
  
  apiRouter.put("/tags/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Validate only the fields that are present in the request body
      const partialTagSchema = insertTagSchema.partial();
      const validatedData = partialTagSchema.parse(req.body);
      
      const updatedTag = await storage.updateTag(id, validatedData);
      
      if (!updatedTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.json(updatedTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });
  
  apiRouter.delete("/tags/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTag(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });
  
  // Note-Tag relationship API
  apiRouter.get("/notes/:id/tags", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const tags = await storage.getTagsForNote(id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags for note:", error);
      res.status(500).json({ message: "Failed to fetch tags for note" });
    }
  });
  
  apiRouter.post("/notes/:noteId/tags/:tagId", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.noteId, 10);
      const tagId = parseInt(req.params.tagId, 10);
      
      // Ensure both note and tag exist
      const note = await storage.getNote(noteId);
      const tag = await storage.getTag(tagId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      await storage.addTagToNote(noteId, tagId);
      const tags = await storage.getTagsForNote(noteId);
      res.json(tags);
    } catch (error) {
      console.error("Error adding tag to note:", error);
      res.status(500).json({ message: "Failed to add tag to note" });
    }
  });
  
  apiRouter.delete("/notes/:noteId/tags/:tagId", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.noteId, 10);
      const tagId = parseInt(req.params.tagId, 10);
      
      await storage.removeTagFromNote(noteId, tagId);
      const tags = await storage.getTagsForNote(noteId);
      res.json(tags);
    } catch (error) {
      console.error("Error removing tag from note:", error);
      res.status(500).json({ message: "Failed to remove tag from note" });
    }
  });
  
// Convert HTML to markdown-like text
const htmlToMarkdown = (html: string): string => {
  // Helper function to handle list conversion (avoid s flag)
  const convertUl = (html: string): string => {
    const ulPattern = /<ul[^>]*>([\s\S]*?)<\/ul>/;
    let result = html;
    let match;
    
    while ((match = ulPattern.exec(result)) !== null) {
      const list = match[1];
      const liReplaced = list.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n');
      result = result.replace(match[0], liReplaced);
    }
    
    return result;
  };
  
  // Helper function for ordered lists (avoid s flag)
  const convertOl = (html: string): string => {
    const olPattern = /<ol[^>]*>([\s\S]*?)<\/ol>/;
    let result = html;
    let match;
    
    while ((match = olPattern.exec(result)) !== null) {
      const list = match[1];
      let index = 1;
      const liReplaced = list.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, () => {
        return `${index++}. $1\n`;
      });
      result = result.replace(match[0], liReplaced);
    }
    
    return result;
  };
  
  // Helper function for code blocks (avoid s flag)
  const convertCodeBlocks = (html: string): string => {
    const codePattern = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/;
    let result = html;
    let match;
    
    while ((match = codePattern.exec(result)) !== null) {
      const code = match[1];
      result = result.replace(match[0], '```\n' + code + '\n```');
    }
    
    return result;
  };
  
  // Helper function for blockquotes (avoid s flag)
  const convertBlockquotes = (html: string): string => {
    const blockquotePattern = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/;
    let result = html;
    let match;
    
    while ((match = blockquotePattern.exec(result)) !== null) {
      const content = match[1];
      result = result.replace(match[0], '> ' + content);
    }
    
    return result;
  };
  
  // Clean up excessive newlines
  const cleanNewlines = (text: string): string => {
    return text.replace(/\n\n\n+/g, '\n\n');
  };
  
  // Main conversion process
  let markdown = html
    // Remove HTML tags that don't need to be transformed
    .replace(/<\/?(div|span|p)([^>]*)>/g, '\n')
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
    // Convert bold
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    // Convert italic
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    // Convert underline to markdown emphasis
    .replace(/<u>(.*?)<\/u>/g, '_$1_')
    // Convert strikethrough
    .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
    // Convert links
    .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    // Convert images
    .replace(/<img src="([^"]*)"[^>]*>/g, '![]($1)')
    // Convert inline code
    .replace(/<code>(.*?)<\/code>/g, '`$1`');
  
  // Apply more complex transformations
  markdown = convertUl(markdown);
  markdown = convertOl(markdown);
  markdown = convertCodeBlocks(markdown);
  markdown = convertBlockquotes(markdown);
  markdown = cleanNewlines(markdown);
  
  // Fix remaining HTML entities
  markdown = markdown
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
    
  return markdown;
};

// Export API
apiRouter.get("/notes/:id/export", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const format = req.query.format as string || 'text';
    const note = await storage.getNoteWithTags(id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.txt"`);
      res.send(`${note.title}\n\n${note.content}`);
    } else if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
      
      // Convert HTML content to Markdown
      const markdown = htmlToMarkdown(note.content);
      
      // Include the title as a top-level heading
      res.send(`# ${note.title}\n\n${markdown}`);
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
      res.json(note);
    }
  } catch (error) {
    console.error("Error exporting note:", error);
    res.status(500).json({ message: "Failed to export note" });
  }
});
  
  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
