# Inbox

An application's inbox over `@nocobase/app-plugin-notification-in-app`: the `inbox` block, the `/inbox` page, documented in [inbox/README.md](inbox/README.md), and the `inbox-button` component a header links to it with.

## inbox-button

`InboxButton` in `inbox-button.tsx` is a header button linking to the inbox (`to`, `/inbox` by default), marked current on that path and below it. Its badge is amber with the count of what waits on the viewer, or in the primary color with the unread count when nothing waits; the label and the tooltip say which. The unread badge deliberately takes `bg-primary`: in a themed application that is the brand color, so the badge may be blue, green or any hue the theme chooses, while amber stays reserved for "needs you". Change that class in your copy if the brand color reads as a warning. The button is a shadcn icon button in size (`size-9`, `rounded-lg`), sits beside the header's other icon buttons, and anchors the badge to its top-right corner, pushed a third of its size out; "99+" uses smaller type so the badge stays a small pill. It is presentational: build the badge with `inboxBadge(waiting, unread)` from `inbox-badge.ts`, which installs beside it, where `unread` comes from `useInboxUnreadCount()` of `@nocobase/app-plugin-notification-in-app/client/inbox` and `waiting` is what the application's inbox counts as waiting (0 without decisions). `useDocumentTitleBadge(badge?.text ?? null)` prefixes the browser tab title with the same count (`(3) Acme`) while mounted.

```tsx
import {
  useInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';

import { inboxBadge, useDocumentTitleBadge } from '@/components/inbox-badge';
import { InboxButton } from '@/components/inbox-button';

export function InboxHeaderButton(): ReactElement {
  useInboxRefresh();
  const unread = useInboxUnreadCount();
  const badge = inboxBadge(0, unread.data ?? 0);
  useDocumentTitleBadge(badge?.text ?? null);
  return <InboxButton badge={badge} />;
}
```

Render it inside a `TooltipProvider`, for signed-in people only. `labels` replaces any of its words, and `idPrefix` names its test ids, `<prefix>-button` and `<prefix>-badge`.

## Translations

The component's keys, for the application's own locale resources:

| Key                       | English                                                        | Chinese                            |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `inboxButton.title`       | Inbox                                                          | 收件箱                             |
| `inboxButton.pending`     | Inbox, {{count}} waiting                                       | 收件箱，{{count}} 项待处理         |
| `inboxButton.unread`      | Inbox, {{count}} unread                                        | 收件箱，{{count}} 条未读           |
| `inboxButton.pendingHint` | {{count}} waiting for you; it goes down once they are handled. | {{count}} 项等你处理，处理后减少。 |
| `inboxButton.unreadHint`  | {{count}} unread; it goes down as you read them.               | {{count}} 条未读，阅读后减少。     |
