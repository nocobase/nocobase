import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../../lib/command.ts';
import {
  readConnections,
  readSettings,
  writeSettings,
} from '../../lib/config.ts';
import { passEnvFlag, rememberPassEnv } from '../../lib/pass-env.ts';
import { selfCommand } from '../../lib/self.ts';
import { runnerCommandLine } from '../../host.ts';
import { EXIT_CODES } from '../../protocol/index.ts';
import {
  installService,
  SERVICE_LABEL_PATTERN,
  serviceEnvironment,
  servicePlan,
  type ServicePlan,
} from '../../core/service.ts';

/** Shown in place of a value taken from this shell: what is printed or answered never holds one. */
const HIDDEN_VALUE = '<hidden>';

export default class ServiceInstall extends RunnerCommand {
  static override summary: string =
    'Run the runner as a user service that starts at login and restarts when it exits.';
  static override description: string =
    'Writes a launchd agent (macOS) or a systemd user unit (Linux) and (re)starts it. --dry-run prints the file and ' +
    'the commands instead. The label is remembered for `service uninstall` and `uninstall`. A service does not read ' +
    "your shell's configuration, so the proxy and CA variables set in this shell (HTTP_PROXY, HTTPS_PROXY, ALL_PROXY, " +
    'NO_PROXY, SSL_CERT_FILE, NODE_EXTRA_CA_CERTS) and the --pass-env names are written into the service with their ' +
    'values now; install again after changing one.';
  static override flags: {
    label: Interfaces.OptionFlag<string | undefined>;
    'pass-env': Interfaces.OptionFlag<string[] | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    label: Flags.string({
      description:
        'The service label: com.nocobase.runner by default (systemd: nocobase-runner.service, else <label>.service).',
      env: 'NOCOBASE_RUNNER_SERVICE_LABEL',
    }),
    'pass-env': passEnvFlag,
    'dry-run': Flags.boolean({
      description: 'Print what would be written and run, and change nothing.',
    }),
  };

  async run(): Promise<ServicePlan & { installed: boolean }> {
    const { flags } = await this.parse(ServiceInstall);
    if ((await readConnections(this.paths)).length === 0) {
      throw new UsageError(
        `This runner is not registered. Run \`${runnerCommandLine('register')}\` first.`,
        EXIT_CODES.auth,
      );
    }
    let settings = await readSettings(this.paths);
    const label = flags.label ?? settings.serviceLabel;
    if (label !== undefined && !SERVICE_LABEL_PATTERN.test(label))
      throw new UsageError(`Not a service label: ${label}`);
    if (!flags['dry-run'])
      settings = await rememberPassEnv(settings, flags['pass-env'], this.paths);
    const passEnv = [
      ...new Set([...(settings.passEnv ?? []), ...(flags['pass-env'] ?? [])]),
    ];
    const options = {
      paths: this.paths,
      command: selfCommand(),
      passEnv,
      ...(label === undefined ? {} : { label }),
    };
    const plan = servicePlan(options);
    // The same plan with every value taken from this shell hidden: what is printed and answered.
    const hidden = Object.fromEntries(
      Object.keys(serviceEnvironment(process.env, passEnv)).map((name) => [
        name,
        HIDDEN_VALUE,
      ]),
    );
    const shown = servicePlan({
      ...options,
      env: { ...process.env, ...hidden },
    });
    const missing = passEnv.filter((name) => !plan.captured.includes(name));
    const answer = { ...plan, content: shown.content };
    if (flags['dry-run']) {
      this.log(`# ${plan.file}`);
      this.log(shown.content);
      for (const command of plan.install) this.log(`$ ${command.join(' ')}`);
      this.reportCaptured(plan.captured, missing);
      return { ...answer, installed: false };
    }
    if (settings.serviceLabel !== plan.label)
      await writeSettings(
        { ...settings, serviceLabel: plan.label },
        this.paths,
      );
    await installService(plan, this.paths);
    this.log(`Installed ${plan.file} and started the service.`);
    this.reportCaptured(plan.captured, missing);
    return { ...answer, installed: true };
  }

  /** Says which variables the service got from this shell, by name, and which passed names this shell lacks. */
  private reportCaptured(
    captured: readonly string[],
    missing: readonly string[],
  ): void {
    this.log(
      captured.length === 0
        ? 'No proxy, CA or --pass-env variable was set in this shell; the service gets none.'
        : `Written into the service from this shell: ${captured.join(', ')}.`,
    );
    if (missing.length > 0)
      this.log(
        `Not set in this shell, so the service does not have them: ${missing.join(', ')}. Set them and install ` +
          `again, or keep the value on this machine with \`${runnerCommandLine('env', 'set', missing[0])}\`.`,
      );
  }
}
