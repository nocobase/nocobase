import {
  defineAppConfig,
  envBoolean,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { ReleasesPluginConfig } from '@nocobase/app-plugin-releases/server';

/**
 * Release management (`@nocobase/app-plugin-releases`): release archives, deployment logs, and the local App Host that
 * the "Preview" environment deploys into. Studio's own listener forwards every request outside its base path to the
 * Host (`server/standalone.ts`), so a preview App answers at `<publicOrigin>/<appId>/`; in production give previews
 * their own origin (`studio.releases.previewPublicUrl`).
 *
 * The Host child receives only the minimal environment (`env.allow` empty: `PATH`, `HOME`, locale and Node settings),
 * so code under preview cannot read this application's secrets from its environment. `launchPrefix` starts it through
 * another command, such as `['setpriv', '--reuid=studio-preview', '--regid=studio-preview', '--init-groups', '--']`, so
 * it also runs as a user who cannot read `config.yml`.
 *
 * `docker` is the second App Host, for environments whose run mode is Docker: it runs each App's release image in its
 * own container and no App code itself, so the Docker connection never sits in a process that runs code under
 * preview. It is off until `releases.docker.enabled` is set in `config.yml`; its listener (`host`, `port`; a free port when
 * omitted) is the Docker Apps' ingress, which Studio's own listener does not forward to: give it a fixed port, put a proxy
 * in front and give the Docker environments a public URL pattern that reaches it.
 *
 * `RELEASES_HOST_ENABLED=false` turns the local App Host off: a preview of Studio itself runs inside another Studio's
 * Host, so the Preview environment Studio creates sets it for every preview there.
 */
const releases: AppConfigFactory<ReleasesPluginConfig> = defineAppConfig({
  defaults: ({ paths, env }) => ({
    artifact: {
      driver: 'fs',
      location: paths.storage('releases/artifacts'),
      visibility: 'private',
    },
    dataDir: paths.storage('releases/data'),
    logging: {
      deployments: {
        enabled: true,
        retentionDays: 30,
        maxFileSizeMB: 50,
        maxTotalSizeMB: 1024,
      },
      apps: {
        level: 'info',
        file: {
          enabled: true,
          name: 'app',
          retentionDays: 7,
          maxFileSizeMB: 10,
          maxTotalSizeMB: 500,
        },
        console: { enabled: true, pretty: env.NODE_ENV !== 'production' },
      },
    },
    host: {
      enabled: true,
      driver: env.NODE_ENV === 'production' ? 'node' : 'auto',
      appRevisionsDir: paths.storage('releases/host/revisions'),
      appVolumesDir: paths.storage('releases/host/volumes'),
      configPath: paths.storage('releases/host/runtime/config.yml'),
      childOutputDir: paths.storage('releases/host/logs/child-output'),
      logging: {
        file: { directory: paths.storage('releases/host/logs/host') },
      },
      host: '127.0.0.1',
      startTimeoutMs: 30000,
      ipcTimeoutMs: 300000,
      shutdownTimeoutMs: 30000,
      autoRestart: true,
      maxAutomaticRestarts: 5,
      automaticRestartWindowMs: 60000,
      automaticRestartBaseDelayMs: 250,
      env: { allow: [] },
      restartAfterChurn: 20,
    },
    docker: {
      enabled: false,
      driver: env.NODE_ENV === 'production' ? 'node' : 'auto',
      appRevisionsDir: paths.storage('releases/docker/revisions'),
      appVolumesDir: paths.storage('releases/docker/volumes'),
      configPath: paths.storage('releases/docker/runtime/config.yml'),
      childOutputDir: paths.storage('releases/docker/logs/child-output'),
      logging: {
        file: { directory: paths.storage('releases/docker/logs/host') },
      },
      host: '127.0.0.1',
    },
  }),
  env: {
    RELEASES_HOST_ENABLED: envBoolean('host.enabled', {
      description:
        'Whether this application runs its own App Host for the in-process environments; a preview of it sets false.',
    }),
  },
});

export default releases;
