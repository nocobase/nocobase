/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { generateFlowModelRdFromToken } from '@nocobase/utils/client';
import { describe, expect, it } from 'vitest';
import { ChartResource } from '../../resources/ChartResource';
import { ChartBlockModel } from '../ChartBlockModel';

class TestChartBlockModel extends ChartBlockModel {
  override async onInit() {}
}

function createModel() {
  const payload = Buffer.from(JSON.stringify({ userId: 1, signInTime: 'chart-session' })).toString('base64url');
  const token = `test.${payload}.sig`;
  const engine = new FlowEngine();
  engine.context.defineProperty('api', { value: { auth: { token } } });
  engine.context.defineProperty('view', {
    value: {
      inputArgs: {
        collectionName: 'orders',
        dataSourceKey: 'main',
        filterByTk: 7,
      },
    },
  });
  engine.context.defineProperty('popup', {
    value: {},
    meta: async () => ({
      type: 'object',
      title: 'Popup',
      buildVariablesParams: () => ({
        record: {
          collection: 'customers',
          dataSourceKey: 'main',
          filterByTk: 9,
        },
      }),
    }),
  });
  engine.registerModels({ TestChartBlockModel });
  const model = engine.createModel<TestChartBlockModel>({ uid: 'chart-model', use: 'TestChartBlockModel' });
  return { model, token };
}

describe('ChartBlockModel variable resolution request', () => {
  it('binds builder queries to the chart model and collects real Record descriptors', async () => {
    const { model, token } = createModel();
    const request = await model.buildQueryRequest({
      mode: 'builder',
      filter: {
        ownerId: '{{ ctx.user.id }}',
        popupId: '{{ ctx.popup.record.id }}',
        unknownId: '{{ ctx.chart.record.id }}',
        viewId: '{{ ctx.view.record.id }}',
      },
    });

    expect(request.rd).toBe(generateFlowModelRdFromToken(model.uid, token));
    expect(request.contextParams).toEqual({
      'popup.record': {
        collection: 'customers',
        dataSourceKey: 'main',
        filterByTk: 9,
      },
      'view.record': {
        collection: 'orders',
        dataSourceKey: 'main',
        filterByTk: 7,
      },
    });
    expect(request.contextParams).not.toHaveProperty('chart.record');
  });

  it('leaves SQL queries unchanged', async () => {
    const { model } = createModel();
    const query = { mode: 'sql', sql: 'select 1' };

    expect(await model.buildQueryRequest(query)).toBe(query);
  });

  it('passes rd and contextParams through the Chart resource request', () => {
    const engine = new FlowEngine();
    const resource = engine.context.createResource(ChartResource);
    const contextParams = {
      'view.record': { collection: 'orders', dataSourceKey: 'main', filterByTk: 7 },
    };

    resource.setQueryParams({
      collectionPath: ['main', 'orders'],
      contextParams,
      measures: [{ field: ['id'] }],
      mode: 'builder',
      rd: 'session-bound-rd',
    });

    expect(resource.getRequestOptions().data).toMatchObject({ contextParams, rd: 'session-bound-rd' });
  });
});
