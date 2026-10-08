---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

The default and examples templates preinstall the UI Library `inbox` block in `client/extensions/nocobase-inbox/` and the `inbox-button` component in `client/components/`: `/inbox` lists the in-app notification plugin's messages, and the header's inbox button links to it with the unread count. The examples template replaces its own `notification-button.tsx` and `/notifications` page with them; an existing examples application that kept those files keeps working, and may move to the block by copying it from the template and pointing the header and the route at it.
