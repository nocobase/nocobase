/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';
import _ from 'lodash';
import type { FormalFlowSurfaceBlockKey } from '../flow-surfaces/support-matrix';

export const FLOW_SURFACE_FIXTURE_ROOT = path.resolve(__dirname, 'flow-surfaces-fixtures');

const NOISY_KEYS = new Set([
  'id',
  'uid',
  'schemaUid',
  'routeId',
  'tabSchemaName',
  'sort',
  'createdAt',
  'updatedAt',
  'createdById',
  'updatedById',
]);

export type FlowSurfaceFixtureBundle = {
  canonical: Record<string, any>;
  refs: Record<string, any>;
  rawPersisted: Record<string, any>;
  readback: Record<string, any>;
};

type AliasState = {
  aliases: Set<string>;
  counts: Record<string, number>;
  topLevelTabIndex: number;
};

type FlowSurfaceFixtureInputs =
  | {
      rawPersisted?: any;
      readback?: any;
    }
  | any;

type FlowSurfaceFixtureLayer = keyof FlowSurfaceFixtureBundle;

export function createFlowSurfaceFixture(input: FlowSurfaceFixtureInputs): FlowSurfaceFixtureBundle {
  const rawPersisted = toPlainObject(extractRawPersisted(input));
  const readback = toPlainObject(extractReadback(input));
  const canonicalSource = materializeCanonicalSource(readback) || materializeCanonicalSource(rawPersisted);
  const normalized = normalizeCanonicalSource(canonicalSource);

  return {
    canonical: normalized.canonical,
    refs: normalized.refs,
    rawPersisted,
    readback,
  };
}

export function createCanonicalFromReadback(readback: any) {
  return normalizeCanonicalSource(materializeCanonicalSource(readback));
}

export function createCanonicalFromRawPersisted(rawPersisted: any) {
  return normalizeCanonicalSource(materializeCanonicalSource(rawPersisted));
}

export function createCreateParityTree(input: FlowSurfaceFixtureInputs | FlowSurfaceFixtureBundle) {
  const bundle = isFixtureBundle(input) ? input : createFlowSurfaceFixture(input);
  return replaceEmbeddedRefs(toPlainObject(bundle.canonical?.tree), buildRefPlaceholderMap(bundle.refs));
}

export function readCreateParityFixtureTree(name: string) {
  return createCreateParityTree(readFixtureBundle(name));
}

export function readCreateParityFixtureExpectation(formalKey: FormalFlowSurfaceBlockKey, name: string) {
  return extractCreateParityFixtureExpectation(formalKey, readCreateParityFixtureTree(name));
}

export function readCanonicalFixture(name: string) {
  const filepath = fixtureFilePath(name, 'canonical');
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

export function readFixtureCanonicalTree(name: string) {
  return readFixtureBundle(name).canonical?.tree;
}

export function createCanonicalTreeFromReadback(readback: any) {
  return createFlowSurfaceFixture(readback).canonical?.tree;
}

export function projectFormalBlockCreateParityTree(formalKey: FormalFlowSurfaceBlockKey, tree: any) {
  const projected = (() => {
    switch (formalKey) {
      case 'table':
        return projectTableBlock(tree);
      case 'calendar':
        return projectCalendarBlock(tree);
      case 'kanban':
        return projectKanbanBlock(tree);
      case 'create-form':
        return projectCreateFormBlock(tree);
      case 'edit-form':
        return projectEditFormBlock(tree);
      case 'details':
        return projectDetailsBlock(tree);
      case 'filter-form':
        return projectFilterFormBlock(tree);
      case 'list':
        return projectListLikeBlock(tree);
      case 'grid-card':
        return projectGridCardLikeBlock(tree);
      case 'js-block':
      case 'markdown':
      case 'iframe':
      case 'chart':
      case 'action-panel':
        return projectStaticBlock(tree);
      default:
        throw new Error(`Unsupported formal flow surface create parity key: ${formalKey}`);
    }
  })();

  return stripCreateParityAliases(projected);
}

export function extractCreateParityFixtureExpectation(formalKey: FormalFlowSurfaceBlockKey, tree: any) {
  const extracted = (() => {
    switch (formalKey) {
      case 'table':
        return extractFixtureTableBlock(tree);
      case 'calendar':
        return extractFixtureCalendarBlock(tree);
      case 'kanban':
        return extractFixtureKanbanBlock(tree);
      case 'create-form':
        return extractFixtureCreateFormBlock(tree);
      case 'edit-form':
        return extractFixtureEditFormBlock(tree);
      case 'details':
        return extractFixtureDetailsBlock(tree);
      case 'filter-form':
        return extractFixtureFilterFormBlock(tree);
      case 'list':
        return extractFixtureListLikeBlock(tree);
      case 'grid-card':
        return extractFixtureGridCardLikeBlock(tree);
      case 'js-block':
      case 'markdown':
      case 'iframe':
      case 'chart':
      case 'action-panel':
        return extractFixtureStaticBlock(tree);
      default:
        throw new Error(`Unsupported formal flow surface fixture expectation key: ${formalKey}`);
    }
  })();

  return stripCreateParityAliases(extracted);
}

export function readFixtureBundle(name: string): FlowSurfaceFixtureBundle {
  const rawPersisted = readFixtureLayer(name, 'rawPersisted');
  const readback = readFixtureLayer(name, 'readback');
  const refs = readFixtureLayer(name, 'refs');
  const canonical = readFixtureLayer(name, 'canonical');

  return {
    rawPersisted,
    readback,
    refs,
    canonical,
  };
}

export function writeFixtureBundle(name: string, bundle: FlowSurfaceFixtureBundle) {
  for (const layer of ['rawPersisted', 'readback', 'refs', 'canonical'] as const) {
    const filepath = fixtureFilePath(name, layer);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, `${JSON.stringify(bundle[layer], null, 2)}\n`, 'utf8');
  }
}

