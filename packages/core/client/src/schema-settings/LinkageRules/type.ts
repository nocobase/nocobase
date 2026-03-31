/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export enum ActionType {
  Visible = 'visible',
  Editable = 'editable',
  ReadOnly = 'disabled',
  ReadPretty = 'readPretty',
  None = 'none',
  Hidden = 'hidden',
  Required = 'required',
  InRequired = 'notRequired',
  Disabled = 'disabled',
  Value = 'value',
  Active = 'enabled',
  Color = 'color',
  BackgroundColor = 'backgroundColor',
  TextAlign = 'textAlign',
  Options = 'options',
  DateScope = 'dateScope',
  FontSize = 'fontSize',
  FontWeight = 'fontWeight',
  FontStyle = 'fontStyle',
}

export enum LinkageRuleCategory {
  default = 'default',
  style = 'style',
  button = 'button',
  block = 'block',
}

export const LinkageRuleDataKeyMap: Record<`${LinkageRuleCategory}`, string> = {
  [LinkageRuleCategory.style]: 'x-linkage-style-rules',
  [LinkageRuleCategory.default]: 'x-linkage-rules',
  [LinkageRuleCategory.button]: 'x-linkage-rules',
  [LinkageRuleCategory.block]: 'x-block-linkage-rules',
};
