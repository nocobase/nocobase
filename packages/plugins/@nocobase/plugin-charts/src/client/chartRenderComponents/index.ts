/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { G2Plot } from '@nocobase/client';
import DataSetPreviewTable from '../DataSetPreviewTable';

const chartRenderComponentsMap = new Map();
chartRenderComponentsMap.set('G2Plot', G2Plot);
chartRenderComponentsMap.set('DataSetPreviewTable', DataSetPreviewTable);
export default chartRenderComponentsMap;
