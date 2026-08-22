/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const aiPageOpenAPI = {
  openapi: '3.1.0',
  info: {
    title: 'NocoBase AI Page API',
    version: '1.0.0',
    description: 'Page-scoped HTTP API for external coding agents. This API is independent from the nb CLI.',
  },
  paths: {
    '/pages/{pageSchemaUid}': {
      get: { summary: 'Read page metadata' },
    },
    '/pages/{pageSchemaUid}/source': {
      get: { summary: 'Read the draft source and revision' },
      put: { summary: 'Replace the draft source with optimistic concurrency control' },
      patch: { summary: 'Apply a unified diff with optimistic concurrency control' },
    },
    '/pages/{pageSchemaUid}/validate': {
      post: { summary: 'Validate JavaScript source' },
    },
    '/pages/{pageSchemaUid}/preview': {
      post: { summary: 'Ask connected browsers to preview the latest draft' },
    },
    '/pages/{pageSchemaUid}/revisions': {
      get: { summary: 'List page revisions' },
    },
    '/sessions/{sessionId}/pair': {
      post: { summary: 'Exchange a one-time pairing code for a short-lived bearer token' },
    },
    '/sessions/{sessionId}/events': {
      get: { summary: 'Subscribe to page events over SSE' },
    },
  },
  components: {
    securitySchemes: {
      pageToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'aip_*',
      },
    },
  },
};
