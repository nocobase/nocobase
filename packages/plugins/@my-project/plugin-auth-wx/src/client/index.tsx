/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import SigninPage from './SigninPage';
import Options from './Options';
import { authType } from '../constants';

/**
 * WeChat认证客户端插件类
 * 负责注册微信授权登录相关的客户端组件
 * 支持PC端二维码扫码登录和移动端微信浏览器授权登录
 */
export class PluginAuthWeChatClient extends Plugin {
  /**
   * 插件加载时的主要逻辑
   * 注册微信授权认证类型到客户端认证管理器
   */
  async load() {
    // 获取认证插件实例
    const auth = this.app.pm.get(AuthPlugin);

    // 注册微信授权认证类型，包含登录表单和管理设置表单组件
    auth.registerType(authType, {
      components: {
        SignInForm: SigninPage, // 微信授权登录表单组件
        AdminSettingsForm: Options, // 微信应用配置管理组件
      },
    });
  }
}

export default PluginAuthWeChatClient;
