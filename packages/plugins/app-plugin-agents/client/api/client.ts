/**
 * The browser API of `/api/agents`, typed with the `shared/` view models. One method per endpoint; answers are
 * unwrapped from `{ data }`. Failures throw `ApiClientError` (`status`, `reason`, `domain`). Runners and registration
 * tokens go through the runners' API (`RunnersApi`, `/api/agents/runners`).
 */
import type { ApiClient } from '@nocobase/app-client';
import type { RunStatus } from '@nocobase/agent-protocol';

import type {
  Agent,
  AgentActionOption,
  AgentChange,
  AgentInput,
  AgentPatch,
  AgentSummary,
  UserRef,
} from '../../shared/agents.js';
import type { BriefPreview, RunBrief } from '../../shared/briefs.js';
import type { PricesAnswer, PricesInput } from '../../shared/reports.js';
import type {
  CreateModelServiceRequest,
  DefaultModels,
  ModelCatalog,
  ModelCheck,
  ModelConnectionCheckRequest,
  ModelConnectionRequest,
  ModelKind,
  ModelRef,
  ModelServiceView,
  ProviderModels,
  UpdateModelServiceRequest,
} from '../../shared/models.js';
import type {
  RegistrationToken,
  RegistrationTokenInput,
  Runner,
  RunnerPatch,
  RunnerRecentRun,
  RunnerSummary,
} from '../../shared/runners.js';
import type { Run, RunDetail, RunEventPage } from '../../shared/runs.js';
import type {
  Skill,
  SkillDetail,
  SkillImport,
  SkillInput,
  SkillSave,
  SkillUpload,
  SkillVersion,
  SkillVersionDetail,
  SkillView,
} from '../../shared/skills.js';
import type {
  Variable,
  VariableAudit,
  VariableScope,
  VariableValue,
} from '../../shared/variables.js';
import type {
  ModelUsageReport,
  UsageQuery,
  UsageReport,
} from '../../shared/reports.js';
import type { AgentsVocabulary } from '../../shared/vocabulary.js';
import { RunnersApi } from './runners.js';

type Method = 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Readonly<Record<string, string | number | boolean | undefined>>;

const BASE = 'agents';
const id = (value: string): string => encodeURIComponent(value);
const pathOf = (path: string): string => (path ? `${BASE}/${path}` : BASE);

/** A list's answer: its items and what it says about itself. */
interface ListAnswer<T> {
  readonly data: T[];
  readonly meta: Readonly<Record<string, unknown>>;
}

/** Which runs to list; without a subject, every run the caller may see. */
export interface RunListQuery {
  readonly subjectKind?: string;
  readonly subjectId?: string;
  readonly agentId?: string;
  readonly status?: RunStatus;
  readonly pageSize?: number;
}

export class AgentsApi {
  private readonly api: ApiClient;
  /** Runners: the runners' API, which the runner pickers use. */
  private readonly runnersApi: RunnersApi;

  public constructor(api: ApiClient) {
    this.api = api;
    this.runnersApi = new RunnersApi(api);
  }

  // Agents

  /** The business actions an agent may be configured with. */
  public agentActions(): Promise<AgentActionOption[]> {
    return this.list('actions');
  }

  /** The services and models of `kind` (chat, the ones online agents may use, by default). */
  public async models(kind?: ModelKind): Promise<ModelCatalog> {
    const services = await this.list<ModelCatalog['services'][number]>(
      'models',
      kind && kind !== 'chat' ? { kind } : {},
    );
    return { services };
  }

  /** Whether a model answers a short test request. */
  public checkModel(ref: ModelRef): Promise<ModelCheck> {
    return this.send('checkModel', 'POST', ref);
  }

  /** The system default chat model, as set and as used now. */
  public defaultModels(): Promise<DefaultModels> {
    return this.get('defaultModels');
  }

  /** Sets the system default chat model. */
  public setDefaultChatModel(ref: ModelRef): Promise<DefaultModels> {
    return this.send('defaultModels/chat', 'PUT', ref);
  }

  // Model services

  public services(): Promise<ModelServiceView[]> {
    return this.list('services');
  }

