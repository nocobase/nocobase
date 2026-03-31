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
  describe('createLLMSchema (new form)', () => {
    const drawerProperties = createLLMSchema.properties.drawer.properties;

    it('keeps provider as required and uses ProviderSelect', () => {
      expect(drawerProperties.provider).toBeDefined();
      expect(drawerProperties.provider.required).toBe(true);
      expect(drawerProperties.provider['x-component']).toBe('ProviderSelect');
    });

    it('keeps enabledModels as object + EnabledModelsSelect', () => {
      expect(drawerProperties.enabledModels).toBeDefined();
      expect(drawerProperties.enabledModels.type).toBe('object');
      expect(drawerProperties.enabledModels['x-component']).toBe('EnabledModelsSelect');
    });

    it('applies provider-based visibility reactions to key fields', () => {
      ['options', 'enabledModels', 'title', 'options.baseURL'].forEach((fieldName) => {
        const reaction = drawerProperties[fieldName]['x-reactions'];
        expect(reaction.dependencies).toContain('provider');
        expect(reaction.fulfill.schema['x-visible']).toBe('{{!!$deps[0]}}');
      });
    });

    it('keeps title auto-fill reaction guarded by modified state', () => {
      const titleReaction = drawerProperties.title['x-reactions'];
      expect(titleReaction.when).toBe('{{!$self.modified}}');
      expect(titleReaction.fulfill.state.value).toBe('{{$getProviderLabel($deps[0])}}');
    });

    it('keeps options and baseURL shape', () => {
      expect(drawerProperties.options.type).toBe('object');
      expect(drawerProperties['options.baseURL']).toBeDefined();
      expect(drawerProperties['options.baseURL'].type).toBe('string');
      expect(drawerProperties['options.baseURL']['x-component']).toBe('Input');
    });

    it('includes LLMTestFlight in create form footer', () => {
      expect(drawerProperties.footer.properties.testFlight['x-component']).toBe('LLMTestFlight');
    });
  });

  describe('llmsSchema (edit form)', () => {
    const tableProperties = llmsSchema.properties.card.properties.table.properties;
    const editDrawerProperties =
      tableProperties.column5.properties.actions.properties.edit.properties.drawer.properties;

    it('keeps provider readonly display + enabledModels object', () => {
      expect(editDrawerProperties.provider['x-component']).toBe('ProviderDisplay');
      expect(editDrawerProperties.enabledModels.type).toBe('object');
      expect(editDrawerProperties.enabledModels['x-component']).toBe('EnabledModelsSelect');
    });

    it('includes LLMTestFlight in edit form footer', () => {
      expect(editDrawerProperties.footer.properties.testFlight['x-component']).toBe('LLMTestFlight');
    });
  });
});
