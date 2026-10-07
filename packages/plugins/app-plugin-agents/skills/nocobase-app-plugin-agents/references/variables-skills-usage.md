# Variables, skills, attachments and usage

## Variables and secrets

Variables (`agSecrets`) are environment variables for a runner agent's process. Every one is a secret sealed with the App's secrets service, so `secrets.keys` must be configured first (otherwise `SECRETS_KEY_MISSING`, 503). They are set on an agent, on a working directory (`workdir`) or on a scope the App registers (`scopes.register`), and merged for a run in the order the subject names its scopes, then its working directories, then the agent. They reach only runners with the `secrets` feature. Values are write-only; revealing one and every delivery are audited (`agSecretAudits`, `variable audit list`). The redactor replaces delivered values with `[REDACTED]` in everything a runner reports.

On the App's own pages, `VariablesSection` from `client/kit` edits a scope's variables. On the CLI: `variable list|set|delete|reveal <scope kind> <scope>`. `pnpm nocobase secrets rotate` reseals them under a new key.

## The skill library

Skills (`agSkills`) follow the open Agent Skills format: a directory with `SKILL.md` (front matter `name` and `description` required) and supporting files under `scripts/`, `references/` and `assets/`. Every save is a version runs get at once; saves name the revision they were made against and conflict with 409 `REVISION_CONFLICT`. Skills are attached to agents, and as defaults to a working directory or a registered scope (`DefaultSkillsSection` in `client/kit`). Runner agents may run a skill's scripts; online agents only read them. File contents go to the Drive disk `agents.skills.disk` names. See the README's "What it does" (Skills) and "Configuration" sections.

Skills the App's CLI ships (`nocobase.cli.skills`) reach every runner run beside the run's own; `online.skills.register` does the same for online runs.

## Chat attachments

A person may send files with a message: each is uploaded first (`POST /api/agents/chatAttachments`, one file, stored through the file plugin), readable only by its uploader until sent, then sent with the message (`attachmentIds`). After that only the conversation's owner and a run of its agent on that conversation read it. A runner agent downloads a file with the CLI (`conversation attachment download <file-id>`); an online agent is shown the images and only the names of the rest. Uploads never sent are purged. Size and count limits are the `CHAT_ATTACHMENT_*` constants in `@nocobase/app-plugin-agents/shared/conversations`, whose header comment is the contract.

## Usage, prices and reports

Every run records what it used (tokens per model and tool) as it reports. The Usage page (`usageRoute`, `GET /api/agents/usage`) groups it by agent, person, group, subject, day, model, tool or type; who reads `agents.prices` sets prices on its prices sheet, and costs are computed from them. Model calls outside runs (embeddings, reranking, short generations through `online.gateway`) appear as "Other model use" (`GET /api/agents/usage/models`). The App's own report pages read `reporting.usage`, `reporting.runFigures`, `reporting.range` and `reporting.modelUsage` from `agentsToken`, and each subject kind's `reports.describe` labels and groups its runs.
