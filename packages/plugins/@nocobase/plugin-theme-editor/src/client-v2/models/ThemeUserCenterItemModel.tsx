/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isSettingsApp, UserCenterSelectItemModel } from '@nocobase/client-v2';
import { getCurrentUserThemeId, getDefaultThemeItem, listThemeItems, updateUserTheme } from '../utils/themeApi';
import { translateThemeEditor } from '../locale';

export class ThemeUserCenterItemModel extends UserCenterSelectItemModel {
  static itemId = 'theme';

  section = 'preferences' as const;
  sort = 310;
  label = 'Theme';

  async prepare() {
    // 设置中心的外观固定跟「简约」那条主题，在这里切主题只会改业务端的样子，
    // 当前这一页纹丝不动，看着像是坏了。所以这个入口只留在业务端。
    if (isSettingsApp(this.context.app)) {
      this.ready = false;
      return;
    }

    const themes = await listThemeItems(this.context.api);
    const optionalThemes = themes.filter((item) => item.optional);
    const currentThemeId = getCurrentUserThemeId(this.context.user);
    const defaultTheme = getDefaultThemeItem(themes);
    const selectedTheme = optionalThemes.find((item) => item.id === currentThemeId) || defaultTheme;

    this.label = translateThemeEditor(this.context, 'Theme');
    this.options = optionalThemes.map((item) => ({
      label: translateThemeEditor(this.context, item.config?.name || ''),
      value: String(item.id),
    }));
    this.value = selectedTheme?.id == null ? undefined : String(selectedTheme.id);
    this.ready = this.options.length > 0;
  }

  async onChange(value: string) {
    const nextThemeId = Number(value);
    await updateUserTheme(this.context.api, Number.isFinite(nextThemeId) ? nextThemeId : null);
    window.location.reload();
  }
}

export default ThemeUserCenterItemModel;