export function listFixtureAliases(bundle: Pick<FlowSurfaceFixtureBundle, 'refs'>) {
  return Object.keys(bundle.refs).sort();
}

export async function captureFlowSurfaceFromLocalDb(options: {
  service: { get: Function };
  target: Record<string, any>;
  loadPersisted: (context: { target: Record<string, any>; readback: any }) => Promise<any>;
}) {
  const readback = await options.service.get(options.target);
  const rawPersisted = await options.loadPersisted({ target: options.target, readback });
  if (!rawPersisted) {
    throw new Error('captureFlowSurfaceFromLocalDb requires a real rawPersisted snapshot');
  }
  return createFlowSurfaceFixture({
    rawPersisted,
    readback,
  });
}

export async function captureFlowSurfaceFromAdminApi(options: {
  baseUrl: string;
  token: string;
  target: Record<string, any>;
  loadPersisted: (context: { target: Record<string, any>; readback: any }) => Promise<any>;
}) {
  const search = new URLSearchParams(
    Object.entries(options.target || {}).reduce(
      (carry, [key, value]) => ({
        ...carry,
        ...(typeof value === 'undefined' ? {} : { [key]: String(value) }),
      }),
      {},
    ),
  );
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}/api/flowSurfaces:get?${search.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
  });
  const payload = await response.json();
  const readback = payload?.data || payload;
  const rawPersisted = await options.loadPersisted({ target: options.target, readback });
  if (!rawPersisted) {
    throw new Error('captureFlowSurfaceFromAdminApi requires a real rawPersisted snapshot');
  }
  return createFlowSurfaceFixture({
    rawPersisted,
    readback,
  });
}

function normalizeCanonicalSource(source: any) {
  const state: AliasState = {
    aliases: new Set(),
    counts: {},
    topLevelTabIndex: 0,
  };
  const refs: Record<string, any> = {};
  const raw = toPlainObject(source);

  const canonical = compactObject({
    target: compactObject({
      kind: raw?.target?.kind,
      use: raw?.target?.node?.use || raw?.tree?.use,
    }),
    tree: raw?.tree ? normalizeNode(raw.tree, state, refs) : undefined,
    pageRoute: raw?.pageRoute ? normalizeRoute(raw.pageRoute, 'page.route', refs) : undefined,
  });

  return {
    canonical,
    refs,
  };
}

function projectStaticBlock(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
  });
}

