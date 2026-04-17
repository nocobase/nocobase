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
import type { FlowSurfaceCatalogItem, FlowSurfaceNodeDefaults, FlowSurfaceNodeSpec } from './types';
import { resolveSupportedActionCatalogItem, resolveSupportedBlockCatalogItem } from './catalog';
import { CHART_DEFAULT_DATA_SOURCE_KEY } from './chart-config';
import { buildApprovalActionDefaults, buildApprovalBlockDefaults, buildApprovalFieldTree } from './approval';

type BuildFieldParams = {
  wrapperUse: string;
  fieldUse: string;
  fieldPath: string;
  dataSourceKey: string;
  collectionName: string;
  associationPathName?: string;
  filterFormInit?: Record<string, any>;
  wrapperProps?: Record<string, any>;
  fieldProps?: Record<string, any>;
  uid?: string;
  innerUid?: string;
};

const JS_BLOCK_DEFAULT_CODE = [
  '// Welcome to the JS block',
  'ctx.render(`',
  '  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; line-height: 1.6;">',
  '    <h2 style="color: #1890ff; margin: 0 0 12px 0; font-size: 24px; font-weight: 600;">JS Block</h2>',
  '    <p style="color: #666; margin: 0;">Replace this code with your custom JavaScript to build an interactive block.</p>',
  '  </div>',
  '`);',
].join('\n');

const JS_FIELD_DEFAULT_CODE = [
  'function JsReadonlyField() {',
  '  const React = ctx.React;',
  '  const { prefix, suffix, overflowMode } = ctx.model?.props || {};',
  "  const text = String(ctx.value ?? '');",
  "  const whiteSpace = overflowMode === 'wrap' ? 'pre-line' : 'nowrap';",
  '',
  '  return (',
  '    <span style={{ whiteSpace }}>',
  '      {prefix}',
  '      {text}',
  '      {suffix}',
  '    </span>',
  '  );',
  '}',
  '',
  'ctx.render(<JsReadonlyField />);',
].join('\n');

const JS_EDITABLE_FIELD_DEFAULT_CODE = [
  '// Render an editable antd Input via JSX and keep it in sync with form value.',
  'function JsEditableField() {',
  '  const React = ctx.React;',
  '  const { Input } = ctx.antd;',
  "  const [value, setValue] = React.useState(ctx.getValue?.() ?? '');",
  '',
  '  React.useEffect(() => {',
  "    const handler = (ev) => setValue(ev?.detail ?? '');",
  "    ctx.element?.addEventListener('js-field:value-change', handler);",
  "    return () => ctx.element?.removeEventListener('js-field:value-change', handler);",
  '  }, []);',
  '',
  '  const onChange = (e) => {',
  "    const v = e?.target?.value ?? '';",
  '    setValue(v);',
  '    ctx.setValue?.(v);',
  '  };',
  '',
  '  return <Input {...ctx.model.props} value={value} onChange={onChange} />;',
  '}',
  '',
  'ctx.render(<JsEditableField />);',
].join('\n');

const JS_ITEM_DEFAULT_CODE = [
  'function JsItem() {',
  '  return (',
  '    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif", lineHeight: 1.6 }}>',
  "      <h3 style={{ color: '#1890ff', margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>JS Item</h3>",
  "      <div style={{ color: '#555' }}>This area is rendered by your JavaScript code.</div>",
  '    </div>',
  '  );',
  '}',
  '',
  'ctx.render(<JsItem />);',
].join('\n');

const JS_COLUMN_DEFAULT_CODE = `ctx.render('<span class="nb-js-column">JS column</span>');`;

const JS_ACTION_DEFAULT_CODE_BY_USE: Record<string, string> = {
  JSCollectionActionModel: [
    'const rows = ctx.resource?.getSelectedRows?.() || [];',
    'if (!rows.length) {',
    "  ctx.message.warning('Please select data first.');",
    '} else {',
    "  ctx.message.success('Selected ' + rows.length + ' row(s).');",
    '}',
  ].join('\n'),
  JSRecordActionModel: [
    'if (!ctx.record) {',
    "  ctx.message.error('No record');",
    '} else {',
    "  ctx.message.success('Record ID: ' + (ctx.filterByTk ?? ctx.record?.id));",
    '}',
  ].join('\n'),
  JSFormActionModel: [
    'const values = ctx.form?.getFieldsValue?.() || {};',
    "ctx.message.success('Current form values: ' + JSON.stringify(values));",
  ].join('\n'),
  JSItemActionModel: [
    'const values = ctx.form?.getFieldsValue?.() || ctx.formValues || {};',
    "ctx.message.success('Current form values: ' + JSON.stringify(values));",
  ].join('\n'),
  FilterFormJSActionModel: '',
  JSActionModel: "ctx.message.info('Hello JS action.');",
};

