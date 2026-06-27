/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { BlockSceneEnum, CollectionBlockModel, TextAreaWithContextSelector } from '@nocobase/client-v2';
import { FlowModel, MultiRecordResource, type Collection } from '@nocobase/flow-engine';
import { Alert } from 'antd';
import React from 'react';

import { NAMESPACE, tExpr } from '../locale';
import { RecordCommentsBlockView } from './components/RecordCommentsBlockView';
import { RecordCommentFieldSelect } from './components/RecordCommentFieldSelect';
import {
  DEFAULT_PAGE_SIZE,
  getAssociationRecordCommentFieldMapping,
  OWNER_FILTER_GROUP_KEY,
  createOwnerFieldFilter,
  getCollectionField,
  getCollectionFilterTargetKey,
  getRecordPrimaryKeyValue,
  getValueByPath,
  isContextVariableValue,
  normalizeOwnerFilterValue,
  resolveCommentOwnerValue,
  resolveCommentOwnerValueFromFilterByTk,
  toScalarFilterValue,
  type RecordCommentAssociationLike,
  type RecordCommentCollection,
  type RecordCommentFieldMapping,
  type RecordCommentRecord,
} from './utils';

type RecordCommentsBlockStructure = {
  subModels: {
    items: RecordCommentItemModel[];
    submitActions?: FlowModel[];
  };
};

type RecordCommentOwnerValue = string | number | boolean | undefined;

const getFieldMappingDefaults = (
  model: RecordCommentsBlockModel | undefined,
  ctx: {
    collection?: unknown;
    view?: {
      inputArgs?: {
        associationName?: string;
        collectionName?: string;
      };
    };
    inputArgs?: {
      associationName?: string;
      collectionName?: string;
    };
    association?: RecordCommentAssociationLike;
  },
) => {
  const resourceSettingsInit =
    model && typeof model.getResourceSettingsInitParams === 'function'
      ? model.getResourceSettingsInitParams()
      : undefined;
  const associationName =
    resourceSettingsInit?.associationName || ctx.view?.inputArgs?.associationName || ctx.inputArgs?.associationName;
  const association = (model?.context?.association as RecordCommentAssociationLike | undefined) || ctx.association;
  const associationMapping = getAssociationRecordCommentFieldMapping({
    collection: model?.collection || ctx.collection,
    association,
    associationName,
  });

  if (associationMapping.ownerField) {
    return {
      defaultMapping: associationMapping,
      shouldHideOwnerMappingFields: true,
    };
  }

  return {
    defaultMapping: {},
    shouldHideOwnerMappingFields: false,
  };
};

export class RecordCommentItemModel extends FlowModel {
  render() {
    return (
      <RecordCommentsBlockView.Item
        blockModel={this.context.blockModel as RecordCommentsBlockModel}
        itemModel={this}
        record={this.context.record as RecordCommentRecord}
        forkKeyPrefix={this.uid}
      />
    );
  }
}

export class RecordCommentsBlockModel extends CollectionBlockModel<RecordCommentsBlockStructure> {
  static scene = BlockSceneEnum.many;

  private readonly resolvedOwnerValue = observable.ref<RecordCommentOwnerValue>(undefined);
  private readonly loadingLastPage = observable.ref(false);
  private shouldLoadLastPage = true;

  static filterCollection(collection: Collection) {
    return Boolean(collection?.filterTargetKey || getCollectionFilterTargetKey(collection as RecordCommentCollection));
  }

  get resource() {
    return super.resource as MultiRecordResource<RecordCommentRecord>;
  }

  get mapping(): RecordCommentFieldMapping {
    return {
      commenterField: this.props.commenterField,
      dateField: this.props.dateField,
      contentField: this.props.contentField,
      ownerField: this.props.ownerField,
      ownerValueField: this.props.ownerValueField,
    };
  }

  private getOwnerValueFromRecord() {
    return toScalarFilterValue(
      getValueByPath(this.context.record as RecordCommentRecord | undefined, this.mapping.ownerValueField),
    );
  }

  private get currentViewInputArgs() {
    return this.context.view?.inputArgs;
  }

  private get currentViewCollection() {
    return this.currentViewInputArgs?.dataSourceKey && this.currentViewInputArgs?.collectionName
      ? this.context.dataSourceManager?.getCollection?.(
          this.currentViewInputArgs.dataSourceKey,
          this.currentViewInputArgs.collectionName,
        )
      : undefined;
  }

  private getOwnerValueFromViewFilterByTk() {
    return resolveCommentOwnerValueFromFilterByTk(
      this.mapping.ownerValueField,
      this.currentViewInputArgs?.filterByTk,
      getCollectionFilterTargetKey(this.currentViewCollection),
    );
  }

