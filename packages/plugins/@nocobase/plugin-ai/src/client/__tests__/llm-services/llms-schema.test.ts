/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { createLLMSchema, llmsSchema } from '../../schemas/llms';

describe('LLM Schema', () => {
  describe('P0: createLLMSchema (New Form)', () => {
    const drawerProperties = createLLMSchema.properties.drawer.properties;

    it('should have provider field as required', () => {
      expect(drawerProperties.provider).toBeDefined();
      expect(drawerProperties.provider.required).toBe(true);
      expect(drawerProperties.provider['x-component']).toBe('ProviderSelect');
    });

    it('should have enabledModels field as required', () => {
      expect(drawerProperties.enabledModels).toBeDefined();
      expect(drawerProperties.enabledModels.required).toBe(true);
      expect(drawerProperties.enabledModels['x-component']).toBe('EnabledModelsSelect');
    });

    it('should have title field as optional (no required)', () => {
      expect(drawerProperties.title).toBeDefined();
      expect(drawerProperties.title.required).toBeUndefined();
      expect(drawerProperties.title['x-component']).toBe('Input');
    });

    it('should have options.baseURL field as optional', () => {
      expect(drawerProperties['options.baseURL']).toBeDefined();
      expect(drawerProperties['options.baseURL'].required).toBeUndefined();
    });

    describe('P0: Field visibility reactions', () => {
      it('should hide other fields when provider is not selected', () => {
        const optionsReaction = drawerProperties.options['x-reactions'];
        expect(optionsReaction.dependencies).toContain('provider');
        expect(optionsReaction.fulfill.schema['x-visible']).toBe('{{!!$deps[0]}}');
      });

      it('should hide enabledModels when provider is not selected', () => {
        const reaction = drawerProperties.enabledModels['x-reactions'];
        expect(reaction.dependencies).toContain('provider');
        expect(reaction.fulfill.schema['x-visible']).toBe('{{!!$deps[0]}}');
      });

      it('should hide title when provider is not selected', () => {
        const reaction = drawerProperties.title['x-reactions'];
        expect(reaction.dependencies).toContain('provider');
        expect(reaction.fulfill.schema['x-visible']).toBe('{{!!$deps[0]}}');
      });

      it('should hide baseURL when provider is not selected', () => {
        const reaction = drawerProperties['options.baseURL']['x-reactions'];
        expect(reaction.dependencies).toContain('provider');
        expect(reaction.fulfill.schema['x-visible']).toBe('{{!!$deps[0]}}');
      });
    });

    describe('P0: Title auto-fill with provider label', () => {
      it('should have title reaction to auto-fill from provider label', () => {
        const titleReaction = drawerProperties.title['x-reactions'];
        expect(titleReaction.dependencies).toContain('provider');
        expect(titleReaction.fulfill.state.value).toBe('{{$getProviderLabel($deps[0])}}');
      });

      it('should only auto-fill when not modified', () => {
        const titleReaction = drawerProperties.title['x-reactions'];
        expect(titleReaction.when).toBe('{{!$self.modified}}');
      });
    });

    describe('P1: Field order', () => {
      it('should have correct field order in schema', () => {
        const fieldKeys = Object.keys(drawerProperties);
        const expectedOrder = [
          'provider',
          'options',
          'enabledModels',
          'title',
          'options.baseURL',
          'testFlight',
          'footer',
        ];

        // Check relative positions
        expect(fieldKeys.indexOf('provider')).toBeLessThan(fieldKeys.indexOf('options'));
        expect(fieldKeys.indexOf('options')).toBeLessThan(fieldKeys.indexOf('enabledModels'));
        expect(fieldKeys.indexOf('enabledModels')).toBeLessThan(fieldKeys.indexOf('title'));
        expect(fieldKeys.indexOf('title')).toBeLessThan(fieldKeys.indexOf('options.baseURL'));
        expect(fieldKeys.indexOf('options.baseURL')).toBeLessThan(fieldKeys.indexOf('testFlight'));
      });
    });
  });

  describe('P0: llmsSchema (Edit Form)', () => {
    // Navigate to edit drawer properties
    const tableProperties = llmsSchema.properties.card.properties.table.properties;
    const editDrawerProperties =
      tableProperties.column4.properties.actions.properties.edit.properties.drawer.properties;

    it('should have provider field with ProviderDisplay component (readonly)', () => {
      expect(editDrawerProperties.provider).toBeDefined();
      expect(editDrawerProperties.provider['x-component']).toBe('ProviderDisplay');
    });

    it('should have enabledModels field as required', () => {
      expect(editDrawerProperties.enabledModels).toBeDefined();
      expect(editDrawerProperties.enabledModels.required).toBe(true);
    });

    it('should have title field as optional', () => {
      expect(editDrawerProperties.title).toBeDefined();
      expect(editDrawerProperties.title.required).toBeUndefined();
    });

    it('should have options.baseURL field', () => {
      expect(editDrawerProperties['options.baseURL']).toBeDefined();
    });

    describe('P1: Edit form field order', () => {
      it('should have correct field order', () => {
        const fieldKeys = Object.keys(editDrawerProperties);

        expect(fieldKeys.indexOf('provider')).toBeLessThan(fieldKeys.indexOf('options'));
        expect(fieldKeys.indexOf('options')).toBeLessThan(fieldKeys.indexOf('enabledModels'));
        expect(fieldKeys.indexOf('enabledModels')).toBeLessThan(fieldKeys.indexOf('title'));
        expect(fieldKeys.indexOf('title')).toBeLessThan(fieldKeys.indexOf('options.baseURL'));
        expect(fieldKeys.indexOf('options.baseURL')).toBeLessThan(fieldKeys.indexOf('testFlight'));
      });
    });
  });

  describe('P0: Data storage structure', () => {
    it('should store enabledModels as array type', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      expect(drawerProperties.enabledModels.type).toBe('array');
    });

    it('should store options as object type', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      expect(drawerProperties.options.type).toBe('object');
    });

    it('should store baseURL in options using dot notation', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      // 'options.baseURL' field name indicates nested storage
      expect(drawerProperties['options.baseURL']).toBeDefined();
      expect(drawerProperties['options.baseURL'].type).toBe('string');
    });
  });

  describe('P1: Base URL configuration', () => {
    it('should have placeholder text for baseURL', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      const baseURLProps = drawerProperties['options.baseURL']['x-component-props'];
      expect(baseURLProps.placeholder).toBeDefined();
    });

    it('should use Input component for baseURL', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      expect(drawerProperties['options.baseURL']['x-component']).toBe('Input');
    });
  });

  describe('P1: TestFlight component', () => {
    it('should have testFlight component in create form', () => {
      const drawerProperties = createLLMSchema.properties.drawer.properties;
      expect(drawerProperties.testFlight).toBeDefined();
      expect(drawerProperties.testFlight['x-component']).toBe('LLMTestFlight');
    });

    it('should have testFlight component in edit form', () => {
      const tableProperties = llmsSchema.properties.card.properties.table.properties;
      const editDrawerProperties =
        tableProperties.column4.properties.actions.properties.edit.properties.drawer.properties;
      expect(editDrawerProperties.testFlight).toBeDefined();
      expect(editDrawerProperties.testFlight['x-component']).toBe('LLMTestFlight');
    });
  });
});
