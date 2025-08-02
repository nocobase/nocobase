/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlowSettings } from '../flowSettings';
import { DefaultSettingsIcon } from '../components/settings/wrappers/contextual/DefaultSettingsIcon';
import { DragHandler } from '../components/dnd';
import { FlowModel } from '../models';
import { FlowEngine } from '../flowEngine';

// Mock external dependencies
vi.mock('../components/settings/wrappers/contextual/StepSettingsDialog', () => ({
  openStepSettingsDialog: vi.fn().mockResolvedValue({ success: true, data: 'test-result' }),
}));

vi.mock('../components/settings/wrappers/contextual/DefaultSettingsIcon', () => ({
  DefaultSettingsIcon: vi.fn(() => 'DefaultSettingsIcon'),
}));

vi.mock('../components/dnd', () => ({
  DragHandler: vi.fn(() => 'DragHandler'),
}));

// Mock dynamic imports
vi.mock('@formily/antd-v5', () => ({
  ArrayBase: vi.fn(() => 'ArrayBase'),
  ArrayCards: vi.fn(() => 'ArrayCards'),
  ArrayCollapse: vi.fn(() => 'ArrayCollapse'),
  ArrayItems: vi.fn(() => 'ArrayItems'),
  ArrayTable: vi.fn(() => 'ArrayTable'),
  ArrayTabs: vi.fn(() => 'ArrayTabs'),
  Cascader: vi.fn(() => 'Cascader'),
  Checkbox: vi.fn(() => 'Checkbox'),
  DatePicker: vi.fn(() => 'DatePicker'),
  Editable: vi.fn(() => 'Editable'),
  Form: vi.fn(() => 'Form'),
  FormDialog: vi.fn(() => 'FormDialog'),
  FormDrawer: vi.fn(() => 'FormDrawer'),
  FormButtonGroup: vi.fn(() => 'FormButtonGroup'),
  FormCollapse: vi.fn(() => 'FormCollapse'),
  FormGrid: vi.fn(() => 'FormGrid'),
  FormItem: vi.fn(() => 'FormItem'),
  FormLayout: vi.fn(() => 'FormLayout'),
  FormStep: vi.fn(() => 'FormStep'),
  FormTab: vi.fn(() => 'FormTab'),
  Input: vi.fn(() => 'Input'),
  NumberPicker: vi.fn(() => 'NumberPicker'),
  Password: vi.fn(() => 'Password'),
  PreviewText: vi.fn(() => 'PreviewText'),
  Radio: vi.fn(() => 'Radio'),
  Reset: vi.fn(() => 'Reset'),
  Select: vi.fn(() => 'Select'),
  SelectTable: vi.fn(() => 'SelectTable'),
  Space: vi.fn(() => 'Space'),
  Submit: vi.fn(() => 'Submit'),
  Switch: vi.fn(() => 'Switch'),
  TimePicker: vi.fn(() => 'TimePicker'),
  Transfer: vi.fn(() => 'Transfer'),
  TreeSelect: vi.fn(() => 'TreeSelect'),
  Upload: vi.fn(() => 'Upload'),
}));

vi.mock('antd', () => ({
  Button: vi.fn(() => 'Button'),
}));

