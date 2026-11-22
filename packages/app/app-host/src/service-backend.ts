/**
 * The contract of an `external-service` activation backend: one that runs each App as a service of its own (a
 * container) and lets the Host reach it, instead of loading the App into the Host process. The registry activates,
 * stops and retires its runtimes like any other backend's, so on-demand start, the idle stop and dormancy work the same;
 * the Host listener forwards the App's traffic to the service (`ActiveAppHandle.forward`).
 *
 * Settings and credentials belong to a scope (one control-plane environment, `HostScope`): the Host binds each scope
 * it is told about to the backend, and every App definition names its scope in `backendOptions.scope`, so credentials
 * never enter a definition. Such a backend holds platform credentials (a Docker socket), so a Host that offers one must not also run
 * untrusted App code in process (see `createAppHost`'s `trustedApps`).
 */
import type { JournalPage, JournalQuery } from '@nocobase/logging';

import type { AppActivationBackend, AppDefinition } from './app-types.ts';
import type {
  HostBackendCapabilities,
  HostScopeCheck,
} from './management/types.ts';

/** A scope's settings and credentials, as the Host binds them. */
export interface ServiceScope {
  readonly scopeId: string;
  readonly config: Readonly<Record<string, unknown>>;
  readonly secret: Readonly<Record<string, unknown>> | null;
}

/** What `inspect` finds for a definition: a service to adopt, a stopped one to start, or none (a dormant App). */
export type ServiceState = 'running' | 'stopped' | 'absent';

export interface ServiceBackend extends AppActivationBackend {
  readonly kind: 'external-service';
  /** What a scope and its control plane call the backend: `docker`. */
  readonly name: string;
  readonly loadsAppCode: false;
  readonly capabilities: HostBackendCapabilities;
  readonly configSchema: Record<string, unknown>;
  readonly secretSchema?: Record<string, unknown>;
  /** Refuses settings or credentials the backend cannot use. */
  validate(
    config: Readonly<Record<string, unknown>>,
    secret: Readonly<Record<string, unknown>> | null,
  ): void;
  /** Takes a scope's settings and credentials, replacing what it held for the scope. */
  bindScope(scope: ServiceScope): Promise<void>;
  /** Forgets a scope. */
  releaseScope?(scopeId: string): Promise<void>;
  /** Whether the scope's platform answers with its settings ("test connection"). */
  check(scopeId: string): Promise<HostScopeCheck>;
  /** What runs for the definition now, without changing it. */
  inspect(definition: AppDefinition): Promise<ServiceState>;
  /** The App was removed: removes what ran it, and with `purgeData` its data too. */
  dispose(
    definition: AppDefinition,
    options: { readonly purgeData: boolean },
  ): Promise<void>;
  logs(definition: AppDefinition, query: JournalQuery): Promise<JournalPage>;
  /**
   * Runs the App's own command-line tool once beside the App, from the definition's release, with its data,
   * configuration and environment: what backups and restores run on.
   */
  commandRunner?(definition: AppDefinition): Promise<AppCommandRunner>;
  /** Runs before a deployment replaces the App, such as a backup; failing fails the deployment first. */
  beforeDeploy?(definition: AppDefinition): Promise<void>;
  /** Lets every connection go when the Host stops; services keep running. */
  close?(): Promise<void>;
}

/** What a run of an App's command-line tool printed and how it exited. */
export interface AppCommandOutput {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Runs an App's command-line tool (`dist/cli/index.js` of its release) for one definition, wherever the App runs: a
 * child process of the Host for an in-process App, a one-off container of the same image and volumes for a service.
 */
export interface AppCommandRunner {
  /** Where the command reads and writes backup archives, as the command sees it. */
  readonly backupsDir: string;
  /** Runs the tool with these arguments; a missing tool fails with `BACKUP_COMMAND_UNAVAILABLE`. */
  run(args: readonly string[]): Promise<AppCommandOutput>;
  /** Removes a file of `backupsDir` by name; an absent one is ignored. */
  removeBackupFile(name: string): Promise<void>;
}

export function isServiceBackend(
  backend: AppActivationBackend,
): backend is ServiceBackend {
  return (
    backend.kind === 'external-service' &&
    typeof (backend as Partial<ServiceBackend>).bindScope === 'function'
  );
}

/**
 * Refuses a Host that would run untrusted App code in process beside a backend holding platform credentials: App code
 * in the Host process could use the backend's Docker socket. `trustedApps` says every in-process App is trusted.
 */
export function assertBackendSeparation(
  backends: readonly AppActivationBackend[],
  trustedApps: boolean = false,
): void {
  if (trustedApps) return;
  const inProcess = backends.some((backend) => backend.kind === 'in-process');
  const services = backends.filter((backend) => isServiceBackend(backend));
  if (inProcess && services.length)
    throw new Error(
      `This Host would run in-process Apps beside the "${services
        .map((backend) => backend.name ?? backend.kind)
        .join(
          '", "',
        )}" backend, which holds platform credentials; run it in a separate Host, or set trustedApps when every in-process App is trusted`,
    );
}