function buildRunJsStepParams(code: string) {
  return {
    runJs: {
      version: 'v2',
      code,
    },
  };
}

export function buildPersistedRootPageModel(options: {
  pageUid?: string;
  pageTitle: string;
  routeId: string | number;
  enableTabs?: boolean;
  displayTitle?: boolean;
  pageDocumentTitle?: string;
}) {
  const pageUid = options.pageUid || uid();
  const enableTabs = !!options.enableTabs;
  const displayTitle = options.displayTitle !== false;

  // Modern page persistence only stores the RootPageModel anchor itself.
  // Route-backed tabs are rebuilt synthetically during readback.
  return {
    uid: pageUid,
    use: 'RootPageModel',
    props: {
      routeId: options.routeId,
      title: options.pageTitle,
      enableTabs,
      displayTitle,
    },
    stepParams: {
      pageSettings: {
        general: {
          title: options.pageTitle,
          displayTitle,
          enableTabs,
          documentTitle: options.pageDocumentTitle,
        },
      },
    },
  };
}

export function buildSyntheticRootPageTabModel(options: {
  uid: string;
  title: string;
  route: Record<string, any>;
  documentTitle?: string;
  icon?: string;
  use?: string;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
  flowRegistry?: Record<string, any>;
  grid?: Record<string, any> | null;
}) {
  const stepParams = _.cloneDeep(options.stepParams || {});

  return {
    uid: options.uid,
    use: options.use || 'RootPageTabModel',
    props: {
      ...(options.props || {}),
      route: _.cloneDeep(options.route),
      title: options.title,
      icon: options.icon,
    },
    decoratorProps: _.cloneDeep(options.decoratorProps || {}),
    flowRegistry: _.cloneDeep(options.flowRegistry || {}),
    stepParams: {
      ...stepParams,
      pageTabSettings: {
        ...(stepParams.pageTabSettings || {}),
        tab: {
          ...(stepParams.pageTabSettings?.tab || {}),
          title: options.title,
          icon: options.icon,
          documentTitle: options.documentTitle,
        },
      },
    },
    ...(options.grid ? { subModels: { grid: options.grid } } : {}),
  };
}

