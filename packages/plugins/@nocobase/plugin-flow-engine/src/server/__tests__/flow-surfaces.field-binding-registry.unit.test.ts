/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveSupportedFieldCapability } from '../flow-surfaces/catalog';

describe('flowSurfaces field binding registry', () => {
  it('should prefer file-manager attachment bindings over titleField fallback models', () => {
    const enabledPackages = new Set(['@nocobase/plugin-file-manager', '@nocobase/plugin-field-attachment-url']);
    const attachmentField = {
      interface: 'attachment',
      type: 'belongsToMany',
      targetCollection: {
        template: 'file',
      },
    };
    const attachmentFieldWithoutResolvedTarget = {
      interface: 'attachment',
      type: 'belongsToMany',
      target: 'custom_files',
    };
    const attachmentUrlField = {
      interface: 'attachmentURL',
      type: 'string',
    };

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'TableBlockModel',
        field: attachmentField,
        enabledPackages,
      }).fieldUse,
    ).toBe('DisplayPreviewFieldModel');
    expect(
      resolveSupportedFieldCapability({
        containerUse: 'EditFormModel',
        field: attachmentField,
        enabledPackages,
      }).fieldUse,
    ).toBe('UploadFieldModel');
    expect(
      resolveSupportedFieldCapability({
        containerUse: 'TableBlockModel',
        field: attachmentFieldWithoutResolvedTarget,
        enabledPackages,
      }).fieldUse,
    ).toBe('DisplayPreviewFieldModel');
    expect(
      resolveSupportedFieldCapability({
        containerUse: 'EditFormModel',
        field: attachmentFieldWithoutResolvedTarget,
        enabledPackages,
      }).fieldUse,
    ).toBe('UploadFieldModel');
    expect(
      resolveSupportedFieldCapability({
        containerUse: 'DetailsBlockModel',
        field: attachmentUrlField,
        enabledPackages,
      }).fieldUse,
    ).toBe('DisplayPreviewFieldModel');
  });

  it('should resolve plugin-backed non-core field interfaces to their registered model strings', () => {
    const enabledPackages = new Set(['@nocobase/plugin-field-code', '@nocobase/plugin-field-formula']);

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'EditFormModel',
        field: {
          interface: 'code',
          type: 'text',
        },
        enabledPackages,
      }).fieldUse,
    ).toBe('CodeFieldModel');

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'DetailsBlockModel',
        field: {
          interface: 'formula',
          type: 'formula',
          dataType: 'boolean',
        },
        enabledPackages,
      }).fieldUse,
    ).toBe('DisplayCheckboxFieldModel');

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'FilterFormBlockModel',
        field: {
          interface: 'formula',
          type: 'formula',
          dataType: 'date',
        },
        enabledPackages,
      }).fieldUse,
    ).toBe('DateTimeFilterFieldModel');

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'FilterFormBlockModel',
        field: {
          interface: 'formula',
          type: 'formula',
          dataType: 'number',
        },
        enabledPackages,
      }).fieldUse,
    ).toBe('NumberFieldModel');
  });
});
