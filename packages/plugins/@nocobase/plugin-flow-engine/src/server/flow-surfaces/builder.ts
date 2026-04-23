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
import { getSingleNodeSubModel } from './service-utils';

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
const CALENDAR_QUICK_CREATE_ACTION_KEY = 'quickCreateAction';
const CALENDAR_EVENT_VIEW_ACTION_KEY = 'eventViewAction';
const CALENDAR_READONLY_ACTION_MODEL_USES = new Set([
  'CalendarNavActionModel',
  'CalendarTitleActionModel',
  'CalendarViewSelectActionModel',
]);

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
  flowRegistry?: Record<string, any>;
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
    ...(use === 'CalendarBlockModel' ? { uid: uid() } : {}),
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
    const gridDefaults = getSingleNodeSubModel(approvalBlockDefaults.subModels.grid);
    if (gridDefaults?.use) {
      model.subModels.grid = {
        uid: uid(),
        use: gridDefaults.use,
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
  } else if (use === 'CalendarBlockModel') {
    const blockUid = model.uid || uid();
    model.uid = blockUid;
    model.subModels = {
      [CALENDAR_QUICK_CREATE_ACTION_KEY]: buildCalendarPopupActionNode({
        actionKey: CALENDAR_QUICK_CREATE_ACTION_KEY,
        blockUid,
        resourceInit: normalizedResourceInit,
        popupSettings: model.props?.quickCreatePopupSettings,
      }),
      [CALENDAR_EVENT_VIEW_ACTION_KEY]: buildCalendarPopupActionNode({
        actionKey: CALENDAR_EVENT_VIEW_ACTION_KEY,
        blockUid,
        resourceInit: normalizedResourceInit,
        popupSettings: model.props?.eventPopupSettings,
      }),
    };
  }

  return assignClientKeysToUids(model, {});
}

function buildCalendarPopupActionNode(options: {
  actionKey: typeof CALENDAR_QUICK_CREATE_ACTION_KEY | typeof CALENDAR_EVENT_VIEW_ACTION_KEY;
  blockUid: string;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
}) {
  const actionUid = `${options.blockUid}-${options.actionKey}`;
  return {
    uid: actionUid,
    use:
      options.actionKey === CALENDAR_QUICK_CREATE_ACTION_KEY
        ? 'CalendarQuickCreateActionModel'
        : 'CalendarEventViewActionModel',
    stepParams: {
      popupSettings: {
        openView: buildCalendarPopupOpenView({
          actionUid,
          resourceInit: options.resourceInit,
          popupSettings: options.popupSettings,
        }),
      },
    },
  };
}

