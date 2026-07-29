import { AI_DRAFT_CONVERSATION_ID, type AIConversation } from "./types";

export type AIChatState = {
  activeConversationId: string;
  conversations: AIConversation[];
  conversationListOpen: boolean;
  drafts: Record<string, string>;
  selectedEmployeeUsername: string;
  selectedModel: string;
};

export type AIChatAction =
  | { type: "reset"; state: AIChatState }
  | { type: "set-active-conversation"; conversationId: string }
  | { type: "set-conversation-list-open"; open: boolean }
  | { type: "set-draft"; conversationId: string; value: string }
  | { type: "select-employee"; username: string }
  | { type: "select-model"; model: string }
  | { type: "start-new-conversation" }
  | { type: "add-conversation"; conversation: AIConversation }
  | { type: "set-conversations"; conversations: AIConversation[] }
  | { type: "remove-conversation"; conversationId: string }
  | { type: "mark-conversation-read"; conversationId: string }
  | { type: "rename-conversation"; conversationId: string; title: string }
  | { type: "replace-conversation-id"; from: string; to: string };

export function createAIChatState({
  conversations,
  employeeUsername,
  model,
}: {
  conversations: AIConversation[];
  employeeUsername: string;
  model: string;
}): AIChatState {
  return {
    activeConversationId: conversations[0]?.id ?? AI_DRAFT_CONVERSATION_ID,
    conversations,
    conversationListOpen: false,
    drafts: {},
    selectedEmployeeUsername: employeeUsername,
    selectedModel: model,
  };
}

export function aiChatReducer(
  state: AIChatState,
  action: AIChatAction
): AIChatState {
  switch (action.type) {
    case "reset":
      return action.state;
    case "set-active-conversation":
      return {
        ...state,
        activeConversationId: action.conversationId,
        conversationListOpen: false,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId
            ? { ...conversation, unread: false }
            : conversation
        ),
      };
    case "set-conversation-list-open":
      return { ...state, conversationListOpen: action.open };
    case "set-draft":
      return {
        ...state,
        drafts: { ...state.drafts, [action.conversationId]: action.value },
      };
    case "select-employee":
      return { ...state, selectedEmployeeUsername: action.username };
    case "select-model":
      return { ...state, selectedModel: action.model };
    case "start-new-conversation":
      return {
        ...state,
        activeConversationId: AI_DRAFT_CONVERSATION_ID,
        conversationListOpen: false,
        drafts: { ...state.drafts, [AI_DRAFT_CONVERSATION_ID]: "" },
      };
    case "add-conversation":
      return {
        ...state,
        activeConversationId: action.conversation.id,
        conversations: [
          action.conversation,
          ...state.conversations.filter(
            (conversation) => conversation.id !== action.conversation.id
          ),
        ],
        drafts: {
          ...state.drafts,
          [action.conversation.id]:
            state.drafts[AI_DRAFT_CONVERSATION_ID] ?? "",
        },
      };
    case "set-conversations":
      return {
        ...state,
        conversations: action.conversations,
      };
    case "mark-conversation-read":
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId
            ? { ...conversation, unread: false }
            : conversation
        ),
      };
    case "remove-conversation": {
      const conversations = state.conversations.filter(
        (conversation) => conversation.id !== action.conversationId
      );
      return { ...state, conversations };
    }
    case "rename-conversation":
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId
            ? { ...conversation, title: action.title }
            : conversation
        ),
      };
    case "replace-conversation-id":
      return {
        ...state,
        activeConversationId:
          state.activeConversationId === action.from
            ? action.to
            : state.activeConversationId,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.from
            ? { ...conversation, id: action.to }
            : conversation
        ),
        drafts: {
          ...state.drafts,
          [action.to]: state.drafts[action.from] ?? "",
        },
      };
    default:
      return state;
  }
}
