/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const secretString = {
  type: 'string',
  writeOnly: true,
  description: 'Sensitive value. Use a protected body file instead of a command-line flag.',
};

const llmProviderOptions = {
  type: 'object',
  description: 'Provider-specific connection options.',
  properties: {
    apiKey: secretString,
    accessKey: secretString,
    secretKey: secretString,
    password: secretString,
    baseURL: {
      type: 'string',
      format: 'uri',
    },
  },
  additionalProperties: true,
};

const enabledModel = {
  type: 'object',
  required: ['label', 'value'],
  additionalProperties: false,
  properties: {
    label: {
      type: 'string',
    },
    value: {
      type: 'string',
    },
  },
};

const enabledModels = {
  type: 'object',
  required: ['mode', 'models'],
  additionalProperties: false,
  properties: {
    mode: {
      type: 'string',
      enum: ['provider', 'custom'],
      description: 'Use provider-discovered models or an explicitly supplied custom model list.',
    },
    models: {
      type: 'array',
      items: enabledModel,
    },
  },
};

const llmServiceWriteProperties = {
  name: {
    type: 'string',
  },
  title: {
    type: 'string',
  },
  provider: {
    type: 'string',
  },
  options: llmProviderOptions,
  enabledModels,
  enabled: {
    type: 'boolean',
  },
};

const modelSelection = {
  type: 'object',
  required: ['llmService', 'model'],
  additionalProperties: false,
  properties: {
    llmService: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
  },
};

const modelSettings = {
  type: 'object',
  required: ['enabled', 'models'],
  additionalProperties: false,
  properties: {
    enabled: {
      type: 'boolean',
    },
    models: {
      type: 'array',
      items: modelSelection,
    },
  },
};

const knowledgeBaseSettings = {
  type: 'object',
  required: ['topK', 'score', 'knowledgeBaseKeys'],
  additionalProperties: false,
  properties: {
    topK: {
      type: 'integer',
      minimum: 1,
    },
    score: {
      type: 'string',
      description: 'Minimum similarity score represented as a decimal string.',
      example: '0.5',
    },
    knowledgeBaseKeys: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

const aiEmployeeWriteProperties = {
  username: {
    type: 'string',
  },
  nickname: {
    type: 'string',
  },
  position: {
    type: 'string',
  },
  avatar: {
    type: 'string',
  },
  bio: {
    type: 'string',
  },
  about: {
    type: 'string',
  },
  greeting: {
    type: 'string',
  },
  modelSettings,
  enableKnowledgeBase: {
    type: 'boolean',
  },
  knowledgeBase: knowledgeBaseSettings,
  enabled: {
    type: 'boolean',
  },
};

export const schemas = {
  ErrorResponse: {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            code: {
              type: 'string',
            },
          },
          additionalProperties: true,
        },
      },
    },
    additionalProperties: true,
  },
  LLMProvider: {
    type: 'object',
    required: ['name', 'title', 'supportedModel', 'supportWebSearch'],
    properties: {
      name: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      supportedModel: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['LLM', 'EMBEDDING'],
        },
      },
      supportWebSearch: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  LLMProviderModelsRequest: {
    type: 'object',
    required: ['provider', 'options'],
    properties: {
      provider: {
        type: 'string',
      },
      options: llmProviderOptions,
      model: {
        type: 'string',
        description: 'Optional case-insensitive search text.',
      },
    },
    additionalProperties: false,
  },
  LLMTestFlightRequest: {
    type: 'object',
    required: ['provider', 'options', 'model'],
    properties: {
      provider: {
        type: 'string',
      },
      options: llmProviderOptions,
      model: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  LLMModel: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
      },
    },
    additionalProperties: true,
  },
  LLMTestFlightResult: {
    type: 'object',
    required: ['status', 'code'],
    properties: {
      status: {
        type: 'string',
        enum: ['success', 'error'],
      },
      code: {
        type: 'integer',
      },
      message: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  LLMServiceCreate: {
    type: 'object',
    required: ['name', 'title', 'provider', 'options', 'enabledModels', 'enabled'],
    properties: llmServiceWriteProperties,
    additionalProperties: false,
  },
  LLMServicePatch: {
    type: 'object',
    properties: llmServiceWriteProperties,
    additionalProperties: false,
  },
  LLMService: {
    type: 'object',
    properties: {
      ...llmServiceWriteProperties,
      modelOptions: {
        type: 'object',
        readOnly: true,
        additionalProperties: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
    },
    additionalProperties: true,
  },
  EnabledLLMService: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      provider: {
        type: 'string',
      },
      enabled: {
        type: 'boolean',
      },
      enabledModels,
    },
    additionalProperties: true,
  },
  AIEmployeeCreate: {
    type: 'object',
    required: ['username', 'nickname', 'avatar'],
    properties: aiEmployeeWriteProperties,
    additionalProperties: false,
  },
  AIEmployeePatch: {
    type: 'object',
    properties: aiEmployeeWriteProperties,
    additionalProperties: false,
  },
  AIEmployee: {
    type: 'object',
    properties: {
      ...aiEmployeeWriteProperties,
      builtIn: {
        type: 'boolean',
        readOnly: true,
      },
      category: {
        type: 'string',
        readOnly: true,
      },
      deprecated: {
        type: 'boolean',
        readOnly: true,
      },
      missingKnowledgeBaseKeys: {
        type: 'array',
        readOnly: true,
        items: {
          type: 'string',
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        readOnly: true,
      },
    },
    additionalProperties: true,
  },
};