  public createService(
    input: CreateModelServiceRequest,
  ): Promise<ModelServiceView> {
    return this.send('services', 'POST', input);
  }

  public updateService(
    name: string,
    input: UpdateModelServiceRequest,
  ): Promise<ModelServiceView> {
    return this.send(`services/${id(name)}`, 'PATCH', input);
  }

  public deleteService(name: string): Promise<void> {
    return this.send(`services/${id(name)}`, 'DELETE');
  }

  /** The models a provider lists over a connection being edited or saved. */
  public providerModels(
    connection: ModelConnectionRequest,
  ): Promise<ProviderModels> {
    return this.send('discoverModels', 'POST', connection);
  }

  /** Whether a model answers over a connection being edited or saved. */
  public checkConnection(
    request: ModelConnectionCheckRequest,
  ): Promise<ModelCheck> {
    return this.send('checkConnection', 'POST', request);
  }

  // Model prices

  /** The prices, the coding tools paid by subscription, and the models coding tools reported. */
  public prices(): Promise<PricesAnswer> {
    return this.get('prices');
  }

  /** Replaces the whole price table and the subscriptions. */
  public savePrices(input: PricesInput): Promise<PricesAnswer> {
    return this.send('prices', 'PUT', input);
  }

  /** People to pick from (who may use an agent); empty without a directory of people. */
  public users(): Promise<UserRef[]> {
    return this.list('users');
  }

  public agents(includeArchived = false): Promise<AgentSummary[]> {
    return this.list('', includeArchived ? { includeArchived: true } : {});
  }

  public agent(agentId: string): Promise<AgentSummary> {
    return this.get(id(agentId));
  }

  public createAgent(input: AgentInput): Promise<Agent> {
    return this.send('', 'POST', input);
  }

  /** Changes the agent as it was at `patch.expectedRevision`; 409 `REVISION_CONFLICT` when it changed since. */
  public updateAgent(agentId: string, patch: AgentPatch): Promise<Agent> {
    return this.send(id(agentId), 'PATCH', patch);
  }

  /** The agent's history, newest first; with `afterRevision`, the changes made after it. */
  public agentHistory(
    agentId: string,
    afterRevision?: number,
  ): Promise<AgentChange[]> {
    return this.list(
      `${id(agentId)}/history`,
      afterRevision === undefined ? {} : { afterRevision },
    );
  }

  public archiveAgent(agentId: string): Promise<Agent> {
    return this.send(`${id(agentId)}/archive`, 'POST');
  }

  public restoreAgent(agentId: string): Promise<Agent> {
    return this.send(`${id(agentId)}/restore`, 'POST');
  }

  /** Deletes an archived agent; `AGENT_NOT_ARCHIVED` or `AGENT_HAS_ACTIVE_RUNS` otherwise. */
  public deleteAgent(agentId: string): Promise<void> {
    return this.send(id(agentId), 'DELETE');
  }

  /** What a run of the agent would be sent now in `scenario` (a subject kind), on a made-up subject; the first by default. */
  public briefPreview(
    agentId: string,
    scenario: string | null,
  ): Promise<BriefPreview> {
    return this.get(
      `${id(agentId)}/previewBrief`,
      scenario ? { scenario } : {},
    );
  }

  // Runners

  public runners(): Promise<RunnerSummary[]> {
    return this.runnersApi.runners();
  }

  /** A runner's latest runs, newest first. */
  public runnerRuns(runnerId: string): Promise<RunnerRecentRun[]> {
    return this.runnersApi.runnerRuns(runnerId);
  }

  public createRegistrationToken(
    input: RegistrationTokenInput,
  ): Promise<RegistrationToken> {
    return this.runnersApi.createRegistrationToken(input);
  }

  public updateRunner(runnerId: string, patch: RunnerPatch): Promise<Runner> {
    return this.runnersApi.updateRunner(runnerId, patch);
  }

  public revokeRunner(runnerId: string): Promise<Runner> {
    return this.runnersApi.revokeRunner(runnerId);
  }

  public deleteRunner(runnerId: string): Promise<void> {
    return this.runnersApi.deleteRunner(runnerId);
  }

