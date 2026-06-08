/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileLegacyTemplate, preferLegacyTemplateTitle } from '../compileLegacyTemplate';

describe('compileLegacyTemplate', () => {
  it('passes namespace options from JSON t templates', () => {
    const t = vi.fn((key: string, options?: Record<string, unknown>) => {
      if (key === 'Space' && Array.isArray(options?.ns) && options.ns.includes('@nocobase/plugin-multi-space')) {
        return '空间';
      }
      return key;
    });

    expect(compileLegacyTemplate('{{t("Space", {"ns":["@nocobase/plugin-multi-space","client"]})}}', t)).toBe('空间');
    expect(t).toHaveBeenCalledWith('Space', { ns: ['@nocobase/plugin-multi-space', 'client'] });
  });

  it('keeps support for legacy object literal namespace options', () => {
    const t = vi.fn((key: string, options?: Record<string, unknown>) => {
      if (key === 'Space' && options?.ns === '@nocobase/plugin-multi-space') {
        return '空间';
      }
      return key;
    });

    expect(compileLegacyTemplate('{{t("Space", { ns: "@nocobase/plugin-multi-space" })}}', t)).toBe('空间');
    expect(t).toHaveBeenCalledWith('Space', { ns: '@nocobase/plugin-multi-space' });
  });

  it('passes namespace options from template fragments', () => {
    const t = (key: string, options?: Record<string, unknown>) => {
      if (key === 'Store the space of each record' && Array.isArray(options?.ns)) {
        return '记录空间';
      }
      return key;
    };

    expect(
      compileLegacyTemplate(
        'Description: {{t("Store the space of each record", {"ns":["@nocobase/plugin-multi-space","client"]})}}',
        t,
      ),
    ).toBe('Description: 记录空间');
  });

  it('prefers a matching namespaced template over a raw title key', () => {
    expect(preferLegacyTemplateTitle('Space', '{{t("Space", {"ns":["@nocobase/plugin-multi-space","client"]})}}')).toBe(
      '{{t("Space", {"ns":["@nocobase/plugin-multi-space","client"]})}}',
    );
  });
});
