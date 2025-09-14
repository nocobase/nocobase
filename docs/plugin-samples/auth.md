# 认证插件示例

## 概述

认证插件 (`@nocobase/plugin-auth`) 提供了用户认证管理功能，包括基础的密码认证、短信认证、SSO 协议的认证等，并且具有良好的可扩展性。

## 功能特性

- 支持多种认证方式（密码、短信、SSO等）
- 可扩展的认证策略系统
- 支持多因素认证
- 与 NocoBase 用户系统无缝集成
- 提供认证日志和监控功能

## 安装和启用

```bash
yarn add @nocobase/plugin-auth
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import AuthPlugin from '@nocobase/plugin-auth';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(AuthPlugin);
  }
}
```

## 基本使用

### 1. 配置认证策略

```ts
// src/server/auth-config.ts
import { AuthManager } from '@nocobase/plugin-auth';

export function configureAuth(authManager: AuthManager) {
  // 配置密码认证
  authManager.registerType('password', {
    title: '密码认证',
    auth: async (ctx) => {
      const { username, password } = ctx.action.params;
      // 实现密码验证逻辑
      return await validatePassword(username, password);
    }
  });
  
  // 配置短信认证
  authManager.registerType('sms', {
    title: '短信认证',
    auth: async (ctx) => {
      const { phone, code } = ctx.action.params;
      // 实现短信验证码验证逻辑
      return await validateSMSCode(phone, code);
    }
  });
}
```

### 2. 在客户端使用认证

```tsx
// src/client/components/LoginForm.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Tabs } from 'antd';
import { useAuth } from '@nocobase/plugin-auth/client';

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState('password');
  const { login } = useAuth();
  
  const handlePasswordLogin = async (values) => {
    try {
      await login('password', values);
      // 登录成功处理
    } catch (error) {
      // 登录失败处理
      console.error('Login failed:', error);
    }
  };
  
  const handleSMSLogin = async (values) => {
    try {
      await login('sms', values);
      // 登录成功处理
    } catch (error) {
      // 登录失败处理
      console.error('Login failed:', error);
    }
  };
  
  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <Tabs.TabPane tab="密码登录" key="password">
        <Form onFinish={handlePasswordLogin}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">登录</Button>
          </Form.Item>
        </Form>
      </Tabs.TabPane>
      
      <Tabs.TabPane tab="短信登录" key="sms">
        <Form onFinish={handleSMSLogin}>
          <Form.Item name="phone" rules={[{ required: true }]}>
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true }]}>
            <Input placeholder="验证码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">登录</Button>
          </Form.Item>
        </Form>
      </Tabs.TabPane>
    </Tabs>
  );
}
```

## 高级用法

### 1. 自定义认证策略

```ts
// src/server/custom-auth-strategy.ts
import { AuthStrategy } from '@nocobase/plugin-auth';

class OAuth2Strategy extends AuthStrategy {
  constructor() {
    super('oauth2');
  }
  
  async auth(ctx) {
    const { code } = ctx.action.params;
    // 实现 OAuth2 认证逻辑
    const token = await exchangeCodeForToken(code);
    const userInfo = await getUserInfo(token);
    
    // 创建或更新用户
    const user = await this.findOrCreateUser(userInfo);
    
    return {
      user,
      token: this.generateToken(user)
    };
  }
  
  private async exchangeCodeForToken(code: string) {
    // 实现授权码交换令牌逻辑
  }
  
  private async getUserInfo(token: string) {
    // 实现获取用户信息逻辑
  }
}

// 注册自定义认证策略
import { AuthManager } from '@nocobase/plugin-auth';

export function registerCustomAuth(authManager: AuthManager) {
  authManager.registerType('oauth2', new OAuth2Strategy());
}
```

### 2. 多因素认证

```ts
// src/server/mfa-auth.ts
class MFAAuthStrategy extends AuthStrategy {
  constructor() {
    super('mfa');
  }
  
  async auth(ctx) {
    const { username, password, totpCode } = ctx.action.params;
    
    // 第一步：验证密码
    const user = await validatePassword(username, password);
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    // 第二步：验证 TOTP 代码
    const isValid = await validateTOTP(user, totpCode);
    if (!isValid) {
      throw new Error('验证码错误');
    }
    
    return {
      user,
      token: this.generateToken(user)
    };
  }
}
```

## 最佳实践