  private get rawOwnerValue() {
    if (isContextVariableValue(this.mapping.ownerValueField)) {
      return this.resolvedOwnerValue.value ?? this.getOwnerValueFromViewFilterByTk();
    }

    return this.getOwnerValueFromRecord() ?? this.getOwnerValueFromViewFilterByTk();
  }

  private get ownerFilterValueState() {
    const ownerValue = this.rawOwnerValue;
    if (!this.mapping.ownerField || ownerValue === undefined) {
      return {
        compatible: true,
        value: ownerValue,
      };
    }

    return normalizeOwnerFilterValue(this.collection, this.mapping.ownerField, ownerValue);
  }

  get ownerValue() {
    const ownerFilterValueState = this.ownerFilterValueState;
    return ownerFilterValueState.compatible ? ownerFilterValueState.value : undefined;
  }

  async resolveOwnerValue() {
    const scalarValue =
      (await resolveCommentOwnerValue(
        {
          record: this.context.record as RecordCommentRecord | undefined,
          resolveJsonTemplate: (template) => this.context.resolveJsonTemplate(template),
        },
        this.mapping.ownerValueField,
      )) ?? this.getOwnerValueFromViewFilterByTk();
    this.resolvedOwnerValue.value = scalarValue;
    return scalarValue;
  }

  async applyOwnerFilter() {
    await this.resolveOwnerValue();
    const ownerFilterValueState = this.ownerFilterValueState;
    this.resource.removeFilterGroup(OWNER_FILTER_GROUP_KEY);

    if (this.mapping.ownerField && ownerFilterValueState.compatible && ownerFilterValueState.value !== undefined) {
      this.resource.addFilterGroup(
        OWNER_FILTER_GROUP_KEY,
        createOwnerFieldFilter(this.collection, this.mapping.ownerField, ownerFilterValueState.value),
      );
    }
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource) as MultiRecordResource<RecordCommentRecord>;
    const mapping = this.mapping;
    const appends = [mapping.commenterField]
      .map((fieldName) => getCollectionField(this.collection, fieldName))
      .filter((field) => field?.targetCollection)
      .map((field) => field?.name)
      .filter((fieldName): fieldName is string => Boolean(fieldName));

    resource.setPageSize(this.props.pageSize || DEFAULT_PAGE_SIZE);

    if (mapping.dateField) {
      resource.setSort([mapping.dateField]);
    }

    if (mapping.ownerField) {
      const ownerFilterValueState = this.ownerFilterValueState;
      if (ownerFilterValueState.compatible && ownerFilterValueState.value !== undefined) {
        resource.addFilterGroup(
          OWNER_FILTER_GROUP_KEY,
          createOwnerFieldFilter(this.collection, mapping.ownerField, ownerFilterValueState.value),
        );
      }
    }

    if (appends.length) {
      resource.addAppends(appends);
    }

    return resource;
  }

  getLastPage(pageSize = this.resource.getPageSize() || this.props.pageSize || DEFAULT_PAGE_SIZE) {
    const count = this.resource.getCount() || 0;
    return Math.max(Math.ceil(count / pageSize), 1);
  }

  isPreparingLastPageLoad() {
    if (this.loadingLastPage.value) {
      return true;
    }

    const count = this.resource.getCount() || 0;
    const currentPage = this.resource.getPage() || 1;
    const lastPage = this.getLastPage();
    return this.shouldLoadLastPage && count > 0 && currentPage !== lastPage;
  }

  async ensureLastPageLoaded() {
    if (this.resource.loading) {
      return;
    }

    const currentPage = this.resource.getPage() || 1;
    const lastPage = this.getLastPage();

    if (currentPage > lastPage) {
      this.shouldLoadLastPage = false;
      this.resource.setPage(lastPage);
      this.resource.loading = true;
      this.loadingLastPage.value = true;
      try {
        await this.refresh();
      } finally {
        this.loadingLastPage.value = false;
      }
      return;
    }

    if (!this.shouldLoadLastPage) {
      return;
    }

    this.shouldLoadLastPage = false;

    if (currentPage === lastPage) {
      return;
    }

    this.resource.setPage(lastPage);
    this.resource.loading = true;
    this.loadingLastPage.value = true;
    try {
      await this.refresh();
    } finally {
      this.loadingLastPage.value = false;
    }
  }

  async handlePageChange(page: number) {
    this.shouldLoadLastPage = false;
    this.resource.setPage(page);
    this.resource.loading = true;
    await this.refresh();
  }

  renderComponent() {
    const mapping = this.mapping;

    if (!mapping.contentField || !mapping.commenterField || !mapping.ownerField || !mapping.dateField) {
      return (
        <Alert
          message={this.context.t(
            'Please configure the comment content field, commenter field, comment owner field, and comment date field.',
            {
              ns: NAMESPACE,
            },
          )}
          type="warning"
          showIcon
        />
      );
    }

    const ownerFilterValueState = this.ownerFilterValueState;

    if (!ownerFilterValueState.compatible) {
      return (
        <Alert
          message={this.context.t(
            'The comment owner field value type does not match the comment owner field. Please reconfigure the field mapping.',
            {
              ns: NAMESPACE,
            },
          )}
          type="warning"
          showIcon
        />
      );
    }

    if (ownerFilterValueState.value === undefined) {
      return (
        <Alert
          message={this.context.t('The current record value is empty, so comments cannot be loaded.', {
            ns: NAMESPACE,
          })}
          type="warning"
          showIcon
        />
      );
    }

    return (
      <RecordCommentsBlockView
        model={this}
        dataSource={this.resource.getData()}
        onPageChange={(page) => {
          this.handlePageChange(page);
        }}
      />
    );
  }
}

