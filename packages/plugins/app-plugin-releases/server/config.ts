import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
import type { AppDriveDiskConfig } from '@nocobase/drive';
import type { LoggingConfig } from '@nocobase/logging';

/** The application's `releases` configuration section. */
export interface ReleasesPluginConfig {
  /** Where release archives are stored. */
  readonly artifact: AppDriveDiskConfig;
  /** The plugin's own files: deployment logs and the configuration each deployment applied. */
  readonly dataDir: string;
  /** Largest accepted release archive, in MiB (256 by default). */
  readonly maxArtifactSizeMB?: number;
  /** Lifetime of an upload ticket when the request names none, in seconds (900 by default, at most 3600). */
  readonly uploadTicketTtlSeconds?: number;
  readonly logging?: {
    readonly deployments?: {
      readonly enabled?: boolean;
      readonly retentionDays?: number;
      readonly maxFileSizeMB?: number;
      readonly maxTotalSizeMB?: number;
    };
    readonly apps?: AppRuntimeLogging;
  };
  /**
   * The local App Host that runs Apps in process. Enabled, the plugin starts it as a child process and registers the
   * `host` driver; an environment with run mode `in-process` deploys into it.
   */
  readonly host?: ReleasesHostConfig;
  /**
   * The Docker Host: a second App Host child that runs Apps in Docker containers (`@nocobase/app-host-docker`, which
   * the application must install) and no App code itself. Enabled, environments may choose the run mode `docker`. Its
   * listener is where Docker Apps are reached.
   */
  readonly docker?: ReleasesDockerHostConfig;
}

/** The Docker Host child (`releases.docker`). */
export interface ReleasesDockerHostConfig {
  readonly enabled: boolean;
  readonly driver?: 'auto' | 'node' | 'tsx';
  /** Its executable; `@nocobase/app-host-docker/cli` resolved from this plugin by default. */
  readonly entrypoint?: string;
  readonly appRevisionsDir: string;
  /** Where it keeps each App's configuration file (data lives in Docker volumes). */
  readonly appVolumesDir: string;
  readonly configPath: string;
  /** Where it records deployment outcomes; `control/` next to the revisions directory by default. */
  readonly controlDir?: string;
  readonly childOutputDir?: string;
  /** Its listener, which Docker Apps are reached through: `127.0.0.1` unless something in front must reach it. */
  readonly host?: string;
  readonly port?: number;
  /** Public origin of its listener (or a pattern with `{appId}`) for environments without their own URL pattern. */
  readonly publicUrl?: string;
  readonly startTimeoutMs?: number;
  readonly ipcTimeoutMs?: number;
  readonly shutdownTimeoutMs?: number;
  readonly autoRestart?: boolean;
  readonly tsxCli?: string;
  readonly tsconfig?: string;
  readonly logging?: LoggingConfig;
  /**
   * Its environment; omitted, it inherits this application's (it runs no App code, and an environment's
   * `env.allow` copies from it).
   */
  readonly env?: {
    readonly allow?: readonly string[];
    readonly set?: Readonly<Record<string, string>>;
  };
  /** How often it stops idle containers and makes Apps dormant, in seconds (60). */
  readonly sweepIntervalSeconds?: number;
  readonly activationHoldMs?: number;
  readonly activationWaitMs?: number;
  /** Host-wide settings of the Docker backend (`pollIntervalMs`, `reachTimeoutMs`). */
  readonly backend?: Readonly<Record<string, unknown>>;
}

export interface ReleasesHostConfig {
  readonly enabled: boolean;
  readonly driver?: 'auto' | 'node' | 'tsx';
  readonly appRevisionsDir: string;
  readonly appVolumesDir: string;
  readonly configPath: string;
  readonly childOutputDir?: string;
  readonly host?: string;
  readonly port?: number;
  /** Public origin of the Host listener for environments without their own URL pattern. */
  readonly publicUrl?: string;
  /** Where the Host records deployment outcomes; `control/` next to the revisions directory by default. */
  readonly controlDir?: string;
  readonly startTimeoutMs?: number;
  readonly ipcTimeoutMs?: number;
  readonly shutdownTimeoutMs?: number;
  readonly autoRestart?: boolean;
  readonly maxAutomaticRestarts?: number;
  readonly automaticRestartWindowMs?: number;
  readonly automaticRestartBaseDelayMs?: number;
  readonly entrypoint?: string;
  readonly tsxCli?: string;
  readonly tsconfig?: string;
  readonly logging?: LoggingConfig;
  /**
   * The Host child's environment (`AppHostSupervisor` `env`): with `allow`, only the listed variables reach it, so
   * Apps cannot read this application's secrets; omitted, it inherits everything.
   */
  readonly env?: {
    readonly allow?: readonly string[];
    readonly set?: Readonly<Record<string, string>>;
  };
  /** User and group the Host child runs as (needs the privilege to switch users). */
  readonly uid?: number;
  readonly gid?: number;
  /** A command the Host child is started through, such as `['setpriv', '--reuid=preview', '--']`. */
  readonly launchPrefix?: readonly string[];
  /**
   * Restart the Host once this many Apps were removed, replaced, stopped for idleness or made dormant since it started,
   * replaying the desired set: in-process Apps cannot unload their modules, so every runtime that goes away leaves
   * memory behind. The restart waits while an on-demand App is running. Off when omitted.
   */
  readonly restartAfterChurn?: number;
  /** How often the Host's idle stops and dormancies are read for `restartAfterChurn`, in milliseconds (60000). */
  readonly churnCheckIntervalMs?: number;
  /** How often the Host stops idle Apps and makes due Apps dormant, in seconds (60). */
  readonly sweepIntervalSeconds?: number;
  /** How long a page request to a stopped App waits before it gets the Host's starting page, in milliseconds (1500). */
  readonly activationHoldMs?: number;
  /** How long other requests to a stopped App wait for it to start, in milliseconds (60000). */
  readonly activationWaitMs?: number;
}
