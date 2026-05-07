/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionBlockModel } from '@nocobase/client';
import { defineAction } from '@nocobase/flow-engine';
import { Empty, Select, Spin, Switch, theme } from 'antd';
import React from 'react';
import { tExpr } from '../locale';
import type { TreeBlockModel } from './TreeBlockModel';

type ConnectFieldsConfig = {
  targets: {
    targetId: string;
    filterPaths: string[];
  }[];
};

type SupportedTarget = {
  model: CollectionBlockModel;
  title: string;
  sameCollection: boolean;
  options: Array<{ label: string; value: string }>;
};

const CONNECT_FIELDS_FLOW_KEY = 'treeSettings';
const CONNECT_FIELDS_STEP_KEY = 'connectFields';
const CONNECT_FIELDS_SUMMARY_KEY = '_summary';

const getCollection = (model: CollectionBlockModel | TreeBlockModel | any) => {
  return model?.collection || model?.context?.collection;
};

const getCollectionFields = (collection: any) => {
  return collection?.getFields?.() || collection?.fields || [];
};

const getCollectionDataSourceKey = (collection: any) => {
  return collection?.dataSourceKey || collection?.dataSource || 'main';
};

const getCollectionFilterTargetKey = (collection: any) => {
  const filterTargetKey = collection?.filterTargetKey;

  if (Array.isArray(filterTargetKey)) {
    return filterTargetKey[0] || 'id';
  }

  return filterTargetKey || 'id';
};

const isSameCollection = (collectionA: any, collectionB: any) => {
  return (
    collectionA?.name === collectionB?.name &&
    getCollectionDataSourceKey(collectionA) === getCollectionDataSourceKey(collectionB)
  );
};

const getAssociationTargetKey = (field: any) => {
  const filterTargetKey = field?.targetCollection?.filterTargetKey;

  if (Array.isArray(filterTargetKey)) {
    return filterTargetKey[0] || 'id';
  }

  return field?.targetKey || filterTargetKey || 'id';
};

const getRelatedFieldOptions = (
  sourceCollection: any,
  targetCollection: any,
  dataSourceManager: any,
  t: (key: string) => string,
) => {
  if (!sourceCollection || !targetCollection) {
    return [];
  }

  const sourceFields = getCollectionFields(sourceCollection);
  const targetFields = getCollectionFields(targetCollection);
  const dataSourceKey = getCollectionDataSourceKey(sourceCollection);
  const collectionManager = dataSourceManager?.getDataSource?.(dataSourceKey)?.collectionManager;
  const inheritChain = collectionManager?.getAllCollectionsInheritChain?.(sourceCollection.name) || [
    sourceCollection.name,
  ];

  const associationOptions = targetFields
    .filter((field) => field?.target && inheritChain.includes(field.target))
    .map((field) => ({
      label: field.title || field.name,
      value: `${field.name}.${getAssociationTargetKey(field)}`,
    }));

  const foreignKeyOptions = targetFields
    .filter((field) => {
      if (!field || field.target) {
        return false;
      }

      return sourceFields.some((sourceField) => {
        return (
          sourceField?.type !== 'belongsTo' &&
          sourceField?.foreignKey === field.name &&
          sourceField?.target === targetCollection?.name
        );
      });
    })
    .map((field) => ({
      label: `${field.title || field.name} [${t('Foreign key')}]`,
      value: field.name,
    }));

  return [...associationOptions, ...foreignKeyOptions].filter(
    (option, index, array) => array.findIndex((item) => item.value === option.value) === index,
  );
};

export const normalizeTreeConnectConfig = (config?: ConnectFieldsConfig): ConnectFieldsConfig => {
  return {
    targets: Array.isArray(config?.targets)
      ? config.targets
          .filter((target) => target?.targetId)
          .map((target) => ({
            targetId: target.targetId,
            filterPaths: Array.isArray(target.filterPaths) ? target.filterPaths.filter(Boolean) : [],
          }))
      : [],
  };
};

