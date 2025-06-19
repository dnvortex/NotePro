import { 
  notes, 
  tags, 
  noteTags, 
  type Note, 
  type InsertNote, 
  type Tag, 
  type InsertTag, 
  type NoteTag, 
  type InsertNoteTag,
  type NoteWithTags,
  users, 
  type User, 
  type InsertUser
} from "@shared/schema";

// Modify the interface with any CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Note methods
  getNotes(includeDeleted?: boolean): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  restoreNote(id: number): Promise<Note | undefined>;
  toggleFavorite(id: number): Promise<Note | undefined>;
  
  // Tag methods
  getTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  
  // Note-Tag methods
  getNoteWithTags(noteId: number): Promise<NoteWithTags | undefined>;
  getNotesWithTags(includeDeleted?: boolean): Promise<NoteWithTags[]>;
  getNotesByTag(tagId: number): Promise<Note[]>;
  getTagsForNote(noteId: number): Promise<Tag[]>;
  addTagToNote(noteId: number, tagId: number): Promise<void>;
  removeTagFromNote(noteId: number, tagId: number): Promise<void>;
  searchNotes(query: string): Promise<NoteWithTags[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private tags: Map<number, Tag>;
  private noteTags: Map<number, NoteTag>;
  private userCurrentId: number;
  private noteCurrentId: number;
  private tagCurrentId: number;
  private noteTagCurrentId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.tags = new Map();
    this.noteTags = new Map();
    
    this.userCurrentId = 1;
    this.noteCurrentId = 1;
    this.tagCurrentId = 1;
    this.noteTagCurrentId = 1;
    
    // Initialize with some default tags
    this.createTag({ name: "Work", color: "#3B82F6" });
    this.createTag({ name: "Personal", color: "#10B981" });
    this.createTag({ name: "Ideas", color: "#8B5CF6" });
    this.createTag({ name: "Meeting", color: "#8B5CF6" });
    this.createTag({ name: "Planning", color: "#3B82F6" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Note methods
  async getNotes(includeDeleted: boolean = false): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => includeDeleted || !note.isDeleted);
  }
  
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteCurrentId++;
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { 
      ...note, 
      ...noteUpdate, 
      updatedAt: new Date() 
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: number): Promise<boolean> {
    const note = this.notes.get(id);
    if (!note) return false;
    
    const updatedNote = { 
      ...note, 
      isDeleted: true, 
      updatedAt: new Date() 
    };
    this.notes.set(id, updatedNote);
    return true;
  }
  
  async restoreNote(id: number): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { 
      ...note, 
      isDeleted: false, 
      updatedAt: new Date() 
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async toggleFavorite(id: number): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { 
      ...note, 
      isFavorite: !note.isFavorite, 
      updatedAt: new Date() 
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  // Tag methods
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }
  
  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagCurrentId++;
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }
  
  async updateTag(id: number, tagUpdate: Partial<InsertTag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;
    
    const updatedTag = { ...tag, ...tagUpdate };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }
  
  async deleteTag(id: number): Promise<boolean> {
    // First remove all relationships
    const noteTagsToRemove = Array.from(this.noteTags.values())
      .filter(noteTag => noteTag.tagId === id);
      
    for (const noteTag of noteTagsToRemove) {
      this.noteTags.delete(noteTag.id);
    }
    
    return this.tags.delete(id);
  }
  
  // Note-Tag methods
  async getNoteWithTags(noteId: number): Promise<NoteWithTags | undefined> {
    const note = this.notes.get(noteId);
    if (!note) return undefined;
    
    const tags = await this.getTagsForNote(noteId);
    return { ...note, tags };
  }
  
  async getNotesWithTags(includeDeleted: boolean = false): Promise<NoteWithTags[]> {
    const notes = await this.getNotes(includeDeleted);
    const notesWithTags: NoteWithTags[] = [];
    
    for (const note of notes) {
      const tags = await this.getTagsForNote(note.id);
      notesWithTags.push({ ...note, tags });
    }
    
    return notesWithTags;
  }
  
  async getNotesByTag(tagId: number): Promise<Note[]> {
    const noteIds = Array.from(this.noteTags.values())
      .filter(noteTag => noteTag.tagId === tagId)
      .map(noteTag => noteTag.noteId);
      
    return Array.from(this.notes.values())
      .filter(note => noteIds.includes(note.id) && !note.isDeleted);
  }
  
  async getTagsForNote(noteId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.noteTags.values())
      .filter(noteTag => noteTag.noteId === noteId)
      .map(noteTag => noteTag.tagId);
      
    return Array.from(this.tags.values())
      .filter(tag => tagIds.includes(tag.id));
  }
  
  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    // First check if the relationship already exists
    const exists = Array.from(this.noteTags.values())
      .some(noteTag => noteTag.noteId === noteId && noteTag.tagId === tagId);
      
    if (exists) return;
    
    const id = this.noteTagCurrentId++;
    const noteTag: NoteTag = { id, noteId, tagId };
    this.noteTags.set(id, noteTag);
  }
  
  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    const noteTagToRemove = Array.from(this.noteTags.values())
      .find(noteTag => noteTag.noteId === noteId && noteTag.tagId === tagId);
      
    if (noteTagToRemove) {
      this.noteTags.delete(noteTagToRemove.id);
    }
  }
  
  async searchNotes(query: string): Promise<NoteWithTags[]> {
    if (!query.trim()) {
      return this.getNotesWithTags();
    }
    
    const lowercaseQuery = query.toLowerCase();
    const matchingNotes = Array.from(this.notes.values())
      .filter(note => 
        (note.title.toLowerCase().includes(lowercaseQuery) || 
        note.content.toLowerCase().includes(lowercaseQuery)) && 
        !note.isDeleted
      );
      
    const notesWithTags: NoteWithTags[] = [];
    
    for (const note of matchingNotes) {
      const tags = await this.getTagsForNote(note.id);
      notesWithTags.push({ ...note, tags });
    }
    
    return notesWithTags;
  }
}

export const storage = new MemStorage();
