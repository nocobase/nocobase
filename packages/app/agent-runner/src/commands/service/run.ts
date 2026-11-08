import { RunnerCommand } from '../../lib/command.ts';
import { selfCommand } from '../../lib/self.ts';
import { RotatingLog, runService } from '../../core/service-runner.ts';
import { readSettings } from '../../lib/config.ts';
import { migrateService, SERVICE_ENV } from '../../core/service.ts';

export default class ServiceRun extends RunnerCommand {
  static override hidden = true;
  static override enableJsonFlag = false;
  async run(): Promise<never> {
    await this.parse(ServiceRun);
    const log = new RotatingLog(this.paths.daemonLog);
    try {
      if (process.env[SERVICE_ENV] === '1') {
        const { serviceLabel } = await readSettings(this.paths);
        if (serviceLabel !== undefined) {
          const migrated = await migrateService(serviceLabel, {
            relaunch: selfCommand(),
          });
          if (migrated && process.platform === 'darwin') process.exit(0);
        }
      }
      const code = await runService({
        command: [...selfCommand(), 'start', '--foreground'],
        log,
        paths: this.paths,
      });
      process.exit(code);
    } catch (error) {
      log.write(`Service launcher failed: ${String(error)}\n`);
      throw error;
    }
  }
}
