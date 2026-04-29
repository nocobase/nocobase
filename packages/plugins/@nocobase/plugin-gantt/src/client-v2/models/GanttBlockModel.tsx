/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { Empty, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';

import { tExpr } from '../locale';

const DATE_INTERFACES = new Set(['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'createdAt', 'updatedAt']);
const TITLE_INTERFACES = new Set(['input', 'textarea', 'select', 'radioGroup', 'email', 'phone']);

const getFieldLabel = (field: any) => field?.title || field?.uiSchema?.title || field?.name;

const getDateFields = (collection: any) => {
  return (collection?.getFields?.() || []).filter((field: any) => {
    return DATE_INTERFACES.has(field.interface) || ['date', 'datetime', 'datetimeNoTz'].includes(field.type);
  });
};

const getTitleFields = (collection: any) => {
  return (collection?.getFields?.() || []).filter((field: any) => {
    return TITLE_INTERFACES.has(field.interface) || ['string', 'text'].includes(field.type);
  });
};

const resolveDefaultField = (fields: any[], fallback?: string) => {
  return fields[0]?.name || fallback;
};

const GanttBlockContent = ({ model }: { model: GanttBlockModel }) => {
  const token = model.context.themeToken;
  const data = model.resource.getData() || [];
  const dateFields = getDateFields(model.collection);
  const titleFields = getTitleFields(model.collection);
  const startField = model.props.startField || resolveDefaultField(dateFields, model.collection?.createdAt);
  const endField = model.props.endField || dateFields.find((field) => field.name !== startField)?.name || startField;
  const titleField =
    model.props.titleField ||
    resolveDefaultField(titleFields, model.collection?.titleField || model.collection?.filterTargetKey);

  const rows = useMemo(() => {
    return data
      .map((record: any) => {
        const start = dayjs(record?.[startField]);
        const end = dayjs(record?.[endField] || record?.[startField]);
        if (!start.isValid()) {
          return null;
        }
        return {
          key:
            record?.[model.collection?.filterTargetKey] ?? record?.id ?? `${record?.[titleField]}-${start.valueOf()}`,
          title: record?.[titleField] ?? record?.id ?? 'N/A',
          start,
          end: end.isValid() ? end : start,
        };
      })
      .filter(Boolean);
  }, [data, endField, model.collection, startField, titleField]);

  const range = useMemo(() => {
    if (!rows.length) {
      return null;
    }
    const min = rows.reduce((value, item) => (item.start.isBefore(value) ? item.start : value), rows[0].start);
    const max = rows.reduce((value, item) => (item.end.isAfter(value) ? item.end : value), rows[0].end);
    const days = Math.max(max.diff(min, 'day') + 1, 1);
    return { min, max, days };
  }, [rows]);

  if (!rows.length || !range) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: minmax(160px, 240px) minmax(360px, 1fr);
        gap: ${token.marginXS}px ${token.margin}px;
        overflow: auto;
      `}
    >
      <Typography.Text type="secondary">{model.translate('Task')}</Typography.Text>
      <Typography.Text type="secondary">
        {range.min.format('YYYY-MM-DD')} - {range.max.format('YYYY-MM-DD')}
      </Typography.Text>
      {rows.map((item) => {
        const offset = Math.max(item.start.diff(range.min, 'day'), 0);
        const span = Math.max(item.end.diff(item.start, 'day') + 1, 1);
        const left = `${(offset / range.days) * 100}%`;
        const width = `${(span / range.days) * 100}%`;

        return (
          <React.Fragment key={item.key}>
            <Typography.Text ellipsis>{item.title}</Typography.Text>
            <div
              className={css`
                position: relative;
                min-height: 28px;
                border-radius: ${token.borderRadiusSM}px;
                background: ${token.colorFillQuaternary};
              `}
            >
              <div
                title={`${item.start.format('YYYY-MM-DD')} - ${item.end.format('YYYY-MM-DD')}`}
                className={css`
                  position: absolute;
                  inset-block: 4px;
                  left: ${left};
                  width: max(${width}, 6px);
                  border-radius: ${token.borderRadiusSM}px;
                  background: ${token.colorPrimary};
                `}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export class GanttBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.setPageSize(this.props.pageSize || 200);
    return resource;
  }

  get resource() {
    return super.resource as MultiRecordResource;
  }

  renderComponent() {
    return <GanttBlockContent model={this} />;
  }
}

GanttBlockModel.registerFlow({
  key: 'ganttSettings',
  title: tExpr('Gantt settings'),
  steps: {
    fields: {
      title: tExpr('Fields'),
      uiSchema(ctx) {
        const dateOptions = getDateFields(ctx.model.collection).map((field) => ({
          label: getFieldLabel(field),
          value: field.name,
        }));
        const titleOptions = getTitleFields(ctx.model.collection).map((field) => ({
          label: getFieldLabel(field),
          value: field.name,
        }));

        return {
          titleField: {
            title: ctx.t('Title field'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: titleOptions,
          },
          startField: {
            title: ctx.t('Start date field'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            required: true,
            enum: dateOptions,
          },
          endField: {
            title: ctx.t('End date field'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: dateOptions,
          },
        };
      },
      defaultParams(ctx) {
        const dateFields = getDateFields(ctx.model.collection);
        const titleFields = getTitleFields(ctx.model.collection);
        return {
          titleField: ctx.model.props.titleField || resolveDefaultField(titleFields),
          startField: ctx.model.props.startField || resolveDefaultField(dateFields),
          endField: ctx.model.props.endField || dateFields[1]?.name || dateFields[0]?.name,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          titleField: params.titleField,
          startField: params.startField,
          endField: params.endField,
        });
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
  },
});

GanttBlockModel.define({
  label: tExpr('Gantt'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'GanttBlockModel',
  },
  sort: 650,
});