export function buildBlockTree(options: {
  type?: string;
  use?: string;
  containerUse?: string;
  resourceInit?: Record<string, any>;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
}) {
  const use = resolveSupportedBlockCatalogItem(
    {
      type: options.type,
      use: options.use,
      containerUse: options.containerUse,
    },
    {
      requireCreateSupported: true,
    },
  ).use;
  const defaults = buildBlockDefaults(use);
  const approvalBlockDefaults = buildApprovalBlockDefaults(use);
  const baseStepParams = _.merge(
    {},
    _.cloneDeep(defaults.stepParams || {}),
    _.cloneDeep(approvalBlockDefaults?.stepParams || {}),
    _.cloneDeep(options.stepParams || {}),
  );
  const normalizedResourceInit = _.pickBy(_.cloneDeep(options.resourceInit || {}), (value) => !_.isUndefined(value));
  if (use === 'ChartBlockModel') {
    _.unset(baseStepParams, 'resourceSettings');
    const currentConfigure = _.get(baseStepParams, ['chartSettings', 'configure']) || {};
    const nextConfigure = _.merge(
      {
        query: {
          mode: 'builder',
        },
        chart: {
          option: {
            mode: 'basic',
          },
        },
      },
      _.cloneDeep(currentConfigure),
    );
    if (Object.keys(normalizedResourceInit).length) {
      _.set(nextConfigure, ['query', 'mode'], 'builder');
      _.set(
        nextConfigure,
        ['query', 'collectionPath'],
        [normalizedResourceInit.dataSourceKey || CHART_DEFAULT_DATA_SOURCE_KEY, normalizedResourceInit.collectionName],
      );
      _.unset(nextConfigure, ['query', 'resource']);
    }
    _.set(baseStepParams, ['chartSettings', 'configure'], nextConfigure);
  } else if (Object.keys(normalizedResourceInit).length) {
    _.set(baseStepParams, ['resourceSettings', 'init'], normalizedResourceInit);
  }

  const model: FlowSurfaceNodeSpec = {
    use,
    ...(typeof approvalBlockDefaults?.async === 'boolean' ? { async: approvalBlockDefaults.async } : {}),
    props: _.merge(
      {},
      _.cloneDeep(defaults.props || {}),
      _.cloneDeep(approvalBlockDefaults?.props || {}),
      _.cloneDeep(options.props || {}),
    ),
    decoratorProps: _.merge(
      {},
      _.cloneDeep(defaults.decoratorProps || {}),
      _.cloneDeep(approvalBlockDefaults?.decoratorProps || {}),
      _.cloneDeep(options.decoratorProps || {}),
    ),
    stepParams: baseStepParams,
  };
  const flowRegistry = _.merge(
    {},
    _.cloneDeep(defaults.flowRegistry || {}),
    _.cloneDeep(approvalBlockDefaults?.flowRegistry || {}),
    _.cloneDeep(options.flowRegistry || {}),
  );
  if (Object.keys(flowRegistry).length) {
    model.flowRegistry = flowRegistry;
  }

  if (approvalBlockDefaults?.subModels) {
    model.subModels = {};
    if (approvalBlockDefaults.subModels.grid?.use) {
      model.subModels.grid = {
        uid: uid(),
        use: approvalBlockDefaults.subModels.grid.use,
      };
    }
    if (Array.isArray(approvalBlockDefaults.subModels.actions) && approvalBlockDefaults.subModels.actions.length) {
      model.subModels.actions = approvalBlockDefaults.subModels.actions.map((action) => ({
        uid: uid(),
        ...buildActionTree({
          use: action.use,
          containerUse: use,
        }),
      }));
    }
  } else if (use === 'TableBlockModel') {
    model.subModels = {
      columns: [buildCanonicalTableActionsColumnNode()],
    };
  } else if (['FormBlockModel', 'CreateFormModel', 'EditFormModel', 'AssignFormModel'].includes(use)) {
    model.subModels = {
      grid: {
        uid: uid(),
        use: use === 'AssignFormModel' ? 'AssignFormGridModel' : 'FormGridModel',
      },
    };
  } else if (use === 'DetailsBlockModel') {
    model.subModels = {
      grid: {
        uid: uid(),
        use: 'DetailsGridModel',
      },
    };
  } else if (use === 'FilterFormBlockModel') {
    model.subModels = {
      grid: {
        uid: uid(),
        use: 'FilterFormGridModel',
      },
    };
  } else if (use === 'ListBlockModel') {
    model.subModels = {
      item: {
        uid: uid(),
        use: 'ListItemModel',
        subModels: {
          grid: {
            uid: uid(),
            use: 'DetailsGridModel',
          },
        },
      },
    };
  } else if (use === 'GridCardBlockModel') {
    model.subModels = {
      item: {
        uid: uid(),
        use: 'GridCardItemModel',
        subModels: {
          grid: {
            uid: uid(),
            use: 'DetailsGridModel',
          },
        },
      },
    };
  }

  return assignClientKeysToUids(model, {});
}

export function buildPopupPageTree(options: {
  pageUid?: string;
  tabUid?: string;
  gridUid?: string;
  pageTitle?: string;
  tabTitle?: string;
  displayTitle?: boolean;
  enableTabs?: boolean;
}) {
  const pageUid = options.pageUid || uid();
  const tabUid = options.tabUid || uid();
  const gridUid = options.gridUid || uid();
  const displayTitle = options.displayTitle === true;
  const enableTabs = options.enableTabs !== false;
  const tabTitle = options.tabTitle || 'Details';

  return {
    uid: pageUid,
    use: 'ChildPageModel',
    props: {
      ...(options.pageTitle ? { title: options.pageTitle } : {}),
      displayTitle,
      enableTabs,
    },
    stepParams: {
      pageSettings: {
        general: {
          ...(options.pageTitle ? { title: options.pageTitle } : {}),
          displayTitle,
          enableTabs,
        },
      },
    },
    subModels: {
      tabs: [
        {
          uid: tabUid,
          use: 'ChildPageTabModel',
          props: {
            title: tabTitle,
          },
          stepParams: {
            pageTabSettings: {
              tab: {
                title: tabTitle,
              },
            },
          },
          subModels: {
            grid: {
              uid: gridUid,
              use: 'BlockGridModel',
            },
          },
        },
      ],
    },
  };
}

