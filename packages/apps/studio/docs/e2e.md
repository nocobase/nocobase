# Browser tests

Studio's browser tests live in `e2e/` and run with Playwright against a real, built Studio. They complement the Vitest suite in `tests/`, which runs without a browser or a server.

## Running them

```bash
pnpm build                                   # the tests run dist/, so build after every change
pnpm exec playwright install chromium        # once per machine, or after Playwright is upgraded
pnpm test:e2e                                # the flows
pnpm test:screenshots                        # the screenshots
```

`pnpm test:e2e` takes about a minute on a laptop with three workers, plus about ten seconds to start the server. Pass Playwright's own options after it, such as `pnpm test:e2e inbox` for one file, `-g "API key"` for matching tests, `--headed` to watch, or `--workers=1`.

## The server they run against

Global setup (`e2e/global-setup.ts`, `e2e/support/server.ts`) starts `dist/server/standalone.js` as a child process of its own and global teardown stops it, with:

- a free port chosen at random on `127.0.0.1` (never 13917, the port a shared preview uses), mounted at `/main`;
- a configuration, a SQLite database and a storage directory in a new temporary directory, through `APP_CONFIG_FILE` and `APP_STORAGE_DIR`, so nothing touches `config.yml`, `storage/` or another server;
- `app.sampleData` on, so the demo team, projects, issues, knowledge and the agents' knowledge proposal are there; setup waits until the demo is built;
- a local OpenAI-compatible model (`e2e/support/mock-llm.ts`), started in a process of its own and, once the demo is built, added through the agents API as the model service `mock-llm`, given to the built-in project assistant, the team's default, so it answers on the server by a few fixed rules, with no real model or key (run it alone with `node e2e/support/mock-llm.ts --port <port>` to try Online mode by hand);
- Better Auth's rate limit off, since the tests sign in far more often than a person does.

Its log is `server.log` in that directory. Teardown removes the directory; set `NB_STUDIO_E2E_KEEP=1` to keep it. To run against a server that is already running instead, set `NB_STUDIO_E2E_URL=http://127.0.0.1:<port>/main`: nothing is started or stopped, and the tests change that server's data.

## Writing tests

Import `test` and `expect` from `e2e/support/fixtures.ts`. Its `page` is already signed in as a demo account (Alex Turner, an admin, by default; `test.use({ user: 'lisa' })` for another), `api` calls the API with the same session for setting up data and checking results, and a test fails if the page throws an uncaught error. `apiAs(browser, user)` gives an API client for another account.

- Find elements by role and accessible name (`getByRole('button', { name: '保存' })`), or by text, as a person would; not by CSS classes or test ids. The tests run in zh-CN, so names are the Chinese labels.
- Make the data a test needs, with a `unique()` suffix in its names, rather than changing shared demo records: the files run side by side against one server, and a test must pass on its own and in any order. A test that has to use a demo record that only exists once, such as the demo knowledge proposal, says so.
- Wait for what the person would see, or poll the API with `expect.poll`, never for a fixed time.
- States only an agent can produce, such as a design proposal waiting for review, come from `FakeRunner` (`e2e/support/runner.ts`): it registers through the runner protocol, claims the run the issue's agent was woken for, and submits through the `nb-studio` CLI's endpoints with that run's token, without a real runner or coding agent.
- `horizontalOverflow(page)` measures how far a page sticks out sideways; `mobile.test.ts` holds it to 0 at phone width on the key pages.

## What they cover

| File                     | Flows                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sign-in.test.ts`        | Signing in by email and by username, a wrong password explained in zh-CN and en-US, signing out                                                                                                                                                                                                                                                                                                  |
| `issues.test.ts`         | The board as the default beside the list and the Agent queue, the board as my issues' default too, an agent's lane in the queue (waiting, working, queued) from a fake runner, search, creating an issue by hand and from notes in the AI tab, opening an issue by its identifier                                                                                                                |
| `issue-page.test.ts`     | Comments, attachments (upload and download), changing the status, approving and sending back a design proposal                                                                                                                                                                                                                                                                                   |
| `inbox.test.ts`          | Approving and rejecting a status change waiting for the project lead (on a project whose workflow asks for it, `support/approval.ts`), approving and sending back a design proposal from the inbox                                                                                                                                                                                               |
| `header.test.ts`         | The header's inbox button: its count following a new decision live, the active state on the inbox, keyboard and phone width; no settings entry, `/settings` URLs landing on the home page, Studio's settings in the sidebar                                                                                                                                                                      |
| `knowledge.test.ts`      | System knowledge, editing a project document and comparing its versions, accepting an agent's proposed change                                                                                                                                                                                                                                                                                    |
| `settings.test.ts`       | Members and roles, a workflow template's rules dialog, labels, an organization API key (secret shown once, used, rotated)                                                                                                                                                                                                                                                                        |
| `run-transcript.test.ts` | A real 200-event run: default type filters, individual hidden segments, persisted choices, live errors, account isolation, narrow screens and dark mode                                                                                                                                                                                                                                          |
| `account.test.ts`        | The colour mode persisting across reloads and browsers, the profile                                                                                                                                                                                                                                                                                                                              |
| `releases.test.ts`       | The environments list, creating a protected in-process App Host environment without deploying, the Apps page                                                                                                                                                                                                                                                                                     |
| `chat.test.ts`           | Online mode: asking the project assistant from the home page (tool calls, a linked knowledge document), organizing requirements into a draft through an online agent with no runner, usage by agent type on the usage page                                                                                                                                                                       |
| `models.test.ts`         | Agent team › Models: adding an OpenAI-compatible service against the mock model in one sheet (provider type, name, base URL, write-only key, connection test, models fetched and one checked), the key shown as set when reopened, the (service, model) pair priced on the Usage page's Prices tab, an online agent created on the new service's model, and a coding tool billed by subscription |
| `home.test.ts`           | The home composer: picking a runner agent in its one agent picker (the message handed to it) and the online default (the project assistant answers on the server), each landing on the full-page conversation; the recent conversations open there, and it moves to the side panel                                                                                                               |
| `mobile.test.ts`         | No horizontal overflow at 390 px on the key pages, the navigation on a phone, the floating chat button clear of the comment composer and of every pinned control                                                                                                                                                                                                                                 |

## Screenshots

`pnpm test:screenshots` runs `e2e/screenshots/screenshots.test.ts` against a server of its own and saves the key pages, as the initial administrator, in four combinations: zh-CN and en-US, each light and dark. They go to `output/screenshots/<locale>-<mode>/<page>.png` (gitignored), with `<page>.phone.png` for the pages also taken at 390 px. `NB_STUDIO_SCREENSHOT_PAGES=inbox,issue` takes a subset, `NB_STUDIO_SCREENSHOT_THEMES=en-US-dark` a subset of the combinations, and `NB_STUDIO_SCREENSHOT_DIR` another directory. They are for looking at, not compared against a baseline.

## In CI

CI builds Studio and runs both suites on pull requests that change Studio or the packages it depends on. The screenshots and the traces are uploaded as artifacts only when the job fails. It needs no secrets: the server and the model are local, the demo data has no repositories and no runner that takes work (its runtimes registered once and are offline), and nothing reaches GitHub or a model provider.
