---
'@nocobase/studio': patch
---

The task pages refresh from announcements once for the whole app instead of once per list, tab and badge: bursts are gathered for 1.5 seconds, a change that names issues reads only those rows unless the lists' membership moved, nothing is read while the page is hidden, and a read under way is never cancelled. The menu's waiting count and the tabs refresh only for changes that can move tasks between lists, what the viewer follows only after following or unfollowing, and opening an issue no longer reads My follow-ups unless it is shown. The issue pane no longer reads its progress, pull requests, marks and comment-run limit again on every revision, and polls its runs quickly only after the viewer commented, handed the issue to an agent or asked for work.
