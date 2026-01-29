# ctx.api.auth

Authentication-related information and operations, based on the `Auth` wrapper from `@nocobase/sdk`. All auth-related requests automatically include Token, role, locale, and other info.

## Notes

- With `ctx.api.auth`, you can:
  - Sign in / sign up / sign out
  - Read or set the current Token, role, and locale
  - Trigger flows like password recovery and reset
- The SDK automatically persists Token, Locale, Role, etc. to local storage and includes them in request headers

## Common Properties

```ts
api.auth.token   // Token for the current user
api.auth.role    // Current role name, e.g. 'admin', 'root'
api.auth.locale  // Current locale, e.g. 'zh-CN', 'en-US'
api.auth.authenticator // Current authenticator identifier
```

## Common Methods (simplified)

```ts
// Sign in / Sign up / Sign out
api.auth.signIn(values, authenticator?): Promise<any>;
api.auth.signUp(values, authenticator?): Promise<any>;
api.auth.signOut(): Promise<any>;

// Password recovery
api.auth.lostPassword(values): Promise<any>;
api.auth.resetPassword(values): Promise<any>;

// Get / Set Token
api.auth.getToken(): string | null;
api.auth.setToken(token: string | null): void;

// Get / Set authenticator
api.auth.getAuthenticator(): string | null;
api.auth.setAuthenticator(authenticator: string | null): void;

// Get / Set locale
api.auth.getLocale(): string | null;
api.auth.setLocale(locale: string | null): void;

// Get / Set role
api.auth.getRole(): string | null;
api.auth.setRole(role: string | null): void;

// Read / write custom options (uses api.storage underneath)
api.auth.getOption(key: string): string | null;
api.auth.setOption(key: string, value?: string): void;
```