  /** What runs used and cost (`USAGE_ROUTE`); needs the usage page's grant. */
  public usage(query: UsageQuery): Promise<UsageReport> {
    return this.get('usage', { ...query });
  }

  /** What model calls outside runs used (`MODEL_USAGE_ROUTE`); needs the usage page's grant. */
  public modelUsage(query: {
    readonly from?: string;
    readonly to?: string;
  }): Promise<ModelUsageReport> {
    return this.get('usage/models', { ...query });
  }

  /** What the application calls the subjects runs work on and the scopes of variables and skills. */
  public vocabulary(): Promise<AgentsVocabulary> {
    return this.get('vocabulary');
  }

  // Variables (an agent's, a working directory's, or a scope the application registers)

  public variables(scope: VariableScope, scopeId: string): Promise<Variable[]> {
    return this.list(`variables/${scope}/${id(scopeId)}`);
  }

  /** Creates or replaces a variable; the value is never read back except through `revealVariables`. */
  public async setVariable(
    scope: VariableScope,
    scopeId: string,
    name: string,
    value: string,
  ): Promise<void> {
    await this.send<Variable>(
      `variables/${scope}/${id(scopeId)}/${id(name)}`,
      'PUT',
      { value },
    );
  }

  public deleteVariable(
    scope: VariableScope,
    scopeId: string,
    name: string,
  ): Promise<void> {
    return this.send(`variables/${scope}/${id(scopeId)}/${id(name)}`, 'DELETE');
  }

  /** Every value of the scope; recorded in its audit log. */
  public async revealVariables(
    scope: VariableScope,
    scopeId: string,
  ): Promise<VariableValue[]> {
    return this.send<VariableValue[]>(
      `variables/${scope}/${id(scopeId)}/reveal`,
      'POST',
    );
  }

  public variableAudits(
    scope: VariableScope,
    scopeId: string,
  ): Promise<VariableAudit[]> {
    // The latest 100, the most a page holds: the access log filters them by variable.
    return this.list(`variables/${scope}/${id(scopeId)}/audits`, {
      pageSize: 100,
    });
  }

  // Skills

  public skills(): Promise<Skill[]> {
    return this.list('skills');
  }

  public skill(skillId: string): Promise<SkillView> {
    return this.get(`skills/${id(skillId)}`);
  }

  public createSkill(input: SkillInput): Promise<SkillDetail> {
    return this.send('skills', 'POST', input);
  }

  /** Saves a new version, made against `save.expectedRevision`; 409 `REVISION_CONFLICT` when another save came first. */
  public saveSkill(skillId: string, save: SkillSave): Promise<SkillView> {
    return this.send(`skills/${id(skillId)}`, 'PATCH', save);
  }

  /** Deletes the skill and detaches it everywhere. */
  public deleteSkill(skillId: string): Promise<void> {
    return this.send(`skills/${id(skillId)}`, 'DELETE');
  }

  public skillVersions(skillId: string): Promise<SkillVersion[]> {
    return this.list(`skills/${id(skillId)}/versions`);
  }

  public skillVersion(
    skillId: string,
    version: number,
  ): Promise<SkillVersionDetail> {
    return this.get(`skills/${id(skillId)}/versions/${version}`);
  }

  /** Makes `version` current again, as a new version, when the skill is still at `expectedRevision`. */
  public restoreSkillVersion(
    skillId: string,
    version: number,
    expectedRevision: number,
  ): Promise<SkillView> {
    return this.send(
      `skills/${id(skillId)}/versions/${version}/restore`,
      'POST',
      { expectedRevision },
    );
  }

  /** Stores a file (or a zip to import) for a save or an import to name by its `id`. */
  public async uploadSkillFile(file: Blob): Promise<SkillUpload> {
    const form = new FormData();
    form.append('file', file);
    const answer = await this.api.request<{ readonly data: SkillUpload }>({
      path: pathOf('skills/uploads'),
      method: 'POST',
      body: form,
    });
    return answer.data;
  }

