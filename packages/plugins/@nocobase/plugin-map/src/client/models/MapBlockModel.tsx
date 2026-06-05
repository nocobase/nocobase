/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DndProvider,
  MultiRecordResource,
  FlowModelRenderer,
  tExpr,
  DragHandler,
  AddSubModelButton,
  FlowSettingsButton,
  Droppable,
} from '@nocobase/flow-engine';
import { Space, InputNumber, Cascader } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel, BlockSceneEnum, openViewFlow } from '@nocobase/client';
import { useField, observer } from '@formily/react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapBlockComponent } from './MapBlockComponent';
import { NAMESPACE } from '../locale';

const findNestedOption = (value: string[] | string, options = []) => {
  if (typeof value === 'string') {
    value = [value];
  }
  return value?.reduce((cur, v, index) => {
    const matched = cur?.find((item) => item.value === v);
    return index === value.length - 1 ? matched : matched?.children;
  }, options);
};

const MapFieldCascader = observer((props: any) => {
  const field: any = useField();
  const options = props?.options ?? props?.dataSource ?? field?.dataSource ?? [];
  return <Cascader {...props} options={options} />;
});
export class MapBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;
  selectedRecordKeys = [];
  get resource() {
    return super.resource as MultiRecordResource;
  }
  onInit(options: any): void {
    super.onInit(options);
    this.setStepParams('popupSettings', 'openView', {
      disablePopupTemplateMenu: true,
    });
    this.resource.on('refresh', async () => {
      this.resource.setSelectedRows([]);
      this.selectedRecordKeys = [];
    });
  }
  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }
  renderConfigureAction() {
    return (
      <AddSubModelButton
        key={'map-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('MapActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  getSelectedRecordKeys() {
    return this.selectedRecordKeys;
  }

  setSelectedRecordKeys(keys) {
    const data = this.getSelectedRecordKeys();
    this.selectedRecordKeys = data.concat(keys);
    const selectRecords = this.selectedRecordKeys.map((v) => {
      return this.resource.getData().find((item) => item[this.collection.filterTargetKey] === v);
    });
    this.resource.setSelectedRows(selectRecords);
  }

  getInputArgs() {
    const inputArgs = {};
    if (this.context.resource) {
      const sourceId = this.context.resource.getSourceId();
      if (sourceId) {
        inputArgs['sourceId'] = sourceId;
      }
    }
    if (this.context.collection && this.context.record) {
      const filterByTk = this.context.collection.getFilterByTK(this.context.record);
      if (filterByTk) {
        inputArgs['filterByTk'] = filterByTk;
      }
    }
    return inputArgs;
  }

  protected onMount(): void {
    super.onMount();
    this.onOpenView = (record) => {
      const filterByTk = this.context.collection.getFilterByTK(record);
      this.dispatchEvent('click', {
        onChange: this.props.onChange,
        record: record,
        filterByTk,
      });
    };
  }

  set onOpenView(fn) {
    this.setProps({ onOpenView: fn });
  }

  renderComponent() {
    const { heightMode, height } = this.decoratorProps;
    return <MapBlockContent model={this} heightMode={heightMode} height={height} />;
  }
}

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

const useMapHeight = ({
  heightMode,
  containerRef,
  actionsRef,
  deps = [],
}: {
  heightMode?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  actionsRef: React.RefObject<HTMLDivElement>;
  deps?: React.DependencyList;
}) => {
  const [mapHeight, setMapHeight] = useState<number>();
  const calcMapHeight = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setMapHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    if (!containerHeight) return;
    const actionsHeight = getOuterHeight(actionsRef.current);
    const nextHeight = Math.max(0, Math.floor(containerHeight - actionsHeight));
    setMapHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, containerRef, actionsRef]);

  useLayoutEffect(() => {
    calcMapHeight();
  }, [calcMapHeight, ...deps]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const container = containerRef.current;
    const actions = actionsRef.current;
    const observer = new ResizeObserver(() => calcMapHeight());
    observer.observe(container);
    if (actions) observer.observe(actions);
    return () => observer.disconnect();
  }, [calcMapHeight, containerRef, actionsRef, ...deps]);

  return mapHeight;
};

