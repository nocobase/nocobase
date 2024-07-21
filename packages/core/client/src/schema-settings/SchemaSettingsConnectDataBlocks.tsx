/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { error } from '@nocobase/utils/client';
import { Empty } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { findFilterTargets, updateFilterTargets } from '../block-provider/hooks';
import { useCollectionManager_deprecated } from '../collection-manager/hooks/useCollectionManager_deprecated';
import { useCollection_deprecated } from '../collection-manager/hooks/useCollection_deprecated';
import { useFilterBlock } from '../filter-provider/FilterProvider';
import {
  canBeConnectedByAssociation,
  canBeConnectedByForeignKey,
  getSupportFieldsByAssociation,
  getSupportFieldsByForeignKey,
  isSameCollection,
  useSupportedBlocks,
} from '../filter-provider/utils';
import { getTargetKey } from '../schema-component/antd/association-filter/utilts';
import { useCompile } from '../schema-component/hooks/useCompile';
import { useDesignable } from '../schema-component/hooks/useDesignable';
import {
  SchemaSettingsItem,
  SchemaSettingsSelectItem,
  SchemaSettingsSubMenu,
  SchemaSettingsSwitchItem,
} from './SchemaSettings';

export function SchemaSettingsConnectDataBlocks(props) {
  const { type, emptyDescription } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const collection = useCollection_deprecated();
  const { inProvider } = useFilterBlock();
  const dataBlocks = useSupportedBlocks(type);
  // eslint-disable-next-line prefer-const
  let { targets = [], uid } = findFilterTargets(fieldSchema);
  const compile = useCompile();
  const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();

  if (!inProvider) {
    return null;
  }

  const Content = _.flatten(
    dataBlocks.map((block) => {
      const onHover = () => {
        const dom = block.dom;
        const designer = dom.querySelector('.general-schema-designer') as HTMLElement;
        if (designer) {
          designer.style.display = 'block';
        }
        dom.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
        dom.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      };
      const onLeave = () => {
        const dom = block.dom;
        const designer = dom.querySelector('.general-schema-designer') as HTMLElement;
        if (designer) {
          designer.style.display = null;
        }
        dom.style.boxShadow = 'none';
      };

      const result = [];

      if (isSameCollection(block.collection, collection)) {
        const title = `${compile(block.collection.title)} #${block.uid.slice(0, 2)}01`;
        result.push(
          <SchemaSettingsSwitchItem
            key={block.uid + 'sameCollection'}
            title={title}
            checked={targets.some((target) => target.uid === block.uid)}
            onChange={(checked) => {
              if (checked) {
                targets.push({ uid: block.uid });
              } else {
                targets = targets.filter((target) => target.uid !== block.uid);
                block.clearFilter(uid);
              }

              updateFilterTargets(fieldSchema, targets);
              dn.emit('patch', {
                schema: {
                  ['x-uid']: uid,
                  'x-filter-targets': targets,
                },
              }).catch(error);
              dn.refresh();
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          />,
        );
      }

      if (
        canBeConnectedByAssociation(collection, block, getAllCollectionsInheritChain) ||
        canBeConnectedByForeignKey(collection, block)
      ) {
        const title = `${compile(block.collection.title)} #${block.uid.slice(0, 2)}02`;
        const target = targets.find((target) => target.uid === block.uid);
        // 与筛选区块的数据表具有关系的表
        result.push(
          <SchemaSettingsSelectItem
            key={block.uid + 'associationFiled'}
            title={title}
            value={target?.field || ''}
            options={[
              ...getSupportFieldsByAssociation(getAllCollectionsInheritChain(collection.name), block).map((field) => {
                return {
                  label: compile(field.uiSchema.title) || field.name,
                  value: `${field.name}.${getTargetKey(field)}`,
                };
              }),
              ...getSupportFieldsByForeignKey(collection, block).map((field) => {
                return {
                  label: `${compile(field.uiSchema.title) || field.name} [${t('Foreign key')}]`,
                  value: field.name,
                };
              }),
              {
                label: t('Unconnected'),
                value: '',
              },
            ]}
            onChange={(value) => {
              if (value === '') {
                targets = targets.filter((target) => target.uid !== block.uid);
                block.clearFilter(uid);
              } else {
                targets = targets.filter((target) => target.uid !== block.uid);
                targets.push({ uid: block.uid, field: value });
              }
              updateFilterTargets(fieldSchema, targets);
              dn.emit('patch', {
                schema: {
                  ['x-uid']: uid,
                  'x-filter-targets': targets,
                },
              });
              dn.refresh();
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          />,
        );
      }

      return result;
    }),
  );

  console.log('Content', Content);

  return (
    <SchemaSettingsSubMenu title={t('Connect data blocks')}>
      {Content.length ? (
        Content
      ) : (
        <SchemaSettingsItem title="empty">
          <Empty
            style={{ width: 160, padding: '0 1em' }}
            description={emptyDescription}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </SchemaSettingsItem>
      )}
    </SchemaSettingsSubMenu>
  );
}
