/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import { randomId } from '@nocobase/flow-engine';
import { DEFAULT_SUCCESS_MESSAGE, PUBLIC_FORM_PAGE_MODEL, PUBLIC_FORM_SUBMIT_ACTION_MODEL } from './constants';

export interface PublicFormRecord {
  key: string;
  title?: string;
  collection?: string;
  type?: string;
  description?: string;
  enabled?: boolean;
  password?: string;
  [key: string]: any;
}

export function parseCollectionValue(value?: string) {
  const keys = String(value || '').split(':');
  const collectionName = keys.pop() || '';
  const dataSourceKey = keys.pop() || 'main';
  return {
    dataSourceKey,
    collectionName,
  };
}

function createUid(prefix: string) {
  return randomId(prefix);
}

export function createPublicFormFlowModelTree(record: PublicFormRecord, t: (key: string) => string) {
  const { dataSourceKey, collectionName } = parseCollectionValue(record.collection);
  const key = record.key;
  const formTabUid = createUid('pft_');
  const successTabUid = createUid('pft_');

  return {
    uid: key,
    use: 'RouteModel',
    subModels: {
      page: {
        use: PUBLIC_FORM_PAGE_MODEL,
        props: {
          title: record.title,
          displayTitle: false,
          enableTabs: false,
          showFlowSettings: false,
        },
        stepParams: {
          pageSettings: {
            general: {
              displayTitle: false,
              enableTabs: false,
            },
          },
        },
        subModels: {
          tabs: [
            {
              uid: formTabUid,
              use: 'ChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: t('Configure form'),
                  },
                },
              },
              subModels: {
                grid: {
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        use: 'CreateFormModel',
                        stepParams: {
                          resourceSettings: {
                            init: {
                              dataSourceKey,
                              collectionName,
                            },
                          },
                        },
                        subModels: {
                          grid: {
                            use: 'FormGridModel',
                          },
                          actions: [
                            {
                              use: PUBLIC_FORM_SUBMIT_ACTION_MODEL,
                              stepParams: {
                                submitSettings: {
                                  saveResource: {
                                    requestConfig: {
                                      url: `${collectionName}:publicSubmit`,
                                    },
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              uid: successTabUid,
              use: 'ChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: t('After successful submission'),
                  },
                },
              },
              subModels: {
                grid: {
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        use: 'MarkdownBlockModel',
                        props: {
                          content: t(DEFAULT_SUCCESS_MESSAGE),
                        },
                        stepParams: {
                          markdownBlockSettings: {
                            editMarkdown: {
                              content: t(DEFAULT_SUCCESS_MESSAGE),
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
}

export async function ensurePublicFormFlowModel(
  flowEngine: FlowEngine,
  record: PublicFormRecord,
  t: (key: string) => string,
) {
  const key = record.key;
  if (!key) {
    throw new Error('[NocoBase] public form key is required before creating FlowModel tree.');
  }

  const existing = await flowEngine.loadModel({ uid: key, refresh: true });
  if (existing) {
    return existing;
  }

  const tree = createPublicFormFlowModelTree(record, t);
  await flowEngine.resolveModelTree(tree);
  const model = await flowEngine.createModelAsync(tree);
  await model.save();
  return model;
}
