/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { defineAction, tExpr } from '@nocobase/flow-engine';
import { DetailsItemModel } from '../models/blocks/details/DetailsItemModel';
import { getFieldBindingUse, rebuildFieldSubModel } from '../internal/utils/rebuildFieldSubModel';

type PatternAwareFieldModelMeta = {
  preserveOnPatternChange?: boolean;
};

type PatternAwareFieldModel = {
  scheduleApplyJsSettings?: () => void;
};

function resolveAssociationTitleField(ctx: any) {
  return (
    ctx.model.subModels?.field?.props?.fieldNames?.label ||
    ctx.model.props.titleField ||
    ctx.collectionField?.targetCollectionTitleFieldName
  );
}

function shouldPreserveFieldModelOnPatternChange(ctx: any) {
  const fieldModel = ctx.model.subModels.field;
  const fieldUse = getFieldBindingUse(fieldModel) ?? fieldModel?.use;
  const ModelClass = typeof fieldUse === 'string' ? ctx.engine.getModelClass(fieldUse) : fieldUse;

  return ((ModelClass?.meta as PatternAwareFieldModelMeta | undefined)?.preserveOnPatternChange ?? false) === true;
}

async function refreshPatternRuntime(ctx: any) {
  ctx.model.invalidateFlowCache?.('beforeRender', true);
  await ctx.model.rerender?.();

  const parent = ctx.model.parent;
  if (!parent) {
    return;
  }

  parent.invalidateFlowCache?.('beforeRender', true);
  parent.setProps?.({
    __patternRefreshKey: uid(),
  });
  await parent.rerender?.();
}

export const pattern = defineAction({
  name: 'pattern',
  title: tExpr('Display mode'),
  uiMode(ctx) {
    const t = ctx.t;
    return {
      type: 'select',
      key: 'pattern',
      props: {
        options: [
          {
            value: 'editable',
            label: t('Editable'),
          },
          {
            value: 'disabled',
            label: t('Disabled'),
          },

          {
            value: 'readPretty',
            label: t('Display only'),
          },
        ],
      },
    };
  },
  hideInSettings(ctx) {
    if (!ctx.model.collectionField) {
      return true;
    }
    return ctx.model.collectionField.inputable === false;
  },
  defaultParams: (ctx) => {
    return {
      pattern:
        ctx.model.collectionField.inputable === false ||
        ctx.model.context.parentDisabled ||
        ctx.model.props.disabled ||
        ctx.model.collectionField.readonly
          ? 'disabled'
          : 'editable',
    };
  },
  afterParamsSave: async (ctx: any, params, previousParams) => {
    if (shouldPreserveFieldModelOnPatternChange(ctx)) {
      if (params.pattern !== previousParams.pattern) {
        (ctx.model.subModels.field as PatternAwareFieldModel | undefined)?.scheduleApplyJsSettings?.();
      }
      await refreshPatternRuntime(ctx);
      return;
    }

    const targetCollection = ctx.collectionField.targetCollection;
    const associationTitleField = resolveAssociationTitleField(ctx);
    const targetCollectionTitleField = targetCollection?.getField(associationTitleField);
    const { model } = ctx;
    const resolveDefaultProps = (binding, field = ctx.collectionField) => {
      if (!binding) return undefined;
      const defaultProps =
        typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps;
      if (!ctx.collectionField?.isAssociationField?.() || !associationTitleField) {
        return defaultProps;
      }
      return {
        ...(defaultProps || {}),
        titleField: associationTitleField,
      };
    };
    if (params.pattern === 'readPretty') {
      const binding = DetailsItemModel.getDefaultBindingByField(ctx, ctx.collectionField, {
        fallbackToTargetTitleField: true,
        targetCollectionTitleField,
      });
      await rebuildFieldSubModel({
        parentModel: model,
        targetUse: binding.modelName,
        defaultProps: resolveDefaultProps(binding, targetCollectionTitleField || ctx.collectionField),
      });
      if (binding.modelName) {
        ctx.model.setStepParams('editItemSettings', 'model', { use: binding.modelName });
      }
    } else {
      const binding = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
      if (previousParams.pattern === 'readPretty') {
        await rebuildFieldSubModel({
          parentModel: model,
          targetUse: binding.modelName,
          defaultProps: resolveDefaultProps(binding),
        });
      }
    }
    await refreshPatternRuntime(ctx);
  },
  async beforeParamsSave(ctx, params, previousParams) {
    if (params.pattern === 'readPretty') {
      const titleField = resolveAssociationTitleField(ctx);
      ctx.model.setProps({
        pattern: 'readPretty',
        disabled: false,
        titleField,
      });
      if (ctx.collectionField.isAssociationField())
        await ctx.model.setStepParams('editItemSettings', 'titleField', {
          titleField,
        });
    } else {
      ctx.model.setProps({
        disabled: params.pattern === 'disabled',
        pattern: 'editable',
      });
    }
  },
  handler(ctx, params) {
    if (params.pattern === 'readPretty') {
      ctx.model.setProps({
        pattern: 'readPretty',
      });
    } else {
      ctx.model.setProps({
        disabled: params.pattern === 'disabled',
        pattern: null,
      });
    }
  },
});
