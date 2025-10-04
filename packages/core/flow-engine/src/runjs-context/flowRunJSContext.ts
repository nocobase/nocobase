/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Subclasses of FlowRunJSContext.
 * Keep only class definitions here to avoid bloat in flowContext.ts.
 */
import { FlowRunJSContext } from '../flowContext';

export class JSBlockRunJSContext extends FlowRunJSContext {}
export class JSFieldRunJSContext extends FlowRunJSContext {}
export class JSItemRunJSContext extends FlowRunJSContext {}
export class FormJSFieldItemRunJSContext extends FlowRunJSContext {}
export class JSRecordActionRunJSContext extends FlowRunJSContext {}
export class JSCollectionActionRunJSContext extends FlowRunJSContext {}
export class LinkageRunJSContext extends FlowRunJSContext {}
