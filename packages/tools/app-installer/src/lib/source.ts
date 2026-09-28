import { statSync } from 'node:fs';
import path from 'node:path';
import { EXIT_INVALID, InstallerError, type Suggestion } from './errors.ts';
import { quoteForShell } from '@nocobase/cli-envelope';
import { installerCommand, installerCommandLine } from './invocation.ts';
import { TEMPLATES, type TemplateDefinition } from './layout.ts';
import { currentNodeMajor, rebuildCommandLine } from './prechecks.ts';
import type { InstallerState } from './state.ts';

/** The template an installation is built from, or `undefined` for one installed from deployment archives. */
export function templateOf(
  state: Pick<InstallerState, 'source'>,
): TemplateDefinition | undefined {
  const { source } = state;
  return source.kind === 'template'
    ? TEMPLATES.find((template) => template.name === source.template)
    : undefined;
}

/** Whether the installed application is a Hub, by what its release manifest says rather than by how it was installed. */
export function isHub(state: Pick<InstallerState, 'templateKind'>): boolean {
  return state.templateKind === 'hub';
}

/** How messages name what is installed: `the Hub`, or `the application`. */
export function subjectOf(state: Pick<InstallerState, 'templateKind'>): string {
  return isHub(state) ? 'the Hub' : 'the application';
}

/**
 * Whether stopping this installation stops other applications too. A Hub hosts applications of its own, which stop
 * with it and have to be rebuilt when its Node major changes; a Hub project deployed from an archive hosts them just
 * as one built from the template does.
 */
export function hostsApplications(
  state: Pick<InstallerState, 'templateKind'>,
): boolean {
  return isHub(state);
}

/** The first letter upper-cased, for a subject at the start of a sentence. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** `--template hub` or `--template hub@1.2.0`: the template, and the version or dist-tag to build, `latest` by default. */
export function parseTemplateSpec(spec: string): {
  template: TemplateDefinition;
  version: string;
} {
  const at = spec.indexOf('@');
  const name = at < 0 ? spec : spec.slice(0, at);
  const version = at < 0 ? 'latest' : spec.slice(at + 1);
  const template = TEMPLATES.find((entry) => entry.name === name);
  if (!template || version === '') {
    throw new InstallerError(
      'INVALID_USAGE',
      `--template takes ${TEMPLATES.map((entry) => entry.name).join(', ')}, optionally with @<version>; got "${spec}".`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'To install an application of your own, build it with `pnpm build --tar` and pass the archive with --archive.',
          },
        ],
      },
    );
  }
  return { template, version };
}

/**
 * The archive `--archive` names, as an absolute path to a file that exists. Only a local path is accepted for now:
 * fetching one would need downloads, credentials and checksums of its own.
 */
export function resolveArchivePath(cwd: string, value: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(value)) {
    throw new InstallerError(
      'INVALID_USAGE',
      `--archive takes a local path; download ${value} to the server first.`,
      { exitCode: EXIT_INVALID },
    );
  }
  const file = path.resolve(cwd, value);
  let isFile = false;
  try {
    isFile = statSync(file).isFile();
  } catch {
    // Reported below.
  }
  if (!isFile) {
    throw new InstallerError(
      'ARCHIVE_NOT_FOUND',
      `${file} is not a file. Pass the deployment archive \`pnpm build --tar\` wrote to storage/exports/dist.tar.gz.`,
      { exitCode: EXIT_INVALID },
    );
  }
  return file;
}

/**
 * How to get a release that runs on this machine's Node: a template installation builds the installed version again
 * here; an archive installation has its archive built again, in the application project, and upgrades to it.
 */
export function nodeRebuildAdvice(
  state: Pick<InstallerState, 'source' | 'registry'>,
  root: string,
): Suggestion[] {
  if (templateOf(state)) {
    return [
      {
        message: `Build the installed version again for Node ${currentNodeMajor()}:`,
        run: installerCommandLine(['upgrade', '--dir', root, '--rebuild'], {
          registry: state.registry,
        }),
      },
    ];
  }
  return [
    {
      message:
        'Build the archive again for this machine, in the application project:',
      run: rebuildCommandLine(),
    },
    // No `run`: a suggestion's command runs as given, and the archive's path is not known here.
    {
      message: `Then copy it here and upgrade to it: ${installerCommand(`upgrade --dir ${quoteForShell(root)} --archive <the copied archive>`, { registry: state.registry })}`,
    },
  ];
}
