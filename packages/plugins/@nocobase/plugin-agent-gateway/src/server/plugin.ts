/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'path';

import { Plugin } from '@nocobase/server';

import { registerApiCallLogMiddleware } from './actions/apiCallLogging';
import { registerAgentSessionRoutes } from './actions/agentSessions';
import { registerConversationEventRoutes } from './actions/conversationEvents';
import { registerDispatchBindingRoutes, registerDispatchBindingValidationHooks } from './actions/dispatchBindings';
import { registerNodeLifecycleRoutes } from './actions/nodeLifecycle';
import { registerPromptTemplateRoutes } from './actions/promptTemplates';
import { registerRunLifecycleHooks, registerRunLifecycleRoutes } from './actions/runLifecycle';
import { registerRunObservabilityRoutes } from './actions/runObservability';
import { registerTerminalStreamTicketRoutes } from './actions/terminalStreamTickets';
import { registerRunTerminalRoutes } from './actions/runTerminal';
import { registerSkillInstallRoutes } from './actions/skillInstalls';
import { registerSkillVersionRoutes } from './actions/skillVersions';
import { TerminalStreamBroker, registerTerminalStreamBroker } from './actions/terminalStreamBroker';
import { registerAgentGatewayAcl } from './security/permissions';

export class PluginAgentGatewayServer extends Plugin {
  private terminalStreamBroker?: TerminalStreamBroker;

  async afterAdd() {}

  async beforeLoad() {
    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    registerAgentGatewayAcl(this.app.acl);
    registerDispatchBindingValidationHooks(this);
    registerRunLifecycleHooks(this);
  }

  async load() {
    registerApiCallLogMiddleware(this);
    registerNodeLifecycleRoutes(this);
    registerSkillInstallRoutes(this);
    registerSkillVersionRoutes(this);
    registerRunLifecycleRoutes(this);
    registerAgentSessionRoutes(this);
    registerConversationEventRoutes(this);
    registerRunTerminalRoutes(this);
    registerTerminalStreamTicketRoutes(this);
    registerRunObservabilityRoutes(this);
    registerPromptTemplateRoutes(this);
    registerDispatchBindingRoutes(this);
    this.terminalStreamBroker = registerTerminalStreamBroker(this);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.terminalStreamBroker?.unregister();
    this.terminalStreamBroker = undefined;
  }

  async remove() {}
}

export default PluginAgentGatewayServer;
