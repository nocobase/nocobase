/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, Application, CollectionActionGroupModel } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { ALLOWED_MAP_ACTION_MODELS, MapActionGroupModel } from '../models/MapActionGroupModel';
import { getMapFieldComponentProps, getMapFieldMapType } from '../models/MapBlockComponent';
import { MAP_GEOMETRY_FIELD_TYPES, applyMapBlockFieldParams, getMapBlockRuntimeProps } from '../models/MapBlockModel';
import { formatMapDisplayValue } from '../models/fieldModels/DisplayMapFieldModel';
import PluginMapClient from '../plugin';

describe('PluginMapClient v2 registration', () => {
  it('registers map geometry field interfaces for data source manager', async () => {
    const app = new Application({
      plugins: [PluginMapClient],
    });

    await app.load();

    const manager = app.dataSourceManager.collectionFieldInterfaceManager;
    const interfaces = manager.getFieldInterfaces().map((fieldInterface) => fieldInterface.name);

    expect(interfaces).toContain('point');
    expect(interfaces).toContain('lineString');
    expect(interfaces).toContain('circle');
    expect(interfaces).toContain('polygon');
    expect(manager.getFieldInterfaceGroup('map')?.label).toContain('Map-based geometry');
    expect(manager.getFieldInterfaceGroup('map')?.label).toContain('@nocobase/plugin-map');
    expect(manager.getFieldInterfaceGroup('map')?.order).toBe(300);
    expect(manager.getFieldInterface('point')?.default?.type).toBe('point');
    expect(manager.getFieldInterface('point')?.configure?.items?.[0]?.name).toBe('uiSchema.x-component-props.mapType');
  });

  it('registers map models through lazy loaders', async () => {
    const app = new Application({
      plugins: [PluginMapClient],
    });

    await app.load();

    expect((app.flowEngine as any)._modelLoaders.has('MapBlockModel')).toBe(true);
    expect((app.flowEngine as any)._modelLoaders.has('MapActionGroupModel')).toBe(true);
    expect((app.flowEngine as any)._modelLoaders.has('PointFieldModel')).toBe(true);
    expect(app.flowEngine.getModelClass('MapBlockModel')).toBeUndefined();

    await app.flowEngine.resolveModelTree({ use: 'MapBlockModel' });

    expect(app.flowEngine.getModelClass('MapBlockModel')).toBeDefined();
  });

  it('keeps map block field params serializable when creating a block', () => {
    const props: Record<string, any> = {};
    const circularField: any = { name: 'location' };
    circularField.collectionManager = { dataSource: { collectionManager: circularField.collectionManager } };

    applyMapBlockFieldParams(
      {
        setProps(key, value) {
          props[key] = value;
        },
      },
      {
        mapField: ['address', 'location'],
        marker: 'title',
        mapFieldCollectionField: circularField,
      },
    );

    expect(props).toEqual({
      mapField: ['address', 'location'],
      marker: 'title',
    });
    expect(() => JSON.stringify(props)).not.toThrow();
  });

  it('resolves associated map fields from persisted field paths at render time', () => {
    const locationField = {
      name: 'location',
      interface: 'point',
      type: 'json',
      getComponentProps: () => ({}),
    };
    const addressField = {
      name: 'address',
      interface: 'm2o',
    };
    const titleField = { name: 'title' };
    const model = {
      props: {
        mapField: ['address', 'location'],
        marker: 'title',
      },
      collection: {
        getField: (name) => (name === 'title' ? titleField : undefined),
        getFieldByPath: (path) => {
          if (path === 'address') {
            return addressField;
          }
          if (path === 'address.location') {
            return locationField;
          }
        },
      },
    } as any;

    expect(getMapBlockRuntimeProps(model)).toEqual({
      mapField: ['address', 'location'],
      marker: 'title',
      mapFieldCollectionField: locationField,
      markerFieldCollectionField: titleField,
      associationCollectionField: addressField,
    });
  });

  it('defaults map block rendering to AMap when field component props omit mapType', () => {
    expect(getMapFieldMapType({ getComponentProps: () => ({}) })).toBe('amap');
    expect(getMapFieldMapType({ getComponentProps: () => ({ mapType: 'google' }) })).toBe('google');
    expect(getMapFieldComponentProps({ uiSchema: { 'x-component-props': { mapType: 'amap' } } })).toEqual({
      mapType: 'amap',
    });
  });

  it('includes circle fields in map block field candidates', () => {
    expect(MAP_GEOMETRY_FIELD_TYPES).toEqual(['point', 'lineString', 'polygon', 'circle']);
  });

  it('limits map block toolbar actions to supported action models', () => {
    expect(ALLOWED_MAP_ACTION_MODELS).toEqual([
      'FilterActionModel',
      'AddNewActionModel',
      'PopupCollectionActionModel',
      'LinkActionModel',
      'RefreshActionModel',
      'CustomRequestActionModel',
      'AIEmployeeActionModel',
      'JSItemActionModel',
      'JSCollectionActionModel',
    ]);
  });

  it('uses optional collection action registrations without importing the owning plugin', async () => {
    class AIEmployeeActionModel extends ActionModel {
      static scene = ActionSceneEnum.all;
    }

    AIEmployeeActionModel.define({
      label: 'AI employees',
    });

    const previousModel = CollectionActionGroupModel.currentModels.get('AIEmployeeActionModel');
    CollectionActionGroupModel.registerActionModels({ AIEmployeeActionModel });

    try {
      const engine = new FlowEngine();
      const items = await MapActionGroupModel.defineChildren({ engine } as any);

      expect(items.some((item: any) => item.useModel === 'AIEmployeeActionModel')).toBe(true);
    } finally {
      if (previousModel) {
        CollectionActionGroupModel.registerActionModels({ AIEmployeeActionModel: previousModel });
      } else {
        CollectionActionGroupModel.currentModels.delete('AIEmployeeActionModel');
      }
    }
  });

  it('formats map display values consistently with v1 read pretty text', () => {
    expect(formatMapDisplayValue([120, 30])).toBe('120,30');
    expect(
      formatMapDisplayValue([
        [120, 30],
        [121, 31],
      ]),
    ).toBe('(120,30),(121,31)');
    expect(formatMapDisplayValue('120, 30')).toBeUndefined();
  });
});
