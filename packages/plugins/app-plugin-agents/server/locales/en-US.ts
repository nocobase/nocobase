import accessEnUS from '../../shared/locales/access.en-US.js';

const enUS: typeof accessEnUS & {
  runnerConversation: { title: string; other: string; untitled: string };
} = {
  ...accessEnUS,
  runnerConversation: {
    title: 'Conversation: {{title}}',
    other: "Someone else's conversation",
    untitled: 'New conversation',
  },
};

export default enUS;
