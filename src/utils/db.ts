import Dexie, { Table } from 'dexie';

// Define the interfaces for our database tables
export interface Project {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  diagramData?: string; // Store ReactFlow nodes and edges as JSON string
  reportData?: string; // Store Markdown report content
  slideData?: string; // Store slides content
}

export interface ChatMessage {
  id?: number;
  projectId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PromptTemplate {
  id?: number;
  name: string;
  content: string;
  description?: string;
}

// Define the database class
class DrillDownDB extends Dexie {
  // Define tables
  projects!: Table<Project>;
  chatMessages!: Table<ChatMessage>;
  promptTemplates!: Table<PromptTemplate>;

  constructor() {
    super('DrillDownDB');
    
    // Define the schema for the database
    this.version(1).stores({
      projects: '++id, name, createdAt, updatedAt',
      chatMessages: '++id, projectId, role, timestamp',
      promptTemplates: '++id, name',
    });
  }
  
  // Project methods
  async createProject(name: string, description: string = ''): Promise<number> {
    const now = new Date();
    return this.projects.add({
      name,
      description,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getAllProjects(): Promise<Project[]> {
    return this.projects.orderBy('updatedAt').reverse().toArray();
  }
  
  async updateProject(id: number, updates: Partial<Project>): Promise<number> {
    const updatedAt = new Date();
    return this.projects.update(id, { ...updates, updatedAt });
  }
  
  async deleteProject(id: number): Promise<void> {
    // Delete associated chat messages first
    await this.chatMessages.where('projectId').equals(id).delete();
    // Then delete the project
    await this.projects.delete(id);
  }
  
  // Chat message methods
  async addChatMessage(projectId: number, role: 'user' | 'assistant', content: string): Promise<number> {
    return this.chatMessages.add({
      projectId,
      role,
      content,
      timestamp: new Date(),
    });
  }
  
  async getChatMessages(projectId: number): Promise<ChatMessage[]> {
    return this.chatMessages
      .where('projectId')
      .equals(projectId)
      .sortBy('timestamp');
  }
  
  // Prompt template methods
  async addPromptTemplate(name: string, content: string, description: string = ''): Promise<number> {
    return this.promptTemplates.add({
      name,
      content,
      description,
    });
  }
  
  async getPromptTemplates(): Promise<PromptTemplate[]> {
    return this.promptTemplates.toArray();
  }
  
  async updatePromptTemplate(id: number, updates: Partial<PromptTemplate>): Promise<number> {
    return this.promptTemplates.update(id, updates);
  }
  
  async deletePromptTemplate(id: number): Promise<void> {
    await this.promptTemplates.delete(id);
  }
}

// Create and export a single instance of the database
const db = new DrillDownDB();

export default db; 