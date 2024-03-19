import { ISchema } from '@formily/react';
import { createAuditLogsBlockSchema } from '../createAuditLogsBlockSchema';

describe('createAuditLogsBlockSchema', () => {
  let schema: ISchema;

  beforeAll(() => {
    schema = createAuditLogsBlockSchema();
  });

  it('should return a valid schema object', () => {
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  it('should have specific top-level properties with expected values', () => {
    expect(schema).toMatchObject({
      type: 'void',
      'x-decorator': 'AuditLogsBlockProvider',
      'x-acl-action': 'auditLogs:list',
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:table',
      'x-component': 'CardItem',
      'x-filter-targets': expect.arrayContaining([]),
    });
  });

  describe('x-decorator-props section', () => {
    it('should have a collection named "auditLogs"', () => {
      expect(schema['x-decorator-props'].collection).toEqual('auditLogs');
    });

    it('should have a list action', () => {
      expect(schema['x-decorator-props'].action).toEqual('list');
    });

    it('should set pageSize to 20', () => {
      expect(schema['x-decorator-props'].params.pageSize).toEqual(20);
    });

    it('contains expected boolean flags', () => {
      expect(schema['x-decorator-props'].showIndex).toBeTruthy();
      expect(schema['x-decorator-props'].dragSort).toBeFalsy();
      expect(schema['x-decorator-props'].disableTemplate).toBeTruthy();
    });
  });

  describe('actions property inside schema.properties', () => {
    let actions;

    beforeAll(() => {
      // @ts-ignore
      actions = schema.properties.actions;
    });

    it('should be defined and have a specific structure', () => {
      expect(actions).toBeDefined();
      expect(actions.type).toBe('void');
      expect(actions['x-initializer']).toBe('auditLogsTable:configureActions');
      expect(actions['x-component']).toBe('ActionBar');
    });

    it('has x-component-props with expected style', () => {
      expect(actions['x-component-props'].style.marginBottom).toBe('var(--nb-spacing)');
    });
  });

  describe('properties should include dynamically keyed objects', () => {
    it('keyed objects should match the expected structure for tables', () => {
      const propertyKeys = Object.keys(schema.properties).filter((key) => key !== 'actions');
      propertyKeys.forEach((key) => {
        expect(schema.properties[key].type).toBe('array');
        expect(schema.properties[key]['x-component']).toBe('TableV2');
      });
    });
  });
});