const getExistingTargetIds = (model: TreeBlockModel) => {
  const gridModel = model.context.blockGridModel;
  const dataModels =
    gridModel?.filterSubModels?.('items', (item: CollectionBlockModel) => !!item?.resource?.supportsFilter) || [];

  return new Set(
    dataModels
      .map((targetModel: CollectionBlockModel) => targetModel?.uid)
      .filter((uid): uid is string => !!uid && uid !== model.uid),
  );
};

export const pruneDisconnectedTreeTargets = (model: TreeBlockModel, config?: ConnectFieldsConfig) => {
  const normalized = normalizeTreeConnectConfig(config);
  const existingTargetIds = getExistingTargetIds(model);
  const nextTargets = normalized.targets.filter((target) => existingTargetIds.has(target.targetId));

  return {
    config: {
      targets: nextTargets,
    },
    changed: nextTargets.length !== normalized.targets.length,
  };
};

const isSameConnectConfig = (left?: ConnectFieldsConfig, right?: ConnectFieldsConfig) => {
  const normalizedLeft = normalizeTreeConnectConfig(left);
  const normalizedRight = normalizeTreeConnectConfig(right);

  if (normalizedLeft.targets.length !== normalizedRight.targets.length) {
    return false;
  }

  return normalizedLeft.targets.every((target, index) => {
    const other = normalizedRight.targets[index];
    return (
      target.targetId === other?.targetId &&
      target.filterPaths.length === other?.filterPaths?.length &&
      target.filterPaths.every((path, pathIndex) => path === other.filterPaths[pathIndex])
    );
  });
};

const getTargetShortTitle = (model: any) => {
  if (!model) {
    return '';
  }

  return `${model.title}${model.uid ? ` #${String(model.uid).slice(0, 4)}` : ''}`;
};

const getSummary = (model: TreeBlockModel, config?: ConnectFieldsConfig) => {
  const normalized = pruneDisconnectedTreeTargets(model, config).config;

  if (!normalized.targets.length) {
    return model.context.t('Unconnected');
  }

  const firstTarget = model.flowEngine.getModel(normalized.targets[0].targetId) as CollectionBlockModel;
  const firstTitle = getTargetShortTitle(firstTarget) || model.context.t('Configured');

  if (normalized.targets.length === 1) {
    return firstTitle;
  }

  return `${firstTitle} +${normalized.targets.length - 1}`;
};

const clearPersistedSummary = (model: TreeBlockModel) => {
  const stepParams = model.stepParams?.[CONNECT_FIELDS_FLOW_KEY]?.[CONNECT_FIELDS_STEP_KEY];
  if (!stepParams || typeof stepParams !== 'object') {
    return;
  }

  delete stepParams.summary;
  delete stepParams[CONNECT_FIELDS_SUMMARY_KEY];
};

const refreshTargetModel = async (targetModel: CollectionBlockModel | any) => {
  const resource = targetModel?.resource;

  if (!resource) {
    return;
  }

  resource.setPage?.(1);
  await resource.refresh?.();
};

const clearDisconnectedTarget = async (filterModel: TreeBlockModel, targetId: string) => {
  const targetModel = filterModel.flowEngine.getModel(targetId) as CollectionBlockModel | undefined;

  if (!targetModel?.resource?.removeFilterGroup) {
    return;
  }

  targetModel.resource.removeFilterGroup(filterModel.uid);
  targetModel.removeFilterSource?.(filterModel.uid);
  await refreshTargetModel(targetModel);
};

const persistConnectConfig = async (model: TreeBlockModel, nextConfig: ConnectFieldsConfig) => {
  const filterManager = model.context.filterManager;

  if (!filterManager) {
    return;
  }

  const previousConfig = normalizeTreeConnectConfig(filterManager.getConnectFieldsConfig(model.uid));
  const nextNormalizedConfig = normalizeTreeConnectConfig(nextConfig);
  const previousTargetIds = new Set(previousConfig.targets.map((target) => target.targetId));
  const nextTargetIds = new Set(nextNormalizedConfig.targets.map((target) => target.targetId));

  for (const targetId of previousTargetIds) {
    if (!nextTargetIds.has(targetId)) {
      await clearDisconnectedTarget(model, targetId);
    }
  }

  await filterManager.saveConnectFieldsConfig(model.uid, nextNormalizedConfig);
  await filterManager.refreshTargetsByFilter(model.uid);
};

