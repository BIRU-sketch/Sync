
import type { LLMMessage, LLMContext, ProjectContext, UserPreferences } from './types';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  message: LLMMessage;
  metadata?: {
    task?: string;
    projectContext?: ProjectContext;
    tags?: string[];
    importance?: 'low' | 'medium' | 'high';
  };
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  relevanceScore: number;
}

export class MemoryManager {
  private shortTermMemory: MemoryEntry[] = [];
  private longTermMemory: MemoryEntry[] = [];
  private maxShortTermEntries = 20;
  private maxLongTermEntries = 100;


  addMessage(
    message: LLMMessage,
    metadata?: MemoryEntry['metadata']
  ): void {
    const entry: MemoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      message,
      metadata,
    };

    this.shortTermMemory.unshift(entry);
    

    if (this.shortTermMemory.length > this.maxShortTermEntries) {

      const oldestEntry = this.shortTermMemory.pop();
      if (oldestEntry?.metadata?.importance === 'high') {
        this.addToLongTerm(oldestEntry);
      }
    }
  }


  getRecentContext(limit: number = 10): LLMContext {
    const recentMessages = this.shortTermMemory
      .slice(0, limit)
      .map(entry => entry.message);

    const recentProjectContext = this.shortTermMemory
      .find(entry => entry.metadata?.projectContext)?.metadata?.projectContext;

    return {
      conversation: recentMessages,
      projectContext: recentProjectContext,
    };
  }

  searchMemory(query: string, limit: number = 5): MemorySearchResult[] {
    const allEntries = [...this.shortTermMemory, ...this.longTermMemory];
    
    const results = allEntries
      .map(entry => ({
        entry,
        relevanceScore: this.calculateRelevance(query, entry.message.content),
      }))
      .filter(result => result.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return results.map(result => ({
      entries: [result.entry],
      relevanceScore: result.relevanceScore,
    }));
  }

  getByTag(tag: string): MemoryEntry[] {
    const allEntries = [...this.shortTermMemory, ...this.longTermMemory];
    return allEntries.filter(entry => 
      entry.metadata?.tags?.includes(tag)
    );
  }

  clearShortTerm(): void {
    this.shortTermMemory = [];
  }

  clearLongTerm(): void {
    this.longTermMemory = [];
  }


  clearAll(): void {
    this.shortTermMemory = [];
    this.longTermMemory = [];
  }


  getStats(): {
    shortTermCount: number;
    longTermCount: number;
    totalEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const allEntries = [...this.shortTermMemory, ...this.longTermMemory];
    const timestamps = allEntries.map(entry => entry.timestamp);
    
    return {
      shortTermCount: this.shortTermMemory.length,
      longTermCount: this.longTermMemory.length,
      totalEntries: allEntries.length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }


  exportMemory(): string {
    const data = {
      shortTermMemory: this.shortTermMemory,
      longTermMemory: this.longTermMemory,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  importMemory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.shortTermMemory && Array.isArray(data.shortTermMemory)) {
        this.shortTermMemory = data.shortTermMemory;
      }
      if (data.longTermMemory && Array.isArray(data.longTermMemory)) {
        this.longTermMemory = data.longTermMemory;
      }
      return true;
    } catch (error) {
      console.error('Failed to import memory:', error);
      return false;
    }
  }


  private addToLongTerm(entry: MemoryEntry): void {
    this.longTermMemory.unshift(entry);
    
    // Manage long-term memory size
    if (this.longTermMemory.length > this.maxLongTermEntries) {
      // Remove least important entries
      this.longTermMemory.sort((a, b) => {
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        const aImportance = importanceOrder[a.metadata?.importance || 'low'];
        const bImportance = importanceOrder[b.metadata?.importance || 'low'];
        
        if (aImportance !== bImportance) {
          return bImportance - aImportance;
        }
        
        // If same importance, keep newer entries
        return b.timestamp - a.timestamp;
      });
      
      this.longTermMemory = this.longTermMemory.slice(0, this.maxLongTermEntries);
    }
  }


  private calculateRelevance(query: string, content: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Exact match
    if (contentLower.includes(queryLower)) {
      return 1.0;
    }
    
    // Word overlap
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const contentWords = contentLower.split(/\s+/);
    
    let matchCount = 0;
    for (const queryWord of queryWords) {
      if (contentWords.some(contentWord => contentWord.includes(queryWord))) {
        matchCount++;
      }
    }
    
    if (queryWords.length === 0) return 0;
    
    return matchCount / queryWords.length;
  }


  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let memoryManagerInstance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
}

export function resetMemoryManager(): void {
  memoryManagerInstance = null;
}