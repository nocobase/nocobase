/**
 * The Host driver's form. An environment chooses its run mode (`config.backend`): in process, beside this
 * application's process (no Docker), or Docker (each App in its own container). Neither run mode has settings of its
 * own: Docker uses the local Docker Engine, found as the `docker` CLI finds it, and the built-in container settings;
 * the connection test shows the Engine it found. Besides the run mode, the form asks only for the address pattern
 * Apps are reached at. The run mode is always stored, also when it is the default.
 */
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DriverFormDescription } from './types.js';

const k = (key: string): string => `ui.driverForms.host.${key}`;

export const hostDriverForm: DriverFormDescription = {
  kind: 'host',
  ns: ACCESS_NAMESPACE,
  title: 'drivers.host',
  description: k('description'),
  codec: {
    decode: (config) => ({
      backend:
        typeof config.backend === 'string' ? config.backend : 'in-process',
    }),
    encode(values, config) {
      config.backend = String(values.backend ?? 'in-process');
      // Neither run mode has settings of its own.
      delete config.backendConfig;
    },
  },
  groups: [
    {
      id: 'runtime',
      title: k('runtime'),
      fields: [
        {
          id: 'backend',
          type: 'choice',
          label: k('backend'),
          display: 'radio',
          default: 'in-process',
          variants: true,
          options: [
            {
              value: 'in-process',
              label: k('backendInProcess'),
              hint: k('backendInProcessHint'),
            },
            {
              value: 'docker',
              label: k('backendDocker'),
              hint: k('backendDockerHint'),
            },
          ],
        },
      ],
    },
    {
      id: 'docker-connection',
      title: k('dockerConnection'),
      description: k('dockerConnectionDescription'),
      visibleWhen: { field: 'backend', equals: 'docker' },
      fields: [],
    },
    {
      id: 'access',
      title: k('access'),
      fields: [
        {
          id: 'publicUrl',
          type: 'text',
          path: 'environment.publicUrl',
          label: k('publicUrl'),
          hint: k('publicUrlHint'),
          placeholder: 'https://apps.example.com/{appId}/',
          mono: true,
          wide: true,
        },
      ],
    },
  ],
  summary: (config) =>
    config.backend === 'docker' ? k('backendDocker') : k('backendInProcess'),
  check: {
    details: [
      { key: 'url', label: k('check.url') },
      { key: 'apps', label: k('check.apps') },
      { key: 'endpoint', label: k('check.endpoint') },
      { key: 'version', label: k('check.version') },
      { key: 'platform', label: k('check.platform') },
    ],
    explain(message) {
      const rules: readonly (readonly [RegExp, string])[] = [
        [/is not supported/i, 'unsupported'],
        [/ENOENT|no such file/i, 'socketMissing'],
        [/EACCES|permission denied/i, 'permission'],
        [/ECONNREFUSED|connection refused/i, 'refused'],
        [/ETIMEDOUT|timed? ?out|did not finish within/i, 'timeout'],
      ];
      for (const [pattern, key] of rules)
        if (pattern.test(message)) return { key: k(`check.errors.${key}`) };
      return null;
    },
  },
};
