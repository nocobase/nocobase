/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormBlockModel } from '@nocobase/client';
import { describe, expect, it } from 'vitest';
import { patchFormBlockTitleForFieldTemplateReference } from '../patchFormBlockTitle';

describe('patchFormBlockTitleForFieldTemplateReference', () => {
  it('appends field template suffix for ReferenceFormGridModel', () => {
    patchFormBlockTitleForFieldTemplateReference();

    const form = Object.create(FormBlockModel.prototype) as any;
    form._title = '默认block title';
    Object.defineProperty(form, 'translate', {
      value: (key: string) => (key === 'Field template' ? '字段模版' : key),
    });
    form.subModels = {
      grid: {
        use: 'ReferenceFormGridModel',
        getStepParams: (flowKey: string, stepKey: string) => {
          if (flowKey === 'referenceFormGridSettings' && stepKey === 'target') {
            return { templateName: '模版名称' };
          }
          return undefined;
        },
      },
    };

    expect(form.title).toBe('默认block title(字段模版: 模版名称)');
  });

  it('does not append for normal grid', () => {
    patchFormBlockTitleForFieldTemplateReference();

    const form = Object.create(FormBlockModel.prototype) as any;
    form._title = '默认block title';
    Object.defineProperty(form, 'translate', {
      value: (key: string) => (key === 'Field template' ? '字段模版' : key),
    });
    form.subModels = {
      grid: { use: 'FormGridModel' },
    };

    expect(form.title).toBe('默认block title');
  });

  it('avoids double append when base title already contains label', () => {
    patchFormBlockTitleForFieldTemplateReference();

    const form = Object.create(FormBlockModel.prototype) as any;
    form._title = '默认block title(字段模版: 模版名称)';
    Object.defineProperty(form, 'translate', {
      value: (key: string) => (key === 'Field template' ? '字段模版' : key),
    });
    form.subModels = {
      grid: {
        use: 'ReferenceFormGridModel',
        getStepParams: () => ({ templateName: '模版名称' }),
      },
    };

    expect(form.title).toBe('默认block title(字段模版: 模版名称)');
  });
});
