/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DrawerFormLayout, SkeletonFallback } from '@nocobase/client-v2';
import {
  FlowModelRenderer,
  useFlowContext,
  useFlowEngine,
  useFlowViewContext,
  type FlowModel,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { useT } from '../locale';
import type { User } from './types';
import {
  ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
  ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
  buildAdminProfileCreateFormModel,
  buildAdminProfileEditFormModel,
} from '../shared/adminProfileFormModels';

type UserFormValues = Record<string, unknown> & {
  roles?: unknown;
};

type LoadedUserFormModel = FlowModel & {
  submit: (
    params?: Record<string, unknown>,
    cb?: (values?: UserFormValues, filterByTk?: unknown) => Promise<unknown>,
  ) => Promise<unknown>;
  use?: string;
  serialize: () => Record<string, any>;
};

type FlowModelsResource = {
  save: (params: { values: Record<string, unknown> }) => Promise<unknown>;
  destroy: (params: { filterByTk: string }) => Promise<unknown>;
};

const userFormBlockClassName = css`
  width: 100%;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;

  > div {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .nb-toolbar-container {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
`;

type FlowModelTree = Record<string, any>;

function normalizeUserFormRootUse(serialized: FlowModelTree, isEdit: boolean) {
  const expectedUse = isEdit ? 'UserEditFormModel' : 'UserCreateFormModel';
  if (serialized.use === expectedUse) {
    return serialized;
  }
  return {
    ...serialized,
    use: expectedUse,
  };
}

function isUsernameFieldItem(item: unknown) {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const record = item as FlowModelTree;
  return record.stepParams?.fieldSettings?.init?.fieldPath === 'username';
}

function normalizeUsernameFieldItem(item: FlowModelTree, isEdit: boolean) {
  const nextItem: FlowModelTree = {
    ...item,
    stepParams: {
      ...(item.stepParams || {}),
      editItemSettings: {
        ...(item.stepParams?.editItemSettings || {}),
        required: {
          ...(item.stepParams?.editItemSettings?.required || {}),
          required: true,
        },
      },
    },
  };

  const nextProps = { ...(nextItem.props || {}) };
  if (isEdit) {
    delete nextProps.disabled;
  }

  if (Object.keys(nextProps).length > 0) {
    nextItem.props = nextProps;
  } else {
    delete nextItem.props;
  }

  return nextItem;
}

function normalizeUserFormModelTree(serialized: FlowModelTree, isEdit: boolean) {
  const withNormalizedUse = normalizeUserFormRootUse(serialized, isEdit);
  const items = withNormalizedUse.subModels?.grid?.subModels?.items;
  if (!Array.isArray(items)) {
    return withNormalizedUse;
  }

  const nextItems = items.map((item) =>
    isUsernameFieldItem(item) ? normalizeUsernameFieldItem(item as FlowModelTree, isEdit) : item,
  );

  return {
    ...withNormalizedUse,
    subModels: {
      ...(withNormalizedUse.subModels || {}),
      grid: {
        ...(withNormalizedUse.subModels?.grid || {}),
        subModels: {
          ...(withNormalizedUse.subModels?.grid?.subModels || {}),
          items: nextItems,
        },
      },
    },
  };
}

function shouldRebuildUserFormModel(loadedModel: LoadedUserFormModel, isEdit: boolean) {
  const serialized = loadedModel.serialize();
  const normalized = normalizeUserFormModelTree(serialized, isEdit);
  return JSON.stringify(serialized) !== JSON.stringify(normalized);
}

async function ensurePersistedUserFormModel(options: {
  flowEngine: ReturnType<typeof useFlowEngine>;
  api: ReturnType<typeof useFlowContext>['api'];
  uid: string;
  fallbackTree: Record<string, unknown>;
}) {
  const { flowEngine, api, uid, fallbackTree } = options;
  const flowModels = api.resource('flowModels') as FlowModelsResource;
  let loaded = (await flowEngine.loadModel({ uid })) as LoadedUserFormModel | null;
  if (loaded) {
    return loaded;
  }
  try {
    await flowModels.save({
      values: fallbackTree,
    });
  } catch (error) {
    if (!isFlowModelTreePathDuplicateError(error)) {
      throw error;
    }
    await flowModels.destroy({
      filterByTk: uid,
    });
    await flowModels.save({
      values: fallbackTree,
    });
  }
  loaded = (await flowEngine.loadModel({ uid })) as LoadedUserFormModel | null;
  return loaded;
}

function isFlowModelTreePathDuplicateError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as {
    response?: {
      data?: {
        errors?: Array<{ message?: string }>;
      };
    };
    errors?: Array<{ message?: string }>;
  };

  const messages = [
    ...(record.errors?.map((item) => item?.message) ?? []),
    ...(record.response?.data?.errors?.map((item) => item?.message) ?? []),
  ]
    .filter((message): message is string => !!message)
    .join(' ');

  return messages.includes('ancestor') && messages.includes('descendant');
}

