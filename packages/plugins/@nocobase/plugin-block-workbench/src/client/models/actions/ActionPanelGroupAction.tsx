/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel } from '@nocobase/client';
import { escapeT } from '@nocobase/flow-engine';
import { ActionPanelPopupActionModel } from './ActionPanelPopupActionModel';
import { ActionPanelLinkActionModel } from './ActionPanelLinkActionModel';

export class ActionPanelGroupActionModel extends ActionGroupModel {}

ActionPanelGroupActionModel.define({
  label: escapeT('Action panel action', { ns: 'block-workbench' }),
});

ActionPanelGroupActionModel.registerActionModels({
  ActionPanelPopupActionModel,
  ActionPanelLinkActionModel,
});
