/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowRuntimeContext } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { PageModel } from '../PageModel';

class PageWithoutTabs extends PageModel {
  supportsPageTabs() {
    return false;
  }
}

function getGeneralSettingsSchema(model: PageModel) {
  const uiSchema = model.getFlow('pageSettings')?.getStep('general')?.uiSchema;
  if (typeof uiSchema !== 'function') {
    throw new Error('pageSettings.general.uiSchema is unavailable.');
  }
  return uiSchema(new FlowRuntimeContext(model, 'pageSettings', 'general'));
}

describe('PageModel capabilities', () => {
  it('keeps tabs enabled for ordinary pages', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PageModel });
    const model = engine.createModel<PageModel>({ use: 'PageModel', uid: 'ordinary-page' });

    expect(model.supportsPageTabs()).toBe(true);
    expect(getGeneralSettingsSchema(model)).toHaveProperty('enableTabs');
  });

  it('hides and refuses tabs for page types without tab support', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PageWithoutTabs });
    const model = engine.createModel<PageWithoutTabs>({
      use: 'PageWithoutTabs',
      uid: 'page-without-tabs',
      props: { enableTabs: true },
    });
    model.renderTabs = vi.fn(() => null);
    model.renderFirstTab = vi.fn(() => 'first tab');

    expect(getGeneralSettingsSchema(model)).not.toHaveProperty('enableTabs');
    expect(model.renderPageContent()).toBe('first tab');
    expect(model.renderTabs).not.toHaveBeenCalled();
  });
});