function buildCalendarPopupOpenView(options: {
  actionUid: string;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
}) {
  const defaults = _.pickBy(
    {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: options.actionUid,
      collectionName: options.resourceInit?.collectionName,
      dataSourceKey: options.resourceInit?.dataSourceKey || (options.resourceInit?.collectionName ? 'main' : undefined),
    },
    (value) => !_.isUndefined(value),
  );
  const current = _.cloneDeep(options.popupSettings || {});
  return _.pickBy(
    {
      ...defaults,
      ...current,
      uid: current.uid || defaults.uid,
      collectionName: current.collectionName || defaults.collectionName,
      dataSourceKey: current.dataSourceKey || defaults.dataSourceKey,
    },
    (value) => !_.isUndefined(value),
  );
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
  const tabTitle = options.tabTitle || '{{t("Details")}}';

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
  use: 'JSColumnModel' | 'JSItemModel' | 'DividerItemModel';
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
  const readonlyCalendarAction = CALENDAR_READONLY_ACTION_MODEL_USES.has(options.use);
  const props = _.merge(
    {},
    inferActionDefaultProps(options.use, options.catalogItem.scope),
    approvalDefaults?.props || {},
  );
  const normalizedProps = applyContainerActionStyle(props, options.containerUse);
  const stepParams: Record<string, any> = _.merge(
    {},
    _.cloneDeep(approvalDefaults?.stepParams || {}),
    readonlyCalendarAction
      ? {}
      : {
          buttonSettings: {
            general: pickButtonGeneralProps(normalizedProps),
          },
        },
  );
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
        title: '{{t("Delete record")}}',
        content: '{{t("Are you sure you want to delete it?")}}',
      },
    };
  }

  if (options.use === 'FormSubmitActionModel') {
    stepParams.submitSettings = {
      confirm: {
        enable: false,
        title: '{{t("Submit record")}}',
        content: '{{t("Are you sure you want to save it?")}}',
      },
    };
  }

  if (['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(options.use)) {
    stepParams.assignSettings = {
      confirm: {
        enable: false,
        title: options.use === 'BulkUpdateActionModel' ? '{{t("Bulk update")}}' : '{{t("Perform the Update record")}}',
        content: '{{t("Are you sure you want to perform the Update record action?")}}',
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
      title: '{{t("Add new")}}',
      icon: 'PlusOutlined',
    },
    ViewActionModel: {
      type: 'link',
      title: '{{t("View")}}',
      icon: 'EyeOutlined',
    },
    EditActionModel: {
      title: '{{t("Edit")}}',
      icon: 'EditOutlined',
    },
    PopupCollectionActionModel: {
      title: '{{t("Popup")}}',
      icon: 'ExportOutlined',
    },
    DeleteActionModel: {
      type: 'link',
      title: '{{t("Delete")}}',
      icon: 'DeleteOutlined',
    },
    UpdateRecordActionModel: {
      type: 'link',
      title: '{{t("Update record")}}',
      icon: 'EditOutlined',
    },
    BulkUpdateActionModel: {
      title: '{{t("Bulk update")}}',
      icon: 'EditOutlined',
    },
    FilterActionModel: {
      title: '{{t("Filter")}}',
      icon: 'FilterOutlined',
    },
    RefreshActionModel: {
      title: '{{t("Refresh")}}',
      icon: 'ReloadOutlined',
    },
    ExpandCollapseActionModel: {
      icon: 'DownOutlined',
    },
    BulkDeleteActionModel: {
      title: '{{t("Delete")}}',
      icon: 'DeleteOutlined',
    },
    BulkEditActionModel: {
      title: '{{t("Bulk edit")}}',
      icon: 'EditOutlined',
    },
    ExportActionModel: {
      title: '{{t("Export")}}',
      icon: 'DownloadOutlined',
    },
    ExportAttachmentActionModel: {
      title: '{{t("Export attachments")}}',
      icon: 'DownloadOutlined',
    },
    ImportActionModel: {
      title: '{{t("Import")}}',
      icon: 'UploadOutlined',
    },
    LinkActionModel: {
      type: 'link',
      title: '{{t("Link")}}',
    },
    UploadActionModel: {
      title: '{{t("Upload")}}',
      icon: 'UploadOutlined',
    },
    DuplicateActionModel: {
      type: 'link',
      title: '{{t("Duplicate")}}',
      icon: 'CopyOutlined',
    },
    AddChildActionModel: {
      type: 'link',
      title: '{{t("Add child")}}',
      icon: 'PlusOutlined',
    },
    TemplatePrintCollectionActionModel: {
      title: '{{t("Template print", { ns: "@nocobase/plugin-action-template-print" })}}',
      icon: 'PrinterOutlined',
    },
    TemplatePrintRecordActionModel: {
      type: 'link',
      title: '{{t("Template print", { ns: "@nocobase/plugin-action-template-print" })}}',
      icon: 'PrinterOutlined',
    },
    CollectionTriggerWorkflowActionModel: {
      title: '{{t("Trigger workflow", { ns: "@nocobase/plugin-workflow-custom-action-trigger" })}}',
      icon: 'PlayCircleOutlined',
    },
    RecordTriggerWorkflowActionModel: {
      type: 'link',
      title: '{{t("Trigger workflow", { ns: "@nocobase/plugin-workflow-custom-action-trigger" })}}',
      icon: 'PlayCircleOutlined',
    },
    FormTriggerWorkflowActionModel: {
      title: '{{t("Trigger workflow", { ns: "@nocobase/plugin-workflow-custom-action-trigger" })}}',
      icon: 'PlayCircleOutlined',
    },
    WorkbenchTriggerWorkflowActionModel: {
      title: '{{t("Trigger global workflow", { ns: "@nocobase/plugin-workflow-custom-action-trigger" })}}',
      icon: 'PlayCircleOutlined',
    },
    MailSendActionModel: {
      title: '{{t("Compose email", { ns: ["@nocobase/plugin-email-manager", "client"] })}}',
      icon: 'MailOutlined',
    },
    FormSubmitActionModel: {
      title: '{{t("Submit")}}',
      type: 'primary',
      htmlType: 'submit',
    },
    FilterFormSubmitActionModel: {
      title: '{{t("Filter")}}',
      type: 'primary',
    },
    FilterFormResetActionModel: {
      title: '{{t("Reset")}}',
    },
    FilterFormCollapseActionModel: {
      type: 'link',
      title: '{{t("Collapse button")}}',
    },
    CalendarTodayActionModel: {
      type: 'default',
      title: '{{t("Today", { ns: "calendar" })}}',
    },
    CalendarNavActionModel: {},
    CalendarTitleActionModel: {},
    CalendarViewSelectActionModel: {},
    JSCollectionActionModel: {
      title: '{{t("JS action")}}',
      icon: 'JavaScriptOutlined',
    },
    JSRecordActionModel: {
      type: 'link',
      title: '{{t("JS action")}}',
      icon: 'JavaScriptOutlined',
    },
    JSFormActionModel: {
      title: '{{t("JS action")}}',
      icon: 'JavaScriptOutlined',
    },
    JSItemActionModel: {
      title: '{{t("JS item")}}',
      icon: 'JavaScriptOutlined',
    },
    FilterFormJSActionModel: {
      title: '{{t("JS action")}}',
      icon: 'JavaScriptOutlined',
    },
    JSActionModel: {
      type: 'default',
      title: '{{t("JS action")}}',
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
  if (use === 'CalendarBlockModel') {
    return {
      props: {
        fieldNames: {
          id: 'id',
        },
        defaultView: 'month',
        enableQuickCreateEvent: true,
        weekStart: 1,
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
          title: '{{t("JS column")}}',
        },
        stepParams: {
          tableColumnSettings: {
            title: {
              title: '{{t("JS column")}}',
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
    case 'DividerItemModel':
      return {
        props: {
          label: '{{t("Divider")}}',
          orientation: 'left',
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
  const title =
    _.startCase(normalized)
      .replace(/\bJs\b/g, 'JS')
      .trim() || 'Action';
  return `{{t(${JSON.stringify(title)})}}`;
}