RecordCommentsBlockModel.registerFlow({
  key: 'recordCommentsSettings',
  title: tExpr('Record comments settings'),
  on: 'beforeRender',
  sort: 520,
  steps: {
    fieldMapping: {
      title: tExpr('Field mapping'),
      preset: true,
      uiSchema(ctx) {
        const model = ctx.model as RecordCommentsBlockModel | undefined;
        const { shouldHideOwnerMappingFields } = getFieldMappingDefaults(model, ctx);

        return {
          contentField: {
            type: 'string',
            title: tExpr('Comment content field'),
            required: true,
            'x-decorator': 'FormItem',
            'x-component': RecordCommentFieldSelect,
          },
          commenterField: {
            type: 'string',
            title: tExpr('Commenter field'),
            required: true,
            'x-decorator': 'FormItem',
            'x-component': RecordCommentFieldSelect,
            'x-component-props': {
              fieldFilter: 'user',
            },
            description: tExpr('Only many-to-one fields associated with the users collection can be selected.'),
          },
          ownerField: shouldHideOwnerMappingFields
            ? undefined
            : {
                type: 'string',
                title: tExpr('Comment owner field'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': RecordCommentFieldSelect,
                'x-component-props': {
                  fieldFilter: 'belongsTo',
                },
              },
          ownerValueField: shouldHideOwnerMappingFields
            ? undefined
            : {
                type: 'string',
                title: tExpr('Comment owner field value'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': TextAreaWithContextSelector,
                'x-component-props': {
                  rows: 1,
                  maxRows: 3,
                  placeholder: 'ctx.record.id',
                },
                description: tExpr('Specify the associated business record value, for example the current record ID.'),
              },
          dateField: {
            type: 'string',
            title: tExpr('Comment date field'),
            required: true,
            'x-decorator': 'FormItem',
            'x-component': RecordCommentFieldSelect,
          },
        };
      },
      defaultParams(ctx) {
        const model = ctx.model as RecordCommentsBlockModel;
        const { defaultMapping } = getFieldMappingDefaults(model, ctx);

        return {
          contentField: model.props.contentField,
          commenterField: model.props.commenterField,
          ownerField: model.props.ownerField ?? defaultMapping.ownerField,
          ownerValueField: model.props.ownerValueField ?? defaultMapping.ownerValueField,
          dateField: model.props.dateField,
        };
      },
      async handler(ctx, params) {
        const model = ctx.model as RecordCommentsBlockModel;
        model.setProps({
          contentField: params.contentField,
          commenterField: params.commenterField,
          ownerField: params.ownerField,
          ownerValueField: params.ownerValueField,
          dateField: params.dateField,
        });
        await model.applyOwnerFilter();
      },
      beforeParamsSave(ctx, params) {
        const model = ctx.model as RecordCommentsBlockModel;
        model.setProps({
          contentField: params.contentField,
          commenterField: params.commenterField,
          ownerField: params.ownerField,
          ownerValueField: params.ownerValueField,
          dateField: params.dateField,
        });
      },
    },
    pageSize: {
      title: tExpr('Page size'),
      uiSchema: {
        pageSize: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [5, 10, 20, 50, 100].map((value) => ({ label: String(value), value })),
        },
      },
      defaultParams: {
        pageSize: DEFAULT_PAGE_SIZE,
      },
      handler(ctx, params) {
        const model = ctx.model as RecordCommentsBlockModel;
        const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
        model.setProps({
          pageSize,
        });
        model.resource.setPageSize(pageSize);
        model.resource.setPage(model.getLastPage(pageSize));
      },
    },
  },
});

RecordCommentsBlockModel.define({
  label: tExpr('Comments'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'RecordCommentsBlockModel',
    subModels: {
      items: [
        {
          use: 'RecordCommentItemModel',
          subModels: {
            actions: [
              {
                use: 'QuoteReplyRecordCommentActionModel',
              },
              {
                use: 'DeleteRecordCommentActionModel',
              },
              {
                use: 'EditRecordCommentActionModel',
              },
            ],
          },
        },
      ],
      submitActions: [],
    },
  },
  sort: 552,
});
