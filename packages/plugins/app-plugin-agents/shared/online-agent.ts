/** Public text only. Provider metadata and tool payloads never enter the stream. */
export type OnlineAgentPublicItem = {
  role: 'user' | 'assistant' | 'notice';
  parts: { type: 'text'; text: string }[];
};

export type OnlineAgentOutcome = 'completed' | 'cancelled' | 'failed';

/** A part replaces a prefix; a delta appends exactly once to the same output item. */
export type OnlineAgentStreamEvent =
  | {
      type: 'part';
      boundary: { afterSeq: number };
      messageIndex: number;
      item: OnlineAgentPublicItem;
    }
  | {
      type: 'delta';
      boundary: { afterSeq: number };
      messageIndex: number;
      text: string;
    }
  | {
      type: 'message';
      message: import('./conversations.js').ConversationMessage;
    }
  | {
      type: 'saved';
      boundary: { afterSeq: number };
      lastSeq: number;
      status: 'idle';
      outcome: OnlineAgentOutcome;
    };
