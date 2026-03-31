/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { FieldModel } from '@nocobase/client';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
@largeField()
export class VditorFieldModel extends FieldModel {
  render() {
    const markdown = this.context.markdown;

    return markdown.edit({ ...this.props, enableContextSelect: false });
  }
}
EditableItemModel.bindModelToInterface('VditorFieldModel', ['vditor', 'markdown'], { isDefault: true });