function projectListLikeBlock(node: any) {
  const item = firstChild(node?.subModels?.item);
  const grid = firstChild(item?.subModels?.grid);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      item: item
        ? [
            compactObject({
              alias: item.alias,
              use: item.use,
              subModels: compactObject({
                grid: grid
                  ? [
                      compactObject({
                        alias: grid.alias,
                        use: grid.use,
                      }),
                    ]
                  : undefined,
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function projectGridCardLikeBlock(node: any) {
  return projectListLikeBlock(node);
}

function projectKanbanBlock(node: any) {
  const item = firstChild(node?.subModels?.item);
  const grid = firstChild(item?.subModels?.grid);
  const quickCreateAction = firstChild(node?.subModels?.quickCreateAction);
  const cardViewAction = firstChild(node?.subModels?.cardViewAction);
  const actions = toArray(node?.subModels?.actions)
    .map((itemNode) => {
      if (
        [
          'FilterActionModel',
          'AddNewActionModel',
          'PopupCollectionActionModel',
          'RefreshActionModel',
          'JSCollectionActionModel',
        ].includes(itemNode?.use)
      ) {
        return projectSimpleAction(itemNode);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions: actions.length ? actions : undefined,
      item: item
        ? [
            compactObject({
              alias: item.alias,
              use: item.use,
              props: normalizeValue(item.props),
              stepParams: normalizeValue(item.stepParams),
              subModels: compactObject({
                grid: grid
                  ? [
                      compactObject({
                        alias: grid.alias,
                        use: grid.use,
                      }),
                    ]
                  : undefined,
              }),
            }),
          ]
        : undefined,
      quickCreateAction: quickCreateAction ? [projectCalendarPopupAction(quickCreateAction)] : undefined,
      cardViewAction: cardViewAction ? [projectCalendarPopupAction(cardViewAction)] : undefined,
    }),
  });
}

function projectCreateFormBlock(node: any) {
  return projectFormLikeBlock(node, {
    submitActionUse: 'FormSubmitActionModel',
  });
}

function projectEditFormBlock(node: any) {
  return projectFormLikeBlock(node, {
    submitActionUse: 'FormSubmitActionModel',
  });
}

function projectDetailsBlock(node: any) {
  const grid = firstChild(node?.subModels?.grid);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      resourceSettings: projectResourceSettings(node),
      detailsSettings: normalizeValue(node?.stepParams?.detailsSettings),
    }),
    subModels: compactObject({
      grid: grid
        ? [
            compactObject({
              alias: grid.alias,
              use: grid.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => projectDetailsFieldWrapper(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function projectFilterFormBlock(node: any) {
  const grid = firstChild(node?.subModels?.grid);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'FilterFormSubmitActionModel') {
        return projectSubmitAction(item);
      }
      if (item?.use === 'FilterFormResetActionModel') {
        return projectSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return normalizeFilterFormDefaultTargetRefs(
    compactObject({
      alias: node?.alias,
      use: node?.use,
      stepParams: compactObject({
        resourceSettings: projectResourceSettings(node),
        formFilterBlockModelSettings: normalizeValue(node?.stepParams?.formFilterBlockModelSettings),
      }),
      subModels: compactObject({
        actions,
        grid: grid
          ? [
              compactObject({
                alias: grid.alias,
                use: grid.use,
                subModels: compactObject({
                  items: toArray(grid?.subModels?.items).map((item) => projectFilterFormFieldWrapper(item)),
                }),
              }),
            ]
          : undefined,
      }),
    }),
  );
}

function projectFormLikeBlock(
  node: any,
  options: {
    submitActionUse: 'FormSubmitActionModel' | 'FilterFormSubmitActionModel';
  },
) {
  const grid = firstChild(node?.subModels?.grid);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => (item?.use === options.submitActionUse ? projectSubmitAction(item) : undefined))
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      resourceSettings: projectResourceSettings(node),
      formModelSettings: normalizeValue(node?.stepParams?.formModelSettings),
      eventSettings: normalizeValue(node?.stepParams?.eventSettings),
      formSettings: normalizeValue(node?.stepParams?.formSettings),
    }),
    subModels: compactObject({
      actions,
      grid: grid
        ? [
            compactObject({
              alias: grid.alias,
              use: grid.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => projectFormFieldWrapper(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function projectTableBlock(node: any) {
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'AddNewActionModel') {
        return projectAddNewTableAction(item);
      }
      if (item?.use === 'RefreshActionModel' || item?.use === 'BulkDeleteActionModel') {
        return projectSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);
  const columns = toArray(node?.subModels?.columns)
    .map((item) => {
      if (item?.use === 'TableColumnModel') {
        return projectTableColumn(item);
      }
      if (item?.use === 'TableActionsColumnModel') {
        return projectTableActionsColumn(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions,
      columns,
    }),
  });
}

function projectCalendarBlock(node: any) {
  const quickCreateAction = firstChild(node?.subModels?.quickCreateAction);
  const eventViewAction = firstChild(node?.subModels?.eventViewAction);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (
        [
          'CalendarTodayActionModel',
          'CalendarNavActionModel',
          'CalendarTitleActionModel',
          'CalendarViewSelectActionModel',
          'FilterActionModel',
          'AddNewActionModel',
          'PopupCollectionActionModel',
          'RefreshActionModel',
          'JSCollectionActionModel',
          'TriggerWorkflowActionModel',
        ].includes(item?.use)
      ) {
        return projectSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions: actions.length ? actions : undefined,
      quickCreateAction: quickCreateAction ? [projectCalendarPopupAction(quickCreateAction)] : undefined,
      eventViewAction: eventViewAction ? [projectCalendarPopupAction(eventViewAction)] : undefined,
    }),
  });
}

function projectCalendarPopupAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      popupSettings: projectCalendarPopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [projectPopupPage(popupPage)] : undefined,
    }),
  });
}

function projectCalendarPopupSettings(node: any) {
  const openView = node?.stepParams?.popupSettings?.openView || {};
  return compactObject({
    openView: compactObject(
      _.pick(openView, [
        'mode',
        'size',
        'pageModelClass',
        'dataSourceKey',
        'collectionName',
        'associationName',
        'filterByTk',
        'sourceId',
        'title',
        'popupTemplateUid',
        'popupTemplateContext',
        'popupTemplateHasFilterByTk',
        'popupTemplateHasSourceId',
      ]),
    ),
  });
}

function projectAddNewTableAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: projectButtonSettings(node),
      popupSettings: projectPopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [projectPopupPage(popupPage)] : undefined,
    }),
  });
}

function projectPopupPage(node: any) {
  const popupTab = firstChild(node?.subModels?.tabs);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      pageSettings: compactObject({
        general: compactObject(
          _.pick(node?.stepParams?.pageSettings?.general || {}, [
            'title',
            'documentTitle',
            'displayTitle',
            'enableTabs',
          ]),
        ),
      }),
    }),
    subModels: compactObject({
      tabs: popupTab ? [projectPopupTab(popupTab)] : undefined,
    }),
  });
}

function projectPopupTab(node: any) {
  const grid = firstChild(node?.subModels?.grid);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      pageTabSettings: compactObject({
        tab: compactObject(_.pick(node?.stepParams?.pageTabSettings?.tab || {}, ['title', 'icon', 'documentTitle'])),
      }),
    }),
    subModels: compactObject({
      grid: grid
        ? [
            compactObject({
              alias: grid.alias,
              use: grid.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => projectNestedPopupItem(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function projectNestedPopupItem(node: any) {
  switch (node?.use) {
    case 'TableBlockModel':
      return projectTableBlock(node);
    case 'ListBlockModel':
      return projectListLikeBlock(node);
    case 'GridCardBlockModel':
      return projectGridCardLikeBlock(node);
    case 'FilterFormBlockModel':
      return projectFilterFormBlock(node);
    case 'CreateFormModel':
    case 'FormBlockModel':
    case 'EditFormModel':
      return projectFormLikeBlock(node, {
        submitActionUse: 'FormSubmitActionModel',
      });
    case 'DetailsBlockModel':
      return projectDetailsBlock(node);
    case 'JSBlockModel':
    case 'MarkdownBlockModel':
    case 'IframeBlockModel':
    case 'ChartBlockModel':
    case 'ActionPanelBlockModel':
      return projectStaticBlock(node);
    default:
      return compactObject({
        alias: node?.alias,
        use: node?.use,
      });
  }
}

function projectTableActionsColumn(node: any) {
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'DeleteActionModel') {
        return projectSimpleAction(item);
      }
      if (item?.use === 'ViewActionModel' || item?.use === 'EditActionModel') {
        return projectPopupRowAction(item);
      }
      return undefined;
    })
    .filter(Boolean);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    subModels: compactObject({
      actions,
    }),
  });
}

function extractFixtureStaticBlock(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
  });
}

