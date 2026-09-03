/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 multi-conditions node. After sharing `Branch`, `AddNodeSlot`, recursive
 * branch-node rendering, and the add-node controller across runtimes, the
 * legacy canvas can reuse the v2 branch render directly. Branch condition
 * configuration is allowed to keep using the v2 dialog; only add-node drawers
 * remain runtime-specific and are already routed through the shared add-node
 * context chain.
 */

import V2MultiConditionsInstruction from '../../client-v2/nodes/multi-conditions';

export default class extends V2MultiConditionsInstruction {}
