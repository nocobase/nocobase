import { RunnerCommand } from '../../lib/command.ts';
import { selfCommand } from '../../lib/self.ts';
import { RotatingLog, runService } from '../../core/service-runner.ts';

export default class ServiceRun extends RunnerCommand {
  static override hidden = true;
  static override enableJsonFlag = false;
  async run(): Promise<never> {
    await this.parse(ServiceRun);
    const log = new RotatingLog(this.paths.daemonLog);
    try {
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