function extractFixtureListLikeBlock(node: any) {
  const item = firstChild(node?.subModels?.item);
  const grid = firstChild(item?.subModels?.grid);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      item: item
        ? [
            compactObject({
              alias: item?.alias,
              use: item?.use,
              subModels: compactObject({
                grid: grid
                  ? [
                      compactObject({
                        alias: grid?.alias,
                        use: grid?.use,
                      }),
                    ]
                  : undefined,
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function extractFixtureGridCardLikeBlock(node: any) {
  return extractFixtureListLikeBlock(node);
}

function extractFixtureKanbanBlock(node: any) {
  const item = firstChild(node?.subModels?.item);
  const grid = firstChild(item?.subModels?.grid);
  const quickCreateAction = firstChild(node?.subModels?.quickCreateAction);
  const cardViewAction = firstChild(node?.subModels?.cardViewAction);
  const actions = toArray(node?.subModels?.actions)
    .map((itemNode) => {
      if (
        [
          'FilterActionModel',
          'AddNewActionModel',
          'PopupCollectionActionModel',
          'RefreshActionModel',
          'JSCollectionActionModel',
        ].includes(itemNode?.use)
      ) {
        return extractFixtureSimpleAction(itemNode);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions: actions.length ? actions : undefined,
      item: item
        ? [
            compactObject({
              alias: item?.alias,
              use: item?.use,
              props: normalizeValue(item?.props),
              stepParams: normalizeValue(item?.stepParams),
              subModels: compactObject({
                grid: grid
                  ? [
                      compactObject({
                        alias: grid?.alias,
                        use: grid?.use,
                      }),
                    ]
                  : undefined,
              }),
            }),
          ]
        : undefined,
      quickCreateAction: quickCreateAction ? [extractFixtureCalendarPopupAction(quickCreateAction)] : undefined,
      cardViewAction: cardViewAction ? [extractFixtureCalendarPopupAction(cardViewAction)] : undefined,
    }),
  });
}

function extractFixtureCreateFormBlock(node: any) {
  return extractFixtureFormLikeBlock(node, {
    submitActionUse: 'FormSubmitActionModel',
  });
}

function extractFixtureEditFormBlock(node: any) {
  return extractFixtureFormLikeBlock(node, {
    submitActionUse: 'FormSubmitActionModel',
  });
}

function extractFixtureDetailsBlock(node: any) {
  const grid = firstChild(node?.subModels?.grid);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      resourceSettings: extractFixtureResourceSettings(node),
      detailsSettings: toPlainObject(node?.stepParams?.detailsSettings),
    }),
    subModels: compactObject({
      grid: grid
        ? [
            compactObject({
              alias: grid?.alias,
              use: grid?.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => extractFixtureDetailsFieldWrapper(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function extractFixtureFilterFormBlock(node: any) {
  const grid = firstChild(node?.subModels?.grid);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'FilterFormSubmitActionModel') {
        return extractFixtureSubmitAction(item);
      }
      if (item?.use === 'FilterFormResetActionModel') {
        return extractFixtureSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return normalizeFilterFormDefaultTargetRefs(
    compactObject({
      alias: node?.alias,
      use: node?.use,
      stepParams: compactObject({
        resourceSettings: extractFixtureResourceSettings(node),
        formFilterBlockModelSettings: toPlainObject(node?.stepParams?.formFilterBlockModelSettings),
      }),
      subModels: compactObject({
        actions,
        grid: grid
          ? [
              compactObject({
                alias: grid?.alias,
                use: grid?.use,
                subModels: compactObject({
                  items: toArray(grid?.subModels?.items).map((item) => extractFixtureFilterFormFieldWrapper(item)),
                }),
              }),
            ]
          : undefined,
      }),
    }),
  );
}

function extractFixtureFormLikeBlock(
  node: any,
  options: {
    submitActionUse: 'FormSubmitActionModel' | 'FilterFormSubmitActionModel';
  },
) {
  const grid = firstChild(node?.subModels?.grid);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => (item?.use === options.submitActionUse ? extractFixtureSubmitAction(item) : undefined))
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      resourceSettings: extractFixtureResourceSettings(node),
      formModelSettings: toPlainObject(node?.stepParams?.formModelSettings),
      eventSettings: toPlainObject(node?.stepParams?.eventSettings),
      formSettings: toPlainObject(node?.stepParams?.formSettings),
    }),
    subModels: compactObject({
      actions,
      grid: grid
        ? [
            compactObject({
              alias: grid?.alias,
              use: grid?.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => extractFixtureFormFieldWrapper(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function extractFixtureTableBlock(node: any) {
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'AddNewActionModel') {
        return extractFixtureAddNewTableAction(item);
      }
      if (item?.use === 'RefreshActionModel' || item?.use === 'BulkDeleteActionModel') {
        return extractFixtureSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);
  const columns = toArray(node?.subModels?.columns)
    .map((item) => {
      if (item?.use === 'TableColumnModel') {
        return extractFixtureTableColumn(item);
      }
      if (item?.use === 'TableActionsColumnModel') {
        return extractFixtureTableActionsColumn(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions,
      columns,
    }),
  });
}

function extractFixtureCalendarBlock(node: any) {
  const quickCreateAction = firstChild(node?.subModels?.quickCreateAction);
  const eventViewAction = firstChild(node?.subModels?.eventViewAction);
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (
        [
          'CalendarTodayActionModel',
          'CalendarNavActionModel',
          'CalendarTitleActionModel',
          'CalendarViewSelectActionModel',
          'FilterActionModel',
          'AddNewActionModel',
          'PopupCollectionActionModel',
          'RefreshActionModel',
          'JSCollectionActionModel',
          'TriggerWorkflowActionModel',
        ].includes(item?.use)
      ) {
        return extractFixtureSimpleAction(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    props: normalizeValue(node?.props),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: compactObject({
      actions: actions.length ? actions : undefined,
      quickCreateAction: quickCreateAction ? [extractFixtureCalendarPopupAction(quickCreateAction)] : undefined,
      eventViewAction: eventViewAction ? [extractFixtureCalendarPopupAction(eventViewAction)] : undefined,
    }),
  });
}

function extractFixtureCalendarPopupAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      popupSettings: extractFixtureCalendarPopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [extractFixturePopupPage(popupPage)] : undefined,
    }),
  });
}

function extractFixtureCalendarPopupSettings(node: any) {
  const openView = node?.stepParams?.popupSettings?.openView || {};
  return compactObject({
    openView: compactObject(
      _.pick(openView, [
        'mode',
        'size',
        'pageModelClass',
        'dataSourceKey',
        'collectionName',
        'associationName',
        'filterByTk',
        'sourceId',
        'title',
        'popupTemplateUid',
        'popupTemplateContext',
        'popupTemplateHasFilterByTk',
        'popupTemplateHasSourceId',
      ]),
    ),
  });
}

function extractFixtureAddNewTableAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: extractFixtureButtonSettings(node),
      popupSettings: extractFixturePopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [extractFixturePopupPage(popupPage)] : undefined,
    }),
  });
}

function extractFixturePopupPage(node: any) {
  const popupTab = firstChild(node?.subModels?.tabs);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      pageSettings: compactObject({
        general: compactObject(
          _.pick(node?.stepParams?.pageSettings?.general || {}, [
            'title',
            'documentTitle',
            'displayTitle',
            'enableTabs',
          ]),
        ),
      }),
    }),
    subModels: compactObject({
      tabs: popupTab ? [extractFixturePopupTab(popupTab)] : undefined,
    }),
  });
}

