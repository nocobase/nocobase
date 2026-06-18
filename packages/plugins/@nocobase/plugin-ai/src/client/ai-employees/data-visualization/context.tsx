/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { WorkContextOptions } from '../types';
import { chartConfigWorkContext as v2ChartConfigWorkContext } from '../../../client-v2/ai-employees/context/chart-config';

export const chartConfigWorkContext = v2ChartConfigWorkContext as unknown as WorkContextOptions;
