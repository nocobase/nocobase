/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const COMMAND_CONTENT_JSON_LIMIT_CHARS = 10 * 1024 * 1024;

// Keep the single output field below the default 10mb request body after JSON wrapping.
export const COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS = 10_000_000;

export const COMMAND_DETAIL_STRING_LIMIT_CHARS = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS;
