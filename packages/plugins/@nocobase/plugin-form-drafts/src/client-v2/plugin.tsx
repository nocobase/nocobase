/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { FormBlockModel, Plugin } from '@nocobase/client-v2';
import type { FlowModelContext } from '@nocobase/flow-engine';
import { Alert, Button, theme } from 'antd';
import React from 'react';
import { FormDraftRepository, type FormDraftValues } from './formDraftRepository';
import { NAMESPACE, tExpr } from './locale';

const RESTORED_DRAFT_MESSAGE =
  'This is an unsubmitted draft. You can continue editing and submit it, or click “Delete draft” to start over.';
const SAVED_DRAFT_MESSAGE =
  'Your draft has been saved. You can continue editing and submit it, or click “Delete Draft” to start over.';

type DecoratedFormModel = {
  uid: string;
  context: FlowModelContext;
  setDecoratorProps?: (props: { beforeContent: React.ReactNode | null }) => void;
  decoratorProps?: {
    beforeContent?: React.ReactNode | null;
  };
};

type DraftFlowContext = FlowModelContext & {
  model: FlowModelContext['model'] & DecoratedFormModel;
  draftRepository: FormDraftRepository;
  form: {
    getFieldsValue: () => FormDraftValues;
    resetFields: () => void;
  };
  setFormValues: (values: FormDraftValues) => Promise<void> | void;
  showDraftAlert: (message: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type DraftAlertProps = {
  message: string;
  onDelete: () => Promise<void>;
  t: DraftFlowContext['t'];
};

function setBeforeContent(model: DecoratedFormModel, beforeContent: React.ReactNode | null) {
  if (typeof model.setDecoratorProps === 'function') {
    model.setDecoratorProps({ beforeContent });
    return;
  }
  if (model.decoratorProps) {
    model.decoratorProps.beforeContent = beforeContent;
  }
}

function DraftAlert({ message, onDelete, t }: DraftAlertProps) {
  const { token } = theme.useToken();
  return (
    <Alert
      style={{ marginBlockEnd: token.margin }}
      type="warning"
      action={
        <Button
          ghost
          size="small"
          danger
          onClick={async () => {
            await onDelete();
          }}
        >
          {t('Delete draft', { ns: NAMESPACE })}
        </Button>
      }
      description={t(message, { ns: NAMESPACE })}
    />
  );
}

FormBlockModel.registerFlow({
  key: 'draftCreateFlow',
  title: tExpr('Draft settings'),
  on: 'beforeRender',
  sort: 10000,
  steps: {
    createDraft: {
      title: tExpr('Enable drafts'),
      uiMode: {
        type: 'switch',
        key: 'enabled',
      },
      uiSchema: {
        enabled: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        enabled: false,
      },
      async handler(ctx, params) {
        const draftCtx = ctx as DraftFlowContext;
        draftCtx.model.context.defineProperty('draftRepository', {
          get: () => new FormDraftRepository(draftCtx),
        });
        draftCtx.model.context.defineMethod('showDraftAlert', (message: string) => {
          setBeforeContent(
            draftCtx.model,
            <DraftAlert
              message={message}
              t={draftCtx.t}
              onDelete={async () => {
                await draftCtx.draftRepository.delete();
                draftCtx.form.resetFields();
                setBeforeContent(draftCtx.model, null);
              }}
            />,
          );
        });
        if (!params.enabled) {
          draftCtx.draftRepository.disable();
          return;
        }
        await draftCtx.draftRepository.connect();
        const draft = await draftCtx.draftRepository.get();
        if (!draft?.values || Object.keys(draft.values).length === 0) {
          await draftCtx.draftRepository.create();
          return;
        }
        await draftCtx.setFormValues(draft.values);
        draftCtx.showDraftAlert(RESTORED_DRAFT_MESSAGE);
      },
    },
  },
});

FormBlockModel.registerFlow({
  key: 'draftSaveFlow',
  on: 'formValuesChange',
  steps: {
    saveDraft: {
      async handler(ctx) {
        const draftCtx = ctx as DraftFlowContext;
        if (draftCtx.draftRepository.disabled) {
          return;
        }
        await draftCtx.draftRepository.save(draftCtx.form.getFieldsValue());
        draftCtx.showDraftAlert(SAVED_DRAFT_MESSAGE);
      },
    },
  },
});

FormBlockModel.registerFlow({
  key: 'deleteDraftFlow',
  on: 'formSubmitSuccess',
  steps: {
    deleteDraft: {
      async handler(ctx) {
        const draftCtx = ctx as DraftFlowContext;
        if (draftCtx.draftRepository.disabled) {
          return;
        }
        await draftCtx.draftRepository.delete();
        setBeforeContent(draftCtx.model, null);
      },
    },
  },
});

export class PluginFormDraftsClient extends Plugin<Record<string, never>, Application> {}

export default PluginFormDraftsClient;
