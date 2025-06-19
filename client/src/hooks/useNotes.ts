import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type NoteWithTags, type InsertNote, type Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { stripHtml } from "@/lib/utils";
import { 
  getOfflineNotesWithTags, 
  getOfflineNoteWithTags, 
  saveOfflineNote, 
  deleteOfflineNote,
  isOffline,
  setLastSyncTime,
  getLastSyncTime
} from "@/lib/offlineStorage";
import { useAuth } from "@/context/AuthContext";
import {
  saveUserNotes,
  getUserNotes,
  saveUserTags,
  getUserTags
} from "@/lib/cloudinaryStorage";

export function useNotes(includeDeleted = false) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  
  return useQuery<NoteWithTags[]>({
    queryKey: ['/api/notes', { includeDeleted, userId }],
    queryFn: async ({ queryKey }) => {
      // If we're offline, use offline storage
      if (isOffline()) {
        console.log('Using offline notes storage');
        const offlineNotes = getOfflineNotesWithTags().filter(note => 
          includeDeleted ? true : !note.isDeleted
        );
        return offlineNotes;
      }
      
      // If user is authenticated, try to get notes from Cloudinary
      if (userId) {
        try {
          console.log('Trying to fetch notes from Cloudinary for user:', userId);
          const cloudNotes = await getUserNotes(userId);
          
          if (cloudNotes) {
            console.log('Notes fetched from Cloudinary successfully');
            // Update local storage with the fetched notes
            for (const note of cloudNotes) {
              saveOfflineNote(note as Note);
            }
            
            // Set the last sync time
            setLastSyncTime(Date.now());
            
            // Filter notes based on includeDeleted parameter
            return cloudNotes.filter(note => includeDeleted ? true : !note.isDeleted);
          }
        } catch (error) {
          console.error('Error fetching notes from Cloudinary:', error);
          // Continue to fetch from API or use offline storage
        }
      }
      
      // Otherwise, fetch from the API
      try {
        const [_, params] = queryKey as [string, { includeDeleted: boolean, userId: string | undefined }];
        const url = `/api/notes${params.includeDeleted ? '?includeDeleted=true' : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        // Store the notes in offline storage
        const notes = await res.json();
        for (const note of notes) {
          saveOfflineNote(note as Note);
        }
        
        // If user is authenticated, save to Cloudinary for persistence
        if (userId) {
          try {
            await saveUserNotes(userId, notes);
            setLastSyncTime(Date.now());
          } catch (cloudError) {
            console.error('Error saving notes to Cloudinary:', cloudError);
            // Continue anyway as notes are saved locally
          }
        }
        
        return notes;
      } catch (error) {
        console.error('Error fetching notes, falling back to offline storage:', error);
        // If the API call fails, fall back to offline storage
        const offlineNotes = getOfflineNotesWithTags().filter(note => 
          includeDeleted ? true : !note.isDeleted
        );
        return offlineNotes;
      }
    }
  });
}

export function useNoteById(id: number | null) {
  console.log("useNoteById called with id:", id, "type:", typeof id);
  
  return useQuery<NoteWithTags | null>({
    queryKey: ['/api/notes', id],
    enabled: id !== null,
    queryFn: async () => {
      console.log("useNoteById queryFn executing with id:", id);
      if (id === null) {
        console.log("id is null, returning null");
        return null;
      }
      
      // If we're offline, use offline storage
      if (isOffline()) {
        console.log('Using offline note storage for note:', id);
        const offlineNote = getOfflineNoteWithTags(id);
        console.log("Offline note found:", offlineNote);
        return offlineNote || null;
      }
      
      // Otherwise, fetch from the API
      try {
        const res = await fetch(`/api/notes/${id}`, { credentials: 'include' });
        
        if (res.status === 404) {
          return null;
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        // Store the note in offline storage
        const note = await res.json();
        saveOfflineNote(note as Note);
        
        return note;
      } catch (error) {
        console.error(`Error fetching note ${id}, falling back to offline storage:`, error);
        // If the API call fails, fall back to offline storage
        const offlineNote = getOfflineNoteWithTags(id);
        return offlineNote || null;
      }
    }
  });
}

export function useCreateNote() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  
  return useMutation({
    mutationFn: async (note: Partial<InsertNote> & { tagIds?: number[] }) => {
      // If we're offline, create a local note
      if (isOffline()) {
        const now = new Date();
        // Create a temporary note with a negative ID (to avoid conflicts with server IDs)
        const tempId = -Math.floor(Math.random() * 10000000);
        const offlineNote: Note = {
          id: tempId,
          title: note.title || "Untitled",
          content: note.content || "",
          isFavorite: note.isFavorite || false,
          isDeleted: note.isDeleted || false,
          createdAt: now,
          updatedAt: now
        };
        
        // Save to offline storage
        saveOfflineNote(offlineNote);
        
        // Return the created note
        return offlineNote;
      }
      
      try {
        const res = await apiRequest('POST', '/api/notes', note);
        const createdNote = await res.json();
        
        // Also save to offline storage
        saveOfflineNote(createdNote);
        
        // If user is authenticated, sync with Cloudinary
        if (userId) {
          try {
            // Get all notes to save them together
            const allNotes = getOfflineNotesWithTags();
            await saveUserNotes(userId, allNotes);
            setLastSyncTime(Date.now());
          } catch (cloudError) {
            console.error('Error syncing notes to Cloudinary after creation:', cloudError);
            // Continue anyway as notes are saved locally
          }
        }
        
        return createdNote;
      } catch (error) {
        console.error('Error creating note, saving offline only:', error);
        // If API call fails, create offline note
        const now = new Date();
        const tempId = -Math.floor(Math.random() * 10000000);
        const offlineNote: Note = {
          id: tempId,
          title: note.title || "Untitled",
          content: note.content || "",
          isFavorite: note.isFavorite || false,
          isDeleted: note.isDeleted || false,
          createdAt: now,
          updatedAt: now
        };
        
        // Save to offline storage
        saveOfflineNote(offlineNote);
        
        // Return the offline note
        return offlineNote;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note created",
        description: "Your note has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: isOffline() 
          ? "Currently offline. Note saved locally."
          : error.message,
        variant: isOffline() ? "default" : "destructive",
      });
    }
  });
}

export function useUpdateNote() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  
  return useMutation({
    mutationFn: async ({ id, note }: { id: number, note: Partial<InsertNote> & { tagIds?: number[] } }) => {
      // If we're offline, update the note locally
      if (isOffline()) {
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Note not found in offline storage');
        }
        
        const updatedNote: Note = {
          ...offlineNote,
          ...note,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(updatedNote);
        
        return updatedNote;
      }
      
      try {
        const res = await apiRequest('PUT', `/api/notes/${id}`, note);
        const updatedNote = await res.json();
        
        // Also save to offline storage
        saveOfflineNote(updatedNote);
        
        // If user is authenticated, sync with Cloudinary
        if (userId) {
          try {
            // Get all notes to save them together
            const allNotes = getOfflineNotesWithTags();
            await saveUserNotes(userId, allNotes);
            setLastSyncTime(Date.now());
          } catch (cloudError) {
            console.error('Error syncing notes to Cloudinary after update:', cloudError);
            // Continue anyway as notes are saved locally
          }
        }
        
        return updatedNote;
      } catch (error) {
        console.error('Error updating note, updating offline only:', error);
        
        // Try to get the current version from offline storage
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Failed to update note and note not found in offline storage');
        }
        
        // Update with new values
        const updatedNote: Note = {
          ...offlineNote,
          ...note,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(updatedNote);
        
        return updatedNote;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes', id] });
      toast({
        title: "Note updated",
        description: isOffline() 
          ? "Note updated in offline mode" 
          : "Your changes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteNote() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // If we're offline, mark the note as deleted locally
      if (isOffline()) {
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Note not found in offline storage');
        }
        
        const deletedNote: Note = {
          ...offlineNote,
          isDeleted: true,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(deletedNote);
        
        return deletedNote;
      }
      
      try {
        const res = await apiRequest('DELETE', `/api/notes/${id}`, undefined);
        const deletedNote = await res.json();
        
        // Also update local storage
        saveOfflineNote({
          ...deletedNote,
          isDeleted: true,
          updatedAt: new Date()
        });
        
        return deletedNote;
      } catch (error) {
        console.error('Error deleting note, marking deleted in offline storage only:', error);
        
        // Try to get the current version from offline storage
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Failed to delete note and note not found in offline storage');
        }
        
        // Mark as deleted
        const deletedNote: Note = {
          ...offlineNote,
          isDeleted: true,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(deletedNote);
        
        return deletedNote;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note moved to trash",
        description: isOffline()
          ? "Note marked as deleted in offline mode"
          : "The note has been moved to trash",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useRestoreNote() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // If we're offline, restore the note locally
      if (isOffline()) {
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Note not found in offline storage');
        }
        
        const restoredNote: Note = {
          ...offlineNote,
          isDeleted: false,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(restoredNote);
        
        return restoredNote;
      }
      
      try {
        const res = await apiRequest('POST', `/api/notes/${id}/restore`, undefined);
        const restoredNote = await res.json();
        
        // Also update local storage
        saveOfflineNote({
          ...restoredNote,
          isDeleted: false,
          updatedAt: new Date()
        });
        
        return restoredNote;
      } catch (error) {
        console.error('Error restoring note, restoring in offline storage only:', error);
        
        // Try to get the current version from offline storage
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Failed to restore note and note not found in offline storage');
        }
        
        // Mark as restored
        const restoredNote: Note = {
          ...offlineNote,
          isDeleted: false,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(restoredNote);
        
        return restoredNote;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note restored",
        description: isOffline()
          ? "Note restored in offline mode"
          : "The note has been restored from trash",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to restore note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useToggleFavorite() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // If we're offline, toggle favorite status locally
      if (isOffline()) {
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Note not found in offline storage');
        }
        
        const updatedNote: Note = {
          ...offlineNote,
          isFavorite: !offlineNote.isFavorite,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(updatedNote);
        
        return updatedNote;
      }
      
      try {
        const res = await apiRequest('POST', `/api/notes/${id}/toggle-favorite`, undefined);
        const updatedNote = await res.json();
        
        // Also update local storage
        saveOfflineNote(updatedNote);
        
        return updatedNote;
      } catch (error) {
        console.error('Error toggling favorite, updating in offline storage only:', error);
        
        // Try to get the current version from offline storage
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Failed to toggle favorite and note not found in offline storage');
        }
        
        // Toggle favorite
        const updatedNote: Note = {
          ...offlineNote,
          isFavorite: !offlineNote.isFavorite,
          updatedAt: new Date()
        };
        
        // Save to offline storage
        saveOfflineNote(updatedNote);
        
        return updatedNote;
      }
    },
    onSuccess: (updatedNote, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes', id] });
      
      const favoriteStatus = updatedNote.isFavorite ? 'added to favorites' : 'removed from favorites';
      toast({
        title: `Note ${favoriteStatus}`,
        description: isOffline() 
          ? `Note ${favoriteStatus} in offline mode` 
          : `The note has been ${favoriteStatus}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update favorite status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useSearchNotes() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (query: string) => {
      // If we're offline, use offline search
      if (isOffline()) {
        console.log('Searching notes in offline storage');
        const results = getOfflineNotesWithTags().filter(note => 
          note.title.toLowerCase().includes(query.toLowerCase()) || 
          note.content.toLowerCase().includes(query.toLowerCase()) ||
          note.tags.some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
        );
        return results;
      }
      
      try {
        const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        return res.json() as Promise<NoteWithTags[]>;
      } catch (error) {
        console.error('Error searching notes, falling back to offline search:', error);
        toast({
          title: "Using offline search",
          description: "Unable to connect to server, searching local notes instead",
          variant: "default"
        });
        
        // Fall back to offline search
        const results = getOfflineNotesWithTags().filter(note => 
          note.title.toLowerCase().includes(query.toLowerCase()) || 
          note.content.toLowerCase().includes(query.toLowerCase()) ||
          note.tags.some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
        );
        return results;
      }
    }
  });
}

export function useExportNote() {
  const { toast } = useToast();
  
  const exportNote = async (id: number, format: 'text' | 'json' | 'markdown' = 'text') => {
    try {
      // If we're offline, export from local storage
      if (isOffline()) {
        const offlineNote = getOfflineNoteWithTags(id);
        if (!offlineNote) {
          throw new Error('Note not found in offline storage');
        }
        
        // Generate content based on format
        let content = '';
        let mimeType = '';
        let fileExtension = '';
        
        if (format === 'text') {
          content = stripHtml(offlineNote.content);
          mimeType = 'text/plain';
          fileExtension = 'txt';
        } else if (format === 'markdown') {
          // Basic HTML to Markdown conversion for offline mode
          let markdown = offlineNote.content;
          // Replace headings
          markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
          markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
          markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
          // Replace paragraphs
          markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
          // Replace bold and italic
          markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
          markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
          // Replace links
          markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
          // Replace lists
          markdown = markdown.replace(/<ul>(.*?)<\/ul>/g, '$1\n');
          markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n');
          
          content = markdown;
          mimeType = 'text/markdown';
          fileExtension = 'md';
        } else if (format === 'json') {
          content = JSON.stringify(offlineNote, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
        }
        
        // Create a download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-${id}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Note exported (offline mode)",
          description: `Note has been exported as ${format.toUpperCase()}`,
        });
        return;
      }
      
      // Online mode - use API
      const a = document.createElement('a');
      a.href = `/api/notes/${id}/export?format=${format}`;
      a.download = `note-${id}.${format === 'text' ? 'txt' : format === 'markdown' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Note exported",
        description: `Note has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  return { exportNote };
}
