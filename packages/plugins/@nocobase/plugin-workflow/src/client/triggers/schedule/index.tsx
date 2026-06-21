/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 schedule trigger wrapper. The canonical metadata, loaders, validation,
 * variables, and v2 block-create hooks live in `client-v2/triggers/schedule`.
 * The legacy Formily artifacts are deliberately dropped here, so v1 trigger
 * surfaces fall through to the inherited v2 loaders.
 */

import V2ScheduleTrigger from '../../../client-v2/triggers/schedule';

export default class ScheduleTrigger extends V2ScheduleTrigger {}
