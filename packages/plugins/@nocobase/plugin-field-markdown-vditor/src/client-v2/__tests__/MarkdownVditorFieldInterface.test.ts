/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { MarkdownVditor } from '../components';
import { defaultToolbar, MarkdownVditorFieldInterface } from '../interface';
import PluginFieldMarkdownVditorClient from '../plugin';

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('MarkdownVditorFieldInterface', () => {
  it('registers markdown vditor components, field interface, context helpers and model loaders', async () => {
    const addComponents = vi.fn();
    const addFieldInterfaces = vi.fn();
    const defineProperty = vi.fn();
    const registerModelLoaders = vi.fn();
    const requireFn = vi.fn();
    requireFn.config = vi.fn();
    const plugin = Object.create(PluginFieldMarkdownVditorClient.prototype) as PluginFieldMarkdownVditorClient & {
      app: {
        addComponents: typeof addComponents;
        addFieldInterfaces: typeof addFieldInterfaces;
        getPublicPath: () => string;
        requirejs: {
          require: typeof requireFn;
        };
        flowEngine: {
          context: {
            defineProperty: typeof defineProperty;
          };
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.dependencyLoaded = false;
    plugin.app = {
      addComponents,
      addFieldInterfaces,
      getPublicPath: () => '/v2/',
      requirejs: {
        require: requireFn,
      },
      flowEngine: {
        context: {
          defineProperty,
        },
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(addComponents).toHaveBeenCalledWith({ MarkdownVditor });
    expect(addFieldInterfaces).toHaveBeenCalledWith([MarkdownVditorFieldInterface]);
    expect(defineProperty).toHaveBeenCalledWith('markdownVditor', {
      get: expect.any(Function),
    });
    expect(defineProperty).toHaveBeenCalledWith('markdownVditorDependencies', {
      get: expect.any(Function),
    });
    expect(defineProperty.mock.calls[0][1].get()).toBe(plugin.runtime);
    expect(defineProperty.mock.calls[1][1].get()).toEqual({
      cdn: plugin.runtime.getCDN(),
    });
    expect(plugin.getCDN()).toBe(plugin.runtime.getCDN());
    const initSpy = vi.spyOn(plugin.runtime, 'initVditorDependency').mockImplementation(() => {});
    plugin.initVditorDependency();
    expect(initSpy).toHaveBeenCalled();

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.VditorFieldModel.loader()).resolves.toHaveProperty('VditorFieldModel');
    await expect(loaders.DisplayVditorFieldModel.loader()).resolves.toHaveProperty('DisplayVditorFieldModel');
  });

  it('defines the markdown vditor field schema and configuration', () => {
    const fieldInterface = new MarkdownVditorFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'vditor',
      type: 'object',
      group: 'media',
      order: 1,
      title: 'Markdown(Vditor)',
      sortable: false,
      default: {
        interface: 'vditor',
        type: 'text',
        length: 'long',
        uiSchema: {
          type: 'string',
          'x-component': 'Input.TextArea',
        },
      },
      availableTypes: ['text', 'json', 'string'],
      filterable: {
        operators: 'bigField',
      },
      titleUsable: true,
    });
    expect(defaultToolbar).toEqual(
      expect.arrayContaining(['headings', 'bold', 'italic', 'link', 'upload', 'fullscreen']),
    );
    expect(fieldInterface.configure.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'uiSchema.x-component-props.fileCollection',
          component: 'Select',
          defaultValue: 'attachments',
          schema: {
            enum: '{{fileCollections}}',
          },
        }),
        expect.objectContaining({
          name: 'uiSchema.x-component-props.toolbar',
          component: 'Select',
          componentProps: {
            mode: 'multiple',
          },
          defaultValue: defaultToolbar,
        }),
      ]),
    );
  });
});
