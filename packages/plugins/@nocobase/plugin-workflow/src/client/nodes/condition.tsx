/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 condition node. The metadata + config UI now live ONCE in the v2 instruction
 * (`client-v2/nodes/condition.tsx`): this class `extends` it (the allowed v1 → v2
 * direction), inheriting `title`/`type`/`group`/`icon`/`description`/`branching`/
 * `testable` and the three modern loaders (`FieldsetLoader` / `PresetFieldsetLoader`
 * / `ComponentLoader`). The legacy Formily config fields (`fieldset` / `presetFieldset`
 * / `scope` / `components`) are deliberately dropped — the v1 canvas now routes the
 * config drawer and add-node preset through the inherited loaders (see
 * `nodes/index.tsx` and `AddNodeContext.tsx`).
 *
 * Only the v1 in-canvas card render (`Component`) is kept here, since the v1 canvas
 * still renders cards with Formily/v1 contexts. It is deleted with the legacy canvas
 * at retirement.
 */

import V2ConditionInstruction from '../../client-v2/nodes/condition';

export default class extends V2ConditionInstruction {}