const MapBlockContent = observer(
  ({ model, heightMode, height }: { model: MapBlockModel; heightMode?: string; height?: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
    const mapHeight = useMapHeight({
      heightMode,
      containerRef,
      actionsRef,
      deps: [height],
    });
    const mapStyle = useMemo(() => {
      if (mapHeight == null) return undefined;
      return { height: mapHeight, overflow: 'auto' };
    }, [mapHeight]);
    const containerStyle: any = isFixedHeight
      ? {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
        }
      : undefined;
    const isConfigMode = !!model.context.flowSettingsEnabled;

    return (
      <div ref={containerRef} style={containerStyle}>
        <div ref={actionsRef}>
          <DndProvider>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}
            >
              <Space>
                {model.mapSubModels('actions', (action) => {
                  // @ts-ignore
                  if (action.props.position === 'left') {
                    return (
                      <FlowModelRenderer
                        key={action.uid}
                        model={action}
                        showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                      />
                    );
                  }

                  return null;
                })}
                {/* 占位 */}
                <span></span>
              </Space>
              <Space wrap>
                {model.mapSubModels('actions', (action) => {
                  if (action.hidden && !isConfigMode) {
                    return;
                  }
                  // @ts-ignore
                  if (action.props.position !== 'left') {
                    return (
                      <Droppable model={action} key={action.uid}>
                        <FlowModelRenderer
                          model={action}
                          showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                          extraToolbarItems={[
                            {
                              key: 'drag-handler',
                              component: DragHandler,
                              sort: 1,
                            },
                          ]}
                        />
                      </Droppable>
                    );
                  }

                  return null;
                })}
                {model.renderConfigureAction()}
              </Space>
            </div>
          </DndProvider>
        </div>
        <div className="nb-map-content" style={mapStyle}>
          <MapBlockComponent
            {...model.props}
            fields={model.collection.getFields()}
            name={model.collection.name}
            primaryKey={model.collection.filterTargetKey}
            setSelectedRecordKeys={model.setSelectedRecordKeys.bind(model)}
            dataSource={model.resource.getData()}
            height={mapHeight ? mapHeight - 5 : null}
          />
        </div>
      </div>
    );
  },
);