export function buildFieldTree(params: BuildFieldParams) {
  const wrapperUid = params.uid || uid();
  const innerUid = params.innerUid || uid();
  const fieldDefaults = getStandaloneFieldDefaults(params.fieldUse);
  const approvalTree = buildApprovalFieldTree({
    ...params,
    uid: wrapperUid,
    innerUid,
    fieldDefaults,
  });
  if (approvalTree) {
    return {
      wrapperUid: approvalTree.wrapperUid,
      innerUid: approvalTree.innerUid,
      model: approvalTree.model,
    };
  }
  const initPayload = _.pickBy(
    {
      dataSourceKey: params.dataSourceKey,
      collectionName: params.collectionName,
      fieldPath: params.fieldPath,
      ...(params.associationPathName ? { associationPathName: params.associationPathName } : {}),
    },
    (value) => !_.isUndefined(value),
  );
  const stepParams: Record<string, any> = {
    fieldSettings: {
      init: initPayload,
    },
  };

  if (params.filterFormInit) {
    stepParams.filterFormItemSettings = {
      init: params.filterFormInit,
    };
  }

  return {
    wrapperUid,
    innerUid,
    model: {
      uid: wrapperUid,
      use: params.wrapperUse,
      props: _.cloneDeep(params.wrapperProps || {}),
      stepParams,
      subModels: {
        field: {
          uid: innerUid,
          use: params.fieldUse,
          props: _.cloneDeep(params.fieldProps || {}),
          stepParams: _.merge(
            {},
            fieldDefaults.stepParams || {},
            _.cloneDeep({
              fieldSettings: {
                init: initPayload,
              },
            }),
          ),
        },
      },
    },
  };
}

export function buildStandaloneFieldNode(options: {
  use: 'JSColumnModel' | 'JSItemModel';
  uid?: string;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
}) {
  const defaults = getStandaloneFieldDefaults(options.use);
  return {
    uid: options.uid || uid(),
    use: options.use,
    props: _.merge({}, _.cloneDeep(defaults.props || {}), _.cloneDeep(options.props || {})),
    decoratorProps: _.merge({}, _.cloneDeep(defaults.decoratorProps || {}), _.cloneDeep(options.decoratorProps || {})),
    stepParams: _.merge({}, _.cloneDeep(defaults.stepParams || {}), _.cloneDeep(options.stepParams || {})),
  };
}

export function buildActionTree(options: {
  type?: string;
  use?: string;
  containerUse?: string;
  resourceInit?: Record<string, any>;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
  flowRegistry?: Record<string, any>;
}) {
  const catalogItem = resolveSupportedActionCatalogItem(
    {
      type: options.type,
      use: options.use,
      containerUse: options.containerUse,
    },
    {
      requireCreateSupported: true,
    },
  );
  const use = catalogItem.use;
  const defaults = buildActionDefaults({
    use,
    catalogItem,
    containerUse: options.containerUse,
    resourceInit: options.resourceInit,
  });
  const props = _.merge({}, _.cloneDeep(defaults.props || {}), _.cloneDeep(options.props || {}));
  const stepParams = _.merge({}, _.cloneDeep(defaults.stepParams || {}), _.cloneDeep(options.stepParams || {}));
  if (_.isPlainObject(stepParams?.buttonSettings?.general)) {
    stepParams.buttonSettings.general = _.merge({}, stepParams.buttonSettings.general, pickButtonGeneralProps(props));
  }

  return {
    use,
    props,
    decoratorProps: _.merge({}, _.cloneDeep(defaults.decoratorProps || {}), _.cloneDeep(options.decoratorProps || {})),
    stepParams,
    flowRegistry: _.merge({}, _.cloneDeep(defaults.flowRegistry || {}), _.cloneDeep(options.flowRegistry || {})),
    ...(defaults.subModels ? { subModels: _.cloneDeep(defaults.subModels) } : {}),
  };
}