export interface UserFormDrawerProps {
  user?: User;
  onSubmitted: () => Promise<void> | void;
}

function normalizeRoleName(role: unknown): string | null {
  if (typeof role === 'string' && role) {
    return role;
  }
  if (!role || typeof role !== 'object') {
    return null;
  }
  const record = role as Record<string, unknown>;
  if (typeof record.name === 'string' && record.name) {
    return record.name;
  }
  if (typeof record.value === 'string' && record.value) {
    return record.value;
  }
  return null;
}

function normalizeSubmitValues(values: UserFormValues) {
  const roles = Array.isArray(values.roles)
    ? values.roles
        .map(normalizeRoleName)
        .filter((role): role is string => !!role)
        .map((name) => ({ name }))
    : values.roles;

  return {
    ...values,
    roles,
  };
}

export default function UserFormDrawer(props: UserFormDrawerProps) {
  const { onSubmitted, user } = props;
  const ctx = useFlowContext();
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const t = useT();
  const isEdit = !!user;
  const [submitting, setSubmitting] = React.useState(false);
  const [model, setModel] = React.useState<LoadedUserFormModel | null>(null);
  const title = isEdit ? t('Edit profile') : t('Add user');

  const formModelUid = isEdit ? ADMIN_PROFILE_EDIT_FORM_MODEL_UID : ADMIN_PROFILE_CREATE_FORM_MODEL_UID;
  const fallbackTree = React.useMemo(
    () => (isEdit ? buildAdminProfileEditFormModel() : buildAdminProfileCreateFormModel()),
    [isEdit],
  );

  useRequest(
    async () => {
      const loadedModel =
        (await ensurePersistedUserFormModel({
          flowEngine,
          api: ctx.api,
          uid: formModelUid,
          fallbackTree,
        })) ?? ((await flowEngine.createModelAsync(fallbackTree)) as LoadedUserFormModel);
      const loaded = !shouldRebuildUserFormModel(loadedModel, isEdit)
        ? loadedModel
        : (() => {
            flowEngine.removeModelWithSubModels(loadedModel.uid);
            return flowEngine.createModelAsync(
              normalizeUserFormModelTree(loadedModel.serialize(), isEdit),
            ) as Promise<LoadedUserFormModel>;
          })();
      const normalizedModel = await loaded;
      if (viewCtx) {
        normalizedModel.context.addDelegate(viewCtx);
      }
      setModel(normalizedModel);
      return normalizedModel;
    },
    {
      refreshDeps: [flowEngine, viewCtx, formModelUid, fallbackTree, user?.id],
    },
  );

  const handleSubmit = React.useCallback(async () => {
    if (!model) {
      return;
    }
    setSubmitting(true);
    try {
      await model.submit({}, async (values) => {
        const nextValues = normalizeSubmitValues(values || {});
        if (isEdit && user?.id != null) {
          await ctx.api.resource('users').update({
            filterByTk: user.id,
            values: nextValues,
          });
          return;
        }
        await ctx.api.resource('users').create({ values: nextValues });
      });
      ctx.message.success(t('Saved successfully'));
      await onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [ctx, isEdit, model, onSubmitted, t, user?.id]);

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <div className={userFormBlockClassName}>
        {model ? (
          <FlowModelRenderer
            model={model}
            showFlowSettings={ctx.flowSettingsEnabled ? { showBackground: false, showBorder: false } : false}
          />
        ) : (
          <SkeletonFallback style={{ margin: 0 }} />
        )}
      </div>
    </DrawerFormLayout>
  );
}
