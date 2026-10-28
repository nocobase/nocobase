# Run check

| Item         | Details                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| Page         | `/<path>`, application URL `http://…/main`                              |
| Code version | Description of the changes at the time of the check                     |
| Check method | Manual operation / screenshot tool / Playwright assertion script (path) |
| Test data    | How it was prepared and how to clean it up                              |

## Design inputs

- Original reference paths/URLs, versions and modes (or no reference):
- Application-owned system/page records and authorized exceptions:
- Tested viewports, themes and languages:
- Plugin owner and host configuration, if applicable:

## Baseline

Console errors seen on an existing page (for example, the homepage). They come from the application shell and are not issues of this page:

- …

## Check results

| ID  | What was checked (matching acceptance criterion) | Method | Result                     | Evidence                            |
| --- | ------------------------------------------------ | ------ | -------------------------- | ----------------------------------- |
| D1  |                                                  |        | Pass / Fail / Not verified | Screenshot file name, script output |

Must cover: the core flow, every state, character-by-character typing and Chinese IME input (the `type` and `ime` steps of the screenshot tool, `.agents/skills/nocobase-app-development/references/frontend/scripts/capture.md`), keyboard operation, the dark theme, narrow screens, the English interface, and every overlay opened from a view other than the first one the page shows — a tab other than the default, a list with a search or filter applied, a board, a dashboard — with its URL, the view behind it and where closing lands; and going back from a page below another one, which must restore the other page's URL exactly.

Also record the relevant [shared acceptance checks](../ui-acceptance.md): reference comparison, long-content and short-viewport footer geometry, translated and pending button labels, affected cross-module journeys, and plugin-host theme/style/overlay integration. Explain which checks do not apply.

## Console and requests

- Console errors introduced by this page:
- Failed requests (note which ones the check caused on purpose):

## Issues found

| ID  | Issue | Handling                                             |
| --- | ----- | ---------------------------------------------------- |
|     |       | Fixed / Left for the reviewer to judge (explain why) |

## Not verified

| Item | Reason |
| ---- | ------ |
|      |        |
