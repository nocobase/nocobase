import { RunnerCommand } from '../lib/command.ts';
import {
  readConnections,
  readSettings,
  type AgentHome,
} from '../lib/config.ts';
import { formatToolSlots } from '../lib/slots.ts';
import type { ToolSlots } from '../protocol/index.ts';
import { readDaemonPid } from '../core/loop.ts';
import { readRecords, type RunRecord } from '../core/supervisor.ts';
import { runnerCommandLine } from '../host.ts';

interface RunnerStatus {
  registered: boolean;
  name: string;
  slots: number;
  /** Limits per coding tool beside `slots`; absent when none is set. */
  toolSlots?: ToolSlots;
  agentHome: AgentHome;
  apps: {
    key: string;
    name: string;
    server: string;
    runnerId: string;
    cli: Record<string, string>;
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
    }));
    this.log(`Runner   ${settings.name}`);
    this.log(
      `Slots    ${settings.slots}${settings.toolSlots === undefined ? '' : ` (${formatToolSlots(settings.toolSlots)})`}`,
    );
    this.log(
      `Home     agents get ${settings.agentHome === 'real' ? 'the real home' : 'an isolated home'}`,
    );
    if (apps.length === 0)
      this.log(`Not registered. Run \`${runnerCommandLine('register')}\`.`);
    for (const app of apps)
      this.log(
        `App      ${app.name || app.key} at ${app.server} as ${app.runnerId}`,
      );
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
      slots: settings.slots,
      ...(settings.toolSlots === undefined
        ? {}
        : { toolSlots: settings.toolSlots }),
      agentHome: settings.agentHome,
      apps,
      running: daemon !== undefined,
      ...(daemon === undefined ? {} : { pid: daemon.pid }),
      runs,
    };
  }
}
