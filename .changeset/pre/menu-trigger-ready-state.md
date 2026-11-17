---
'@nocobase/app-skills': patch
---

The application and plugin development Skills tell an agent to find a menu, popover, select or dialog trigger by its ready state, such as `findByRole('button', { name, expanded: false })`, before clicking it in a jsdom test, so a test does not click a trigger that is still mounting and fail only under CI load.
