/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import _ from 'lodash';
import type { FlowSurfaceNodeDefaults } from '../types';

type ApprovalFieldTreeParams = {
  wrapperUse: string;
  fieldUse: string;
  fieldPath: string;
  dataSourceKey: string;
  collectionName: string;
  associationPathName?: string;
  filterFormInit?: Record<string, any>;
  wrapperProps?: Record<string, any>;
  fieldProps?: Record<string, any>;
  uid: string;
  innerUid: string;
  fieldDefaults?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
};

type ApprovalActionDefaults = {
  props?: Record<string, any>;
  stepParams?: Record<string, any>;
  subModels?: Record<string, any>;
};

const APPROVAL_CREATE_NEW_PATTERN_STEP_PARAMS = {
  patternSettings: {
    pattern: {
      pattern: 'createNew',
    },
  },
};

function buildFieldInitPayload(params: {
  dataSourceKey: string;
  collectionName: string;
  fieldPath: string;
  associationPathName?: string;
}) {
  return _.pickBy(
    {
      dataSourceKey: params.dataSourceKey,
      collectionName: params.collectionName,
      fieldPath: params.fieldPath,
      ...(params.associationPathName ? { associationPathName: params.associationPathName } : {}),
    },
    (value) => !_.isUndefined(value),
  );
}

export function buildApprovalFieldTree(params: ApprovalFieldTreeParams) {
  if (params.wrapperUse !== 'PatternFormItemModel') {
    return null;
  }

  const initPayload = buildFieldInitPayload(params);
  const wrapperStepParams: Record<string, any> = {
    fieldSettings: {
      init: initPayload,
    },
  };

  if (params.filterFormInit) {
    wrapperStepParams.filterFormItemSettings = {
      init: params.filterFormInit,
    };
  }

  return {
    wrapperUid: params.uid,
    innerUid: params.innerUid,
    model: {
      uid: params.uid,
      use: 'PatternFormItemModel',
      props: _.cloneDeep(params.wrapperProps || {}),
      stepParams: wrapperStepParams,
      subModels: {
        field: {
          uid: params.innerUid,
          use: 'PatternFormFieldModel',
          props: _.merge({}, _.cloneDeep(params.fieldDefaults?.props || {}), _.cloneDeep(params.fieldProps || {})),
          stepParams: _.merge({}, _.cloneDeep(params.fieldDefaults?.stepParams || {}), {
            fieldSettings: {
              init: initPayload,
            },
            fieldBinding: {
              use: params.fieldUse,
            },
          }),
        },
      },
    },
  };
}

export function buildApprovalBlockDefaults(use: string): FlowSurfaceNodeDefaults | null {
  switch (String(use || '').trim()) {
    case 'ApplyFormModel':
      return {
        stepParams: _.cloneDeep(APPROVAL_CREATE_NEW_PATTERN_STEP_PARAMS),
        subModels: {
          grid: {
            use: 'PatternFormGridModel',
          },
          actions: [
            {
              use: 'ApplyFormSubmitModel',
            },
          ],
        },
      };
    case 'ProcessFormModel':
      return {
        stepParams: _.cloneDeep(APPROVAL_CREATE_NEW_PATTERN_STEP_PARAMS),
        subModels: {
          grid: {
            use: 'PatternFormGridModel',
          },
        },
      };
    case 'ApprovalDetailsModel':
      return {
        subModels: {
          grid: {
            use: 'ApprovalDetailsGridModel',
          },
        },
      };
    default:
      return null;
  }
}

export function buildApprovalActionDefaults(use: string): ApprovalActionDefaults | null {
  switch (String(use || '').trim()) {
    case 'ApplyFormSubmitModel':
      return {
        props: {
          title: 'Submit',
          type: 'primary',
          htmlType: 'submit',
        },
      };
    case 'ApplyFormSaveDraftModel':
      return {
        props: {
          title: 'Save draft',
          type: 'default',
          htmlType: 'submit',
        },
      };
    case 'ApplyFormWithdrawModel':
      return {
        props: {
          title: 'Withdraw',
          type: 'default',
          htmlType: 'submit',
        },
      };
    case 'ProcessFormApproveModel':
      return {
        props: {
          title: 'Approve',
          type: 'primary',
        },
      };
    case 'ProcessFormRejectModel':
      return {
        props: {
          title: 'Reject',
          type: 'default',
          danger: true,
        },
      };
    case 'ProcessFormReturnModel':
      return {
        props: {
          title: 'Return',
          type: 'default',
        },
      };
    case 'ProcessFormDelegateModel':
      return {
        props: {
          title: 'Delegate',
          type: 'default',
        },
      };
    case 'ProcessFormAddAssigneeModel':
      return {
        props: {
          title: 'Add assignee',
          type: 'default',
        },
      };
    default:
      return null;
  }
}

