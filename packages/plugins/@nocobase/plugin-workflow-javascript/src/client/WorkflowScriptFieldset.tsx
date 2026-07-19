/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { ScriptFieldset } from '../client-v2/nodes/components/script';
import { WorkflowRunJSEditorField } from './WorkflowRunJSEditorField';

export function WorkflowScriptFieldset() {
  return <ScriptFieldset EditorComponent={WorkflowRunJSEditorField} />;
}

export default WorkflowScriptFieldset;