export const syncTreeConnectConfig = async (model: TreeBlockModel) => {
  const filterManager = model.context.filterManager;

  if (!filterManager) {
    return normalizeTreeConnectConfig();
  }

  const currentConfig = filterManager.getConnectFieldsConfig(model.uid);
  const { config, changed } = pruneDisconnectedTreeTargets(model, currentConfig);

  if (changed) {
    await filterManager.saveConnectFieldsConfig(model.uid, config);
  }

  return config;
};

const getSupportedTargets = (model: TreeBlockModel, t: (key: string) => string) => {
  const sourceCollection = getCollection(model);
  const gridModel = model.context.blockGridModel;
  const dataSourceManager = model.context.dataSourceManager;
  const allDataModels =
    gridModel?.filterSubModels?.('items', (item: CollectionBlockModel) => !!item?.resource?.supportsFilter) || [];

  return allDataModels
    .filter((targetModel: CollectionBlockModel) => targetModel?.uid && targetModel.uid !== model.uid)
    .map((targetModel: CollectionBlockModel) => {
      const targetCollection = getCollection(targetModel);
      const sameCollection = isSameCollection(sourceCollection, targetCollection);
      const options = sameCollection
        ? []
        : getRelatedFieldOptions(sourceCollection, targetCollection, dataSourceManager, t);

      return {
        model: targetModel,
        title: getTargetShortTitle(targetModel),
        sameCollection,
        options,
      };
    })
    .filter((target: SupportedTarget) => target.sameCollection || target.options.length > 0);
};

const highlightTargetBlock = (model: CollectionBlockModel | undefined) => {
  const element = model?.context?.ref?.current as HTMLElement | null;

  if (!element) {
    return;
  }

  if (element.dataset.treeHighlightOutline === undefined) {
    element.dataset.treeHighlightOutline = element.style.outline || '';
  }
  if (element.dataset.treeHighlightTransition === undefined) {
    element.dataset.treeHighlightTransition = element.style.transition || '';
  }

  element.style.outline = '2px solid var(--colorBorderSettingsHover)';
  element.style.transition = element.dataset.treeHighlightTransition || '';
};

const unhighlightTargetBlock = (model: CollectionBlockModel | undefined) => {
  const element = model?.context?.ref?.current as HTMLElement | null;

  if (!element) {
    return;
  }

  element.style.outline = element.dataset.treeHighlightOutline || '';
  element.style.transition = element.dataset.treeHighlightTransition || '';
  delete element.dataset.treeHighlightOutline;
  delete element.dataset.treeHighlightTransition;
};

