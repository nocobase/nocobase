/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatBedrockConverse } from '@langchain/aws';
import { BedrockClient, ListFoundationModelsCommand, ListInferenceProfilesCommand } from '@aws-sdk/client-bedrock';
import { LLMProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';

// Default region if not specified
const DEFAULT_REGION = 'us-east-1';

// Known TEXT model patterns for Inference Profiles (whitelist approach)
const TEXT_MODEL_PATTERNS = [
  'anthropic.claude',
  'amazon.titan-text',
  'amazon.nova-pro',
  'amazon.nova-lite',
  'amazon.nova-micro',
  'mistral.',
  'meta.llama',
  'cohere.',
  'ai21.',
];

// Provider name mapping from model ID patterns
const PROVIDER_PATTERNS: Record<string, string> = {
  'anthropic.': 'Anthropic',
  'amazon.': 'Amazon',
  'mistral.': 'Mistral AI',
  'meta.': 'Meta',
  'cohere.': 'Cohere',
  'ai21.': 'AI21 Labs',
};

/**
 * Check if an Inference Profile ID corresponds to a TEXT model
 * Uses whitelist approach - only known TEXT model patterns are allowed
 */
function isTextInferenceProfile(profileId: string): boolean {
  const lowerProfileId = profileId.toLowerCase();
  return TEXT_MODEL_PATTERNS.some((pattern) => lowerProfileId.includes(pattern));
}

/**
 * Extract provider name from a model/profile ID
 */
function extractProviderFromId(modelId: string): string {
  const lowerModelId = modelId.toLowerCase();
  for (const [pattern, name] of Object.entries(PROVIDER_PATTERNS)) {
    if (lowerModelId.includes(pattern)) return name;
  }
  return 'Unknown';
}

// Claude 4.x model patterns for temperature/topP conflict detection
const CLAUDE_4X_PATTERNS = [
  /\bclaude-sonnet-4/i,
  /\bclaude-haiku-4/i,
  /\bclaude-opus-4/i,
  /anthropic\.claude-sonnet-4/i,
  /anthropic\.claude-haiku-4/i,
  /anthropic\.claude-opus-4/i,
];

export class BedrockProvider extends LLMProvider {
  declare chatModel: ChatBedrockConverse;

  /**
   * Check if the model is Claude 4.x or later (which doesn't support both temperature and topP)
   * Uses regex patterns for more precise matching
   */
  private isClaude4xOrLater(modelId: string): boolean {
    if (!modelId) return false;
    return CLAUDE_4X_PATTERNS.some((pattern) => pattern.test(modelId));
  }

  /**
   * Creates a ChatBedrockConverse instance with the configured options
   */
  createModel(): ChatBedrockConverse {
    const { region, accessKeyId, secretAccessKey, sessionToken } = this.serviceOptions || {};
    const { model, temperature, maxTokens, topP, timeout, maxRetries } = this.modelOptions || {};

    // Validate model is provided
    if (!model) {
      throw new Error('Model ID is required for Bedrock provider');
    }

    // Validate credentials - if one is provided, both must be provided
    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new Error('Both accessKeyId and secretAccessKey are required when providing AWS credentials');
    }

    // Build credentials object if access keys are provided
    const credentials =
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          }
        : undefined;

    const resolvedRegion = region || DEFAULT_REGION;

    // Claude 4.x+ models don't support both temperature and topP simultaneously
    // When both are provided, we prioritize temperature and ignore topP
    const isClaude4x = this.isClaude4xOrLater(model);
    const resolvedTopP = isClaude4x && temperature !== undefined ? undefined : topP;

    if (isClaude4x && topP !== undefined && temperature !== undefined) {
      this.app.logger.warn(
        `[Bedrock] Claude 4.x+ detected (${model}). Ignoring topP because temperature is set. ` +
          `These parameters cannot be used together for this model.`,
      );
    }

    return new ChatBedrockConverse({
      region: resolvedRegion,
      credentials,
      model,
      temperature,
      maxTokens,
      topP: resolvedTopP,
      ...(timeout ? { timeout } : {}),
      ...(maxRetries ? { maxRetries } : {}),
    });
  }

  /**
   * Lists available foundation models from AWS Bedrock
   * Returns TEXT models only, sorted by provider then by model ID
   */
  async listModels(): Promise<{
    models?: { id: string; provider?: string }[];
    code?: number;
    errMsg?: string;
  }> {
    const { region, accessKeyId, secretAccessKey, sessionToken } = this.serviceOptions || {};
    const resolvedRegion = region || DEFAULT_REGION;

    if (!accessKeyId || !secretAccessKey) {
      return { code: 400, errMsg: 'AWS credentials (accessKeyId and secretAccessKey) are required' };
    }

    try {
      // Build credentials
      const credentials = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      };

      const client = new BedrockClient({
        region: resolvedRegion,
        credentials,
      });

      // List foundation models - filtered to TEXT modality by AWS API
      const command = new ListFoundationModelsCommand({
        byOutputModality: 'TEXT',
      });

      const response = await client.send(command);
      const ipResponse = await client.send(new ListInferenceProfilesCommand({}));

      // Foundation models: already filtered to TEXT by API, add provider info
      const foundationModels = (response.modelSummaries || [])
        .filter((model) => model.modelId && model.inferenceTypesSupported?.includes('ON_DEMAND'))
        .map((model) => ({
          id: model.modelId,
          provider: model.providerName || extractProviderFromId(model.modelId),
        }));

      // Inference profiles: filter to TEXT models using whitelist, extract provider from ID
      const inferenceProfiles = (ipResponse.inferenceProfileSummaries || [])
        .filter((profile) => profile.inferenceProfileId && isTextInferenceProfile(profile.inferenceProfileId))
        .map((profile) => ({
          id: profile.inferenceProfileId,
          provider: extractProviderFromId(profile.inferenceProfileId),
        }));

      // Combine and sort by provider, then by model ID
      const models = [...foundationModels, ...inferenceProfiles].sort((a, b) => {
        const providerCompare = a.provider.localeCompare(b.provider);
        if (providerCompare !== 0) return providerCompare;
        return a.id.localeCompare(b.id);
      });

      return { models };
    } catch (error: any) {
      // Log the full error for debugging
      const errorName = error.name || '';
      const errorMessage = error.message || 'Unknown error';
      this.app.logger.error('[Bedrock] listModels failed', {
        errorName,
        errorMessage,
        region: resolvedRegion,
        requestId: error.$metadata?.requestId,
      });

      // Map AWS errors to appropriate HTTP status codes with sanitized messages
      // Validation errors (400)
      if (errorName === 'ValidationException') {
        return { code: 400, errMsg: 'Invalid request parameters. Please check your configuration.' };
      }

      // Authentication errors (401)
      if (
        errorName === 'ExpiredTokenException' ||
        errorName === 'UnauthorizedException' ||
        errorMessage.includes('expired') ||
        errorMessage.includes('credentials')
      ) {
        return { code: 401, errMsg: 'Authentication failed. Please verify your AWS credentials.' };
      }

      // Access denied errors (403)
      if (errorName === 'AccessDeniedException' || errorMessage.includes('Access')) {
        return { code: 403, errMsg: 'Access denied. Please verify your AWS credentials and permissions.' };
      }

      // Resource not found (404)
      if (errorName === 'ResourceNotFoundException') {
        return { code: 404, errMsg: 'Resource not found. Please check your region and configuration.' };
      }

      // Rate limiting (429)
      if (errorName === 'ThrottlingException' || errorMessage.includes('Rate')) {
        return { code: 429, errMsg: 'Rate limit exceeded. Please try again later.' };
      }

      // Service unavailable (503)
      if (
        errorName === 'ServiceException' ||
        errorName === 'ServiceUnavailableException' ||
        errorName === 'InternalServerException'
      ) {
        return { code: 503, errMsg: 'AWS Bedrock service is temporarily unavailable. Please try again later.' };
      }

      // Network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return { code: 503, errMsg: 'Network error. Please check your internet connection and region settings.' };
      }

      // Default error - don't expose internal details
      return { code: 500, errMsg: 'Failed to list models. Please check your AWS configuration.' };
    }
  }
}

export const bedrockProviderOptions: LLMProviderMeta = {
  title: 'Amazon Bedrock',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [
      'us.anthropic.claude-sonnet-4-20250514-v1:0',
      'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'anthropic.claude-3-5-haiku-20241022-v1:0',
      'amazon.nova-pro-v1:0',
      'amazon.nova-lite-v1:0',
      'amazon.nova-micro-v1:0',
    ],
  },
  provider: BedrockProvider,
};

// Exported for testing purposes only
export const _testUtils = {
  isTextInferenceProfile,
  extractProviderFromId,
  CLAUDE_4X_PATTERNS,
};
