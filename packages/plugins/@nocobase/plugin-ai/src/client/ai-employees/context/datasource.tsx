/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { WorkContextOptions } from '../types';
import { DatasourceContext as V2DatasourceContext } from '../../../client-v2/ai-employees/context/datasource';

export const DatasourceContext = V2DatasourceContext as unknown as WorkContextOptions;
