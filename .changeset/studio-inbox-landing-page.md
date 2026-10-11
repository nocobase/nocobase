---
"@nocobase/studio": patch
---

Make the inbox the default landing page: `/` redirects signed-in users to `/inbox`, preserving query and fragment. Order the sidebar as My tasks, Inbox and Dashboard, remove the Home entry and the header inbox button, and retain the live inbox count in the sidebar. Move the chat composer to `/chat` and redirect legacy `/home` links there.
