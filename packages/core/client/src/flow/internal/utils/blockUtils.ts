/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function createDefaultCollectionBlockTitle(options: {
  blockLabel: string;
  dsName?: string;
  dsCount: number;
  collectionTitle: string;
  sourceCollectionTitle?: string;
  associationTitle?: string;
}) {
  const { blockLabel, dsName, dsCount, collectionTitle, sourceCollectionTitle, associationTitle } = options;
  const showDs = dsCount > 1 && !!dsName;

  let rightPart = collectionTitle;
  if (sourceCollectionTitle && associationTitle) {
    const assocPath = `${sourceCollectionTitle} > ${associationTitle} (${collectionTitle})`;
    rightPart = `${showDs ? `${dsName} > ` : ''}${assocPath}`;
  } else {
    rightPart = `${showDs ? `${dsName} > ` : ''}${collectionTitle}`;
  }

  return `
    ${blockLabel}:
    ${rightPart}`;
}
