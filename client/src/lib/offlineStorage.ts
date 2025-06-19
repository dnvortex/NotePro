import { Note, NoteWithTags, Tag } from '@shared/schema';

const NOTES_STORAGE_KEY = 'notes_master_offline_notes';
const TAGS_STORAGE_KEY = 'notes_master_offline_tags';
const NOTE_TAGS_STORAGE_KEY = 'notes_master_offline_note_tags';
const LAST_SYNC_KEY = 'notes_master_last_sync';

interface NoteTag {
  noteId: number;
  tagId: number;
}

// Helper to get stored data with a fallback
function getStoredData<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error retrieving ${key} from localStorage:`, e);
    return fallback;
  }
}

// Helper to store data
function storeData(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error storing ${key} in localStorage:`, e);
  }
}

// Get all notes from local storage
export function getOfflineNotes(): Note[] {
  return getStoredData<Note[]>(NOTES_STORAGE_KEY, []);
}

// Get all tags from local storage
export function getOfflineTags(): Tag[] {
  return getStoredData<Tag[]>(TAGS_STORAGE_KEY, []);
}

// Get note-tag relationships from local storage
export function getOfflineNoteTags(): NoteTag[] {
  return getStoredData<NoteTag[]>(NOTE_TAGS_STORAGE_KEY, []);
}

// Store notes in local storage
export function storeOfflineNotes(notes: Note[]) {
  storeData(NOTES_STORAGE_KEY, notes);
}

// Store tags in local storage
export function storeOfflineTags(tags: Tag[]) {
  storeData(TAGS_STORAGE_KEY, tags);
}

// Store note-tag relationships in local storage
export function storeOfflineNoteTags(noteTags: NoteTag[]) {
  storeData(NOTE_TAGS_STORAGE_KEY, noteTags);
}

// Get a specific note with its tags
export function getOfflineNoteWithTags(noteId: number): NoteWithTags | undefined {
  const notes = getOfflineNotes();
  const tags = getOfflineTags();
  const noteTags = getOfflineNoteTags();
  
  const note = notes.find(n => n.id === noteId);
  if (!note) return undefined;
  
  const noteTagIds = noteTags
    .filter(nt => nt.noteId === noteId)
    .map(nt => nt.tagId);
  
  const noteTags_: Tag[] = tags.filter(tag => noteTagIds.includes(tag.id));
  
  return {
    ...note,
    tags: noteTags_
  };
}

// Get all notes with their tags
export function getOfflineNotesWithTags(): NoteWithTags[] {
  const notes = getOfflineNotes();
  const tags = getOfflineTags();
  const noteTags = getOfflineNoteTags();
  
  return notes.map(note => {
    const noteTagIds = noteTags
      .filter(nt => nt.noteId === note.id)
      .map(nt => nt.tagId);
    
    const noteTags_: Tag[] = tags.filter(tag => noteTagIds.includes(tag.id));
    
    return {
      ...note,
      tags: noteTags_
    };
  });
}

// Save a note to offline storage
export function saveOfflineNote(note: Note) {
  const notes = getOfflineNotes();
  const existingNoteIndex = notes.findIndex(n => n.id === note.id);
  
  if (existingNoteIndex >= 0) {
    // Update existing note
    notes[existingNoteIndex] = note;
  } else {
    // Add new note
    notes.push(note);
  }
  
  storeOfflineNotes(notes);
  return note;
}

// Delete a note from offline storage
export function deleteOfflineNote(noteId: number) {
  const notes = getOfflineNotes();
  const filteredNotes = notes.filter(n => n.id !== noteId);
  storeOfflineNotes(filteredNotes);
  
  // Also remove note-tag relationships
  const noteTags = getOfflineNoteTags();
  const filteredNoteTags = noteTags.filter(nt => nt.noteId !== noteId);
  storeOfflineNoteTags(filteredNoteTags);
  
  return true;
}

// Save a tag to offline storage
export function saveOfflineTag(tag: Tag) {
  const tags = getOfflineTags();
  const existingTagIndex = tags.findIndex(t => t.id === tag.id);
  
  if (existingTagIndex >= 0) {
    // Update existing tag
    tags[existingTagIndex] = tag;
  } else {
    // Add new tag
    tags.push(tag);
  }
  
  storeOfflineTags(tags);
  return tag;
}

// Delete a tag from offline storage
export function deleteOfflineTag(tagId: number) {
  const tags = getOfflineTags();
  const filteredTags = tags.filter(t => t.id !== tagId);
  storeOfflineTags(filteredTags);
  
  // Also remove note-tag relationships
  const noteTags = getOfflineNoteTags();
  const filteredNoteTags = noteTags.filter(nt => nt.tagId !== tagId);
  storeOfflineNoteTags(filteredNoteTags);
  
  return true;
}

// Add a tag to a note in offline storage
export function addOfflineTagToNote(noteId: number, tagId: number) {
  const noteTags = getOfflineNoteTags();
  
  // Check if relation already exists
  const exists = noteTags.some(nt => nt.noteId === noteId && nt.tagId === tagId);
  if (exists) return;
  
  // Add new relation
  noteTags.push({ noteId, tagId });
  storeOfflineNoteTags(noteTags);
}

// Remove a tag from a note in offline storage
export function removeOfflineTagFromNote(noteId: number, tagId: number) {
  const noteTags = getOfflineNoteTags();
  const filteredNoteTags = noteTags.filter(
    nt => !(nt.noteId === noteId && nt.tagId === tagId)
  );
  storeOfflineNoteTags(filteredNoteTags);
}

// Search notes in offline storage
export function searchOfflineNotes(query: string): NoteWithTags[] {
  const lowercaseQuery = query.toLowerCase();
  const notesWithTags = getOfflineNotesWithTags();
  
  return notesWithTags.filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) || 
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.tags.some(tag => tag.name.toLowerCase().includes(lowercaseQuery))
  );
}

// Store the last sync timestamp
export function setLastSyncTime(timestamp: number) {
  localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
}

// Get the last sync timestamp
export function getLastSyncTime(): number {
  const timestamp = localStorage.getItem(LAST_SYNC_KEY);
  return timestamp ? parseInt(timestamp, 10) : 0;
}

// Check if we're offline
export function isOffline(): boolean {
  return !navigator.onLine;
}

// Listen for online/offline events
export function setupConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}