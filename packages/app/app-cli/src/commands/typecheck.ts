import { ToolCommand } from '../lib/tool-command.ts';
import type { AppTool } from '../tools/run-tool.ts';

export default class Typecheck extends ToolCommand {
  static override summary = 'Typecheck the client, tooling and server.';
  static override description =
    'Uses the native compiler if installed. Set NOCOBASE_TSC=tsc to use the application’s tsc.';

  static override strict = true;

  protected readonly tool: AppTool = 'typecheck';

  override async run(): Promise<void> {
    await this.parse(Typecheck);
    await super.run();
  }
}
