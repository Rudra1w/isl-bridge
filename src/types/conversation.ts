export type ConversationSender = 'hearing' | 'signer';

export type ConversationSourceType =
  | 'speech'
  | 'typed'
  | 'sign_camera'
  | 'sign_selector';

export interface ConversationMessage {
  id: string;
  sender: ConversationSender;
  senderName: string;
  sourceType: ConversationSourceType;
  text: string;
  gloss: string[];
  timestamp: number; // ms
  confidence?: number;
}

export type AppNavigationMode =
  | 'conversation'
  | 'sign-to-text'
  | 'speech-to-text'
  | 'text-to-sign'
  | 'text-to-speech'
  | 'dashboard'
  | 'dictionary';