function extractFixturePopupTab(node: any) {
  const grid = firstChild(node?.subModels?.grid);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      pageTabSettings: compactObject({
        tab: compactObject(_.pick(node?.stepParams?.pageTabSettings?.tab || {}, ['title', 'icon', 'documentTitle'])),
      }),
    }),
    subModels: compactObject({
      grid: grid
        ? [
            compactObject({
              alias: grid?.alias,
              use: grid?.use,
              subModels: compactObject({
                items: toArray(grid?.subModels?.items).map((item) => extractFixtureNestedPopupItem(item)),
              }),
            }),
          ]
        : undefined,
    }),
  });
}

function extractFixtureNestedPopupItem(node: any) {
  switch (node?.use) {
    case 'TableBlockModel':
      return extractFixtureTableBlock(node);
    case 'ListBlockModel':
      return extractFixtureListLikeBlock(node);
    case 'GridCardBlockModel':
      return extractFixtureGridCardLikeBlock(node);
    case 'FilterFormBlockModel':
      return extractFixtureFilterFormBlock(node);
    case 'CreateFormModel':
    case 'FormBlockModel':
    case 'EditFormModel':
      return extractFixtureFormLikeBlock(node, {
        submitActionUse: 'FormSubmitActionModel',
      });
    case 'DetailsBlockModel':
      return extractFixtureDetailsBlock(node);
    case 'JSBlockModel':
    case 'MarkdownBlockModel':
    case 'IframeBlockModel':
    case 'ChartBlockModel':
    case 'ActionPanelBlockModel':
      return extractFixtureStaticBlock(node);
    default:
      return compactObject({
        alias: node?.alias,
        use: node?.use,
      });
  }
}

function extractFixtureTableActionsColumn(node: any) {
  const actions = toArray(node?.subModels?.actions)
    .map((item) => {
      if (item?.use === 'DeleteActionModel') {
        return extractFixtureSimpleAction(item);
      }
      if (item?.use === 'ViewActionModel' || item?.use === 'EditActionModel') {
        return extractFixturePopupRowAction(item);
      }
      return undefined;
    })
    .filter(Boolean);

  return compactObject({
    alias: node?.alias,
    use: node?.use,
    subModels: compactObject({
      actions,
    }),
  });
}

function extractFixturePopupRowAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: extractFixtureButtonSettings(node),
      popupSettings: extractFixturePopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [extractFixturePopupPage(popupPage)] : undefined,
    }),
  });
}

function extractFixtureSimpleAction(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: extractFixtureButtonSettings(node),
    }),
  });
}

function extractFixtureSubmitAction(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: extractFixtureButtonSettings(node),
      submitSettings: compactObject({
        confirm: compactObject(_.pick(node?.stepParams?.submitSettings?.confirm || {}, ['enable'])),
      }),
    }),
  });
}

