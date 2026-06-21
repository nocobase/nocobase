/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 condition node. After sharing `Branch`, `AddNodeSlot`, and the branch-node
 * renderer injection across runtimes, the legacy canvas can reuse the v2
 * `ComponentLoader` directly. This file stays as a thin compatibility entry.
 */

import V2ConditionInstruction from '../../client-v2/nodes/condition';

export default class extends V2ConditionInstruction {}
