/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const path = require('path');
const { PluginGenerator, resolveTargetRoot } = require('../plugin-generator');

describe('cli-v1 plugin generator', () => {
  test('uses cwd as baseDir when baseDir is not provided', () => {
    const cwd = path.resolve('/tmp/nocobase-plugin-generator');
    const generator = new PluginGenerator({
      cwd,
      args: {},
      context: {
        name: '@nocobase/plugin-demo',
      },
    });

    expect(generator.baseDir).toBe(cwd);
  });

  test('prefers explicit baseDir over cwd', () => {
    const baseDir = path.resolve('/tmp/nocobase-plugin-generator-base');
    const cwd = path.resolve('/tmp/nocobase-plugin-generator-cwd');
    const generator = new PluginGenerator({
      baseDir,
      cwd,
      args: {},
      context: {
        name: '@nocobase/plugin-demo',
      },
    });

    expect(generator.baseDir).toBe(baseDir);
  });

  test('resolveTargetRoot falls back to NB_PLUGIN_TARGET_ROOT', () => {
    const originalTargetRoot = process.env.NB_PLUGIN_TARGET_ROOT;
    process.env.NB_PLUGIN_TARGET_ROOT = '/tmp/app/plugins';

    try {
      expect(resolveTargetRoot()).toBe('/tmp/app/plugins');
      expect(resolveTargetRoot('/tmp/explicit')).toBe('/tmp/explicit');
    } finally {
      if (originalTargetRoot === undefined) {
        delete process.env.NB_PLUGIN_TARGET_ROOT;
      } else {
        process.env.NB_PLUGIN_TARGET_ROOT = originalTargetRoot;
      }
    }
  });
});