1. **安全性**：
   - 使用 HTTPS 传输敏感信息
   - 实施适当的密码策略
   - 实现登录失败次数限制
   - 定期更新认证令牌

2. **用户体验**：
   - 提供清晰的错误提示
   - 实现记住我功能
   - 支持密码重置流程
   - 提供多种认证方式

3. **可扩展性**：
   - 设计灵活的认证策略接口
   - 支持第三方认证集成
   - 实现认证日志记录
   - 提供认证监控功能

## 扩展示例

### 1. 微信登录集成

```ts
// src/server/wechat-auth.ts
class WeChatAuthStrategy extends AuthStrategy {
  constructor() {
    super('wechat');
  }
  
  async auth(ctx) {
    const { code } = ctx.action.params;
    
    // 通过微信授权码获取用户信息
    const accessToken = await this.getWeChatAccessToken(code);
    const userInfo = await this.getWeChatUserInfo(accessToken);
    
    // 查找或创建用户
    const user = await this.findOrCreateUser({
      username: `wechat_${userInfo.openid}`,
      nickname: userInfo.nickname,
      avatar: userInfo.headimgurl
    });
    
    return {
      user,
      token: this.generateToken(user)
    };
  }
  
  private async getWeChatAccessToken(code: string) {
    // 实现微信访问令牌获取逻辑
  }
  
  private async getWeChatUserInfo(accessToken: string) {
    // 实现微信用户信息获取逻辑
  }
}
```

### 2. LDAP 认证

```ts
// src/server/ldap-auth.ts
import ldap from 'ldapjs';

class LDAPAuthStrategy extends AuthStrategy {
  constructor() {
    super('ldap');
  }
  
  async auth(ctx) {
    const { username, password } = ctx.action.params;
    
    // 连接 LDAP 服务器
    const client = ldap.createClient({
      url: process.env.LDAP_URL
    });
    
    return new Promise((resolve, reject) => {
      // 尝试绑定用户
      client.bind(`uid=${username},${process.env.LDAP_BASE_DN}`, password, async (err) => {
        if (err) {
          reject(new Error('LDAP 认证失败'));
          return;
        }
        
        // 获取用户详细信息
        client.search(process.env.LDAP_BASE_DN, {
          filter: `(uid=${username})`,
          scope: 'sub'
        }, async (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          
          res.on('searchEntry', async (entry) => {
            const userAttrs = entry.object;
            
            // 查找或创建用户
            const user = await this.findOrCreateUser({
              username: userAttrs.uid,
              email: userAttrs.mail,
              displayName: userAttrs.displayName
            });
            
            resolve({
              user,
              token: this.generateToken(user)
            });
          });
          
          res.on('error', reject);
        });
      });
    });
  }
}
```

### 3. JWT 认证

```ts
// src/server/jwt-auth.ts
import jwt from 'jsonwebtoken';

class JWTAuthStrategy extends AuthStrategy {
  constructor() {
    super('jwt');
  }
  
  async auth(ctx) {
    const { token } = ctx.action.params;
    
    try {
      // 验证 JWT 令牌
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 查找用户
      const user = await this.findUserById(decoded.userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return {
        user,
        token: this.refreshToken(user)
      };
    } catch (error) {
      throw new Error('无效的访问令牌');
    }
  }
  
  generateToken(user) {
    return jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  refreshToken(user) {
    return this.generateToken(user);
  }
}
```

## 常见问题

### 1. 会话管理

```ts
// src/server/session-management.ts
import { AuthManager } from '@nocobase/plugin-auth';

export class SessionManager {
  static async invalidateUserSessions(userId: number) {
    // 实现使用户所有会话失效的逻辑
  }
  
  static async invalidateSession(token: string) {
    // 实现使特定会话失效的逻辑
  }
}
```

### 2. 认证日志

```ts
// src/server/auth-logging.ts
import { Logger } from '@nocobase/logger';

export class AuthLogger {
  constructor(private logger: Logger) {}
  
  logAuthAttempt(username: string, success: boolean, ip: string) {
    this.logger.info('Authentication attempt', {
      username,
      success,
      ip,
      timestamp: new Date()
    });
  }
  
  logAuthFailure(username: string, reason: string, ip: string) {
    this.logger.warn('Authentication failure', {
      username,
      reason,
      ip,
      timestamp: new Date()
    });
  }
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/auth)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth)
- [认证相关插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth-*)
