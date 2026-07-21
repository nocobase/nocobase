/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { JSBlockContext, JSPageContext, JSPageRuntimeFacade } from '@nocobase/light-extension-sdk/client';

describe('JS Page public context', () => {
  it('extends the render context with a settings-aware page facade', () => {
    type Settings = { title: string };
    type RecordType = { id: number; title: string };
    type Values = { title?: string };
    type Collection = { name?: 'orders' };
    type CollectionField = { name?: 'title' };
    type DataSource = { key?: 'main' };

    type PageContext = JSPageContext<Settings, RecordType, Values, Collection, CollectionField, DataSource>;
    type BlockContext = JSBlockContext<Settings, RecordType, Values, Collection, CollectionField, DataSource>;

    expectTypeOf<PageContext>().toMatchTypeOf<BlockContext>();
    expectTypeOf<PageContext['settings']>().toEqualTypeOf<Settings>();
    expectTypeOf<PageContext['record']>().toEqualTypeOf<RecordType | null | undefined>();
    expectTypeOf<PageContext['records']>().toEqualTypeOf<RecordType[] | undefined>();
    expectTypeOf<PageContext['values']>().toEqualTypeOf<Values | undefined>();
    expectTypeOf<PageContext['collection']>().toEqualTypeOf<Collection | undefined>();
    expectTypeOf<PageContext['collectionField']>().toEqualTypeOf<CollectionField | undefined>();
    expectTypeOf<PageContext['dataSource']>().toEqualTypeOf<DataSource | undefined>();
    expectTypeOf<PageContext['element']>().toEqualTypeOf<BlockContext['element']>();
    expectTypeOf<PageContext['render']>().toEqualTypeOf<BlockContext['render']>();
    expectTypeOf<PageContext['page']>().toEqualTypeOf<JSPageRuntimeFacade>();
  });

  it('exposes only the stable page facade fields', () => {
    expectTypeOf<keyof JSPageRuntimeFacade>().toEqualTypeOf<'uid' | 'active' | 'refresh' | 'setDocumentTitle'>();
    expectTypeOf<Extract<keyof JSPageRuntimeFacade, 'route' | 'app' | 'engine'>>().toEqualTypeOf<never>();
  });
});
