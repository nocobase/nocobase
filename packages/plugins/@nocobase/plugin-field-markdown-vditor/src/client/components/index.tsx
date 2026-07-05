/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import { withDynamicSchemaProps } from '@nocobase/client';
import { Display } from './Display';
import { Edit } from './Edit';

export const MarkdownVditor = withDynamicSchemaProps(connect(Edit, mapReadPretty(Display)));

export default MarkdownVditor;
