/**
 * The browser API of `/api/agents/runners`, typed with the `shared/` view models: one method per endpoint, answers
 * unwrapped from `{ data }`. Failures throw `ApiClientError` (`status`, `reason`, `domain`).
 */
import type { ApiClient } from '@nocobase/app-client';

import type {
  RegistrationToken,
  RegistrationTokenInput,
  Runner,
  RunnerHeldItem,
  RunnerPatch,
  RunnerRecentRun,
  RunnerSummary,
} from '../../shared/runners.js';

type Method = 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Readonly<Record<string, string | number | boolean | undefined>>;

const BASE = 'agents/runners';
const id = (value: string): string => encodeURIComponent(value);
const pathOf = (path: string): string => (path ? `${BASE}/${path}` : BASE);

export class RunnersApi {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  // Runners

  public runners(): Promise<RunnerSummary[]> {
    return this.list('');
  }

  public runner(runnerId: string): Promise<RunnerSummary> {
    return this.get(id(runnerId));
  }

  /** What the runner holds now: runs, then jobs. */
  public runnerWork(runnerId: string): Promise<RunnerHeldItem[]> {
    return this.list(`${id(runnerId)}/work`);
  }

  /** Its latest runs, newest first. */
  public runnerRuns(runnerId: string): Promise<RunnerRecentRun[]> {
    return this.list(`${id(runnerId)}/runs`);
  }

  public createRegistrationToken(
    input: RegistrationTokenInput,
  ): Promise<RegistrationToken> {
    return this.send('registrationTokens', 'POST', input);
  }

  public updateRunner(runnerId: string, patch: RunnerPatch): Promise<Runner> {
    return this.send(id(runnerId), 'PATCH', patch);
  }

  public revokeRunner(runnerId: string): Promise<Runner> {
    return this.send(`${id(runnerId)}/revoke`, 'POST');
  }

  public deleteRunner(runnerId: string): Promise<void> {
    return this.send(id(runnerId), 'DELETE');
  }

  private async list<T>(path: string, query?: Query): Promise<T[]> {
    return await this.get<T[]>(path, query);
  }

  private async get<T>(path: string, query?: Query): Promise<T> {
    const clean = query
      ? Object.fromEntries(
          Object.entries(query).filter(
            ([, value]) => value !== undefined && value !== '',
          ),
        )
      : undefined;
    const { data } = await this.api.request<{ readonly data: T }>({
      path: pathOf(path),
      ...(clean && Object.keys(clean).length > 0 ? { query: clean } : {}),
    });
    return data;
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
