import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
import type { JournalPolicy, LoggingConfig } from '@nocobase/logging';
import type { AppDriveDiskConfig } from '@nocobase/drive';

export interface HubPluginConfig {
  /** Public App Host origin, or `/` when the Hub listener proxies the same origin. */
  readonly publicHostUrl?: string;
  readonly desiredConfigsDir?: string;
  /**
   * Where resumable Release uploads are staged, one directory per App holding one per session. Defaults to `uploads`
   * next to `host.configPath`.
   */
  readonly uploadsDir?: string;
  readonly logging?: {
    readonly deployments?: JournalPolicy & {
      directory?: string;
      maxFileSizeMB?: number;
      maxTotalSizeMB?: number;
    };
    readonly apps?: AppRuntimeLogging;
  };
  readonly artifact: AppDriveDiskConfig;
  readonly host: {
    readonly logging?: LoggingConfig;
    readonly enabled: boolean;
    readonly driver: 'auto' | 'node' | 'tsx';
    readonly appRevisionsDir?: string;
    readonly appVolumesDir: string;
    readonly configPath: string;
    readonly childOutputDir?: string;
    readonly host?: string;
    readonly port?: number;
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
  };
}
