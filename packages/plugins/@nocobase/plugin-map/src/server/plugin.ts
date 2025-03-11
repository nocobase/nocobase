/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import { getConfiguration, setConfiguration } from './actions';
import { CircleField, LineStringField, PointField, PolygonField } from './fields';
import { CircleInterface, LineStringInterface, PointInterface, PolygonInterface } from './interfaces';
import { CircleValueParser, LineStringValueParser, PointValueParser, PolygonValueParser } from './value-parsers';

export class PluginMapServer extends Plugin {
  afterAdd() {}

  beforeLoad() {
    const fields = {
      point: PointField,
      polygon: PolygonField,
      lineString: LineStringField,
      circle: CircleField,
    };
    this.db.registerFieldTypes(fields);
    this.db.registerFieldValueParsers({
      point: PointValueParser,
      polygon: PolygonValueParser,
      lineString: LineStringValueParser,
      circle: CircleValueParser,
    });

    this.db.interfaceManager.registerInterfaceType('point', PointInterface);
    this.db.interfaceManager.registerInterfaceType('polygon', PolygonInterface);
    this.db.interfaceManager.registerInterfaceType('lineString', LineStringInterface);
    this.db.interfaceManager.registerInterfaceType('circle', CircleInterface);
  }

  async load() {
    this.app.resourceManager.define({
      name: 'map-configuration',
      actions: {
        get: getConfiguration,
        set: setConfiguration,
      },
      only: ['get', 'set'],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.configuration`,
      actions: ['map-configuration:set'],
    });

    this.app.acl.allow('map-configuration', 'get', 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMapServer;