function TreeConnectDataBlocksPanel(props: {
  model: TreeBlockModel;
  t: (key: string) => string;
  onSummaryChange: (summary: string) => void;
  setDropdownOpen?: (open: boolean) => void;
}) {
  const { model, t, onSummaryChange, setDropdownOpen } = props;
  const [config, setConfig] = React.useState<ConnectFieldsConfig>(() =>
    normalizeTreeConnectConfig(model.context.filterManager?.getConnectFieldsConfig(model.uid)),
  );
  const [blockGridVersion, setBlockGridVersion] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [hoveredRowId, setHoveredRowId] = React.useState<string>();
  const hoveredTargetIdRef = React.useRef<string>();
  const onSummaryChangeRef = React.useRef(onSummaryChange);
  const lastSummaryRef = React.useRef(getSummary(model, config));
  const panelRef = React.useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();

  onSummaryChangeRef.current = onSummaryChange;

  const notifySummaryChange = React.useCallback(
    (nextConfig: ConnectFieldsConfig) => {
      const nextSummary = getSummary(model, nextConfig);
      if (lastSummaryRef.current === nextSummary) {
        return;
      }

      lastSummaryRef.current = nextSummary;
      onSummaryChangeRef.current(nextSummary);
    },
    [model],
  );

  const supportedTargets = React.useMemo(() => {
    return getSupportedTargets(model, t);
  }, [blockGridVersion, model, t]);

  React.useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      const nextConfig = await syncTreeConnectConfig(model);
      if (cancelled) {
        return;
      }

      setConfig((previousConfig) => (isSameConnectConfig(previousConfig, nextConfig) ? previousConfig : nextConfig));
      notifySummaryChange(nextConfig);
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [model, notifySummaryChange]);

  React.useEffect(() => {
    const blockGridModel = model.context.blockGridModel;
    if (!blockGridModel?.emitter) {
      return;
    }

    let cancelled = false;
    const syncAfterChange = async () => {
      const nextConfig = await syncTreeConnectConfig(model);
      if (cancelled) {
        return;
      }

      setConfig((previousConfig) => (isSameConnectConfig(previousConfig, nextConfig) ? previousConfig : nextConfig));
      notifySummaryChange(nextConfig);
    };
    const handleSubModelChanged = () => {
      setBlockGridVersion((version) => version + 1);
    };
    const handleSubModelRemoved = () => {
      handleSubModelChanged();
      void syncAfterChange();
    };

    blockGridModel.emitter.on('onSubModelAdded', handleSubModelChanged);
    blockGridModel.emitter.on('onSubModelRemoved', handleSubModelRemoved);
    blockGridModel.emitter.on('onSubModelReplaced', handleSubModelRemoved);
    blockGridModel.emitter.on('onSubModelDestroyed', handleSubModelRemoved);

    return () => {
      cancelled = true;
      blockGridModel.emitter.off('onSubModelAdded', handleSubModelChanged);
      blockGridModel.emitter.off('onSubModelRemoved', handleSubModelRemoved);
      blockGridModel.emitter.off('onSubModelReplaced', handleSubModelRemoved);
      blockGridModel.emitter.off('onSubModelDestroyed', handleSubModelRemoved);
    };
  }, [model, notifySummaryChange]);

  React.useEffect(() => {
    return () => {
      if (!hoveredTargetIdRef.current) {
        return;
      }

      const hoveredModel = model.flowEngine.getModel(hoveredTargetIdRef.current) as CollectionBlockModel | undefined;
      unhighlightTargetBlock(hoveredModel);
    };
  }, [model]);

  const saveConfig = React.useCallback(
    async (nextConfig: ConnectFieldsConfig) => {
      const normalizedNextConfig = normalizeTreeConnectConfig(nextConfig);

      setSaving(true);
      try {
        await persistConnectConfig(model, normalizedNextConfig);
        setConfig((previousConfig) =>
          isSameConnectConfig(previousConfig, normalizedNextConfig) ? previousConfig : normalizedNextConfig,
        );
        notifySummaryChange(normalizedNextConfig);
      } finally {
        setSaving(false);
      }
    },
    [model, notifySummaryChange],
  );

  const upsertTarget = React.useCallback(
    async (targetId: string, filterPaths: string[]) => {
      const nextTargets = config.targets.filter((target) => target.targetId !== targetId);
      nextTargets.push({ targetId, filterPaths });
      await saveConfig({ targets: nextTargets });
    },
    [config.targets, saveConfig],
  );

  const removeTarget = React.useCallback(
    async (targetId: string) => {
      await saveConfig({
        targets: config.targets.filter((target) => target.targetId !== targetId),
      });
    },
    [config.targets, saveConfig],
  );

  const handleMouseEnter = React.useCallback(
    (targetModel: CollectionBlockModel) => {
      setHoveredRowId(targetModel.uid);

      if (hoveredTargetIdRef.current && hoveredTargetIdRef.current !== targetModel.uid) {
        const previousModel = model.flowEngine.getModel(hoveredTargetIdRef.current) as CollectionBlockModel | undefined;
        unhighlightTargetBlock(previousModel);
      }

      hoveredTargetIdRef.current = targetModel.uid;
      highlightTargetBlock(targetModel);
    },
    [model],
  );

  const handleMouseLeave = React.useCallback((targetModel: CollectionBlockModel) => {
    setHoveredRowId((current) => (current === targetModel.uid ? undefined : current));

    if (hoveredTargetIdRef.current === targetModel.uid) {
      hoveredTargetIdRef.current = undefined;
    }

    unhighlightTargetBlock(targetModel);
  }, []);

  return (
    <div
      ref={panelRef}
      style={{ width: 340, maxHeight: 360, overflow: 'auto', padding: 4 }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDropdownOpen?.(true);
      }}
      onMouseEnter={() => setDropdownOpen?.(true)}
    >
      {saving ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Spin size="small" />
        </div>
      ) : null}
      {supportedTargets.length ? (
        supportedTargets.map((target) => {
          const connectedTarget = config.targets.find((item) => item.targetId === target.model.uid);
          const selectedField = connectedTarget?.filterPaths?.[0];

          return (
            <div
              key={target.model.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                minHeight: 32,
                padding: '5px 8px',
                borderRadius: token.borderRadiusSM,
                background: hoveredRowId === target.model.uid ? token.controlItemBgHover : 'transparent',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={() => handleMouseEnter(target.model)}
              onMouseLeave={() => handleMouseLeave(target.model)}
            >
              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: token.colorText,
                  // lineHeight: `${token.lineHeight}px`,
                }}
              >
                {target.title}
              </div>
              {target.sameCollection ? null : (
                <div
                  style={{ flex: '0 0 152px' }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDropdownOpen?.(true);
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <Select
                    size="small"
                    allowClear
                    disabled={saving}
                    placeholder={t('Please select')}
                    value={selectedField}
                    options={target.options}
                    style={{ width: '100%' }}
                    getPopupContainer={() => document.body}
                    onChange={(value) => {
                      if (!value) {
                        void removeTarget(target.model.uid);
                        return;
                      }

                      void upsertTarget(target.model.uid, [value]);
                    }}
                  />
                </div>
              )}
              {target.sameCollection ? (
                <div
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <Switch
                    size="small"
                    checked={!!connectedTarget}
                    disabled={saving}
                    onChange={(checked) => {
                      if (!checked) {
                        void removeTarget(target.model.uid);
                        return;
                      }

                      const targetCollection = getCollection(target.model);
                      void upsertTarget(target.model.uid, [getCollectionFilterTargetKey(targetCollection)]);
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <Empty
          style={{ width: 200, padding: '8px 0' }}
          description={t('No supported data blocks')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
}

export const treeConnectDataBlocks = defineAction({
  name: 'treeConnectDataBlocks',
  title: tExpr('Connect data blocks'),
  uiMode(ctx) {
    const model = ctx.model as TreeBlockModel;
    const summary = getSummary(model, model.context.filterManager?.getConnectFieldsConfig?.(model.uid));

    return {
      type: 'select',
      key: CONNECT_FIELDS_SUMMARY_KEY,
      props: {
        options: [
          {
            label: summary,
            value: summary,
          },
        ],
        dropdownRender: (_menu, _setOpen, handleChange) => {
          return (
            <TreeConnectDataBlocksPanel
              model={model}
              t={ctx.t}
              setDropdownOpen={_setOpen}
              onSummaryChange={(nextSummary) => {
                handleChange(nextSummary);
              }}
            />
          );
        },
      },
    };
  },
  defaultParams(ctx) {
    return {
      [CONNECT_FIELDS_SUMMARY_KEY]: getSummary(
        ctx.model as TreeBlockModel,
        ctx.model.context.filterManager?.getConnectFieldsConfig?.(ctx.model.uid),
      ),
    };
  },
  beforeParamsSave(ctx, params) {
    delete params.summary;
    delete params[CONNECT_FIELDS_SUMMARY_KEY];
    clearPersistedSummary(ctx.model as TreeBlockModel);
  },
  handler() {},
});
