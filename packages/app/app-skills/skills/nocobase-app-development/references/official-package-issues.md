# Suspected problems in official packages

Read this when building the application seems to need a change to an official NocoBase package (`@nocobase/*`) rather than to the application. Most of these turn out to have an application-level solution; build with it. Only a problem confirmed in a clean application becomes a report, and the report is a draft the user reviews: nothing is published without the user's explicit confirmation.

## When to start an investigation

Stop and investigate before you make any of these changes:

- Editing a file under `node_modules/`, adding `pnpm patch`, `patchedDependencies` or a `pnpm.overrides` entry that replaces an official package.
- Importing an official package's internal path (`@nocobase/<package>/src/...`, `.../dist/...`, or any path its `exports` do not list).
- Calling an undocumented function, reading a private field, replacing a prototype method, or writing directly to a plugin's own tables.

Wanting one of these is a signal, not a diagnosis. Do not make the change while you investigate.

## Look for an application-level solution first

Work through these in order and stop at the first one that fully meets the requirement:

1. The package's installed Skill under `.agents/skills/`, its `README`, its exported types and, for HTTP endpoints, the application's API document (`<APP_BASE_PATH>/api/swagger`).
2. A documented extension point: configuration, a ServiceProvider or Token, a hook, a component prop or composition, plugin registration, theme tokens, or an application-owned copy of a UI Library block.
3. Application-owned code that wraps or composes the package's public API instead of changing it.
4. A newer release of the package within the application's supported version set that already fixes it: check the package's `CHANGELOG.md` and upgrade through [plugins](plugins.md) or the upgrade Skill.

When one works, finish the feature with it and tell the user in a few sentences what you ran into and which supported approach you used instead. That is the whole outcome: no report.

Application code that compensates for a public API returning a wrong result, such as correcting a value the package computed, is a workaround, not a supported solution: the defect is still reported, and the workaround follows the rules under [write the draft](#write-the-draft).

## Decide whether it is an official package problem

Only these three kinds of problems are reported:

- A public API or the runtime behavior of an official package is defective.
- An official package lacks an extension point that a reasonable requirement needs, and no application-level code can provide it.
- A supported combination of official package versions is incompatible.

Reproduce it in a clean application before you decide. Create one with `pnpm create @nocobase/app` in the operating system's temporary directory, never inside the user's project, using the same official package versions as the user's application. Add only the code the problem needs, with neutral names (`items`, `title`, `status`) and no customer collections, fields, data or configuration. If the problem does not reproduce there, it belongs to the application: return to the previous section.

Record what the report needs from the clean application: `pnpm list --depth 0` for the `@nocobase/*` versions, `node -v`, the database type and version, and the operating system.

## Write the draft

Write the draft in English, in a file in the operating system's temporary directory, never in the user's repository. Follow the sections of the official bug report template (`.github/ISSUE_TEMPLATE/bug_report.md` in `nocobase/nocobase`), including for missing extension points and incompatibilities:

```markdown
## * Describe the bug

<problem and its impact; which of the three kinds it is>

## * Environment

- NocoBase major version: v3
- NocoBase version: <@nocobase/* packages and versions involved>
- Database type and version:
- OS:
- Deployment Methods: create-app
- NodeJS version:

## * How To Reproduce

<steps in a clean application created by `pnpm create @nocobase/app`, with the minimal code inline>

## Expected behavior

## Actual behavior

## Logs

<only the lines that show the problem>

## Application-level options ruled out

<each option from the list above that you tried, and why it does not work>

## Workaround

<a temporary workaround if there is one, or "None">
```

Use a short title that names the package and the symptom, such as `@nocobase/app-client: useX loses Y after Z`.

A temporary workaround is written in the report. It goes into the user's project, for example as a `pnpm patch`, only after the user agrees to it. Meanwhile, continue the parts of the application the problem does not block.

## Remove sensitive information

The draft must not contain business data, customer names, collection or field names from the user's application, secrets, license or package-access credentials, internal host names or addresses, email addresses, or local absolute paths. Commercial packages are reported the same way; leave out any license or registry access detail.

Before showing the draft, scan it and fix every match, then tell the user that the scan ran and what it changed:

```bash
grep -nEi '(api[_-]?key|secret|token|passw|bearer|authorization|ghp_|gho_|ghu_|sk-)|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[a-z]{2,}|([0-9]{1,3}\.){3}[0-9]{1,3}|(postgres|mysql|mariadb|mongodb|redis)://|/(home|Users)/' <draft>
```

The scan only catches patterns. Also read the draft for business terms, and compare it with the application's `.env`, `config.yml` and collection names without copying any of their values into the conversation.

## Search for an existing issue

Search before submitting, using only words from the cleaned draft: the package name, the API name and the error text. The search itself is sent to GitHub, so never put business terms in it.

```bash
gh search issues --repo nocobase/nocobase --state all --limit 10 -- "<package> <api or error text>"
```

Without an authorized `gh`, give the user the search link `https://github.com/nocobase/nocobase/issues?q=<url-encoded words>`. When a matching issue exists, recommend adding to it instead of opening a new one, and prepare a comment with only what it lacks (the versions, the reproduction, the ruled-out options).

## Get the user's confirmation

Show the user, in one message, the final title, the full body, the target repository and how it will be submitted (the GitHub account, or by hand). Submit only after the user explicitly confirms that content. Any change after the confirmation, including your own edits, needs a new confirmation. Do not upload attachments, screenshots or logs beyond what the user saw in the body.

The target repository is `nocobase/nocobase`. Use another repository only when the user names it in the conversation.

## Submit

**When the user's GitHub CLI is signed in.** Check with `gh auth status` and show the account with `gh api user --jq .login`. After the confirmation, submit the confirmed file and return the link it prints:

```bash
gh issue create --repo nocobase/nocobase --title "<confirmed title>" --body-file <draft>
```

To add to an existing issue, use `gh issue comment <number> --repo nocobase/nocobase --body-file <comment>` instead. Delete the draft file after submitting.

The submission uses only the user's own signed-in `gh`. Never run `gh auth login`, `gh auth token` or `gh auth status --show-token`, never read, print, copy or store a token or credential file, never put a token on a command line or in a file, and never submit with a shared, bot or official account. If the user wants to sign in, they run `gh auth login` themselves.

**When `gh` is not signed in, or submitting fails.** Give the user the title and the body as separate copyable blocks, and the link `https://github.com/nocobase/nocobase/issues/new?template=bug_report.md`, so that they submit it themselves.

## Not part of this workflow

Following the issue after it is submitted, triage, release tracking and private support channels are outside it. Do not post further comments on the issue unless the user asks.
