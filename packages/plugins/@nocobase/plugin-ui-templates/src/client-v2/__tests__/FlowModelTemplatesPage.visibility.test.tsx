/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { createMockClient } from '@nocobase/client-v2';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowModelTemplatesPage } from '../components/FlowModelTemplatesPage';

afterEach(cleanup);

describe('FlowModelTemplatesPage collection visibility', () => {
  it.each(['block', 'popup'] as const)(
    'keeps the %s template collection out of block choices after deletion',
    async (templateType) => {
      const app = createMockClient();
      app.apiMock.onGet('app:getInfo').reply(200, { data: { version: 'test' } });
      const main = app.dataSourceManager.getDataSource('main');
      main.addCollection({ name: 'posts', fields: [{ name: 'title', type: 'string', interface: 'input' }] });
      const list = vi
        .fn()
        .mockResolvedValue({ data: { rows: [{ uid: 'tpl-1', name: 'Template A', usageCount: 0 }], count: 1 } });
      const destroy = vi.fn().mockResolvedValue(undefined);
      app.flowEngine.context.defineProperty('api', {
        value: { resource: () => ({ list, destroy }) },
      });
      const { unmount } = render(
        <App>
          <FlowEngineProvider engine={app.flowEngine}>
            <FlowModelTemplatesPage templateType={templateType} />
          </FlowEngineProvider>
        </App>,
      );
      expect(await screen.findByText('Template A')).toBeTruthy();
      const assertHidden = () => {
        expect(main.getCollection('flowModelTemplates')?.getField('name')).toBeDefined();
        expect(main.getCollections().map((collection) => collection.name)).toContain('posts');
        expect(main.getCollections().map((collection) => collection.name)).not.toContain('flowModelTemplates');
      };
      assertHidden();
      list.mockResolvedValue({ data: { rows: [], count: 0 } });
      fireEvent.click(screen.getByRole('button', { name: /Delete$/ }));
      fireEvent.click(await screen.findByRole('button', { name: /OK/ }));
      await waitFor(() => expect(destroy).toHaveBeenCalledWith({ filterByTk: 'tpl-1' }));
      await waitFor(() => expect(screen.queryByText('Template A')).toBeNull());
      assertHidden();
      unmount();
      expect(main.getCollection('flowModelTemplates')).toBeUndefined();
      expect(main.getCollection('posts')).toBeDefined();
    },
  );
});
