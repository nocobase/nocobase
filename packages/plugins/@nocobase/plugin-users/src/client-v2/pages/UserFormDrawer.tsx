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
  type CreateModelOptions,
  type FlowEngineContext,
  type FlowModel,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { useT } from '../locale';
import type { User } from './types';
import { UserCreateFormModel, UserEditFormModel } from '../models/UserProfileFormModels';
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
};

type FlowModelsResource = {
  save: (params: { values: Record<string, unknown> }) => Promise<unknown>;
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

type PersistedFlowModelTree = CreateModelOptions & Record<string, unknown>;

const privateUserFormModels = {
  [ADMIN_PROFILE_CREATE_FORM_MODEL_UID]: UserCreateFormModel,
  [ADMIN_PROFILE_EDIT_FORM_MODEL_UID]: UserEditFormModel,
} as const;

function withPrivateUserFormModel(tree: PersistedFlowModelTree, uid: string): PersistedFlowModelTree {
  const ModelClass = privateUserFormModels[uid as keyof typeof privateUserFormModels];
  if (!ModelClass) {
    return tree;
  }
  return {
    ...tree,
    use: ModelClass,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneWithoutCreatePasswordDefaults(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneWithoutCreatePasswordDefaults);
  }
  if (!isRecord(value)) {
    return value;
  }

  const next = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, cloneWithoutCreatePasswordDefaults(item)]),
  );
  const stepParams = next.stepParams;
  const fieldSettings = isRecord(stepParams) ? stepParams.fieldSettings : undefined;
  const init = isRecord(fieldSettings) ? fieldSettings.init : undefined;
  const fieldPath = isRecord(init) ? init.fieldPath : undefined;
  if (fieldPath !== 'password') {
    return next;
  }

  const editItemSettings = isRecord(stepParams) ? stepParams.editItemSettings : undefined;
  if (isRecord(editItemSettings)) {
    delete editItemSettings.initialValue;
  }
  const subModels = next.subModels;
  const fieldModel = isRecord(subModels) ? subModels.field : undefined;
  const fieldProps = isRecord(fieldModel) ? fieldModel.props : undefined;
  if (isRecord(fieldProps)) {
    delete fieldProps.initialValue;
    delete fieldProps.defaultValue;
    delete fieldProps.value;
  }

  return next;
}

function normalizePersistedUserFormModel(tree: PersistedFlowModelTree, uid: string): PersistedFlowModelTree {
  if (uid !== ADMIN_PROFILE_CREATE_FORM_MODEL_UID) {
    return tree;
  }
  return cloneWithoutCreatePasswordDefaults(tree) as PersistedFlowModelTree;
}

async function ensurePersistedUserFormModel(options: {
  flowEngine: ReturnType<typeof useFlowEngine>;
  api: FlowEngineContext['api'];
  uid: string;
  fallbackTree: PersistedFlowModelTree;
}) {
  const { flowEngine, api, uid, fallbackTree } = options;
  const flowModels = api.resource('flowModels') as FlowModelsResource;
  let modelTree = (await flowEngine.modelRepository?.findOne({ uid })) as PersistedFlowModelTree | null | undefined;
  if (!modelTree) {
    await flowModels.save({
      values: fallbackTree,
    });
    modelTree = fallbackTree;
  }
  modelTree = normalizePersistedUserFormModel(modelTree, uid);
  return (await flowEngine.createModelAsync(withPrivateUserFormModel(modelTree, uid))) as LoadedUserFormModel;
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
      const loadedModel = await ensurePersistedUserFormModel({
        flowEngine,
        api: ctx.api,
        uid: formModelUid,
        fallbackTree,
      });
      if (viewCtx) {
        loadedModel.context.addDelegate(viewCtx);
      }
      setModel(loadedModel);
      return loadedModel;
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
