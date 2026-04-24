/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
import { type RunPromptCatalogWebUIStage, runPromptCatalogWebUI } from '../lib/prompt-web-ui.ts';
import PromptsTest from './prompts-test.ts';

function buildWebUiStagesFromTestPrompts(
  c: (typeof PromptsTest)['prompts'],
): RunPromptCatalogWebUIStage[] {
  return [
    {
      sectionTitle: 'Step 1',
      sectionDescription: 'intro, file, name, and boolean',
      catalog: {
        intro1: c.intro1,
        file: c.file,
        text: c.text,
        boolean: c.boolean,
      } satisfies PromptsCatalog,
    },
    {
      sectionTitle: 'Step 2',
      sectionDescription: 'select, then the option1 run hook',
      catalog: {
        select: c.select,
        onOption1: c.onOption1,
      } satisfies PromptsCatalog,
    },
    {
      sectionTitle: 'Step 3',
      sectionDescription: 'password, integer, and outro',
      catalog: {
        password: c.password,
        integer: c.integer,
        outro1: c.outro1,
      } satisfies PromptsCatalog,
    },
  ];
}

/**
 * With `--ui`: `runPromptCatalogWebUI` using `stages` + `sectionTitle`, then
 * `runPromptCatalog` on the same catalog as `prompts-test`. Without `--ui`, same terminal behavior
 * as `prompts-test` (handy for comparing).
 */
export default class PromptsStages extends Command {
  static override hidden = true;

  static override args = {
    file: Args.string({ description: 'file to read', required: false }),
  };

  static override description =
    'Demo: with --ui, `runPromptCatalogWebUI` with `stages` (section headings in the form); without --ui, same as `prompts-test`. The submitted preset runs through the same `PromptsTest.prompts` catalog as `prompts-test`.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>  # same terminal flow as `prompts-test`',
    '<%= config.bin %> <%= command.id %> --ui  # `runPromptCatalogWebUI` with `stages` + `sectionTitle`',
    '<%= config.bin %> <%= command.id %> -y ./README.md -p secret --ui',
  ];

  static override flags = {
    ui: Flags.boolean({
      description:
        'Open the localhost form: `runPromptCatalogWebUI` with `stages` and `sectionTitle` (vs `prompts-test --ui`, which uses one `catalog`). Without --ui, behavior matches `prompts-test` (Clack in TTY / presets).',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Accept defaults only in the terminal (no Clack after submit); same semantics as `prompts-test` when used with the submitted or default preset.',
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

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PromptsStages);
    applyCliLocale(flags.locale);

    let presetValues = this.buildPresetValuesFromParsed(args, flags);

    if (flags.ui) {
      presetValues = await runPromptCatalogWebUI({
        stages: buildWebUiStagesFromTestPrompts(PromptsTest.prompts),
        values: presetValues,
        pageTitle: 'nb prompts-stages — Web UI',
        documentHeading: 'nb prompts-stages — `stages` demo',
        onServerStart: ({ host, port, url }) => {
          this.log(
            `Local Web UI (multi-stage) ready — ${url} (listening on ${host}:${port}). Submit the form in the browser to continue.`,
          );
        },
        onOpenBrowserError: (url, err) => {
          this.log(`Open this URL in a browser: ${url} (${err instanceof Error ? err.message : String(err)})`);
        },
      });
    }

    const results = await runPromptCatalog(PromptsTest.prompts, {
      initialValues: {},
      values: presetValues,
      yes: flags.yes || flags.ui,
    });

    this.log(JSON.stringify(results, null, 2));
  }

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
