/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginSettingsPageType } from '@nocobase/client-v2';
import { getSettingsChildren, mergeRoleSnippets, toRoleSnippetsPayload, translateTitle } from '../utils';

describe('permission utils', () => {
  it('normalizes role snippets payloads defensively', () => {
    expect(toRoleSnippetsPayload(null)).toEqual({});
    expect(toRoleSnippetsPayload({ data: 'pm.*' })).toEqual({ data: [] });
    expect(toRoleSnippetsPayload({ data: ['pm.*', '!pm.users'] })).toEqual({ data: ['pm.*', '!pm.users'] });
  });

  it('translates string titles and keeps non-string titles unchanged', () => {
    const t = vi.fn((key: string) => (key === 'Missing title' ? '' : `translated:${key}`));
    const titleNode = { node: true };

    expect(translateTitle('Users', t)).toBe('translated:Users');
    expect(translateTitle('Missing title', t)).toBe('translated:Unnamed');
    expect(translateTitle(titleNode, t)).toBe(titleNode);
  });

  it('merges role snippets without changing other role properties', () => {
    expect(
      mergeRoleSnippets(
        {
          name: 'member',
          title: 'Member',
          default: true,
          snippets: ['!pm.*'],
        },
        ['pm.*'],
      ),
    ).toEqual({
      name: 'member',
      title: 'Member',
      default: true,
      snippets: ['pm.*'],
    });
  });

  it('returns a copied children array for settings nodes', () => {
    const child = { key: 'data-sources', title: 'Data sources' } as PluginSettingsPageType;
    const item = { key: 'data', title: 'Data', children: [child] } as PluginSettingsPageType;
    const children = getSettingsChildren(item);

    children.push({ key: 'collections', title: 'Collections' } as PluginSettingsPageType);

    expect(children).toHaveLength(2);
    expect(item.children).toEqual([child]);
    expect(getSettingsChildren({ key: 'empty', title: 'Empty' } as PluginSettingsPageType)).toEqual([]);
  });
});