describe('FlowSettings', () => {
  let flowSettings: FlowSettings;
  let consoleSpy: any;

  beforeEach(() => {
    flowSettings = new FlowSettings();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Constructor & Initialization', () => {
    test('should initialize with default values', () => {
      expect(flowSettings.enabled).toBe(false);
      expect(flowSettings.components).toEqual({});
      expect(flowSettings.scopes).toEqual({});
      expect(flowSettings.toolbarItems).toHaveLength(1);
    });

    test('should add default toolbar items during construction', () => {
      const toolbarItems = flowSettings.getToolbarItems();

      expect(toolbarItems).toHaveLength(1);

      const settingsItem = toolbarItems.find((item) => item.key === 'settings-menu');

      expect(settingsItem).toBeDefined();
      expect(settingsItem?.component).toBe(DefaultSettingsIcon);
      expect(settingsItem?.sort).toBe(0);
    });

    test('should set up observable properties', () => {
      // Test that enabled property is reactive
      const initialEnabled = flowSettings.enabled;
      flowSettings.enable();
      expect(flowSettings.enabled).not.toBe(initialEnabled);
      expect(flowSettings.enabled).toBe(true);
    });
  });

  describe('Component Registration', () => {
    test('should register single component', () => {
      const TestComponent = () => 'TestComponent';
      flowSettings.registerComponents({ TestComponent });

      expect(flowSettings.components.TestComponent).toBe(TestComponent);
    });

    test('should register multiple components', () => {
      const Component1 = () => 'Component1';
      const Component2 = () => 'Component2';

      flowSettings.registerComponents({ Component1, Component2 });

      expect(flowSettings.components.Component1).toBe(Component1);
      expect(flowSettings.components.Component2).toBe(Component2);
    });

    test('should warn when overwriting existing component', () => {
      const Component1 = () => 'Component1';
      const Component1Updated = () => 'Component1Updated';

      flowSettings.registerComponents({ Component1 });
      flowSettings.registerComponents({ Component1: Component1Updated });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "FlowSettings: Component with name 'Component1' is already registered and will be overwritten.",
      );
      expect(flowSettings.components.Component1).toBe(Component1Updated);
    });

    test('should handle empty components object', () => {
      flowSettings.registerComponents({});
      expect(Object.keys(flowSettings.components)).toHaveLength(0);
    });
  });

  describe('Scope Registration', () => {
    test('should register single scope', () => {
      const testHook = () => 'testHook';
      flowSettings.registerScopes({ testHook });

      expect(flowSettings.scopes.testHook).toBe(testHook);
    });

    test('should register multiple scopes', () => {
      const hook1 = () => 'hook1';
      const variable1 = 'variable1';
      const function1 = () => 'function1';

      flowSettings.registerScopes({ hook1, variable1, function1 });

      expect(flowSettings.scopes.hook1).toBe(hook1);
      expect(flowSettings.scopes.variable1).toBe(variable1);
      expect(flowSettings.scopes.function1).toBe(function1);
    });

    test('should warn when overwriting existing scope', () => {
      const scope1 = () => 'scope1';
      const scope1Updated = () => 'scope1Updated';

      flowSettings.registerScopes({ scope1 });
      flowSettings.registerScopes({ scope1: scope1Updated });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "FlowSettings: Scope with name 'scope1' is already registered and will be overwritten.",
      );
      expect(flowSettings.scopes.scope1).toBe(scope1Updated);
    });

    test('should handle empty scopes object', () => {
      flowSettings.registerScopes({});
      expect(Object.keys(flowSettings.scopes)).toHaveLength(0);
    });
  });

  describe('Enable/Disable Functionality', () => {
    test('should enable flow settings', () => {
      expect(flowSettings.enabled).toBe(false);

      flowSettings.enable();

      expect(flowSettings.enabled).toBe(true);
    });

    test('should disable flow settings', () => {
      flowSettings.enable();
      expect(flowSettings.enabled).toBe(true);

      flowSettings.disable();

      expect(flowSettings.enabled).toBe(false);
    });

    test('should handle multiple enable/disable calls', () => {
      flowSettings.enable();
      flowSettings.enable();
      expect(flowSettings.enabled).toBe(true);

      flowSettings.disable();
      flowSettings.disable();
      expect(flowSettings.enabled).toBe(false);
    });
  });

  describe('Resource Loading', () => {
    test('should load Antd components successfully', async () => {
      await flowSettings.load();

      // Verify all expected components are registered
      const expectedComponents = [
        'Form',
        'FormDialog',
        'FormDrawer',
        'FormItem',
        'FormLayout',
        'FormGrid',
        'FormStep',
        'FormTab',
        'FormCollapse',
        'FormButtonGroup',
        'Input',
        'NumberPicker',
        'Password',
        'Select',
        'SelectTable',
        'Cascader',
        'TreeSelect',
        'Transfer',
        'DatePicker',
        'TimePicker',
        'Checkbox',
        'Radio',
        'Switch',
        'ArrayBase',
        'ArrayCards',
        'ArrayCollapse',
        'ArrayItems',
        'ArrayTable',
        'ArrayTabs',
        'Upload',
        'Space',
        'Editable',
        'PreviewText',
        'Button',
        'Submit',
        'Reset',
      ];

      expectedComponents.forEach((componentName) => {
        expect(flowSettings.components[componentName]).toBeDefined();
      });
    });
  });

  describe('Toolbar Item Management', () => {
    describe('addToolbarItem', () => {
      test('should add new toolbar item', () => {
        const TestIcon = () => 'TestIcon';
        const config = {
          key: 'test-item',
          component: TestIcon,
          sort: 10,
        };

        flowSettings.addToolbarItem(config);

        const items = flowSettings.getToolbarItems();
        const testItem = items.find((item) => item.key === 'test-item');

        expect(testItem).toBeDefined();
        expect(testItem?.component).toBe(TestIcon);
        expect(testItem?.sort).toBe(10);
      });

      test('should replace existing toolbar item with same key', () => {
        const TestIcon1 = () => 'TestIcon1';
        const TestIcon2 = () => 'TestIcon2';

        flowSettings.addToolbarItem({
          key: 'duplicate-key',
          component: TestIcon1,
          sort: 10,
        });

        flowSettings.addToolbarItem({
          key: 'duplicate-key',
          component: TestIcon2,
          sort: 20,
        });

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          "FlowSettings: Toolbar item with key 'duplicate-key' already exists and will be replaced.",
        );

        const items = flowSettings.getToolbarItems();
        const duplicateItems = items.filter((item) => item.key === 'duplicate-key');

        expect(duplicateItems).toHaveLength(1);
        expect(duplicateItems[0].component).toBe(TestIcon2);
        expect(duplicateItems[0].sort).toBe(20);
      });

      test('should sort toolbar items by sort field (descending)', () => {
        const Icon1 = () => 'Icon1';
        const Icon2 = () => 'Icon2';
        const Icon3 = () => 'Icon3';

        flowSettings.addToolbarItem({ key: 'item1', component: Icon1, sort: 10 });
        flowSettings.addToolbarItem({ key: 'item2', component: Icon2, sort: 30 });
        flowSettings.addToolbarItem({ key: 'item3', component: Icon3, sort: 20 });

        const items = flowSettings.getToolbarItems();
        const customItems = items.filter((item) => ['item1', 'item2', 'item3'].includes(item.key));

        expect(customItems[0].key).toBe('item2'); // sort: 30
        expect(customItems[1].key).toBe('item3'); // sort: 20
        expect(customItems[2].key).toBe('item1'); // sort: 10
      });

      test('should handle items with undefined sort', () => {
        const TestIcon = () => 'TestIcon';

        flowSettings.addToolbarItem({
          key: 'no-sort-item',
          component: TestIcon,
        });

        const items = flowSettings.getToolbarItems();
        const item = items.find((item) => item.key === 'no-sort-item');

        expect(item).toBeDefined();
        expect(item?.sort).toBeUndefined();
      });
    });

    describe('addToolbarItems', () => {
      test('should add multiple toolbar items', () => {
        const Icon1 = () => 'Icon1';
        const Icon2 = () => 'Icon2';

        const configs = [
          { key: 'multi-item1', component: Icon1, sort: 10 },
          { key: 'multi-item2', component: Icon2, sort: 20 },
        ];

        flowSettings.addToolbarItems(configs);

        const items = flowSettings.getToolbarItems();

        expect(items.find((item) => item.key === 'multi-item1')).toBeDefined();
        expect(items.find((item) => item.key === 'multi-item2')).toBeDefined();
      });

      test('should handle empty array', () => {
        const initialLength = flowSettings.getToolbarItems().length;

        flowSettings.addToolbarItems([]);

        expect(flowSettings.getToolbarItems()).toHaveLength(initialLength);
      });
    });

    describe('removeToolbarItem', () => {
      test('should remove existing toolbar item', () => {
        const TestIcon = () => 'TestIcon';

        flowSettings.addToolbarItem({
          key: 'remove-test',
          component: TestIcon,
          sort: 10,
        });

        let items = flowSettings.getToolbarItems();
        expect(items.find((item) => item.key === 'remove-test')).toBeDefined();

        flowSettings.removeToolbarItem('remove-test');

        items = flowSettings.getToolbarItems();
        expect(items.find((item) => item.key === 'remove-test')).toBeUndefined();
      });

      test('should handle removal of non-existent item', () => {
        const initialLength = flowSettings.getToolbarItems().length;

        flowSettings.removeToolbarItem('non-existent-key');

        expect(flowSettings.getToolbarItems()).toHaveLength(initialLength);
      });
    });

    describe('getToolbarItems', () => {
      test('should return copy of toolbar items', () => {
        const items1 = flowSettings.getToolbarItems();
        const items2 = flowSettings.getToolbarItems();

        expect(items1).not.toBe(items2); // Different references
        expect(items1).toEqual(items2); // Same content
      });
    });

    describe('clearToolbarItems', () => {
      test('should clear all toolbar items', () => {
        const TestIcon = () => 'TestIcon';

        flowSettings.addToolbarItem({
          key: 'clear-test',
          component: TestIcon,
          sort: 10,
        });

        expect(flowSettings.getToolbarItems().length).toBeGreaterThan(0);

        flowSettings.clearToolbarItems();

        expect(flowSettings.getToolbarItems()).toHaveLength(0);
      });

      test('should handle clearing empty toolbar items', () => {
        flowSettings.clearToolbarItems();
        flowSettings.clearToolbarItems();

        expect(flowSettings.getToolbarItems()).toHaveLength(0);
      });
    });
  });

  describe('Step Settings Dialog', () => {
    test('should call openStepSettingsDialog with correct parameters', async () => {
      const { openStepSettingsDialog } = await import('../components/settings/wrappers/contextual/StepSettingsDialog');

      const props = {
        model: new FlowModel({ uid: 'test-model', flowEngine: new FlowEngine() }),
        flowKey: 'test-flow',
        stepKey: 'test-step',
        dialogWidth: 800,
        dialogTitle: 'Test Dialog',
      };

      const result = await flowSettings.openStepSettingsDialog(props);

      expect(openStepSettingsDialog).toHaveBeenCalledWith(props);
      expect(result).toEqual({ success: true, data: 'test-result' });
    });

    test('should handle dialog errors', async () => {
      const { openStepSettingsDialog } = await import('../components/settings/wrappers/contextual/StepSettingsDialog');

      (openStepSettingsDialog as any).mockRejectedValueOnce(new Error('Dialog error'));

      const props = {
        model: new FlowModel({ uid: 'test-model', flowEngine: new FlowEngine() }),
        flowKey: 'test-flow',
        stepKey: 'test-step',
      };

      await expect(flowSettings.openStepSettingsDialog(props)).rejects.toThrow('Dialog error');
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('should maintain state consistency during multiple operations', () => {
      // Initialize with components and scopes
      const TestComponent = () => 'TestComponent';
      const testScope = () => 'testScope';

      flowSettings.registerComponents({ TestComponent });
      flowSettings.registerScopes({ testScope });

      // Add toolbar items
      flowSettings.addToolbarItem({
        key: 'integration-test',
        component: TestComponent,
        sort: 15,
      });

      // Enable/disable
      flowSettings.enable();
      expect(flowSettings.enabled).toBe(true);

      // Verify all state is maintained
      expect(flowSettings.components.TestComponent).toBe(TestComponent);
      expect(flowSettings.scopes.testScope).toBe(testScope);
      expect(flowSettings.getToolbarItems().find((item) => item.key === 'integration-test')).toBeDefined();

      flowSettings.disable();
      expect(flowSettings.enabled).toBe(false);

      // State should still be maintained after disable
      expect(flowSettings.components.TestComponent).toBe(TestComponent);
      expect(flowSettings.scopes.testScope).toBe(testScope);
    });

    test('should handle complex toolbar sorting scenarios', () => {
      // Clear default items for this test
      flowSettings.clearToolbarItems();

      const items = [
        { key: 'item-a', component: () => 'A', sort: 10 },
        { key: 'item-b', component: () => 'B' }, // no sort (should be 0)
        { key: 'item-c', component: () => 'C', sort: 30 },
        { key: 'item-d', component: () => 'D', sort: 10 }, // duplicate sort
        { key: 'item-e', component: () => 'E', sort: 5 },
      ];

      items.forEach((item) => flowSettings.addToolbarItem(item));

      const sortedItems = flowSettings.getToolbarItems();
      const keys = sortedItems.map((item) => item.key);

      // Expected order: item-c (30), then items with sort 10 (order of insertion: item-a, item-d), item-e (5), item-b (0)
      expect(keys).toEqual(['item-c', 'item-a', 'item-d', 'item-e', 'item-b']);
    });
  });
});
