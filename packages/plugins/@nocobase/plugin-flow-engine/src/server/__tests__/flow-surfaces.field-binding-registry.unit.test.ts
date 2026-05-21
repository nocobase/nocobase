/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getSupportedFieldComponentUseSet, resolveSupportedFieldCapability } from '../flow-surfaces/catalog';

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

  it('should keep plain URL display fields on the core URL binding when file-manager is enabled', () => {
    const enabledPackages = new Set(['@nocobase/plugin-file-manager']);
    const urlField = {
      interface: 'url',
      type: 'text',
    };

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'TableBlockModel',
        field: urlField,
        enabledPackages,
      }),
    ).toMatchObject({
      wrapperUse: 'TableColumnModel',
      fieldUse: 'DisplayURLFieldModel',
      inferredFieldUse: 'DisplayURLFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'DetailsBlockModel',
        field: urlField,
        enabledPackages,
      }),
    ).toMatchObject({
      wrapperUse: 'DetailsItemModel',
      fieldUse: 'DisplayURLFieldModel',
      inferredFieldUse: 'DisplayURLFieldModel',
    });
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

  it('should keep core fallback field bindings aligned with the frontend defaults and allowed use sets', () => {
    expect(
      resolveSupportedFieldCapability({
        containerUse: 'TableBlockModel',
        field: {
          interface: 'select',
          type: 'string',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'TableColumnModel',
      fieldUse: 'DisplayEnumFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'DetailsBlockModel',
        field: {
          interface: 'tableoid',
          type: 'virtual',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'DetailsItemModel',
      fieldUse: 'DisplayEnumFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'CreateFormModel',
        field: {
          interface: 'radioGroup',
          type: 'string',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FormItemModel',
      fieldUse: 'RadioGroupFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'EditFormModel',
        field: {
          interface: 'checkboxGroup',
          type: 'array',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FormItemModel',
      fieldUse: 'CheckboxGroupFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'EditFormModel',
        field: {
          interface: 'collection',
          type: 'string',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FormItemModel',
      fieldUse: 'CollectionSelectorFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'FilterFormBlockModel',
        field: {
          interface: 'select',
          type: 'string',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FilterFormItemModel',
      fieldUse: 'SelectFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'FilterFormBlockModel',
        field: {
          interface: 'checkbox',
          type: 'boolean',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FilterFormItemModel',
      fieldUse: 'SelectFieldModel',
    });

    expect(
      resolveSupportedFieldCapability({
        containerUse: 'FilterFormBlockModel',
        field: {
          interface: 'number',
          type: 'integer',
        },
      }),
    ).toMatchObject({
      wrapperUse: 'FilterFormItemModel',
      fieldUse: 'NumberFieldModel',
    });

    expect(
      getSupportedFieldComponentUseSet({
        containerUse: 'CreateFormModel',
        field: {
          interface: 'radioGroup',
          type: 'string',
        },
      }),
    ).toEqual(expect.any(Set));
    expect(
      getSupportedFieldComponentUseSet({
        containerUse: 'CreateFormModel',
        field: {
          interface: 'radioGroup',
          type: 'string',
        },
      })?.has('RadioGroupFieldModel'),
    ).toBe(true);
    expect(
      getSupportedFieldComponentUseSet({
        containerUse: 'CreateFormModel',
        field: {
          interface: 'checkboxGroup',
          type: 'array',
        },
      })?.has('CheckboxGroupFieldModel'),
    ).toBe(true);
  });

  it('should expose generic relation field component sets that back public fieldType options', () => {
    const singleAssociationField = {
      interface: 'm2o',
      targetCollection: {
        template: 'general',
      },
    };
    const multiAssociationField = {
      interface: 'm2m',
      targetCollection: {
        template: 'general',
      },
    };

    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'FormItemModel', field: singleAssociationField }) || [],
      ),
    ).toEqual(['RecordSelectFieldModel', 'RecordPickerFieldModel', 'SubFormFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'FormItemModel', field: multiAssociationField }) || [],
      ),
    ).toEqual([
      'RecordSelectFieldModel',
      'RecordPickerFieldModel',
      'SubFormListFieldModel',
      'SubTableFieldModel',
      'PopupSubTableFieldModel',
    ]);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'DetailsItemModel', field: multiAssociationField }) || [],
      ),
    ).toEqual(['DisplayTextFieldModel', 'DisplaySubListFieldModel', 'DisplaySubTableFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'TableColumnModel', field: multiAssociationField }) || [],
      ),
    ).toEqual(['DisplayTextFieldModel', 'DisplaySubListFieldModel', 'DisplaySubTableFieldModel']);
  });
});