export function buildCanonicalTableActionsColumnNode(
  options: {
    uid?: string;
    props?: Record<string, any>;
    decoratorProps?: Record<string, any>;
    stepParams?: Record<string, any>;
    flowRegistry?: Record<string, any>;
  } = {},
) {
  return {
    uid: options.uid || uid(),
    use: 'TableActionsColumnModel',
    props: _.cloneDeep(options.props || {}),
    decoratorProps: _.cloneDeep(options.decoratorProps || {}),
    stepParams: _.merge(
      {},
      {
        tableColumnSettings: {
          title: {
            title: '{{t("Actions")}}',
          },
        },
      },
      _.cloneDeep(options.stepParams || {}),
    ),
    flowRegistry: _.cloneDeep(options.flowRegistry || {}),
  };
}

function pickButtonGeneralProps(props: Record<string, any>) {
  return _.pickBy(
    _.pick(props || {}, ['title', 'tooltip', 'icon', 'type', 'danger', 'color']),
    (value) => !_.isUndefined(value),
  );
}

export function assignClientKeysToUids(
  spec: FlowSurfaceNodeSpec,
  clientKeyToUid: Record<string, string>,
): FlowSurfaceNodeSpec {
  const next = _.cloneDeep(spec);
  const walk = (node: FlowSurfaceNodeSpec) => {
    if (!node.uid) {
      node.uid = uid();
    }
    if (node.clientKey) {
      clientKeyToUid[node.clientKey] = node.uid;
    }
    Object.values(node.subModels || {}).forEach((value) => {
      _.castArray(value as any).forEach((child) => walk(child as FlowSurfaceNodeSpec));
    });
  };
  walk(next);
  return next;
}