const getCollectionFieldsOptions = (
  collectionName: string,
  collectionManager: any,
  type?: string | string[],
  interfaces?: string | string[],
  opts?: {
    dataSource?: string;
    cached?: Record<string, any>;
    collectionNames?: string[];
    /**
     * 为 true 时允许查询所有关联字段
     * 为 Array<string> 时仅允许查询指定的关联字段
     */
    association?: boolean | string[];
    /**
     * Max depth of recursion
     */
    maxDepth?: number;
    allowAllTypes?: boolean;
    /**
     * 排除这些接口的字段
     */
    exceptInterfaces?: string[];
    /**
     * field value 的前缀，用 . 连接，比如 a.b.c
     */
    prefixFieldValue?: string;
    /**
     * 是否使用 prefixFieldValue 作为 field value
     */
    usePrefix?: boolean;
  },
) => {
  const {
    association = false,
    cached = {},
    collectionNames = [collectionName],
    maxDepth = 1,
    allowAllTypes = false,
    exceptInterfaces = [],
    prefixFieldValue = '',
    usePrefix = false,
    dataSource: customDataSourceNameValue,
  } = opts || {};

  const normalizeToArray = (value?: string | string[]) => {
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  };

  const cloneOptions = (options?: any[]) => {
    if (!options?.length) {
      return options;
    }
    return options.map((option) => ({
      ...option,
      options: option?.options ? { ...option.options } : option?.options,
      children: cloneOptions(option?.children),
    }));
  };

  if (collectionNames.length - 1 > maxDepth) {
    return;
  }

  if (cached[collectionName]) {
    // avoid infinite recursion
    return cloneOptions(cached[collectionName]);
  }

  // Fetch the collection
  const collection = collectionManager.getCollection(collectionName);
  if (!collection) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  // Get the fields of the collection
  const fields = collection.getFields(); // Assuming `getFields` returns an array of fields for the collection.

  const typeList = normalizeToArray(type);
  const interfaceList = normalizeToArray(interfaces);

  const options = fields
    ?.filter(
      (field) =>
        field.interface &&
        !exceptInterfaces.includes(field.interface) &&
        (allowAllTypes ||
          (typeList && typeList.includes(field.type)) ||
          (interfaceList && interfaceList.includes(field.interface)) ||
          (association && field.target && field.target !== collectionName && Array.isArray(association)
            ? association.includes(field.interface)
            : false)),
    )
    ?.map((field) => {
      const fieldName = field?.name;
      const fieldType = field?.type ?? field?.options?.type;
      const fieldInterface = field?.interface ?? field?.options?.interface;
      const fieldTarget = field?.target ?? field?.options?.target;
      const fieldLabel = field?.uiSchema?.title || field?.title || fieldName;
      const result: any['options'][0] = {
        value: usePrefix && prefixFieldValue ? `${prefixFieldValue}.${fieldName}` : fieldName,
        label: fieldLabel || fieldName,
        type: fieldType,
        interface: fieldInterface,
        target: fieldTarget,
        options: {
          type: fieldType,
          interface: fieldInterface,
          target: fieldTarget,
        },
      };

      if (association && fieldTarget) {
        result.children = collectionNames.includes(fieldTarget)
          ? []
          : getCollectionFieldsOptions(fieldTarget, collectionManager, type, interfaces, {
              ...opts,
              cached,
              dataSource: customDataSourceNameValue,
              collectionNames: [...collectionNames, fieldTarget],
              prefixFieldValue: usePrefix ? (prefixFieldValue ? `${prefixFieldValue}.${fieldName}` : fieldName) : '',
              usePrefix,
            });

        // If no children are found, don't return the field
        if (!result.children?.length) {
          return null;
        }
      }
      return result;
    })
    // Filter out null values (i.e., fields with no valid options)
    .filter(Boolean);

  // Cache the result to avoid infinite recursion
  cached[collectionName] = options;
  return options;
};
MapBlockModel.registerFlow({
  key: 'createMapBlock',
  title: tExpr('Map block settings', { ns: NAMESPACE }),
  steps: {
    init: {
      title: tExpr('Map Field & Marker field', { ns: NAMESPACE }),
      preset: true,
      uiSchema: (ctx) => {
        const t = ctx.t;
        const dataSourceKey = ctx.dataSource.key;
        const collectionManager = ctx.dataSourceManager.getDataSource(dataSourceKey).collectionManager;
        let mapFieldOptionsCache = [];
        let markerFieldOptionsCache = [];
        let optionsLoaded = false;
        let optionsLoading = false;
        const getMapFieldOptions = () =>
          getCollectionFieldsOptions(ctx.collection.name, collectionManager, ['point', 'lineString', 'polygon'], null, {
            association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
          }) || [];
        const getMarkerFieldOptions = () =>
          getCollectionFieldsOptions(ctx.collection.name, collectionManager, 'string', null, {
            dataSource: dataSourceKey,
          }) || [];
        const syncMarkerHidden = (form, mapFieldValue) => {
          if (!mapFieldValue?.length || !mapFieldOptionsCache.length) {
            return;
          }
          const item = findNestedOption(mapFieldValue, mapFieldOptionsCache);
          if (!item) {
            return;
          }
          form.setFieldState('marker', (state) => {
            state.hidden = item.options?.type !== 'point';
          });
        };
        const applyAsyncOptions = (field) => {
          if (optionsLoaded || optionsLoading) {
            return;
          }
          optionsLoading = true;
          setTimeout(() => {
            mapFieldOptionsCache = getMapFieldOptions();
            markerFieldOptionsCache = getMarkerFieldOptions();
            optionsLoaded = true;
            optionsLoading = false;
            const form = field?.form;
            if (!form) {
              return;
            }
            let resolvedMapFieldValue = form.values.mapField;
            form.setFieldState('mapField', (state) => {
              state.dataSource = mapFieldOptionsCache;
              if (!state.value?.length && mapFieldOptionsCache.length) {
                const defaultValue = [
                  mapFieldOptionsCache[0].value,
                  mapFieldOptionsCache[0].children?.[0]?.value,
                ].filter((v) => v !== undefined && v !== null);
                state.value = defaultValue;
                if (!state.initialValue?.length) {
                  state.initialValue = defaultValue;
                }
                resolvedMapFieldValue = defaultValue;
                return;
              }
              resolvedMapFieldValue = state.value;
            });
            form.setFieldState('marker', (state) => {
              state.dataSource = markerFieldOptionsCache.map((v) => ({
                label: v.label,
                value: v.value,
              }));
            });
            syncMarkerHidden(form, resolvedMapFieldValue ?? form.values.mapField);
          }, 0);
        };
        return {
          mapField: {
            title: t('Map field', { ns: NAMESPACE }),
            required: true,
            enum: [],
            'x-component': MapFieldCascader,
            'x-component-props': {
              style: { width: '100%' },
            },
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const mapFieldValue = field.value;
              applyAsyncOptions(field);
              if (!optionsLoaded || !mapFieldOptionsCache.length) {
                return;
              }
              syncMarkerHidden(field.form, mapFieldValue);
            },
          },
          marker: {
            title: t('Marker field', { ns: NAMESPACE }),
            enum: [],
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const mapFieldValue = field.query('mapField').get('value');
              if (!optionsLoaded || !mapFieldOptionsCache.length) {
                return;
              }
              if (!mapFieldValue?.length) {
                return;
              }
              const item = findNestedOption(mapFieldValue, mapFieldOptionsCache);
              if (item) {
                field.hidden = item.options?.type !== 'point';
              }
            },
          },
        };
      },
      async handler(ctx, params) {
        if (params.mapField) {
          let collectionField;
          let associationCollectionField;
          if (params.mapField.length > 1) {
            collectionField = ctx.collection.getFieldByPath(params.mapField.join('.'));
            associationCollectionField = ctx.collection.getFieldByPath(params.mapField[0]);
          } else {
            collectionField = ctx.collection.getField(params.mapField[0]);
          }
          ctx.model.setProps('mapField', params.mapField);
          ctx.model.setProps('marker', params.marker);
          ctx.model.setProps('mapFieldCollectionField', collectionField);
          ctx.model.setProps('markerFieldCollectionField', ctx.collection.getField(params.marker));
          ctx.model.setProps('associationCollectionField', associationCollectionField);
        }
      },
    },
    addAppends: {
      handler(ctx, params) {
        ctx.resource.setRequestParameters({
          paginate: false,
        });
        const { associationCollectionField } = ctx.model.props;
        if (associationCollectionField) {
          ctx.resource.addAppends(associationCollectionField.name);
        }
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    lineSort: {
      use: 'sortingRule',
      title: tExpr('Concatenation order field', { ns: NAMESPACE }),
      async handler(ctx, params) {
        const sortArr = params.sort.map((item) => {
          return item.direction === 'desc' ? `-${item.field}` : item.field;
        });
        // @ts-ignore
        const resource = ctx.model?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        ctx.model.setProps({
          lineSort: sortArr,
        });
      },
    },
    mapZoom: {
      title: tExpr('The default zoom level of the map', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          zoom: {
            title: t('Zoom'),
            'x-component': InputNumber,
            'x-decorator': 'FormItem',
            'x-component-props': {
              precision: 0,
            },
          },
        };
      },
      defaultParams: {
        zoom: 13,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          zoom: params.zoom,
        });
      },
    },
  },
});

MapBlockModel.registerFlow(openViewFlow);

MapBlockModel.define({
  label: tExpr('Map', { ns: NAMESPACE }),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  sort: 600,
});
