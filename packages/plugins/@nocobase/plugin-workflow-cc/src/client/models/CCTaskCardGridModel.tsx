/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { DetailsGridModel } from '@nocobase/client';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import type { CCTaskTempAssociationFieldConfig } from './CCTaskCardDetailsItemModel';
import { getEligibleTempAssociationSources } from './CCTaskCardDetailsItemModel';
import { TEMP_ASSOCIATION_PREFIX } from '../../common/tempAssociation';

/**
 * 抄送任务卡片详情的字段网格
 */
export class CCTaskCardGridModel extends DetailsGridModel {
  private lastTempAssociationSnapshot?: string;
  private readonly tempAssociationSyncHandler = () => {
    this.syncTempAssociationFields();
  };

  onMount(): void {
    super.onMount();
    this.emitter.on('onSubModelAdded', this.tempAssociationSyncHandler);
    this.emitter.on('onSubModelDestroyed', this.tempAssociationSyncHandler);
  }

  onUnmount(): void {
    this.emitter.off('onSubModelAdded', this.tempAssociationSyncHandler);
    this.emitter.off('onSubModelDestroyed', this.tempAssociationSyncHandler);
    super.onUnmount();
  }

  private getTempAssociationFieldNames() {
    const fieldNames = this.mapSubModels('items', (item) => {
      const fieldPath = item.getStepParams('fieldSettings', 'init')?.fieldPath;
      if (!fieldPath) return null;
      const baseField = fieldPath.split('.')[0];
      if (!baseField.startsWith(TEMP_ASSOCIATION_PREFIX)) return null;
      return baseField;
    }).filter(Boolean) as string[];

    return Array.from(new Set(fieldNames));
  }

  private syncTempAssociationFields() {
    if (!this.context.flowSettingsEnabled) return;
    const sync = this.context.ccTaskTempAssociationSync as
      | ((fields: CCTaskTempAssociationFieldConfig[]) => void)
      | undefined;
    if (typeof sync !== 'function') return;

    const associationMetadata = getEligibleTempAssociationSources(this.context.tempAssociationSources || []);
    const metadataMap = new Map(associationMetadata.map((association) => [association.fieldName, association]));
    const selectedFields = this.getTempAssociationFieldNames();
    const configs = selectedFields
      .map((fieldName) => metadataMap.get(fieldName))
      .filter(Boolean)
      .map((association) => ({
        nodeId: association.nodeId,
        nodeKey: association.nodeKey,
        nodeType: association.nodeType,
      }))
      .sort((a, b) => a.nodeKey.localeCompare(b.nodeKey));
    const snapshot = JSON.stringify(configs);
    if (snapshot === this.lastTempAssociationSnapshot) return;
    this.lastTempAssociationSnapshot = snapshot;
    sync(configs);
  }

  renderAddSubModelButton() {
    if (!this.context.flowSettingsEnabled) {
      return null;
    }

    return (
      <AddSubModelButton
        model={this}
        subModelKey={'items'}
        subModelBaseClasses={[
          this.context.getModelClassName('CCTaskCardDetailsItemModel'),
          this.context.getModelClassName('CCTaskCardDetailsAssociationFieldGroupModel'),
          this.context.getModelClassName('TaskCardCommonItemModel'),
        ].filter(Boolean)}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}
