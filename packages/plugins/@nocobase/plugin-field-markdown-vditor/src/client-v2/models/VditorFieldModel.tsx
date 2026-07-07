/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { FieldModel } from '@nocobase/client-v2';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';
@largeField()
export class VditorFieldModel extends FieldModel {
  render() {
    const markdown = this.context.markdownVditor || this.context.markdown;

    return markdown.edit({
      ...this.props,
      mode: this.props.editMode || this.props.mode,
      enableContextSelect: false,
    });
  }
}

VditorFieldModel.define({
  label: tExpr('MarkdownVditor'),
});

VditorFieldModel.registerFlow({
  key: 'markdownVditorEditSettings',
  title: tExpr('Content settings'),
  sort: 200,
  steps: {
    editMode: {
      title: tExpr('Default Edit Mode'),
      uiMode: {
        type: 'select',
        key: 'editMode',
        props: {
          options: [
            { label: tExpr('What You See Is What You Get'), value: 'wysiwyg' },
            { label: tExpr('Instant Rendering'), value: 'ir' },
            { label: tExpr('Split View'), value: 'sv' },
          ],
        },
      },
      defaultParams(ctx) {
        return {
          editMode: ctx.model.props.editMode || ctx.model.props.mode || 'ir',
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          editMode: params.editMode,
          mode: params.editMode,
        });
      },
    },
  },
});

EditableItemModel.bindModelToInterface('VditorFieldModel', ['vditor', 'markdown'], { isDefault: true });
