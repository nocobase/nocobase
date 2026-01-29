---
title: "Auth: Sign In / Sign Out / Read Token"
description: "Use ctx.api.auth to sign in, sign out, and read the current user's Token, role, and locale."
---

# Auth: Sign In / Sign Out / Read Token

## Sign in (signIn)

```ts
// Sign in with a specific authenticator
const response = await ctx.api.auth.signIn(
  { email, password },
  'basic', // authenticator identifier, configurable in the admin UI
);

// After sign-in, the token is automatically saved to local storage
typeof ctx.api.auth.token; // string | null
```

## Sign out (signOut)

```ts
await ctx.api.auth.signOut();

// After sign-out, token / role / authenticator etc. are cleared
console.log(ctx.api.auth.token); // null
```

## Read current auth info

```ts
// Current Token
const token = ctx.api.auth.getToken();

// Current role
const role = ctx.api.auth.getRole();

// Current locale
const locale = ctx.api.auth.getLocale();
```
