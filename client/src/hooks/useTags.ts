import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Tag, type InsertTag } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  getOfflineTags, 
  saveOfflineTag, 
  deleteOfflineTag,
  addOfflineTagToNote,
  removeOfflineTagFromNote,
  isOffline,
  getOfflineNoteWithTags
} from "@/lib/offlineStorage";

export function useTags() {
  const { toast } = useToast();
  
  return useQuery<Tag[]>({
    queryKey: ['/api/tags'],
    queryFn: async () => {
      // If we're offline, get tags from local storage
      if (isOffline()) {
        console.log('Getting tags from offline storage');
        return getOfflineTags();
      }
      
      try {
        const res = await fetch('/api/tags', { credentials: 'include' });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        // Store tags in offline storage
        const tags = await res.json();
        for (const tag of tags) {
          saveOfflineTag(tag);
        }
        
        return tags;
      } catch (error) {
        console.error('Error fetching tags, using offline storage:', error);
        
        // Show toast only once
        toast({
          title: "Using offline tags",
          description: "Unable to connect to server, showing locally stored tags",
          variant: "default"
        });
        
        return getOfflineTags();
      }
    }
  });
}

export function useCreateTag() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (tag: InsertTag) => {
      // If we're offline, create a local tag
      if (isOffline()) {
        const tempId = -Math.floor(Math.random() * 10000000);
        const offlineTag: Tag = {
          id: tempId,
          name: tag.name || 'Untitled Tag',
          color: tag.color || '#6e56cf' // Default color (purple)
        };
        
        // Save to offline storage
        saveOfflineTag(offlineTag);
        
        return offlineTag;
      }
      
      try {
        const res = await apiRequest('POST', '/api/tags', tag);
        const createdTag = await res.json();
        
        // Also save to offline storage
        saveOfflineTag(createdTag);
        
        return createdTag;
      } catch (error) {
        console.error('Error creating tag, saving offline only:', error);
        
        // If API call fails, create offline tag
        const tempId = -Math.floor(Math.random() * 10000000);
        const offlineTag: Tag = {
          id: tempId,
          name: tag.name || 'Untitled Tag',
          color: tag.color || '#6e56cf' // Default color (purple)
        };
        
        // Save to offline storage
        saveOfflineTag(offlineTag);
        
        return offlineTag;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({
        title: "Tag created",
        description: isOffline()
          ? "Tag created in offline mode"
          : "Your tag has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateTag() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, tag }: { id: number, tag: Partial<InsertTag> }) => {
      // If we're offline, update the tag locally
      if (isOffline()) {
        // Get current tag from offline storage
        const offlineTags = getOfflineTags();
        const existingTag = offlineTags.find(t => t.id === id);
        
        if (!existingTag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Update the tag
        const updatedTag: Tag = {
          ...existingTag,
          ...tag
        };
        
        // Save to offline storage
        saveOfflineTag(updatedTag);
        
        return updatedTag;
      }
      
      try {
        const res = await apiRequest('PUT', `/api/tags/${id}`, tag);
        const updatedTag = await res.json();
        
        // Also save to offline storage
        saveOfflineTag(updatedTag);
        
        return updatedTag;
      } catch (error) {
        console.error('Error updating tag, updating offline only:', error);
        
        // Try to get the current version from offline storage
        const offlineTags = getOfflineTags();
        const existingTag = offlineTags.find(t => t.id === id);
        
        if (!existingTag) {
          throw new Error('Failed to update tag and tag not found in offline storage');
        }
        
        // Update the tag
        const updatedTag: Tag = {
          ...existingTag,
          ...tag
        };
        
        // Save to offline storage
        saveOfflineTag(updatedTag);
        
        return updatedTag;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({
        title: "Tag updated",
        description: isOffline()
          ? "Tag updated in offline mode"
          : "Your tag has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteTag() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // If we're offline, delete the tag locally
      if (isOffline()) {
        // Check if tag exists
        const offlineTags = getOfflineTags();
        const existingTag = offlineTags.find(t => t.id === id);
        
        if (!existingTag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Delete from offline storage
        deleteOfflineTag(id);
        
        return { success: true };
      }
      
      try {
        const res = await apiRequest('DELETE', `/api/tags/${id}`, undefined);
        const result = await res.json();
        
        // Also delete from offline storage
        deleteOfflineTag(id);
        
        return result;
      } catch (error) {
        console.error('Error deleting tag, deleting in offline storage only:', error);
        
        // Try to get the current version from offline storage
        const offlineTags = getOfflineTags();
        const existingTag = offlineTags.find(t => t.id === id);
        
        if (!existingTag) {
          throw new Error('Failed to delete tag and tag not found in offline storage');
        }
        
        // Delete from offline storage
        deleteOfflineTag(id);
        
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({
        title: "Tag deleted",
        description: isOffline()
          ? "Tag deleted in offline mode"
          : "The tag has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useAddTagToNote() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: number, tagId: number }) => {
      // If we're offline, add tag to note locally
      if (isOffline()) {
        // Check if note exists
        const note = getOfflineNoteWithTags(noteId);
        if (!note) {
          throw new Error('Note not found in offline storage');
        }
        
        // Check if tag exists
        const offlineTags = getOfflineTags();
        const tag = offlineTags.find(t => t.id === tagId);
        if (!tag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Add tag to note in offline storage
        addOfflineTagToNote(noteId, tagId);
        
        return { success: true };
      }
      
      try {
        const res = await apiRequest('POST', `/api/notes/${noteId}/tags/${tagId}`, undefined);
        const result = await res.json();
        
        // Also add in offline storage
        addOfflineTagToNote(noteId, tagId);
        
        return result;
      } catch (error) {
        console.error('Error adding tag to note, adding in offline storage only:', error);
        
        // Check if note exists
        const note = getOfflineNoteWithTags(noteId);
        if (!note) {
          throw new Error('Note not found in offline storage');
        }
        
        // Check if tag exists
        const offlineTags = getOfflineTags();
        const tag = offlineTags.find(t => t.id === tagId);
        if (!tag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Add tag to note in offline storage
        addOfflineTagToNote(noteId, tagId);
        
        return { success: true };
      }
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', noteId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      
      toast({
        title: "Tag added to note",
        description: isOffline()
          ? "Tag added to note in offline mode"
          : "Tag has been added to note",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add tag to note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useRemoveTagFromNote() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: number, tagId: number }) => {
      // If we're offline, remove tag from note locally
      if (isOffline()) {
        // Check if note exists
        const note = getOfflineNoteWithTags(noteId);
        if (!note) {
          throw new Error('Note not found in offline storage');
        }
        
        // Check if tag exists
        const offlineTags = getOfflineTags();
        const tag = offlineTags.find(t => t.id === tagId);
        if (!tag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Remove tag from note in offline storage
        removeOfflineTagFromNote(noteId, tagId);
        
        return { success: true };
      }
      
      try {
        const res = await apiRequest('DELETE', `/api/notes/${noteId}/tags/${tagId}`, undefined);
        const result = await res.json();
        
        // Also remove in offline storage
        removeOfflineTagFromNote(noteId, tagId);
        
        return result;
      } catch (error) {
        console.error('Error removing tag from note, removing in offline storage only:', error);
        
        // Check if note exists
        const note = getOfflineNoteWithTags(noteId);
        if (!note) {
          throw new Error('Note not found in offline storage');
        }
        
        // Check if tag exists
        const offlineTags = getOfflineTags();
        const tag = offlineTags.find(t => t.id === tagId);
        if (!tag) {
          throw new Error('Tag not found in offline storage');
        }
        
        // Remove tag from note in offline storage
        removeOfflineTagFromNote(noteId, tagId);
        
        return { success: true };
      }
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', noteId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      
      toast({
        title: "Tag removed from note",
        description: isOffline()
          ? "Tag removed from note in offline mode"
          : "Tag has been removed from note",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove tag from note",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