function buildActionDefaults(options: {
  use: string;
  catalogItem: FlowSurfaceCatalogItem;
  containerUse?: string;
  resourceInit?: Record<string, any>;
}): FlowSurfaceNodeDefaults {
  const approvalDefaults = buildApprovalActionDefaults(options.use);
  const props = _.merge(
    {},
    inferActionDefaultProps(options.use, options.catalogItem.scope),
    approvalDefaults?.props || {},
  );
  const normalizedProps = applyContainerActionStyle(props, options.containerUse);
  const stepParams: Record<string, any> = _.merge({}, _.cloneDeep(approvalDefaults?.stepParams || {}), {
    buttonSettings: {
      general: pickButtonGeneralProps(normalizedProps),
    },
  });
  const subModels: Record<string, any> = _.cloneDeep(approvalDefaults?.subModels || {});

  if (approvalDefaults) {
    return {
      props: normalizedProps,
      stepParams,
      ...(Object.keys(subModels).length ? { subModels } : {}),
    };
  }

  if (
    [
      'AddNewActionModel',
      'ViewActionModel',
      'EditActionModel',
      'PopupCollectionActionModel',
      'DuplicateActionModel',
      'AddChildActionModel',
      'MailSendActionModel',
    ].includes(options.use)
  ) {
    const popupSourceId = inferPopupActionSourceId(options.resourceInit);
    stepParams.popupSettings = {
      openView: {
        mode: 'drawer',
        size: 'medium',
        pageModelClass: 'ChildPageModel',
        ...(options.resourceInit?.dataSourceKey ? { dataSourceKey: options.resourceInit.dataSourceKey } : {}),
        ...(options.resourceInit?.collectionName ? { collectionName: options.resourceInit.collectionName } : {}),
        ...(options.resourceInit?.associationName ? { associationName: options.resourceInit.associationName } : {}),
        ...(popupSourceId ? { sourceId: popupSourceId } : {}),
      },
    };
  }

  if (options.use === 'DeleteActionModel' || options.use === 'BulkDeleteActionModel') {
    stepParams.deleteSettings = {
      confirm: {
        enable: true,
        title: 'Delete record',
        content: 'Are you sure you want to delete it?',
      },
    };
  }

  if (options.use === 'FormSubmitActionModel') {
    stepParams.submitSettings = {
      confirm: {
        enable: false,
        title: 'Submit record',
        content: 'Are you sure you want to save it?',
      },
    };
  }

  if (['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(options.use)) {
    stepParams.assignSettings = {
      confirm: {
        enable: false,
        title: options.use === 'BulkUpdateActionModel' ? 'Perform the Bulk update' : 'Perform the Update record',
        content:
          options.use === 'BulkUpdateActionModel'
            ? 'Are you sure you want to perform the Bulk update action?'
            : 'Are you sure you want to perform the Update record action?',
      },
      assignFieldValues: {
        assignedValues: {},
      },
    };
    stepParams.apply = {
      apply: {
        assignedValues: {},
      },
    };
    subModels.assignForm = {
      uid: uid(),
      use: 'AssignFormModel',
      stepParams: {
        resourceSettings: {
          init: _.cloneDeep(options.resourceInit || {}),
        },
      },
      subModels: {
        grid: {
          uid: uid(),
          use: 'AssignFormGridModel',
        },
      },
    };
  }

  if (JS_ACTION_DEFAULT_CODE_BY_USE[options.use] !== undefined) {
    stepParams.clickSettings = buildRunJsStepParams(JS_ACTION_DEFAULT_CODE_BY_USE[options.use]);
  }

  return {
    props: normalizedProps,
    stepParams,
    ...(Object.keys(subModels).length ? { subModels } : {}),
  };
}

function inferPopupActionSourceId(resourceInit?: Record<string, any>) {
  if (!resourceInit?.associationName) {
    return undefined;
  }
  const sourceId = typeof resourceInit?.sourceId === 'string' ? resourceInit.sourceId.trim() : resourceInit?.sourceId;
  if (!sourceId) {
    return undefined;
  }
  if (sourceId === '{{ctx.view.inputArgs.filterByTk}}') {
    return '{{ctx.view.inputArgs.sourceId}}';
  }
  return sourceId;
}

function inferActionDefaultProps(use: string, scope?: FlowSurfaceCatalogItem['scope']) {
  const map: Record<string, Record<string, any>> = {
    AddNewActionModel: {
      type: 'primary',
      title: 'Add new',
      icon: 'PlusOutlined',
    },
    ViewActionModel: {
      type: 'link',
      title: 'View',
      icon: 'EyeOutlined',
    },
    EditActionModel: {
      title: 'Edit',
      icon: 'EditOutlined',
    },
    PopupCollectionActionModel: {
      title: 'Popup',
      icon: 'ExportOutlined',
    },
    DeleteActionModel: {
      type: 'link',
      title: 'Delete',
      icon: 'DeleteOutlined',
    },
    UpdateRecordActionModel: {
      type: 'link',
      title: 'Update record',
      icon: 'EditOutlined',
    },
    BulkUpdateActionModel: {
      title: 'Bulk update',
      icon: 'EditOutlined',
    },
    FilterActionModel: {
      title: 'Filter',
      icon: 'FilterOutlined',
    },
    RefreshActionModel: {
      title: 'Refresh',
      icon: 'ReloadOutlined',
    },
    ExpandCollapseActionModel: {
      title: 'Expand/Collapse',
      icon: 'DownOutlined',
    },
    BulkDeleteActionModel: {
      title: 'Delete',
      icon: 'DeleteOutlined',
    },
    BulkEditActionModel: {
      title: 'Bulk edit',
      icon: 'EditOutlined',
    },
    ExportActionModel: {
      title: 'Export',
      icon: 'DownloadOutlined',
    },
    ExportAttachmentActionModel: {
      title: 'Export attachments',
      icon: 'DownloadOutlined',
    },
    ImportActionModel: {
      title: 'Import',
      icon: 'UploadOutlined',
    },
    LinkActionModel: {
      type: 'link',
      title: 'Link',
    },
    UploadActionModel: {
      title: 'Upload',
      icon: 'UploadOutlined',
    },
    DuplicateActionModel: {
      type: 'link',
      title: 'Duplicate',
      icon: 'CopyOutlined',
    },
    AddChildActionModel: {
      type: 'link',
      title: 'Add child',
      icon: 'PlusOutlined',
    },
    TemplatePrintCollectionActionModel: {
      title: 'Template print',
      icon: 'PrinterOutlined',
    },
    TemplatePrintRecordActionModel: {
      type: 'link',
      title: 'Template print',
      icon: 'PrinterOutlined',
    },
    CollectionTriggerWorkflowActionModel: {
      title: 'Trigger workflow',
      icon: 'PlayCircleOutlined',
    },
    RecordTriggerWorkflowActionModel: {
      type: 'link',
      title: 'Trigger workflow',
      icon: 'PlayCircleOutlined',
    },
    FormTriggerWorkflowActionModel: {
      title: 'Trigger workflow',
      icon: 'PlayCircleOutlined',
    },
    WorkbenchTriggerWorkflowActionModel: {
      title: 'Trigger workflow',
      icon: 'PlayCircleOutlined',
    },
    MailSendActionModel: {
      title: 'Compose email',
      icon: 'MailOutlined',
    },
    FormSubmitActionModel: {
      title: 'Submit',
      type: 'primary',
      htmlType: 'submit',
    },
    FilterFormSubmitActionModel: {
      title: 'Filter',
      type: 'primary',
    },
    FilterFormResetActionModel: {
      title: 'Reset',
    },
    FilterFormCollapseActionModel: {
      type: 'link',
      title: 'Collapse button',
    },
    JSCollectionActionModel: {
      title: 'JS action',
      icon: 'JavaScriptOutlined',
    },
    JSRecordActionModel: {
      type: 'link',
      title: 'JS action',
      icon: 'JavaScriptOutlined',
    },
    JSFormActionModel: {
      title: 'JS action',
      icon: 'JavaScriptOutlined',
    },
    JSItemActionModel: {
      title: 'JS item',
      icon: 'JavaScriptOutlined',
    },
    FilterFormJSActionModel: {
      title: 'JS action',
      icon: 'JavaScriptOutlined',
    },
    JSActionModel: {
      type: 'default',
      title: 'JS action',
      icon: 'JavaScriptOutlined',
    },
  };

  return _.cloneDeep(
    map[use] || {
      title: humanizeActionTitle(use),
      ...(scope === 'record' ? { type: 'link' } : { type: 'default' }),
    },
  );
}

function applyContainerActionStyle(props: Record<string, any>, containerUse?: string) {
  if (containerUse === 'TableActionsColumnModel') {
    return {
      ...props,
      type: 'link',
      icon: null,
    };
  }

  if (containerUse === 'DetailsBlockModel') {
    return {
      ...props,
      type: 'default',
    };
  }

  return props;
}

function buildBlockDefaults(use: string): FlowSurfaceNodeDefaults {
  if (use === 'JSBlockModel') {
    return {
      stepParams: {
        jsSettings: buildRunJsStepParams(JS_BLOCK_DEFAULT_CODE),
      },
    };
  }
  if (use === 'ChartBlockModel') {
    return {
      stepParams: {
        chartSettings: {
          configure: {
            query: {
              mode: 'builder',
            },
            chart: {
              option: {
                mode: 'basic',
              },
            },
          },
        },
      },
    };
  }
  return {};
}

function getStandaloneFieldDefaults(use: string): FlowSurfaceNodeDefaults {
  switch (use) {
    case 'JSFieldModel':
      return {
        stepParams: {
          jsSettings: buildRunJsStepParams(JS_FIELD_DEFAULT_CODE),
        },
      };
    case 'JSEditableFieldModel':
      return {
        stepParams: {
          jsSettings: buildRunJsStepParams(JS_EDITABLE_FIELD_DEFAULT_CODE),
        },
      };
    case 'JSColumnModel':
      return {
        props: {
          title: 'JS column',
        },
        stepParams: {
          tableColumnSettings: {
            title: {
              title: 'JS column',
            },
          },
          jsSettings: buildRunJsStepParams(JS_COLUMN_DEFAULT_CODE),
        },
      };
    case 'JSItemModel':
      return {
        stepParams: {
          jsSettings: buildRunJsStepParams(JS_ITEM_DEFAULT_CODE),
        },
      };
    default:
      return {};
  }
}

function humanizeActionTitle(use: string) {
  const normalized = String(use || '')
    .replace(/ActionModel$/, '')
    .replace(/(Collection|Record|Form|Workbench)$/, '');
  return (
    _.startCase(normalized)
      .replace(/\bJs\b/g, 'JS')
      .trim() || 'Action'
  );
}
