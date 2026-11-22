import { z } from 'zod';

import type {
  FoundationLocalizedText,
  FoundationPluginView,
  FoundationPluginsMeta,
} from '../../shared/plugins.js';

export const PluginsQuery = z.strictObject({
  client: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .meta({
      description:
        'A package the browser application registers; repeat it for each. Without it, a plugin with a page counts as registered in the browser exactly when it is on the server.',
    }),
});

const LocalizedText: z.ZodType<FoundationLocalizedText> = z
  .union([z.string(), z.record(z.string(), z.string())])
  .meta({
    ref: 'FoundationLocalizedText',
    description: 'One text, or one per locale such as `en-US` and `zh-CN`.',
  });

export const PluginSchema: z.ZodType<FoundationPluginView> = z
  .object({
    packageName: z.string(),
    name: z.string().meta({
      description:
        'The name `pnpm nocobase plugin` commands take: the short name of an official plugin, the package name otherwise.',
    }),
    version: z
      .string()
      .optional()
      .meta({ description: 'The installed version.' }),
    title: LocalizedText.optional(),
    description: LocalizedText.optional(),
    docs: LocalizedText.optional(),
    dependencyField: z
      .enum(['dependencies', 'devDependencies'])
      .optional()
      .meta({
        description: "Where the application's package.json declares it.",
      }),
    state: z
      .enum([
        'absent',
        'preinstalled',
        'registered',
        'unregistered',
        'inconsistent',
      ])
      .meta({
        description: 'The state `pnpm nocobase plugin inspect` reports.',
      }),
    skillsOnly: z.boolean().meta({
      description:
        'The plugin ships only Agent Skills, so declaring it in dependencies enables it.',
    }),
    issues: z
      .array(
        z.enum([
          'PLUGIN_NOT_INSTALLED',
          'DEPENDENCY_MISSING',
          'REGISTERED_DEV_DEPENDENCY',
          'PARTIALLY_REGISTERED',
          'CLIENT_ENTRY_UNEXPECTED',
          'SERVER_ENTRY_UNEXPECTED',
          'CLI_ENTRY_UNEXPECTED',
        ]),
      )
      .meta({ description: 'Registration problems, as `plugin inspect` codes.' }),
    requires: z.array(z.string()).meta({
      description: 'Application plugins this one builds on.',
    }),
    missingRequires: z.array(z.string()).meta({
      description: 'Those of `requires` the application has not enabled.',
    }),
  })
  .meta({ ref: 'FoundationPlugin' });

export const PluginsMetaSchema: z.ZodType<FoundationPluginsMeta> = z.object({
  deployed: z.boolean().meta({
    description:
      'The application runs from a build, which installs only dependencies.',
  }),
});
