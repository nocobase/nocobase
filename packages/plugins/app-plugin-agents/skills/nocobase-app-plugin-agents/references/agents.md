# Agents

Add an agent from the live available-model list, already enabled. Only the application’s recommended combinations are automatically added when runners report them. Runner agents are enabled or disabled. `docs/runner-agents.md` in the package and the README's "What it does" (Agents) are the reference.

## Enabling agents

- Someone who manages agents (`agents.agents` manage) adds one with `POST /api/agents/runnerAgents` (`agent create`), writing what it is good at — the project manager hands it work by this — and optionally its default reasoning effort. The page starts the description from the catalog's suggestion.
- Every change names the agent's revision (`expectedRevision`); `REVISION_CONFLICT` means someone changed it since, so read it again. `GOOD_AT_REQUIRED`: enabling needs a description. `EFFORT_UNSUPPORTED`: the tool does not take that effort. `AGENT_MANAGED`: an App's own agent is changed through the App.
- Disabling an agent withdraws its queued runs and announces `agent.removed` (`reason` `disabled`); the App lets go of the work it gave the agent. Work for an agent that is not enabled is refused with `AGENT_NOT_ENABLED`.
- Anyone signed in reads the agents (`GET /api/agents`, `agent list-all`); `GET /api/agents/agentNames` names every agent there has been, for runs that name a removed one.

## Available models

The page defaults to enabled agents, with “Show disabled” to include disabled agents. Available models are computed live, grouped by tool and searchable. “Added” means an enabled or disabled runner agent exists. Adding enables directly; adding the same combination again returns `AGENT_EXISTS`. Edit the existing agent to enable it again. The old discovery ignore/restore and cleanup routes and commands have been removed.

## Where an agent can run

`GET /api/agents` answers, per caller, how many team and personal runners online have the agent's tool signed in with its model, whether only personal runners have it (`personalOnly`: they take their owners' work only), and `unusable`, why the caller's work cannot start now: `disabled`, `unreported` (no runner reported it for 14 days), `notConfigured`, `noRunner` or `othersPersonal`. The roster (`GET /api/agents/available`, `agent list`, `Agents.roster`) lists the enabled agents reported recently with whether each would take the caller's work now. A run that fails `modelUnavailable` marks that tool and model unavailable on its runner until the runner reports the tool's models differently.

## The App's own agents and defaults

- `agents.ensureSystem(input)` keeps an agent of the App's own, such as a project manager: fixed id, name, description, instructions, business actions and the tools and models it runs with. Call it at boot; it creates the agent the first time and writes changes after.
- `agents.setDefaults(provider)` gives every discovered agent the App's instructions and business actions; call `agents.applyDefaults()` after the provider changes so agents discovered earlier get them too. Without a provider, business actions marked `defaultOn` apply.
- The system default chat agent is the App's to set (`PATCH /api/agents/chatSettings`); upgrading clears it along with every agent an earlier version kept.

## Upgrading from configured agents

The `202610240020_ag_runner_agents` migration removes every agent an earlier version kept, online agents included: their rows stay disabled with `deletedAt` so history still names them, their queued runs are cancelled, their pending run requests withdrawn, and default chat agents cleared. After upgrading, wait for runners to report (or restart them), add agents from Available models, and set the system default chat agent again.

The retirement migration preserves all referenced legacy records as disabled, including records with only a creation audit. Only unreferenced runner records are deleted. This data change is irreversible; deployment rollback leaves the cleanup in place. See `docs/retire-pending-runner-agents.md` for the read-only operator preflight and custom-reference boundary.
