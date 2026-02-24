import { FormBlockModel, Plugin } from '@nocobase/client';
import { FlowModelContext } from '@nocobase/flow-engine';
import { Alert, Button } from 'antd';
import { IDBPDatabase, openDB } from 'idb';
import React from 'react';
import { NAMESPACE, tExpr } from './locale';
import models from './models';

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
          // title: tExpr('Enable drafts'),
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        enabled: false,
      },
      async handler(ctx, params) {
        ctx.model.context.defineProperty('draftRepository', {
          get: () => new FormDraftRepository(ctx),
        });
        ctx.model.context.defineMethod('showDraftAlert', (message) => {
          console.log('showDraftAlert', message);
          ctx.model['decoratorProps'].beforeContent = (
            <Alert
              style={{ marginBottom: '1em' }}
              type="warning"
              action={
                <Button
                  ghost
                  size="small"
                  danger
                  onClick={() => {
                    ctx.draftRepository.delete();
                    ctx.form.resetFields();
                    ctx.model['decoratorProps'].beforeContent = null;
                  }}
                >
                  {ctx.t('Delete draft', { ns: NAMESPACE })}
                </Button>
              }
              description={ctx.t(message, { ns: NAMESPACE })}
            />
          );
        });
        if (!params.enabled) {
          await ctx.draftRepository.disable();
          return;
        }
        await ctx.draftRepository.connect();
        const draft = await ctx.draftRepository.get();
        if (!draft?.values || Object.keys(draft.values).length === 0) {
          await ctx.draftRepository.create();
          return;
        }
        const model = ctx.blockModel as FormBlockModel;
        model.form.setFieldsValue(draft.values || {});
        ctx.showDraftAlert(
          'This is an unsubmitted draft. You can continue editing and submit it, or click “Delete draft” to start over.',
        );
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
        if (ctx.draftRepository.disabled) {
          return;
        }
        await ctx.draftRepository.save(ctx.form.getFieldsValue());
        ctx.showDraftAlert(
          'Your draft has been saved. You can continue editing and submit it, or click “Delete Draft” to start over.',
        );
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
        if (ctx.draftRepository.disabled) {
          return;
        }
        await ctx.draftRepository.delete();
        ctx.model['decoratorProps'].beforeContent = null;
      },
    },
  },
});

class FormDraftRepository {
  uid: string;
  db: IDBPDatabase;
  #disabled = false;

  disable() {
    this.#disabled = true;
  }

  get disabled() {
    return this.#disabled;
  }

  constructor(protected ctx: FlowModelContext) {
    this.uid = ctx.model.uid + ':' + (ctx?.resource?.getFilterByTk() || '__new_record__');
  }

  async connect() {
    if (this.#disabled) {
      return;
    }
    this.db = await openDB('FormDraftsDB', 1, {
      upgrade(db) {
        db.createObjectStore('drafts', { keyPath: 'uid' });
      },
    });
  }

  async create() {
    if (this.#disabled) {
      return;
    }
    const draft = { uid: this.uid, values: {} };
    await this.db.put('drafts', draft);
  }

  async get() {
    if (this.#disabled) {
      return;
    }
    return this.db.get('drafts', this.uid);
  }

  async save(values: Record<string, any>) {
    if (this.#disabled) {
      return;
    }
    const safeValues = JSON.parse(JSON.stringify(values));
    await this.db.put('drafts', { uid: this.uid, values: safeValues });
  }

  async delete() {
    if (this.#disabled) {
      return;
    }
    await this.db.delete('drafts', this.uid);
  }
}

export class PluginFormDraftsClient extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);
  }
}

export default PluginFormDraftsClient;
