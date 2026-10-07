// The CLI's help class. oclif renders help itself and refuses a command it does not know, so `<bin> issue comment add
// --help` would never reach the manifest: this class answers the static commands as oclif does, and the business
// commands (and their topics) from the manifest. The root help lists the business commands too, when the manifest can
// be had.
import { Help } from '@oclif/core';

import { GLOBAL_FLAG_HELP } from '../lib/globals.ts';
import { renderCommandList } from './output.ts';
import { getOriginalArgv, loadDynamic, runDynamic } from './index.ts';
import { leadingWords } from './parse.ts';

export default class AppCliHelp extends Help {
  override async showHelp(argv: string[]): Promise<void> {
    const words = leadingWords(
      argv.filter((word) => word !== '--help' && word !== '-h'),
    );
    const id = words.join(':');
    if (
      words.length === 0 ||
      this.config.findCommand(id) !== undefined ||
      this.config.findTopic(id) !== undefined
    ) {
      await super.showHelp(argv);
      if (words.length === 0) {
        await this.showBusinessCommands();
        this.log(
          `\nGLOBAL FLAGS\n${GLOBAL_FLAG_HELP.map(([flag, text]) => `  ${flag.padEnd(18)}  ${text}`).join('\n')}`,
        );
      }
      return;
    }
    // oclif's argv may have lost words with `:` in them; the original line is exact.
    const original = getOriginalArgv();
    await runDynamic(
      original.includes('--help') || original.includes('-h')
        ? original
        : [...words, '--help'],
    );
  }

  private async showBusinessCommands(): Promise<void> {
    try {
      const context = await loadDynamic({ offline: true });
      const list = context ? renderCommandList(context.manifest) : undefined;
      if (list)
        this.log(
          `\nBUSINESS COMMANDS (from ${context!.session.server})\n${list}`,
        );
    } catch {
      // Without a server, the static commands are the whole help.
    }
  }
}
