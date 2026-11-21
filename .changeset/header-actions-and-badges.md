---
'@nocobase/app-client': minor
'@nocobase/app-skills': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Add the platform pieces for message features. Personal settings gain a built-in `messages` category (Messages), after Preferences and before Other, shown only when a page joins it. A route's `navigation` may declare a `badge` hook returning `{ count, tone? }`, and the menu shows the count beside the entry at any depth, nothing at zero; a layout's `badges` still replace it. Plugins and applications register buttons in the header's right-hand area with `headerActions` (`{ name, order, component, auth?, badge? }`), rendered by order with their badges and the account menu last, collapsing the buttons that render something into a More popover on phones; `useHeaderActions({ signedIn })` gives a signed-out visitor only `auth: 'optional'` actions. An application hides or replaces one by name with `headerActionOverrides`. The templates render header actions and declared badges, and Examples registers its Agent chat button as the `agent-chat` header action.