function extractFixtureButtonSettings(node: any) {
  const general = node?.stepParams?.buttonSettings?.general || {};
  return compactObject({
    general: compactObject(_.pick(general, ['title', 'type'])),
  });
}

function extractFixturePopupSettings(node: any) {
  const openView = node?.stepParams?.popupSettings?.openView || {};
  return compactObject({
    openView: compactObject(
      _.pick(openView, ['pageModelClass', 'dataSourceKey', 'collectionName', 'associationName', 'title']),
    ),
  });
}

function extractFixtureTableColumn(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: extractFixtureFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([extractFixtureFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function extractFixtureFormFieldWrapper(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: extractFixtureFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([extractFixtureFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function extractFixtureDetailsFieldWrapper(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: extractFixtureFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([extractFixtureFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function extractFixtureFilterFormFieldWrapper(node: any) {
  const init = node?.stepParams?.filterFormItemSettings?.init || {};
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: extractFixtureFieldSettings(node),
      filterFormItemSettings: compactObject({
        init: compactObject({
          defaultTargetUid: init?.defaultTargetUid,
          filterField: compactObject({
            name: init?.filterField?.name,
          }),
        }),
      }),
    }),
    subModels: compactObject({
      field: compactArray([extractFixtureFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function extractFixtureFieldNode(node: any) {
  if (!node) {
    return undefined;
  }
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: extractFixtureFieldSettings(node),
    }),
  });
}

function extractFixtureFieldSettings(node: any) {
  const init = node?.stepParams?.fieldSettings?.init || {};
  return compactObject({
    init: compactObject(
      _.pick(init, ['dataSourceKey', 'collectionName', 'associationName', 'associationPathName', 'fieldPath']),
    ),
  });
}

function extractFixtureResourceSettings(node: any) {
  const init = node?.stepParams?.resourceSettings?.init || {};
  return compactObject({
    init: compactObject(_.pick(init, ['dataSourceKey', 'collectionName', 'associationName', 'associationPathName'])),
  });
}

function projectPopupRowAction(node: any) {
  const popupPage = firstChild(node?.subModels?.page);
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: projectButtonSettings(node),
      popupSettings: projectPopupSettings(node),
    }),
    subModels: compactObject({
      page: popupPage ? [projectPopupPage(popupPage)] : undefined,
    }),
  });
}

function projectSimpleAction(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: projectButtonSettings(node),
    }),
  });
}

function projectSubmitAction(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      buttonSettings: projectButtonSettings(node),
      submitSettings: compactObject({
        confirm: compactObject(_.pick(node?.stepParams?.submitSettings?.confirm || {}, ['enable'])),
      }),
    }),
  });
}

function projectButtonSettings(node: any) {
  const general = node?.stepParams?.buttonSettings?.general || {};
  return compactObject({
    general: compactObject(_.pick(general, ['title', 'type'])),
  });
}

function projectPopupSettings(node: any) {
  const openView = node?.stepParams?.popupSettings?.openView || {};
  return compactObject({
    openView: compactObject(
      _.pick(openView, ['pageModelClass', 'dataSourceKey', 'collectionName', 'associationName', 'title']),
    ),
  });
}

