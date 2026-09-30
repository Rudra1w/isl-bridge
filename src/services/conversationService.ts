import { ConversationMessage, ConversationSender, ConversationSourceType } from '@/types/conversation';

const STORAGE_KEY = 'isl_conversation_messages_v1';

const INITIAL_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg-demo-1',
    sender: 'hearing',
    senderName: 'Hearing User',
    sourceType: 'speech',
    text: 'Where are you going?',
    gloss: ['WHERE', 'YOU', 'GO'],
    timestamp: Date.now() - 45000,
    confidence: 0.96,
  },
  {
    id: 'msg-demo-2',
    sender: 'signer',
    senderName: 'ISL Signer',
    sourceType: 'sign_camera',
    text: 'ME COLLEGE',
    gloss: ['ME', 'COLLEGE'],
    timestamp: Date.now() - 20000,
    confidence: 0.92,
  },
];

type ConversationListener = (messages: ConversationMessage[]) => void;

class ConversationService {
  private static instance: ConversationService;
  private messages: ConversationMessage[] = [];
  private listeners: Set<ConversationListener> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load conversation from localStorage:', e);
    }
    this.messages = [...INITIAL_MESSAGES];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('Failed to save conversation to localStorage:', e);
    }
  }

  private notify(): void {
    const copy = [...this.messages];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (e) {
        console.error('Conversation listener error:', e);
      }
    });
  }

  public subscribe(listener: ConversationListener): () => void {
    this.listeners.add(listener);
    listener([...this.messages]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  public addMessage(
    sender: ConversationSender,
    senderName: string,
    sourceType: ConversationSourceType,
    text: string,
    gloss: string[],
    confidence?: number
  ): ConversationMessage {
    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender,
      senderName,
      sourceType,
      text: text.trim(),
      gloss: gloss.map((g) => g.toUpperCase().trim()).filter(Boolean),
      timestamp: Date.now(),
      confidence,
    };

    this.messages = [...this.messages, newMessage];
    this.saveToStorage();
    this.notify();
    return newMessage;
  }

  public deleteMessage(id: string): void {
    this.messages = this.messages.filter((m) => m.id !== id);
    this.saveToStorage();
    this.notify();
  }

  public clearConversation(): void {
    this.messages = [];
    this.saveToStorage();
    this.notify();
  }

  public resetToSample(): void {
    this.messages = [...INITIAL_MESSAGES];
    this.saveToStorage();
    this.notify();
  }
}

export const conversationService = ConversationService.getInstance();
