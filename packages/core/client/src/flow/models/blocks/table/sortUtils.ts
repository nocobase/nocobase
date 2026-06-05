/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type AssociationTitleFieldModel = {
  fieldPath?: string;
  props?: {
    dataIndex?: string;
    titleField?: string;
  };
  collectionField?: {
    name?: string;
    targetCollectionTitleFieldName?: string;
    isAssociationField?: () => boolean;
  };
  getStepParams?: (flowKey: string, stepKey: string) => { label?: string } | undefined;
};

export function getSavedAssociationTitleField(model: AssociationTitleFieldModel) {
  return model.getStepParams?.('tableColumnSettings', 'fieldNames')?.label || model.props?.titleField;
}

export function getTableColumnSortField(model: AssociationTitleFieldModel) {
  const fallbackField = model.fieldPath || model.collectionField?.name || model.props?.dataIndex;

  if (!model.collectionField?.isAssociationField?.()) {
    return fallbackField;
  }

  const associationName = model.collectionField.name || model.fieldPath;
  const titleField = getSavedAssociationTitleField(model) || model.collectionField.targetCollectionTitleFieldName;

  if (!associationName || !titleField) {
    return fallbackField;
  }

  return `${associationName}.${titleField}`;
}

export function resolveTableSorterField(sorter: {
  field?: string;
  column?: {
    sortField?: string;
  };
}) {
  return sorter?.column?.sortField || sorter?.field;
}
