# UI customization

Set `chatRoutes: false` to omit the chat pages.

The plugin brings its UI when it is registered; customize it in layers, choosing the least that does the job. Each layer keeps what later versions of the plugin bring, except the last.

## 1. Register the plugin

```ts
// client/plugins.ts
import agents from '@nocobase/app-plugin-agents/client';

export default defineClientPlugins([
  // …
  agents(),
]);
```

Register `@nocobase/app-plugin-agents/server` and `/cli` too, and give the server `agents` configuration and a `people` directory (`server/config/agents.ts` and `server/providers/conversation-sharing.ts` in the default template). The App's layout renders `AppLayoutProviders` around the signed-in layout and `AppAsideOutlet` beside `<main>`; both templates do.

## 2. Options

```ts
agents({
  headerAction: false, // no ✦; the panel still opens from AskAgentButton, ⌘J / Ctrl+J and ?chat= links
  panel: { width: 480, defaultOpen: true },
  chatPath: '/assistant', // the conversation page at /assistant/:conversationId
});
```

## 3. Extension points

On a business page:

```tsx
import {
  AskAgentButton,
  useAgentContext,
} from '@nocobase/app-plugin-agents/client';

function OrderPage({ order }: { order: Order }) {
  // The panel's context chips; the server resolves `order` through conversations.contextKinds.register('order', …).
  useAgentContext({
    items: [{ kind: 'order', id: order.id, label: order.number }],
  });
  return (
    <AskAgentButton
      prompt='Check this order for problems.'
      context={{ kind: 'order', id: order.id }}
    />
  );
}
```

In client code that runs once (the App's `client/plugins.ts`, or a plugin's client service provider):

```ts
import agents from '@nocobase/app-plugin-agents/client';

agents.toolRenderers.add({ name: 'orders.update', component: OrderChangeCard });
agents.slots.composerActions.add({ key: 'quote', component: InsertQuote }); // gets { conversationId, agentId, insertText }
agents.slots.messageActions.add({ key: 'pin', component: PinMessage }); // gets { conversationId, message }
agents.slots.emptyState.add({ key: 'tips', component: OrderTips }); // gets { agentId, insertText }
agents.preferenceSections.add({ key: 'my-computer', component: MyComputer }); // Personal settings › Agent
```

A tool card gets `AIToolRendererProps` (`toolName`, `part`, `message`, `context` with `approval.respond(approved)` for a call waiting for confirmation). `AIToolRendererProvider` still works and wins over a registered card. Each `add` returns the function that removes it.

On the server: `actions.provide` (business actions), `conversations.contextKinds.register` (page context kinds) and `models.providers.register` (a model service provider; the Model services reference has an example).

## 4. Replace a part or a page

```tsx
agents.components.replace(
  'MessageItem',
  function MyMessage({ Default, ...props }) {
    return (
      <div className='rounded-lg ring-1 ring-primary/20'>
        <Default {...props} />
      </div>
    );
  },
);
```

Replaceable parts: `MessageItem`, `Composer`, `ConversationListItem`, `PanelHeader`, `ToolCard`, `ConfirmationCard`. A whole page, in the App's runtime definition:

```ts
routeComponentOverrides: defineClientRouteComponentOverrides([
  { routeId: '@nocobase/app-plugin-agents:agentChat', componentLoader: () => import('./pages/my-chat.js') },
]),
headerActionOverrides: defineHeaderActionOverrides([{ name: 'agent', component: MyAgentButton }]),
```

The page routes are `agentChat`, `agents`, `models`, `runtimes`, `skills`, `usage` and `agentPreferences`.

## 5. Copy it out (last resort)

```bash
yes n | pnpm exec shadcn add @nocobase/agent-chat
```

The block is generated from the plugin's panel. Register `agents({ headerAction: false, panel: false })`: the plugin's button and panel step aside, while its provider stays so the copied block's hooks (`@nocobase/app-plugin-agents/client/chat`) work. Mount the block's `ChatPanel` beside `<main>` and its header button yourself. Later plugin versions do not update the copy: merge each new version of the block by hand.
