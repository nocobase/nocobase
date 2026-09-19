/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { Plugin } from '@nocobase/server';
import { createAIPageHttpRouter } from './http-router';
import { AIPageService } from './service';

const BROWSER_ACTIONS = [
  'createPage',
  'getPage',
  'deletePage',
  'getSource',
  'putSource',
  'patchSource',
  'validateSource',
  'preview',
  'publish',
  'revisions',
  'rollback',
  'createSession',
  'events',
  'closeSession',
  'runtimeResult',
];

const PUBLIC_ACTIONS = [
  'openapi',
  'pair',
  'agentGetPage',
  'agentGetSource',
  'agentPutSource',
  'agentPatchSource',
  'agentValidateSource',
  'agentPreview',
  'agentRevisions',
  'agentEvents',
  'agentCloseSession',
];

export class PluginAIPageServer extends Plugin {
  service: AIPageService;

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));
    this.service = new AIPageService(this);

    this.app.use(createAIPageHttpRouter(), {
      tag: 'ai-page-http-router',
      after: 'dataWrapping',
      before: 'dataSource',
    });

    this.app.resourceManager.define({
      name: 'aiPageApi',
      actions: {
        openapi: this.service.openapi,
        createPage: this.service.createPage,
        getPage: this.service.getPage,
        agentGetPage: this.service.agentGetPage,
        deletePage: this.service.deletePage,
        getSource: this.service.getSource,
        agentGetSource: this.service.agentGetSource,
        putSource: this.service.putSource,
        agentPutSource: this.service.agentPutSource,
        patchSource: this.service.patchSource,
        agentPatchSource: this.service.agentPatchSource,
        validateSource: this.service.validateSource,
        agentValidateSource: this.service.agentValidateSource,
        preview: this.service.preview,
        agentPreview: this.service.agentPreview,
        publish: this.service.publish,
        revisions: this.service.revisions,
        agentRevisions: this.service.agentRevisions,
        rollback: this.service.rollback,
        createSession: this.service.createSession,
        pair: this.service.pair,
        events: this.service.events,
        agentEvents: this.service.agentEvents,
        closeSession: this.service.closeSession,
        agentCloseSession: this.service.agentCloseSession,
        runtimeResult: this.service.runtimeResult,
      },
    });

    this.app.acl.registerSnippet({
      name: 'ui.aiPage.develop',
      actions: BROWSER_ACTIONS.map((action) => `aiPageApi:${action}`),
    });
    this.app.acl.allow('aiPageApi', PUBLIC_ACTIONS, 'public');
  }
}

export default PluginAIPageServer;
