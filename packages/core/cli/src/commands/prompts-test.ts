/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as p from '@clack/prompts';
import { Args, Command, Flags } from '@oclif/core';
import {
  type PromptInitialValues,
  type PromptsCatalog,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import {
  applyCliLocale,
  CLI_LOCALE_FLAG_DESCRIPTION,
  CLI_LOCALE_FLAG_OPTIONS,
} from '../lib/cli-locale.ts';
import {
  type RunPromptCatalogWebUIOptionsWithoutSource,
  runPromptCatalogWebUI,
} from '../lib/prompt-web-ui.ts';

export default class PromptsTest extends Command {
  static override hidden = true;

  static override args = {
    file: Args.string({ description: 'file to read', required: false }),
  };
  static override description =
    'Demo: declarative `prompts` catalog + `initialValues` + `yesInitialValues` / per-block `yesInitialValue`; runner is `runPromptCatalog`.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -t Ada --boolean',
    '<%= config.bin %> <%= command.id %> -y',
    '<%= config.bin %> <%= command.id %> -y ./README.md -p secret',
    '<%= config.bin %> <%= command.id %> --ui',
  ];
  static override flags = {
    ui: Flags.boolean({
      description:
        'Open a browser to configure the same parameters in a form (served only on 127.0.0.1). Uses `runPromptCatalogWebUI` with this command’s `prompts` catalog. Submit to continue; then `runPromptCatalog` runs in this terminal with the submitted preset.',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Accept defaults only (no prompts); uses `yesInitialValues` merged over `initialValues`, then per-block `yesInitialValue`. Same as non-TTY.',
      default: false,
    }),
    locale: Flags.string({
      description: CLI_LOCALE_FLAG_DESCRIPTION,
      options: CLI_LOCALE_FLAG_OPTIONS,
    }),
    file: Flags.string({
      char: 'f',
      description: 'Merged into initialValues.file (default for the text prompt when set)',
    }),
    text: Flags.string({
      char: 't',
      description: 'Merged into initialValues.text (default for the text prompt when set)',
    }),
    boolean: Flags.boolean({
      char: 'b',
      description: 'Merged into initialValues.boolean (default for confirm when set)',
      allowNo: true,
    }),
    select: Flags.string({
      char: 's',
      description: 'Merged into initialValues.select (default for select when set)',
      options: ['option1', 'option2', 'option3'],
    }),
    password: Flags.string({
      char: 'p',
      description: 'Merged into initialValues.password (required when -y / non-TTY if password is required)',
    }),
    integer: Flags.integer({
      char: 'i',
      description: 'Merged into initialValues.integer (default for integer prompt when set)',
    }),
  };

  static prompts: PromptsCatalog = {
    intro1: {
      type: 'intro',
      title: 'Welcome to the prompts test!',
    },
    file: {
      type: 'text',
      message: 'File to read',
      initialValue: '',
      placeholder: 'Enter the file to read',
      yesInitialValue: 'package.json',
      required: true,
    },
    text: {
      type: 'text',
      message: 'What is your name?',
      initialValue: 'world',
      placeholder: 'Your name',
      /**
       * Example: async validation (Clack re-prompts; Web UI returns 400 on submit with this message).
       */
      validate: async (v) => {
        if (String(v).trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        return undefined;
      },
    },
    boolean: {
      type: 'boolean',
      message: 'Do you want to continue?',
      initialValue: true,
    },
    select: {
      type: 'select',
      message: 'Select an option',
      options: ['option1', 'option2', 'option3'],
      initialValue: 'option1',
      yesInitialValue: 'option2',
    },
    onOption1: {
      type: 'run',
      when: (values) => values.select === 'option1',
      run: (values) => {
        p.log.info(`run block: select is option1 (current keys: ${Object.keys(values).join(', ')})`);
      },
    },
    password: {
      type: 'password',
      message: 'Enter your password',
      yesInitialValue: 'demo-secret',
      required: true,
    },
    integer: {
      type: 'integer',
      message: 'Enter an integer',
      initialValue: 0,
      placeholder: 'e.g. 42',
      hidden: (values) => values.select === 'option1',
    },
    outro1: {
      type: 'outro',
      message: 'Done.',
    },
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PromptsTest);
    applyCliLocale(flags.locale);

    let presetValues = this.buildPresetValuesFromParsed(args, flags);
    if (flags.ui) {
      presetValues = await runPromptCatalogWebUI(PromptsTest.prompts, {
        values: presetValues,
        pageTitle: 'nb prompts-test — UI',
        documentHeading: 'nb prompts-test',
        onServerStart: ({ host, port, url }) => {
          this.log(
            `Local Web UI ready — ${url} (listening on ${host}:${port}). Submit the form in the browser to continue.`,
          );
        },
        onOpenBrowserError: (url, err) => {
          this.log(`Open this URL in a browser: ${url} (${err instanceof Error ? err.message : String(err)})`);
        },
      } satisfies RunPromptCatalogWebUIOptionsWithoutSource);
    }

    const results = await runPromptCatalog(PromptsTest.prompts, {
      initialValues: {},
      values: presetValues,
      yes: flags.yes || flags.ui,
    });

    this.log(JSON.stringify(results, null, 2));
  }

  /** Map oclif parse result into `values` presets: each key here skips that prompt (no Clack UI). */
  private buildPresetValuesFromParsed(
    args: { file?: string },
    flags: {
      locale?: string;
      file?: string;
      text?: string;
      boolean?: boolean;
      select?: string;
      password?: string;
      integer?: number;
    },
  ): PromptInitialValues {
    const preset: PromptInitialValues = {};

    const file = args.file ?? flags.file;
    if (file !== undefined) {
      preset.file = file;
    }

    if (flags.text !== undefined) {
      preset.text = flags.text;
    }

    if (flags.boolean !== undefined) {
      preset.boolean = flags.boolean;
    }

    if (flags.select !== undefined) {
      preset.select = flags.select;
    }

    if (flags.password !== undefined) {
      preset.password = flags.password;
    }

    if (flags.integer !== undefined) {
      preset.integer = flags.integer;
    }

    return preset;
  }
}
