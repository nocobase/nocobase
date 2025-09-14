# 认证示例

本文档将详细介绍如何在 NocoBase 插件中实现自定义认证机制。

## 认证基础

### 认证概念

NocoBase 提供了灵活的认证框架，支持多种认证方式，包括本地认证、第三方认证（如 OAuth、LDAP 等）以及自定义认证方案。

### 认证流程

1. 用户提供认证凭据（用户名/密码、OAuth令牌等）
2. 系统验证凭据的有效性
3. 生成认证令牌（如 JWT）
4. 将令牌返回给客户端
5. 客户端在后续请求中携带令牌
6. 服务器验证令牌并识别用户身份

## 自定义认证策略

### 创建认证策略

```typescript
// src/server/auth/CustomAuthStrategy.ts
import { AuthStrategy, AuthConfig, AuthContext } from '@nocobase/auth';

interface CustomAuthConfig extends AuthConfig {
  customOption?: string;
  apiUrl?: string;
}

export class CustomAuthStrategy extends AuthStrategy<CustomAuthConfig> {
  async validate(username: string, password: string, ctx: AuthContext) {
    try {
      // 实现自定义认证逻辑
      const user = await this.authenticateWithCustomService(username, password);
      
      if (!user) {
        throw new Error('认证失败');
      }
      
      return user;
    } catch (error) {
      throw new Error(`认证错误: ${error.message}`);
    }
  }
  
  async register(username: string, password: string, userInfo: any, ctx: AuthContext) {
    try {
      // 实现用户注册逻辑
      const user = await this.registerWithCustomService(username, password, userInfo);
      return user;
    } catch (error) {
      throw new Error(`注册错误: ${error.message}`);
    }
  }
  
  private async authenticateWithCustomService(username: string, password: string) {
    // 调用自定义认证服务
    // 这里可以是任何外部认证系统
    return {
      id: 'user-id',
      username: username,
      email: `${username}@example.com`,
      // 其他用户信息
    };
  }
  
  private async registerWithCustomService(username: string, password: string, userInfo: any) {
    // 实现用户注册逻辑
    return {
      id: 'new-user-id',
      username: username,
      email: userInfo.email,
      // 其他用户信息
    };
  }
}
```

### 注册认证策略

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { CustomAuthStrategy } from './auth/CustomAuthStrategy';

export class AuthPlugin extends Plugin {
  async load() {
    // 注册自定义认证策略
    this.app.authManager.registerAuthStrategy('custom', CustomAuthStrategy);
  }
}
```

## OAuth2 认证示例

### OAuth2 策略实现

```typescript
// src/server/auth/OAuth2Strategy.ts
import { AuthStrategy, AuthContext } from '@nocobase/auth';
import axios from 'axios';

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userProfileURL: string;
  scope?: string[];
}

