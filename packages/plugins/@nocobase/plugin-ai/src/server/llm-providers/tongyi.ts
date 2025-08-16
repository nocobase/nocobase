/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { LLMProvider } from './provider';
// import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';
//
// export class TongyiProvider extends LLMProvider {
//   declare chatModel: ChatAlibabaTongyi;
//
//   get baseURL() {
//     return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
//   }
//
//   createModel() {
//     const { apiKey, baseURL } = this.serviceOptions || {};
//     const { model } = this.modelOptions || {};
//
//     const tongyi = new ChatAlibabaTongyi({
//       alibabaApiKey: apiKey,
//       ...this.modelOptions,
//       model,
//     });
//     if (baseURL) {
//       tongyi.apiUrl = baseURL;
//     }
//     return tongyi;
//   }
//
//   async listModels(): Promise<{
//     models?: { id: string }[];
//     code?: number;
//     errMsg?: string;
//   }> {
//     return { code: 500, errMsg: 'Not supported' };
//   }
// }
//
// export const tongyiProviderOptions = {
//   title: '{{t("Tongyi", {ns: "ai"})}}',
//   provider: TongyiProvider,
// };
