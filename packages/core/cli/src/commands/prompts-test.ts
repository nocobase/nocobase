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
  ];
  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description:
        'Accept defaults only (no prompts); uses `yesInitialValues` merged over `initialValues`, then per-block `yesInitialValue`. Same as non-TTY.',
      default: false,
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

    const initialValues = this.buildInitialValuesFromParsed(args, flags);

    const results = await runPromptCatalog(PromptsTest.prompts, {
      initialValues,
      yes: flags.yes,
    });

    this.log(JSON.stringify(results, null, 2));
  }

  /** Example: map oclif parse result into `initialValues` for `runPromptCatalog`. */
  private buildInitialValuesFromParsed(
    args: { file?: string },
    flags: {
      text?: string;
      boolean?: boolean;
      select?: string;
      password?: string;
      integer?: number;
    },
  ): PromptInitialValues {
    const initialValues: PromptInitialValues = {};

    if (args.file !== undefined) {
      initialValues.file = args.file;
    }

    if (flags.text !== undefined) {
      initialValues.text = flags.text;
    }

    if (flags.boolean !== undefined) {
      initialValues.boolean = flags.boolean;
    }

    if (flags.select !== undefined) {
      initialValues.select = flags.select;
    }

    if (flags.password !== undefined) {
      initialValues.password = flags.password;
    }

    if (flags.integer !== undefined) {
      initialValues.integer = flags.integer;
    }

    return initialValues;
  }
}
