const HISTORY_KEY = 'isl_bridge_history_v1';

export interface HistoryItem {
  id: string;
  type: 'sign-to-text' | 'speech-to-sign' | 'text-to-sign';
  input: string;
  output: string;
  timestamp: number;
}

export class StorageService {
  public static getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public static addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
    try {
      const current = this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...current].slice(0, 50); // Keep last 50
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // storage full or disabled
    }
  }

  public static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }
}