export class OAuth2Strategy extends AuthStrategy<OAuth2Config> {
  async getAuthorizationUrl(ctx: AuthContext) {
    const { clientId, authorizationURL, scope } = this.config;
    const redirectUri = `${ctx.app.url}/api/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope?.join(' ') || 'user:read',
    });
    
    return `${authorizationURL}?${params.toString()}`;
  }
  
  async handleCallback(code: string, ctx: AuthContext) {
    try {
      // 交换授权码获取访问令牌
      const tokenResponse = await this.exchangeCodeForToken(code, ctx);
      
      // 获取用户信息
      const userProfile = await this.getUserProfile(tokenResponse.access_token);
      
      // 查找或创建用户
      const user = await this.findOrCreateUser(userProfile);
      
      return {
        user,
        token: tokenResponse.access_token,
      };
    } catch (error) {
      throw new Error(`OAuth2 认证失败: ${error.message}`);
    }
  }
  
  private async exchangeCodeForToken(code: string, ctx: AuthContext) {
    const { clientId, clientSecret, tokenURL } = this.config;
    const redirectUri = `${ctx.app.url}/api/auth/callback`;
    
    const response = await axios.post(tokenURL, {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    
    return response.data;
  }
  
  private async getUserProfile(accessToken: string) {
    const { userProfileURL } = this.config;
    
    const response = await axios.get(userProfileURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.data;
  }
  
  private async findOrCreateUser(profile: any) {
    // 根据 OAuth 提供商的用户ID查找用户
    let user = await this.db.getRepository('users').findOne({
      filter: {
        provider: 'oauth2',
        providerId: profile.id,
      },
    });
    
    // 如果用户不存在，则创建新用户
    if (!user) {
      user = await this.db.getRepository('users').create({
        values: {
          username: profile.username || profile.login,
          email: profile.email,
          nickname: profile.name || profile.displayName,
          provider: 'oauth2',
          providerId: profile.id,
          avatar: profile.avatar_url,
        },
      });
    }
    
    return user;
  }
}
```

## JWT 认证中间件

### JWT 令牌处理

```typescript
// src/server/middlewares/JWTAuthMiddleware.ts
import { Context, Next } from '@nocobase/server';
import { verify } from 'jsonwebtoken';

export class JWTAuthMiddleware {
  private readonly secret: string;
  private readonly excludePaths: string[];
  
  constructor(options: { secret: string; excludePaths?: string[] }) {
    this.secret = options.secret;
    this.excludePaths = options.excludePaths || [];
  }
  
  async authenticate(ctx: Context, next: Next) {
    // 检查是否需要跳过认证
    if (this.shouldSkipAuth(ctx.path)) {
      return await next();
    }
    
    const token = this.extractToken(ctx);
    
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: '未提供认证令牌' };
      return;
    }
    
    try {
      // 验证 JWT 令牌
      const decoded = verify(token, this.secret);
      ctx.state.user = decoded;
      
      // 检查用户是否仍然有效
      const user = await this.validateUser(decoded.userId);
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: '用户不存在或已被禁用' };
        return;
      }
      
      ctx.state.currentUser = user;
    } catch (error) {
      ctx.status = 401;
      ctx.body = { error: '无效的认证令牌' };
      return;
    }
    
    await next();
  }
  
  private shouldSkipAuth(path: string): boolean {
    return this.excludePaths.some(excludePath => 
      path.startsWith(excludePath)
    );
  }
  
  private extractToken(ctx: Context): string | null {
    const authHeader = ctx.headers.authorization;
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
  
  private async validateUser(userId: string) {
    // 验证用户是否仍然有效
    return await this.db.getRepository('users').findById(userId);
  }
}
```

## 客户端认证组件

### 登录表单组件

```typescript
// src/client/components/LoginForm.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Space, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const LoginForm: React.FC<{ 
  onLoginSuccess?: () => void;
  showRegisterLink?: boolean;
  onShowRegister?: () => void;
}> = (props) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const onFinish = async (values: any) => {
    setLoading(true);
    
    try {
      // 执行登录
      const response = await api.auth.signIn({
        username: values.username,
        password: values.password,
      });
      
      // 保存认证信息
      api.auth.setToken(response.data.token);
      
      message.success(t('登录成功'));
      props.onLoginSuccess?.();
    } catch (error) {
      message.error(t('登录失败') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: t('请输入用户名') }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder={t('用户名')}
        />
      </Form.Item>
      
      <Form.Item
        name="password"
        rules={[{ required: true, message: t('请输入密码') }]}
      >
        <Input
          prefix={<LockOutlined />}
          type="password"
          placeholder={t('密码')}
        />
      </Form.Item>
      
      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{t('记住我')}</Checkbox>
          </Form.Item>
          
          <a href="#">{t('忘记密码')}</a>
        </Space>
      </Form.Item>
      
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{ width: '100%' }}
        >
          {t('登录')}
        </Button>
      </Form.Item>
      
      {props.showRegisterLink && (
        <Form.Item>
          <Button
            type="link"
            onClick={props.onShowRegister}
            style={{ width: '100%' }}
          >
            {t('还没有账户？立即注册')}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};
```

### OAuth2 登录按钮

```typescript
// src/client/components/OAuth2LoginButton.tsx
import React from 'react';
import { Button } from 'antd';
import { useAPIClient } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const OAuth2LoginButton: React.FC<{
  provider: string;
  buttonText?: string;
  icon?: React.ReactNode;
}> = (props) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  
  const handleLogin = async () => {
    try {
      // 获取 OAuth2 授权 URL
      const response = await api.request({
        url: `/auth/${props.provider}/url`,
      });
      
      // 重定向到授权页面
      window.location.href = response.data.url;
    } catch (error) {
      console.error('获取授权URL失败:', error);
    }
  };
  
  return (
    <Button
      onClick={handleLogin}
      icon={props.icon}
      style={{ width: '100%' }}
    >
      {props.buttonText || t('使用 {{provider}} 登录', { provider: props.provider })}
    </Button>
  );
};
```

## 认证钩子和中间件

### 认证后处理钩子

```typescript
// src/server/hooks/AuthHooks.ts
import { HookFn } from '@nocobase/server';

// 登录后处理钩子
export const AfterLoginHook: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'auth' && actionName === 'signIn') {
    const user = ctx.state.currentUser;
    
    if (user) {
      // 记录登录日志
      await this.logUserLogin(user, ctx);
      
      // 更新最后登录时间
      await this.updateLastLoginTime(user);
      
      // 检查账户状态
      await this.checkAccountStatus(user);
    }
  }
  
  await next();
};

// 登出后处理钩子
export const AfterLogoutHook: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'auth' && actionName === 'signOut') {
    const user = ctx.state.currentUser;
    
    if (user) {
      // 记录登出日志
      await this.logUserLogout(user, ctx);
      
      // 清理用户会话
      await this.clearUserSession(user);
    }
  }
  
  await next();
};

// 实现钩子方法
private async logUserLogin(user: any, ctx: any) {
  await ctx.db.getRepository('loginLogs').create({
    values: {
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent'],
      loginAt: new Date(),
    },
  });
}

private async updateLastLoginTime(user: any) {
  await user.update({
    lastLoginAt: new Date(),
  });
}

private async checkAccountStatus(user: any) {
  if (user.status === 'disabled') {
    throw new Error('账户已被禁用');
  }
}

private async logUserLogout(user: any, ctx: any) {
  await ctx.db.getRepository('logoutLogs').create({
    values: {
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent'],
      logoutAt: new Date(),
    },
  });
}

private async clearUserSession(user: any) {
  // 清理用户会话数据
  await this.cache.del(`user-session:${user.id}`);
}
```

## 权限和角色管理

### 基于角色的访问控制

```typescript
// src/server/middlewares/RBACMiddleware.ts
import { Context, Next } from '@nocobase/server';

export class RBACMiddleware {
  async checkPermission(ctx: Context, next: Next) {
    const user = ctx.state.currentUser;
    const { resourceName, actionName } = ctx.action;
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: '未认证' };
      return;
    }
    
    // 检查用户是否有权限执行该操作
    const hasPermission = await this.checkUserPermission(user, resourceName, actionName);
    
    if (!hasPermission) {
      ctx.status = 403;
      ctx.body = { error: '权限不足' };
      return;
    }
    
    await next();
  }
  
  private async checkUserPermission(user: any, resourceName: string, actionName: string) {
    // 获取用户角色
    const roles = await this.getUserRoles(user.id);
    
    // 检查角色权限
    for (const role of roles) {
      const hasPermission = await this.checkRolePermission(role, resourceName, actionName);
      if (hasPermission) {
        return true;
      }
    }
    
    return false;
  }
  
  private async getUserRoles(userId: string) {
    // 获取用户的角色
    const userRoles = await this.db.getRepository('users_roles').find({
      filter: { userId },
    });
    
    return userRoles.map(ur => ur.roleId);
  }
  
  private async checkRolePermission(roleId: string, resourceName: string, actionName: string) {
    // 检查角色是否有权限
    const permission = await this.db.getRepository('permissions').findOne({
      filter: {
        roleId,
        resourceName,
        actionName,
      },
    });
    
    return !!permission;
  }
}
```

## 多因素认证

### TOTP 认证实现

```typescript
// src/server/auth/TOPTAuth.ts
import { AuthStrategy, AuthContext } from '@nocobase/auth';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TOTPAuth extends AuthStrategy {
  async setupTOTP(user: any, ctx: AuthContext) {
    try {
      // 生成 TOTP 密钥
      const secret = speakeasy.generateSecret({
        name: `NocoBase (${user.email})`,
        issuer: 'NocoBase',
      });
      
      // 生成 QR 码
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      // 保存密钥到用户记录
      await user.update({
        totpSecret: secret.base32,
      });
      
      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
      };
    } catch (error) {
      throw new Error(`TOTP 设置失败: ${error.message}`);
    }
  }
  
  async verifyTOTP(user: any, token: string, ctx: AuthContext) {
    try {
      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: token,
        window: 2, // 允许的时间窗口
      });
      
      if (!verified) {
        throw new Error('验证码不正确');
      }
      
      return true;
    } catch (error) {
      throw new Error(`TOTP 验证失败: ${error.message}`);
    }
  }
  
  async enableTOTP(user: any, token: string, ctx: AuthContext) {
    // 验证 TOTP 令牌
    const isValid = await this.verifyTOTP(user, token, ctx);
    
    if (isValid) {
      // 启用 TOTP
      await user.update({
        totpEnabled: true,
      });
      
      return true;
    }
    
    return false;
  }
}
```

## 会话管理

### 会话存储和验证

```typescript
// src/server/auth/SessionManager.ts
import { Context } from '@nocobase/server';

export class SessionManager {
  private readonly sessionTimeout: number;
  
  constructor(options: { sessionTimeout?: number }) {
    this.sessionTimeout = options.sessionTimeout || 24 * 60 * 60 * 1000; // 24小时
  }
  
  async createSession(user: any, ctx: Context) {
    const sessionId = this.generateSessionId();
    
    // 创建会话记录
    const session = await ctx.db.getRepository('sessions').create({
      values: {
        id: sessionId,
        userId: user.id,
        ip: ctx.ip,
        userAgent: ctx.headers['user-agent'],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.sessionTimeout),
      },
    });
    
    // 存储到缓存中以提高性能
    await ctx.cache.set(`session:${sessionId}`, session, this.sessionTimeout / 1000);
    
    return sessionId;
  }
  
  async validateSession(sessionId: string, ctx: Context) {
    // 首先从缓存中查找
    let session = await ctx.cache.get(`session:${sessionId}`);
    
    if (!session) {
      // 缓存未命中，从数据库查找
      session = await ctx.db.getRepository('sessions').findById(sessionId);
      
      if (session) {
        // 存储到缓存中
        await ctx.cache.set(`session:${sessionId}`, session, this.sessionTimeout / 1000);
      }
    }
    
    // 检查会话是否有效
    if (!session || session.expiresAt < new Date()) {
      // 会话已过期，删除它
      await this.destroySession(sessionId, ctx);
      return null;
    }
    
    // 更新会话过期时间
    await this.refreshSession(sessionId, ctx);
    
    return session;
  }
  
  async destroySession(sessionId: string, ctx: Context) {
    // 从数据库删除
    await ctx.db.getRepository('sessions').destroy({
      filter: { id: sessionId },
    });
    
    // 从缓存删除
    await ctx.cache.del(`session:${sessionId}`);
  }
  
  private async refreshSession(sessionId: string, ctx: Context) {
    const newExpiresAt = new Date(Date.now() + this.sessionTimeout);
    
    // 更新数据库记录
    await ctx.db.getRepository('sessions').update({
      filter: { id: sessionId },
      values: { expiresAt: newExpiresAt },
    });
    
    // 更新缓存
    const session = await ctx.cache.get(`session:${sessionId}`);
    if (session) {
      session.expiresAt = newExpiresAt;
      await ctx.cache.set(`session:${sessionId}`, session, this.sessionTimeout / 1000);
    }
  }
  
  private generateSessionId(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

## 认证最佳实践

### 1. 安全性考虑

```typescript
// 实现安全的认证实践
class SecureAuthManager {
  private readonly rateLimiter: Map<string, number[]>;
  
  constructor() {
    this.rateLimiter = new Map();
  }
  
  async secureAuthenticate(username: string, password: string, ctx: any) {
    // 1. 速率限制
    if (await this.isRateLimited(ctx.ip)) {
      throw new Error('请求过于频繁，请稍后再试');
    }
    
    // 2. 防止定时攻击
    const user = await this.findUserByUsername(username);
    const isValid = user && await this.verifyPassword(password, user.password);
    
    // 3. 记录认证尝试
    await this.logAuthAttempt(ctx.ip, username, isValid);
    
    // 4. 实施账户锁定策略
    if (!isValid) {
      await this.handleFailedAttempt(username);
      throw new Error('用户名或密码不正确');
    }
    
    // 5. 检查账户状态
    if (user.status !== 'active') {
      throw new Error('账户未激活或已被禁用');
    }
    
    return user;
  }
  
  private async isRateLimited(ip: string): Promise<boolean> {
    const now = Date.now();
    const attempts = this.rateLimiter.get(ip) || [];
    
    // 清理1分钟前的尝试记录
    const recentAttempts = attempts.filter(time => now - time < 60000);
    
    // 如果1分钟内超过5次尝试，则限制
    if (recentAttempts.length >= 5) {
      return true;
    }
    
    // 记录本次尝试
    recentAttempts.push(now);
    this.rateLimiter.set(ip, recentAttempts);
    
    return false;
  }
  
  private async handleFailedAttempt(username: string) {
    // 实现账户锁定逻辑
    // 例如：连续失败5次后锁定账户30分钟
  }
}
```

### 2. 令牌管理

```typescript
// 安全的令牌管理
class SecureTokenManager {
  private readonly jwtSecret: string;
  private readonly refreshTokenSecret: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || this.generateSecret();
  }
  
  generateTokens(user: any) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1小时
    };
  }
  
  refreshTokens(refreshToken: string) {
    try {
      const decoded = verify(refreshToken, this.refreshTokenSecret);
      
      // 验证刷新令牌是否仍然有效
      const tokenValid = this.isRefreshTokenValid(decoded.jti);
      if (!tokenValid) {
        throw new Error('刷新令牌无效');
      }
      
      // 生成新的令牌对
      const newTokens = this.generateTokens(decoded.user);
      
      // 撤销旧的刷新令牌
      this.revokeRefreshToken(decoded.jti);
      
      return newTokens;
    } catch (error) {
      throw new Error('无效的刷新令牌');
    }
  }
  
  private generateAccessToken(user: any) {
    return sign(
      { user: { id: user.id, username: user.username } },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }
  
  private generateRefreshToken(user: any) {
    const tokenId = this.generateTokenId();
    
    return sign(
      { 
        user: { id: user.id, username: user.username },
        jti: tokenId 
      },
      this.refreshTokenSecret,
      { expiresIn: '7d' }
    );
  }
  
  private generateSecret(): string {
    return require('crypto').randomBytes(64).toString('hex');
  }
  
  private generateTokenId(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }
}
```

### 3. 密码安全

```typescript
// 密码安全处理
class PasswordSecurity {
  private readonly saltRounds: number;
  
  constructor() {
    this.saltRounds = 12;
  }
  
  async hashPassword(password: string): Promise<string> {
    return await hash(password, this.saltRounds);
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
  }
  
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 长度检查
    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }
    
    // 复杂度检查
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    // 常见密码检查
    const commonPasswords = ['password', '12345678', 'qwertyui'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('密码过于简单');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

## 下一步

- 学习 [API文档](./api-documentation.md) 示例（如果创建了该文档）
- 掌握 [异步任务管理](./async-task-management.md) 示例（如果创建了该文档）