function projectTableColumn(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: projectFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([projectFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function projectFormFieldWrapper(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: projectFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([projectFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function projectDetailsFieldWrapper(node: any) {
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: projectFieldSettings(node),
    }),
    subModels: compactObject({
      field: compactArray([projectFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function projectFilterFormFieldWrapper(node: any) {
  const init = node?.stepParams?.filterFormItemSettings?.init || {};
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: projectFieldSettings(node),
      filterFormItemSettings: compactObject({
        init: compactObject({
          defaultTargetUid: init?.defaultTargetUid,
          filterField: compactObject({
            name: init?.filterField?.name,
          }),
        }),
      }),
    }),
    subModels: compactObject({
      field: compactArray([projectFieldNode(firstChild(node?.subModels?.field))]),
    }),
  });
}

function projectFieldNode(node: any) {
  if (!node) {
    return undefined;
  }
  return compactObject({
    alias: node?.alias,
    use: node?.use,
    stepParams: compactObject({
      fieldSettings: projectFieldSettings(node),
    }),
  });
}

function projectFieldSettings(node: any) {
  const init = node?.stepParams?.fieldSettings?.init || {};
  return compactObject({
    init: compactObject(
      _.pick(init, ['dataSourceKey', 'collectionName', 'associationName', 'associationPathName', 'fieldPath']),
    ),
  });
}

function projectResourceSettings(node: any) {
  const init = node?.stepParams?.resourceSettings?.init || {};
  return compactObject({
    init: compactObject(_.pick(init, ['dataSourceKey', 'collectionName', 'associationName', 'associationPathName'])),
  });
}

function normalizeFilterFormDefaultTargetRefs(tree: any) {
  const grid = firstChild(tree?.subModels?.grid);
  const items = toArray(grid?.subModels?.items);
  if (!items.length) {
    return tree;
  }

  const placeholderByValue = new Map<string, string>();
  let index = 0;

  const normalizedItems = items.map((item) => {
    const currentValue = item?.stepParams?.filterFormItemSettings?.init?.defaultTargetUid;
    if (!currentValue || String(currentValue).startsWith('@uid:')) {
      return item;
    }

    const key = String(currentValue);
    if (!placeholderByValue.has(key)) {
      index += 1;
      placeholderByValue.set(key, `@uid:block.table${index}`);
    }

    return _.merge({}, item, {
      stepParams: {
        filterFormItemSettings: {
          init: {
            defaultTargetUid: placeholderByValue.get(key),
          },
        },
      },
    });
  });

  return _.merge({}, tree, {
    subModels: {
      grid: [
        _.merge({}, grid, {
          subModels: {
            items: normalizedItems,
          },
        }),
      ],
    },
  });
}

function compactArray<T>(items: Array<T | undefined | null>) {
  return items.filter(Boolean) as T[];
}

function stripCreateParityAliases(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => stripCreateParityAliases(item));
  }
  if (_.isPlainObject(value)) {
    return compactObject(
      Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => key !== 'alias')
          .map(([key, item]) => [key, stripCreateParityAliases(item)]),
      ),
    );
  }
  return value;
}

function firstChild(value: any) {
  return toArray(value)[0];
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  return _.castArray(value as any).filter(Boolean) as T[];
}

function extractReadback(input: FlowSurfaceFixtureInputs) {
  if (_.isPlainObject(input) && ('readback' in (input as any) || 'rawPersisted' in (input as any))) {
    return (input as any).readback || (input as any).rawPersisted || {};
  }
  return input || {};
}

function extractRawPersisted(input: FlowSurfaceFixtureInputs) {
  if (_.isPlainObject(input) && ('rawPersisted' in (input as any) || 'readback' in (input as any))) {
    return (input as any).rawPersisted || (input as any).readback || {};
  }
  return input || {};
}

function materializeCanonicalSource(input: any) {
  const raw = toPlainObject(input);
  const persisted = raw?.persisted ? toPlainObject(raw.persisted) : undefined;
  const tree = persisted?.tree || persisted?.focusNode || raw?.tree;
  const pageRoute = persisted?.pageRoute || raw?.pageRoute;

  return compactObject({
    target: raw?.target,
    tree,
    pageRoute,
  });
}

function normalizeNode(
  node: any,
  state: AliasState,
  refs: Record<string, any>,
  forcedAlias?: string,
): Record<string, any> {
  const alias = uniqueAlias(forcedAlias || inferNodeAlias(node, state), state);
  if (node?.uid) {
    refs[alias] = {
      ...(refs[alias] || {}),
      uid: node.uid,
      schemaUid: node.schemaUid,
    };
  }

  const subModels = Object.fromEntries(
    Object.entries(node?.subModels || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([subKey, subValue]) => [
        subKey,
        _.castArray(subValue as any).map((child: any) => {
          const childAlias = inferChildAlias(alias, subKey, child, state);
          return normalizeNode(child, state, refs, childAlias);
        }),
      ])
      .filter(([, value]) => value.length > 0),
  );

  return compactObject({
    alias,
    use: node?.use,
    props: normalizeValue(_.omit(node?.props || {}, ['route', 'routeId'])),
    decoratorProps: normalizeValue(node?.decoratorProps),
    stepParams: normalizeValue(node?.stepParams),
    flowRegistry: normalizeValue(node?.flowRegistry),
    subModels: Object.keys(subModels).length ? subModels : undefined,
  });
}

function readFixtureLayer(name: string, layer: FlowSurfaceFixtureLayer) {
  const filepath = fixtureFilePath(name, layer);
  if (!fs.existsSync(filepath)) {
    if (layer === 'rawPersisted' || layer === 'readback') {
      const legacyPath = path.resolve(FLOW_SURFACE_FIXTURE_ROOT, `${name}.raw.json`);
      if (fs.existsSync(legacyPath)) {
        return JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      }
    }
    throw new Error(`Missing flowSurfaces fixture layer: ${filepath}`);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function fixtureFilePath(name: string, layer: FlowSurfaceFixtureLayer) {
  const suffixMap: Record<FlowSurfaceFixtureLayer, string> = {
    canonical: 'canonical',
    refs: 'refs',
    rawPersisted: 'raw-persisted',
    readback: 'readback',
  };
  return path.resolve(FLOW_SURFACE_FIXTURE_ROOT, `${name}.${suffixMap[layer]}.json`);
}

function isFixtureBundle(input: any): input is FlowSurfaceFixtureBundle {
  return _.isPlainObject(input) && 'canonical' in input && 'refs' in input;
}

function buildRefPlaceholderMap(refs: Record<string, any>) {
  const map = new Map<string, string>();

  Object.entries(refs || {}).forEach(([alias, ref]) => {
    if (!_.isNil(ref?.uid)) {
      map.set(String(ref.uid), `@uid:${alias}`);
    }
    if (!_.isNil(ref?.routeId)) {
      map.set(String(ref.routeId), `@route:${alias}`);
    }
    if (!_.isNil(ref?.schemaUid)) {
      map.set(String(ref.schemaUid), `@schema:${alias}`);
    }
  });

  return map;
}

function replaceEmbeddedRefs(value: any, refPlaceholders: Map<string, string>): any {
  if (Array.isArray(value)) {
    return value.map((item) => replaceEmbeddedRefs(item, refPlaceholders));
  }

  if (_.isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, replaceEmbeddedRefs(nested, refPlaceholders)]),
    );
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return refPlaceholders.get(String(value)) || value;
  }

  return value;
}

function normalizeRoute(route: any, alias: string, refs: Record<string, any>) {
  const plainRoute = toPlainObject(route);
  refs[alias] = {
    ...(refs[alias] || {}),
    routeId: plainRoute?.id,
    schemaUid: plainRoute?.schemaUid,
  };

  return compactObject({
    alias,
    type: plainRoute?.type,
    title: plainRoute?.title,
    icon: plainRoute?.icon,
    options: normalizeValue(plainRoute?.options),
  });
}

