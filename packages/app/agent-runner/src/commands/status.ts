import { RunnerCommand } from '../lib/command.ts';
import type { AgentTools } from '../agent/runner-tools.ts';
import {
  readConnections,
  readSettings,
  type AppRegistration,
} from '../lib/config.ts';
import { formatToolSlots } from '../lib/slots.ts';
import type { RunnerCapacity } from '../protocol/index.ts';
import { readJson } from '../lib/home.ts';
import { readDaemonPid } from '../core/loop.ts';
import { readRecords, type RunRecord } from '../core/supervisor.ts';
import { runnerCommandLine } from '../host.ts';

type EffectiveCapacity = RunnerCapacity & {
  source: 'online' | 'legacyLocal';
  connected: boolean;
  reportedAt?: string;
};

interface RunnerStatus {
  registered: boolean;
  name: string;
  agentTools: AgentTools;
  apps: {
    key: string;
    name: string;
    server: string;
    runnerId: string;
    cli: Record<string, string>;
    capacity?: EffectiveCapacity;
    reportedAt?: string;
    revoked?: AppRegistration['revoked'];
  }[];
  running: boolean;
  pid?: number;
  runs: Pick<
    RunRecord,
    'runId' | 'appKey' | 'pid' | 'phase' | 'startedAt' | 'workDir'
  >[];
}

export default class Status extends RunnerCommand {
  static override summary = 'Show the registrations, the daemon and its runs.';

  async run(): Promise<RunnerStatus> {
    const settings = await readSettings(this.paths);
    const connections = await readConnections(this.paths);
    const daemon = await readDaemonPid(this.paths);
    const stored = await readJson<{
      pid: number;
      startedAt: string;
      apps: Record<string, EffectiveCapacity>;
    }>(this.paths.capacity).catch(() => undefined);
    const snapshot =
      daemon &&
      stored?.pid === daemon.pid &&
      stored.startedAt === daemon.startedAt
        ? stored
        : undefined;
    const runs = (await readRecords(this.paths)).map(
      ({ runId, appKey, pid, phase, startedAt, workDir }) => ({
        runId,
        appKey,
        pid,
        phase,
        startedAt,
        ...(workDir === undefined ? {} : { workDir }),
      }),
    );
    const apps = connections.map(({ registration }) => ({
      key: registration.key,
      name: registration.app.name,
      server: registration.server,
      runnerId: registration.runnerId,
      cli: registration.cli,
      ...(snapshot?.apps[registration.key]?.source
        ? {
            capacity: snapshot.apps[registration.key],
            reportedAt: snapshot.apps[registration.key]?.reportedAt,
          }
        : {}),
      ...(registration.revoked === undefined
        ? {}
        : { revoked: registration.revoked }),
    }));
    this.log(`Runner   ${settings.name}`);
    this.log(
      'Access   agents run with full access and your real home; the runner is not a sandbox',
    );
    this.log(
      `Tools    agents get ${settings.agentTools === 'system' ? "the machine's Node.js and pnpm" : "the runner's Node.js and pnpm"}`,
    );
    if (apps.length === 0)
      this.log(`Not registered. Run \`${runnerCommandLine('register')}\`.`);
    for (const app of apps) {
      this.log(
        `App      ${app.name || app.key} at ${app.server} as ${app.runnerId}${app.revoked === undefined ? '' : ` — revoked at ${app.revoked.at} (${app.revoked.reason}); run ${runnerCommandLine('register')} to register again`}`,
      );
      this.log(
        app.capacity
          ? 'Slots    ' +
              app.capacity.slots +
              ' (' +
              app.capacity.source +
              (app.capacity.connected ? ')' : ', disconnected)') +
              (Object.keys(app.capacity.toolSlots).length
                ? ' ' + formatToolSlots(app.capacity.toolSlots)
                : '') +
              ' · last reported ' +
              (app.reportedAt ?? 'unknown')
          : 'Slots    unknown (daemon stopped or awaiting heartbeat)',
      );
    }
    this.log(
      `Daemon   ${daemon === undefined ? 'stopped' : `running (pid ${daemon.pid}, since ${daemon.startedAt})`}`,
    );
    for (const run of runs)
      this.log(
        `Run      ${run.runId}  ${run.appKey}  ${run.phase}  pid ${run.pid}  since ${run.startedAt}`,
      );
    return {
      registered: apps.length > 0,
      name: settings.name,
      agentTools: settings.agentTools,
      apps,
      running: daemon !== undefined,
      ...(daemon === undefined ? {} : { pid: daemon.pid }),
      runs,
    };
  }
}
