---
'@nocobase/studio': patch
---

Fix the issue page's title being squeezed down to a few characters at 1280px when the AI assistant panel is docked beside it. `IssueDetailLayout`'s side column and `IssueHeader`'s actions now respond to the page's own width through a container query instead of the viewport, so a docked panel narrowing the page is detected the same way a narrow window is. Below that width, "Ask agent" and "Delete" collapse to icon-only buttons with a tooltip, leaving the title the room it needs.
