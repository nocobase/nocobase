/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import {
  CollectionField,
  EditableItemModel,
  tExpr,
  FilterableItemModel,
  MultiRecordResource,
  useFlowViewContext,
  FlowModelRenderer,
  useFlowContext,
  FlowModel,
  useFlowModel,
} from '@nocobase/flow-engine';
import { Select, Space, Button, Divider, Tooltip, Tag } from 'antd';
import { css } from '@emotion/css';
import { debounce } from 'lodash';
import { useRequest } from 'ahooks';
import { PlusOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { AssociationFieldModel } from './AssociationFieldModel';
import {
  buildOpenerUids,
  LabelByField,
  resolveOptions,
  toSelectValue,
  type AssociationOption,
  type LazySelectProps,
} from './recordSelectShared';
import { MobileLazySelect } from '../mobile-components/MobileLazySelect';
import { BlockSceneEnum } from '../../base';
import { ActionWithoutPermission } from '../../base/ActionModel';
import { EditFormModel } from '../../blocks';

function RemoteModelRenderer({ options }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options, { delegateToParent: false, delegate: ctx });
      return model;
    },
    {
      refreshDeps: [ctx, options],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

export function CreateContent({ model, toOne = false }) {
  const ctx = useFlowContext();
  const { Header, type } = ctx.view;
  model._closeView = ctx.view.close;
  return (
    <div>
      <Header
        title={
          type === 'dialog' ? (
            <div
              style={{
                padding: `${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px 0`,
                marginBottom: -ctx.themeToken.marginSM,
                backgroundColor: 'var(--colorBgLayout)',
              }}
            >
              {ctx.t('Create record')}
            </div>
          ) : (
            ctx.t('Create record')
          )
        }
      />
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: 'grid',
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    </div>
  );
}

const useFieldPermissionMessage = (model, allowEdit) => {
  const collection = model.context.collectionField?.collection;
  const dataSource = collection.dataSource;
  const t = model.context.t;
  const name = model.context.collectionField?.name || model.fieldPath;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  if (allowEdit) {
    return null;
  }
  const messageValue = t(
    `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
    {
      name: nameValue,
      actionName: 'Update',
    },
  ).replaceAll('&gt;', '>');
  return messageValue;
};

const LazySelect = (props: Readonly<LazySelectProps>) => {
  const {
    fieldNames = { label: 'label', value: 'value' },
    value,
    multiple,
    allowMultiple,
    options,
    quickCreate,
    onChange,
    allowCreate = true,
    allowEdit = true,
    ...others
  } = props;
  const isMultiple = Boolean(multiple && allowMultiple);
  const realOptions = resolveOptions(options, value, isMultiple);
  const model: any = useFlowModel();
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const { t } = useTranslation();
  const QuickAddContent = ({ searchText }) => {
    return (
      <div
        onClick={() => others.onDropdownAddClick(searchText)}
        style={{ cursor: 'pointer', padding: '5px 12px', color: '#0d0c0c' }}
      >
        <PlusOutlined />
        <span style={{ paddingLeft: 5 }}>{t('Add') + ` “${searchText}” `}</span>
      </div>
    );
  };
  const fieldAclMessage = useFieldPermissionMessage(model, allowEdit);

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        style={{ width: '100%' }}
        {...others}
        allowClear
        showSearch
        maxTagCount="responsive"
        maxTagPlaceholder={(omittedValues) => (
          <Tooltip
            title={
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxWidth: '100%',
                }}
              >
                {omittedValues.map((item) => (
                  <Tag
                    key={item.value}
                    style={{
                      margin: 0,
                      background: '#fafafa',
                      border: '1px solid #d9d9d9',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    {item.label}
                  </Tag>
                ))}
              </div>
            }
            overlayInnerStyle={{
              background: '#fff',
              color: '#000',
              padding: 8,
              maxWidth: '100%',
            }}
            color="#fff"
            overlayStyle={{
              pointerEvents: 'auto',
              maxWidth: 300,
            }}
          >
            +{omittedValues.length}...
          </Tooltip>
        )}
        filterOption={false}
        labelInValue
        //@ts-ignore
        onCompositionEnd={(e) => others.onCompositionEnd(e, false)}
        fieldNames={fieldNames}
        options={realOptions}
        value={toSelectValue(value, fieldNames, isMultiple)}
        mode={isMultiple ? 'multiple' : undefined}
        onChange={(value, option) => {
          onChange(option as AssociationOption | AssociationOption[]);
        }}
        optionRender={({ data }) => {
          return <LabelByField option={data} fieldNames={fieldNames} />;
        }}
        popupMatchSelectWidth
        labelRender={(data) => {
          return (
            <div
              className={css`
                div {
                  white-space: nowrap !important;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              `}
            >
              {data.label}
            </div>
          );
        }}
        dropdownRender={(menu) => {
          const isFullMatch = realOptions.some((v) => v[fieldNames.label] === others.searchText);
          return (
            <>
              {quickCreate === 'quickAdd' && allowCreate && allowEdit && others.searchText ? (
                <>
                  {!(realOptions.length === 0 && others.searchText) && menu}
                  {realOptions.length > 0 && others.searchText && !isFullMatch && <Divider style={{ margin: 0 }} />}
                  {!isFullMatch && <QuickAddContent searchText={others.searchText} />}
                </>
              ) : (
                menu
              )}
            </>
          );
        }}
      />
      {quickCreate === 'modalAdd' &&
        ((allowCreate && allowEdit) || isConfigMode) &&
        (allowCreate && allowEdit ? (
          <Button onClick={others.onModalAddClick}>{t('Add new')}</Button>
        ) : (
          <ActionWithoutPermission
            forbidden={{ actionName: 'create' }}
            collection={model.collectionField.targetCollection}
            message={fieldAclMessage}
          >
            <Button onClick={others.onModalAddClick} disabled={!allowEdit} style={{ opacity: '0.3' }}>
              {t('Add new')}
            </Button>
          </ActionWithoutPermission>
        ))}
    </Space.Compact>
  );
};

export class RecordSelectFieldModel extends AssociationFieldModel {
  declare resource: MultiRecordResource;

  get collectionField(): CollectionField {
    return this.context.collectionField;
  }

  onInit(options) {
    super.onInit(options);
    // For association fields, expose target collection to variable selectors
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField?.targetCollection,
    });
    this.setDataSource([]);
  }

  set onPopupScroll(fn) {
    this.setProps({ onPopupScroll: fn });
  }
  set onDropdownVisibleChange(fn) {
    this.setProps({ onDropdownVisibleChange: fn });
  }
  set onSearch(fn) {
    this.setProps({ onSearch: fn });
  }

  setDataSource(dataSource) {
    this.setProps({ options: dataSource });
  }
  getDataSource() {
    return this.props.options;
  }

  getFilterValue() {
    const fieldNames = this.props.fieldNames || { label: 'label', value: 'value' };
    return Array.isArray(this.props.value)
      ? this.props.value.map((item) => item[fieldNames.value])
      : this.props.value?.[fieldNames.value];
  }

  protected onMount(): void {
    this.onModalAddClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
        onChange: this.props.onChange,
      });
    };
    this.onDropdownAddClick = (search) => {
      this.dispatchEvent('dropdownAdd', {
        search: search,
        onChange: this.props.onChange,
      });
    };
  }
  set onModalAddClick(fn) {
    this.setProps({ onModalAddClick: fn });
  }

  set onDropdownAddClick(fn) {
    this.setProps({ onDropdownAddClick: fn });
  }

  change(value) {
    this.props.onChange(value);
  }

  render() {
    // TODO: 移动端相关的代码需迁移到单独的插件中
    if (this.context.isMobileLayout) {
      return <MobileLazySelect {...(this.props as LazySelectProps)} loading={this.resource.loading} />;
    }

    return <LazySelect {...(this.props as LazySelectProps)} />;
  }
}

const paginationState = {
  page: 1,
  pageSize: 40,
  loading: false,
  hasMore: true,
};

// 事件绑定
RecordSelectFieldModel.registerFlow({
  key: 'eventSettings',
  sort: 900,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        const labelFieldName = ctx.model.props.fieldNames.label;

        ctx.model.onDropdownVisibleChange = (open) => {
          if (open) {
            ctx.model.dispatchEvent('dropdownOpen', {
              apiClient: ctx.app.apiClient,
              form: ctx.model.context.form,
            });
          } else {
            ctx.model.resource.removeFilterGroup(labelFieldName);
            paginationState.page = 1;
          }
        };
        ctx.model.onPopupScroll = (e) => {
          ctx.model.dispatchEvent('popupScroll', {
            event: e,
            apiClient: ctx.app.apiClient,
          });
        };
        ctx.model.onSearch = (searchText) => {
          ctx.model.dispatchEvent('search', {
            searchText,
            apiClient: ctx.app.apiClient,
          });
        };
      },
    },
  },
});

//点击打开下拉时加载数据
RecordSelectFieldModel.registerFlow({
  key: 'dropdownOpenSettings',
  on: 'dropdownOpen',
  steps: {
    setScope: {
      async handler(ctx, params) {
        const labelFieldValue = ctx.model.props.fieldNames.value;
        const resource = ctx.model.resource;
        const options = ctx.model.getDataSource();
        resource.setPage(1);
        await ctx.model.applyFlow('selectSettings');
        await resource.refresh();
        const { count } = resource.getMeta();
        const data = resource.getData();
        //已经全部加载
        if (options && count === options.length && data[0][labelFieldValue] === options[0][labelFieldValue]) {
          return;
        }
        ctx.model.setDataSource(data);
        ctx.model.setProps({
          searchText: null,
        });
        if (data.length < paginationState.pageSize) {
          paginationState.hasMore = false;
        } else {
          paginationState.hasMore = true;
          paginationState.page++;
        }
      },
    },
  },
});

//鼠标滚动后分页加载数据
RecordSelectFieldModel.registerFlow({
  key: 'popupScrollSettings',
  on: 'popupScroll',
  steps: {
    step1: {
      async handler(ctx, params) {
        const event = ctx.inputArgs?.event;
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        // 只在接近底部时才触发加载
        if (scrollTop + clientHeight < scrollHeight - 20) {
          return;
        }
        if (paginationState.loading || !paginationState.hasMore) {
          return;
        }
        paginationState.loading = true;

        try {
          const resource = ctx.model.resource;
          resource.setPage(paginationState.page);
          await resource.refresh();
          const data = resource.getData();
          const currentDataSource = ctx.model.getDataSource() || [];
          ctx.model.setDataSource([...currentDataSource, ...data]);
          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
            paginationState.page = 1;
          } else {
            paginationState.page++;
          }
        } catch (error) {
          console.error('Scroll pagination request failed:', error);
        } finally {
          paginationState.loading = false;
        }
      },
    },
  },
});

async function originalHandler(ctx, params) {
  try {
    const targetCollection = ctx.model.collectionField.targetCollection;
    const labelFieldName = ctx.model.props.fieldNames.label;
    const targetLabelField = targetCollection.getField(labelFieldName);

    const targetInterface = targetLabelField.getInterfaceOptions();

    const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';

    const searchText = ctx.inputArgs.searchText?.trim();

    const resource = ctx.model.resource;
    const key = `${labelFieldName}.${operator}`;
    if (searchText === '') {
      resource.removeFilterGroup(labelFieldName);
    } else {
      resource.setPage(1);
      resource.addFilterGroup(labelFieldName, {
        [key]: searchText,
      });
    }
    await resource.refresh();
    const data = resource.getData();
    ctx.model.setDataSource(data);
    if (data.length < paginationState.pageSize) {
      paginationState.hasMore = false;
    } else {
      paginationState.hasMore = true;
      paginationState.page++;
    }
    ctx.model.setProps({
      searchText: searchText,
    });
  } catch (error) {
    console.error('AssociationSelectField search flow error:', error);
    ctx.model.setDataSource([]);
  }
}

const debouncedHandler = debounce(originalHandler, 500);

// 模糊搜索
RecordSelectFieldModel.registerFlow({
  key: 'searchSettings',
  on: 'search',
  steps: {
    step1: {
      handler: debouncedHandler,
    },
  },
});

RecordSelectFieldModel.registerFlow({
  key: 'recordSelectSettings',
  sort: 200,
  steps: {
    init: {
      async handler(ctx) {
        const resource = ctx.createResource(MultiRecordResource);
        const collectionField = ctx.model.context.collectionField;
        const { target, dataSourceKey, foreignKey } = collectionField;
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(target);
        resource.setPageSize(paginationState.pageSize);
        const isFilterScene = ctx?.blockModel?.constructor?.scene === BlockSceneEnum.filter;
        const isOToAny = ['oho', 'o2m'].includes(collectionField.interface);
        const record = ctx.currentObject || ctx.record;
        const sourceValue = record?.[collectionField?.sourceKey];
        // 构建 $or 条件数组
        const orFilters: Record<string, any>[] = [];
        if (!isFilterScene && sourceValue != null && isOToAny) {
          const eqKey = `${foreignKey}.$eq`;
          orFilters.push({ [eqKey]: sourceValue });
        }

        if (!isFilterScene && isOToAny) {
          const isKey = `${foreignKey}.$is`;
          orFilters.push({ [isKey]: null });
        }

        if (orFilters.length > 0) {
          resource.addFilterGroup(foreignKey, { $or: orFilters });
        }
        ctx.model.resource = resource;
      },
    },
    allowEditCheck: {
      async handler(ctx) {
        if (ctx.blockModel instanceof EditFormModel) {
          const aclEdit = await ctx.aclCheck({
            dataSourceKey: ctx.collectionField.dataSourceKey,
            resourceName: ctx.collectionField?.collectionName,
            actionName: 'update',
            fields: [ctx.collectionField.name],
          });
          ctx.model.setProps({
            allowEdit: !!aclEdit,
          });
        }
      },
    },
  },
});

//专有配置项
RecordSelectFieldModel.registerFlow({
  key: 'selectSettings',
  title: tExpr('Association select settings'),
  sort: 800,
  steps: {
    fieldNames: {
      use: 'titleField',
    },
    dataScope: {
      use: 'dataScope',
    },
    sortingRule: {
      use: 'sortingRule',
    },
    allowMultiple: {
      title: tExpr('Multiple'),
      uiMode: { type: 'switch', key: 'allowMultiple' },
      hideInSettings(ctx) {
        return (
          !ctx.collectionField || !['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.collectionField.type)
        );
      },
      defaultParams(ctx) {
        return {
          allowMultiple:
            ctx.collectionField &&
            ['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.model.context.collectionField.type),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowMultiple: params?.allowMultiple,
        });
      },
    },
    quickCreate: {
      title: tExpr('Quick create'),
      uiMode(ctx) {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'quickCreate',
          props: {
            options: [
              { label: t('None'), value: 'none' },
              { label: t('Dropdown'), value: 'quickAdd' },
              { label: t('Pop-up'), value: 'modalAdd' },
            ],
          },
        };
      },
      hideInSettings(ctx) {
        if (ctx?.blockModel?.constructor?.scene === BlockSceneEnum.filter) {
          return true;
        }
        return false;
      },
      defaultParams: {
        quickCreate: 'none',
      },
      handler(ctx, params) {
        ctx.model.setProps({
          quickCreate: params.quickCreate,
        });
      },
    },
  },
});

RecordSelectFieldModel.registerFlow({
  key: 'dropdownAdd',
  title: tExpr('Create record setting'),
  sort: 900,
  on: {
    eventName: 'dropdownAdd',
  },
  steps: {
    dropdownAdd: {
      async handler(ctx, params) {
        if (ctx.model.props.quickCreate !== 'quickAdd') {
          return null;
        }
        const { onChange, search: value } = ctx.inputArgs;
        const data: any = await ctx.model.resource.create(
          {
            [ctx.model.props?.fieldNames?.label || 'id']: value,
          },
          { refresh: false },
        );
        if (data) {
          if (['m2m', 'o2m'].includes(ctx.collectionField?.interface) && ctx.model.props.allowMultiple !== false) {
            const prev = ctx.model.props.value || [];
            const merged = [...prev, data.data];

            // 去重，防止同一个值重复
            const unique = merged.filter(
              (row, index, self) =>
                index ===
                self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
            );
            onChange(unique);
          } else {
            onChange(data.data);
          }
          ctx.message.success(ctx.t('Saved successfully'));
          ctx.model.setProps({
            searchText: null,
          });
        }
      },
    },
  },
});

RecordSelectFieldModel.registerFlow({
  key: 'popupSettings',
  title: tExpr('Create record setting'),
  sort: 900,
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: tExpr('Edit popup'),
      uiSchema: (ctx) => {
        if (ctx.model.props.quickCreate !== 'modalAdd') {
          return null;
        }
        return {
          mode: {
            type: 'string',
            title: tExpr('Open mode'),
            enum: [
              { label: tExpr('Drawer'), value: 'drawer' },
              { label: tExpr('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: tExpr('Popup size'),
            enum: [
              { label: tExpr('Small'), value: 'small' },
              { label: tExpr('Medium'), value: 'medium' },
              { label: tExpr('Large'), value: 'large' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
        };
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const { onChange } = ctx.inputArgs;
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const toOne = ['belongsTo', 'hasOne'].includes(ctx.collectionField.type);
        const size = ctx.inputArgs.size || params.size || 'medium';
        const sourceCollection = ctx.collectionField?.collection;
        const sourceRecord = ctx.currentObject || ctx.record;
        const sourceId = sourceRecord ? sourceCollection?.getFilterByTK?.(sourceRecord) : undefined;
        const associationName = ctx.collectionField?.resourceName;
        const openerUids = buildOpenerUids(ctx, ctx.inputArgs);
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'create',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            ...(associationName && sourceId != null ? { associationName, sourceId } : {}),
            collectionField: ctx.collectionField,
            openerUids,
            onChange: (e) => {
              if (toOne || !ctx.model.props.allowMultiple) {
                onChange(e);
                const data = ctx.model.getDataSource() || [];
                data.push(e);
                ctx.model.setDataSource(data);
              } else {
                const prev = ctx.model.props.value || [];
                const merged = [...prev, e];

                // 去重，防止同一个值重复
                const unique = merged.filter(
                  (row, index, self) =>
                    index ===
                    self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
                );
                onChange(unique);
                const data = ctx.model.getDataSource() || [];
                ctx.model.setDataSource(data.concat(unique));
              }
            },
          },
          content: () => <CreateContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
        });
      },
    },
  },
});

RecordSelectFieldModel.define({
  label: tExpr('Select'),
});

EditableItemModel.bindModelToInterface(
  'RecordSelectFieldModel',
  ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
  { isDefault: true },
);

FilterableItemModel.bindModelToInterface(
  'RecordSelectFieldModel',
  ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
  { isDefault: true },
);