  /** A zip in the Agent Skills layout as a new skill, or as a new version of `input.skillId`. */
  public importSkill(input: SkillImport): Promise<SkillView> {
    return this.send('skills/import', 'POST', input);
  }

  /** A version (the current one by default) as a zip. */
  public exportSkill(skillId: string, version?: number): Promise<Blob> {
    return this.blob(
      `skills/${id(skillId)}/archive`,
      version === undefined ? undefined : { version },
    );
  }

  /** One file of a version, as stored. */
  public skillFile(
    skillId: string,
    version: number,
    path: string,
  ): Promise<Blob> {
    return this.blob(`skills/${id(skillId)}/versions/${version}/file`, {
      path,
    });
  }

  /** The skills attached to a working directory or a registered scope, as defaults for every run there. */
  public async scopeSkills(scope: string, scopeId: string): Promise<string[]> {
    const { skillIds } = await this.get<{ readonly skillIds: string[] }>(
      `skillAttachments/${scope}/${id(scopeId)}`,
    );
    return skillIds;
  }

  public async setScopeSkills(
    scope: string,
    scopeId: string,
    skillIds: readonly string[],
  ): Promise<string[]> {
    const result = await this.send<{ readonly skillIds: string[] }>(
      `skillAttachments/${scope}/${id(scopeId)}`,
      'PUT',
      { skillIds },
    );
    return result.skillIds;
  }

  // Runs

  public runs(query: RunListQuery = {}): Promise<Run[]> {
    return this.list('runs', { ...query });
  }

  public run(runId: string): Promise<RunDetail> {
    return this.get(`runs/${id(runId)}`);
  }

  /** The transcript after `after` (a `seq`), at most `pageSize` events. */
  public async runEvents(
    runId: string,
    after: number,
    pageSize = 500,
  ): Promise<RunEventPage> {
    const page = await this.page<RunEventPage['events'][number]>(
      `runs/${id(runId)}/events`,
      { after, pageSize },
    );
    return { events: page.data, lastSeq: Number(page.meta.lastSeq ?? after) };
  }

  /** The brief the run's latest attempt was given; `BRIEF_NOT_FOUND` before its first claim. */
  public runBrief(runId: string): Promise<RunBrief> {
    return this.get(`runs/${id(runId)}/brief`);
  }

  /** The next run on the subject starts from a fresh working directory (a new checkout). */
  public resetWorkspace(subjectKind: string, subjectId: string): Promise<void> {
    return this.send(
      `workspaces/${id(subjectKind)}/${id(subjectId)}/reset`,
      'POST',
    );
  }

  public cancelRun(runId: string): Promise<Run> {
    return this.send(`runs/${id(runId)}/cancel`, 'POST');
  }

  /** The new run that retries `runId`. */
  public retryRun(runId: string): Promise<Run> {
    return this.send(`runs/${id(runId)}/retry`, 'POST');
  }

  private async list<T>(path: string, query?: Query): Promise<T[]> {
    return (await this.page<T>(path, query)).data;
  }

  private page<T>(path: string, query?: Query): Promise<ListAnswer<T>> {
    return this.read<ListAnswer<T>>(path, query);
  }

  private async blob(path: string, query?: Query): Promise<Blob> {
    const stream = await this.api.stream({
      path: pathOf(path),
      ...(query ? { query } : {}),
    });
    return new Response(stream).blob();
  }

  private async get<T>(path: string, query?: Query): Promise<T> {
    return (await this.read<{ readonly data: T }>(path, query)).data;
  }

  private read<T>(path: string, query?: Query): Promise<T> {
    const clean = query
      ? Object.fromEntries(
          Object.entries(query).filter(
            ([, value]) => value !== undefined && value !== '',
          ),
        )
      : undefined;
    return this.api.request<T>({
      path: pathOf(path),
      ...(clean && Object.keys(clean).length > 0 ? { query: clean } : {}),
    });
  }

  private async send<T = void>(
    path: string,
    method: Method,
    json?: unknown,
  ): Promise<T> {
    const answer = await this.api.request<{ readonly data: T } | undefined>({
      path: pathOf(path),
      method,
      ...(json === undefined ? {} : { json }),
    });
    return answer?.data as T;
  }
}
