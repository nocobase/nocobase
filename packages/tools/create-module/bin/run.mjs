#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createModule } from '../src/create.mjs';
let json = process.argv.includes('--json');
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      dir: { type: 'string' },
      template: { type: 'string', default: 'minimal' },
      title: { type: 'string' },
      'title-zh': { type: 'string' },
      'dry-run': { type: 'boolean' },
      'no-install': { type: 'boolean' },
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  json = values.json;
  if (values.help) {
    console.log(`Create a NocoBase business module

create-module <name> [--dir <app>] [--template minimal|records]
  --title <text>       Module title (defaults to the name)
  --title-zh <text>    Chinese module title
  --dry-run           Preview files, dependencies and registration without writing
  --no-install        Generate only; print install/register steps
  --json              Machine-readable result

Requires an installed App with the open-source modules Server plugin and a module-compatible CLI.
Both templates run without a commercial plugin. Registered modules initialize with the App.`);
  } else {
    if (positionals.length !== 1)
      throw new Error(
        'Specify exactly one module name. Run create-module --help.',
      );
    const result = await createModule({
      name: positionals[0],
      directory: values.dir,
      template: values.template,
      title: values.title,
      titleZh: values['title-zh'],
      dryRun: values['dry-run'],
      install: !values['no-install'],
    });
    console.log(
      json
        ? JSON.stringify({ ok: true, result }, null, 2)
        : `${result.written ? 'Created' : 'Preview'} ${result.packageName}\n${result.targetDirectory}\n${result.registered ? 'Registered. Restart the App to initialize the module.' : result.nextCommands.map((args) => args.join(' ')).join('\n')}`,
    );
  }
} catch (error) {
  console.error(
    json
      ? JSON.stringify({ ok: false, error: { message: error.message } })
      : error.message,
  );
  process.exitCode = 1;
}
