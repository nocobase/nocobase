import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { describe, expect, it } from 'vitest';

import { resourceName } from '../../client/projects/settings/model';
import { repositoryFullName } from '../../shared/releases';

const resource = (patch: Partial<ProjectResource>): ProjectResource => ({
  id: 'r1',
  projectId: 'p1',
  type: 'gitRepo',
  url: null,
  defaultRef: null,
  binding: null,
  runnerId: null,
  path: null,
  label: null,
  initPrompt: null,
  position: 0,
  ...patch,
});

describe('a repository’s name', () => {
  it('is owner/repo on its host, else from its clone URL', () => {
    expect(
      repositoryFullName({ repo: 'acme-demo/crm', url: 'https://x/y.git' }),
    ).toBe('acme-demo/crm');
    expect(
      repositoryFullName({ url: 'https://github.com/acme-demo/crm.git' }),
    ).toBe('acme-demo/crm');
    expect(
      repositoryFullName({ url: 'git@github.com:acme-demo/crm.git' }),
    ).toBe('acme-demo/crm');
  });

  it('ignores a repository’s stored short name, while a directory keeps its display name', () => {
    expect(
      resourceName(
        resource({
          label: 'CRM 仓库',
          url: 'https://github.com/acme-demo/crm.git',
          binding: {
            provider: 'github',
            connectionId: 'c1',
            repoId: '1',
            fullName: 'acme-demo/crm',
          },
        }),
      ),
    ).toBe('acme-demo/crm');
    expect(
      resourceName(
        resource({ type: 'directory', path: '/srv/data', label: 'Data' }),
      ),
    ).toBe('Data');
  });
});