export function buildApprovalInitiatorSurfaceTree(options: {
  dataSourceKey: string;
  collectionName: string;
  pageUid?: string;
  tabUid?: string;
  gridUid?: string;
}) {
  const pageUid = options.pageUid || uid();
  const tabUid = options.tabUid || uid();
  const gridUid = options.gridUid || uid();

  return {
    uid: pageUid,
    async: true,
    subType: 'object',
    use: 'TriggerChildPageModel',
    sortIndex: 0,
    flowRegistry: {},
    stepParams: {
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: false,
          title: `{{t("Initiator's interface", { ns: "workflow" })}}`,
        },
      },
      TriggerChildPageSettings: {
        init: {
          dataSourceKey: options.dataSourceKey,
          collectionName: options.collectionName,
        },
      },
    },
    subModels: {
      tabs: [
        {
          uid: tabUid,
          parentId: pageUid,
          use: 'TriggerChildPageTabModel',
          subKey: 'tabs',
          subType: 'array',
          sortIndex: 0,
          flowRegistry: {},
          stepParams: {
            pageTabSettings: {
              tab: {
                title: `{{t("Details")}}`,
              },
            },
          },
          subModels: {
            grid: {
              uid: gridUid,
              parentId: tabUid,
              async: true,
              use: 'TriggerBlockGridModel',
              subKey: 'grid',
              subType: 'object',
              sortIndex: 0,
              flowRegistry: {},
              filterManager: [],
            },
          },
        },
      ],
    },
  };
}

export function buildApprovalApproverSurfaceTree(options: {
  dataSourceKey: string;
  collectionName: string;
  pageUid?: string;
  tabUid?: string;
  gridUid?: string;
}) {
  const pageUid = options.pageUid || uid();
  const tabUid = options.tabUid || uid();
  const gridUid = options.gridUid || uid();

  return {
    uid: pageUid,
    async: true,
    subType: 'object',
    use: 'ApprovalChildPageModel',
    sortIndex: 0,
    flowRegistry: {},
    stepParams: {
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: false,
          title: `{{t("Approver's interface", { ns: "@nocobase/plugin-workflow-approval" })}}`,
        },
      },
      ApprovalChildPageSettings: {
        init: {
          dataSourceKey: options.dataSourceKey,
          collectionName: options.collectionName,
        },
      },
      resourceSettings: {
        init: {
          dataSourceKey: options.dataSourceKey,
          collectionName: options.collectionName,
        },
      },
    },
    subModels: {
      tabs: [
        {
          uid: tabUid,
          parentId: pageUid,
          use: 'ApprovalChildPageTabModel',
          subKey: 'tabs',
          subType: 'array',
          sortIndex: 0,
          flowRegistry: {},
          stepParams: {
            pageTabSettings: {
              tab: {
                title: `{{t("Details")}}`,
              },
            },
          },
          subModels: {
            grid: {
              uid: gridUid,
              parentId: tabUid,
              async: true,
              use: 'ApprovalBlockGridModel',
              subKey: 'grid',
              subType: 'object',
              sortIndex: 0,
              flowRegistry: {},
              filterManager: [],
            },
          },
        },
      ],
    },
  };
}

export function buildApprovalTaskCardSurfaceTree(options: {
  detailsUse: 'ApplyTaskCardDetailsModel' | 'ApprovalTaskCardDetailsModel';
  gridUse: 'ApplyTaskCardGridModel' | 'ApprovalTaskCardGridModel';
  dataSourceKey: string;
  collectionName: string;
  detailsUid?: string;
  gridUid?: string;
}) {
  const detailsUid = options.detailsUid || uid();
  const gridUid = options.gridUid || uid();

  return {
    uid: detailsUid,
    async: true,
    subType: 'object',
    use: options.detailsUse,
    sortIndex: 0,
    flowRegistry: {},
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: options.dataSourceKey,
          collectionName: options.collectionName,
        },
      },
      detailsSettings: {
        layout: {
          layout: 'horizontal',
        },
      },
    },
    subModels: {
      grid: {
        uid: gridUid,
        parentId: detailsUid,
        use: options.gridUse,
        subKey: 'grid',
        subType: 'object',
        sortIndex: 0,
        flowRegistry: {},
      },
    },
  };
}
