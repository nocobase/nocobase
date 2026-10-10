import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';

import { servedVersions } from '../agents/served-versions.js';

/**
 * Agents (`@nocobase/app-plugin-agents`). `app` is how runners name Studio. `cli` is the command line agents talk to
 * Studio with: `nb-studio` (declared under `nocobase.cli` in `package.json` and packaged by `pnpm nocobase cli build`), which
 * runners install from the tarball Studio serves for their platform and which finds the run's token in
 * `.nb-studio/run.json`. `vectors` is where the knowledge base's vector index lives, apart from the
 * application's database: sqlite-vec in `storage/vectors.sqlite` by default, which needs nothing to run but serves one
 * instance. Several instances share pgvector in a PostgreSQL of its own: `agents.vectors` in `config.yml` with
 * `store: pgvector` and `url` (or `host`, `port`, `database`, `user`, `password`, `ssl`). `store: false` turns
 * semantic search off; knowledge is then searched by keywords only. Changing the store builds the index again there in
 * the background. `dist.dir` is where the `nb-studio` and `nocobase-runner` tarballs are served from: the image bakes
 * them into `/app/runners/dist` and sets `NB_STUDIO_RUNNERS_DIST` to it, which counts only once it holds a channel. An
 * image built without them, local development, and a `config.yml` naming its own `agents.dist.dir` keep the plugin's
 * default `storage/runners/dist` or that directory. `dist.npm` pins the runner and `nb-studio` to the exact versions
 * this build ships with (`server/agents/served-versions.ts`): a product that directory has no tarball of is named on
 * npm instead, to the runners, install scripts and CLIs that understand that answer.
 */
const agents: AppConfigFactory<AgentsConfig> = defineAppConfig(
  ({ paths, env }) => ({
    app: { id: 'nb-studio', name: 'NocoBase Studio' },
    dist: {
      ...(env.NB_STUDIO_RUNNERS_DIST &&
      existsSync(path.join(env.NB_STUDIO_RUNNERS_DIST, 'stable'))
        ? { dir: env.NB_STUDIO_RUNNERS_DIST }
        : {}),
      npm: servedVersions(),
    },
    cli: {
      name: 'nb-studio',
      package: { kind: 'served' },
      credentialFile: '.nb-studio/run.json',
    },
    vectors: {
      store: 'sqlite-vec',
      path: paths.storage('vectors.sqlite'),
    },
  }),
);

export default agents;