function inferNodeAlias(node: any, state: AliasState) {
  const use = String(node?.use || '');
  if (use === 'RootPageModel') {
    return 'page';
  }
  if (use === 'RootPageTabModel') {
    return getTopLevelTabAlias(state.topLevelTabIndex++);
  }
  if (use === 'TableActionsColumnModel') {
    return nextCountAlias('column.actions', state);
  }
  if (BLOCK_USE_ALIAS[use]) {
    return nextCountAlias(`block.${BLOCK_USE_ALIAS[use]}`, state);
  }
  if (ACTION_USE_ALIAS[use]) {
    return nextCountAlias(`action.${ACTION_USE_ALIAS[use]}`, state);
  }
  if (WRAPPER_USES.has(use)) {
    const fieldPath = String(node?.stepParams?.fieldSettings?.init?.fieldPath || 'unknown');
    return `field.${fieldPath}.wrapper`;
  }
  if (use.endsWith('FieldModel')) {
    return nextCountAlias(`node.${use}`, state);
  }
  return nextCountAlias(`node.${use || 'FlowModel'}`, state);
}

function inferChildAlias(parentAlias: string, subKey: string, child: any, state: AliasState) {
  if (subKey === 'field' && parentAlias.startsWith('field.') && parentAlias.endsWith('.wrapper')) {
    return `${parentAlias.slice(0, -'.wrapper'.length)}.inner`;
  }
  if (child?.use === 'ChildPageModel' && (parentAlias.startsWith('action.') || parentAlias.startsWith('field.'))) {
    return `${parentAlias}.popup.page`;
  }
  if (child?.use === 'ChildPageTabModel' && parentAlias.endsWith('.popup.page')) {
    return parentAlias.replace(/\.page$/, '.tab');
  }
  if (child?.use === 'BlockGridModel' && parentAlias.endsWith('.popup.tab')) {
    return parentAlias.replace(/\.tab$/, '.grid');
  }
  if (GRID_USES.has(child?.use) && (parentAlias.startsWith('block.') || parentAlias.startsWith('field.'))) {
    return `${parentAlias}.grid`;
  }
  return inferNodeAlias(child, state);
}

function normalizeValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (_.isPlainObject(value)) {
    return compactObject(
      Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !NOISY_KEYS.has(key))
          .map(([key, item]) => [key, normalizeValue(item)]),
      ),
    );
  }
  return value;
}

function compactObject(input: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([, value]) => {
      if (typeof value === 'undefined') {
        return false;
      }
      if (_.isPlainObject(value)) {
        return Object.keys(value).length > 0;
      }
      return true;
    }),
  );
}

function uniqueAlias(alias: string, state: AliasState) {
  if (!state.aliases.has(alias)) {
    state.aliases.add(alias);
    return alias;
  }
  return nextCountAlias(alias, state);
}

function nextCountAlias(prefix: string, state: AliasState) {
  state.counts[prefix] = (state.counts[prefix] || 0) + 1;
  return `${prefix}${state.counts[prefix]}`;
}

function getTopLevelTabAlias(index: number) {
  return index === 0 ? 'tab.main' : `tab.${index + 1}`;
}

function toPlainObject(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => toPlainObject(item));
  }
  if (value?.toJSON) {
    return value.toJSON();
  }
  if (_.isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlainObject(item)]));
  }
  return value;
}

const GRID_USES = new Set([
  'BlockGridModel',
  'FormGridModel',
  'DetailsGridModel',
  'FilterFormGridModel',
  'AssignFormGridModel',
]);
const WRAPPER_USES = new Set(['FormItemModel', 'DetailsItemModel', 'FilterFormItemModel', 'TableColumnModel']);
const BLOCK_USE_ALIAS: Record<string, string> = {
  JSBlockModel: 'jsBlock',
  TableBlockModel: 'table',
  CalendarBlockModel: 'calendar',
  KanbanBlockModel: 'kanban',
  CreateFormModel: 'createForm',
  EditFormModel: 'editForm',
  FormBlockModel: 'form',
  DetailsBlockModel: 'details',
  FilterFormBlockModel: 'filterForm',
  ListBlockModel: 'list',
  GridCardBlockModel: 'gridCard',
  MarkdownBlockModel: 'markdown',
  IframeBlockModel: 'iframe',
  MapBlockModel: 'map',
  ChartBlockModel: 'chart',
  CommentsBlockModel: 'comments',
  ActionPanelBlockModel: 'actionPanel',
};
const ACTION_USE_ALIAS: Record<string, string> = {
  AddNewActionModel: 'addNew',
  ViewActionModel: 'view',
  EditActionModel: 'edit',
  PopupCollectionActionModel: 'popup',
  CalendarQuickCreateActionModel: 'calendarQuickCreate',
  CalendarEventViewActionModel: 'calendarEventView',
  KanbanQuickCreateActionModel: 'kanbanQuickCreate',
  KanbanCardViewActionModel: 'kanbanCardView',
  CalendarTodayActionModel: 'calendarToday',
  CalendarNavActionModel: 'calendarNav',
  CalendarTitleActionModel: 'calendarTitle',
  CalendarViewSelectActionModel: 'calendarViewSelect',
  DeleteActionModel: 'delete',
  UpdateRecordActionModel: 'updateRecord',
  FormSubmitActionModel: 'submit',
  FilterFormSubmitActionModel: 'submit',
};
