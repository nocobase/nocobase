/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { TableColumnModel } from '../TableColumnModel';

describe('TableColumnModel sorter settings', () => {
  it('hides sortable setting for association fields', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-association-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => true,
      },
    });

    expect(hidden).toBe(true);
  });

  it('keeps sortable setting visible for sortable non-association fields', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-basic-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => false,
      },
    });

    expect(hidden).toBeFalsy();
  });

  it('hides sortable setting for relation path columns added from association groups', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-relation-path-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        associationPathName: 'department',
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => false,
      },
    });

    expect(hidden).toBe(true);
  });
});
