---
'@nocobase/studio': minor
---

Make the issue pages and My follow-ups work on a phone, and tighten the issue summary.

- **Phone:** these views go edge to edge with a single 16px inset: lists are full-width rows with hairline dividers (title 15px, one-line status), the issue view has a 20px title, icon actions, a plain Now row, a full-width Needs-you band and muted bands between sections. My follow-ups and an issue's page hide the app header and draw their own row with Back (or the page heading), the agent chat button and the navigation. My follow-ups shows one list at a time under two bottom tabs, "Following" and "Issues I own", each with a count of what needs a look; choosing an issue shows it alone. The comment composer starts as a slim "Write a comment…" bar that opens on tap (and from Reply or Answer) and folds again once sent or left empty.
- **Summary:** the summary scrolls with the page, and a one-line bar (status, title, what waits for you: Merge, Answer, Take over) stays at the top once it has scrolled away. On a phone the summary starts as that bar. Key, status and actions sit on their own rows on narrow screens.
- **Now and Next:** "Now" is one short line from the progress (agent, state, time, runner) that opens the live run's record, "Nothing is running" when idle. "Next" is the manager's line rendered as inline Markdown. Both are cut to two lines with Show more.
- **Needs you:** what waits for you is one card: accepting the work ("Accept PR #N — title", checks, the manager's delivery report, then Merge, Mark as merged, View changes and Send back), taking over a handoff, or answering a question. Without one, the summary shows the pull request on one line with its checks and preview.
- **Delivery report:** the delivery shown is the project manager's report (a comment with "What was asked", "Key changes" or "Open issues" headings, or their Chinese forms) around the latest move to In review. Otherwise it is the latest agent comment, labelled as such.
- **Issue body:** "Waiting for you" leaves out what the card already shows, and the body no longer repeats the agent-working pill.
- **My follow-ups cards:** asks read as a short first sentence and status as one short line, never the manager's prose.
- **Header:** the header shows the agent chat as an icon button again, in place of the "Ask Agent…" input. The account menu gains "Use Studio in your agent", which opens the `nb-studio` setup dialog.
