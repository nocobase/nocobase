---
title: 'Protect APIs and pages'
description: 'Restrict business pages and data APIs to signed-in users.'
---

# Protect APIs and pages

Business pages require sign-in by default. You can make product introductions and help pages public so visitors can browse them directly. Pages can use different access rules within the same application:

- **Public access**: product introductions and help pages, without requiring sign-in.
- **Sign-in required**: internal business pages, such as orders and customer records.

Protecting APIs and pages means restricting access to business content that requires sign-in. Your development Agent can reuse the application's authentication capability to apply appropriate access rules to public and internal pages.

## Example: make a product introduction public

The application already has orders for employees. You now want a public product introduction so customers can learn about products without an account. Ask your development Agent:

```text
Add a public product introduction page that visitors can browse without registering or signing in.
Show product names, images, and descriptions. Signed-in users should also be able to visit it.
If the page reads product descriptions through an API, allow visitors to read this public content too.
Keep existing sign-in requirements and permission rules for internal pages and APIs, including orders and customer records.
```

Visitors can open the product introduction directly. Employees still sign in to access orders and other internal features. Product introduction content is public, while internal data keeps its existing access rules.

### Pages that require sign-in

Business pages already require sign-in by default. If an existing page needs its access rules adjusted, describe the requirement:

```text
Require employees to sign in before viewing the orders page and calling its data APIs.
Send visitors to the sign-in page when they open the orders page without signing in.
Keep existing permission rules for which orders employees can view and which actions they can perform.
```

The page displays orders, while related APIs read or change order data. Your development Agent handles sign-in requirements for both.

## Sign-in requirements and business permissions

Authentication determines whether the visitor is signed in. Business permissions determine which data that user can see and which actions they can perform. For example, employees may enter the orders feature after sign-in, while buyers can view only their own orders and approvers can process pending orders. Configure these rules through [authorization](../../authorization).

## Developer reference

The following details are for developers connecting custom pages, APIs, and account management. When developing through an Agent, you can use the business prompts above directly.

### API authentication

Resolve the authentication service through `authenticationToken`. Use `auth.required()` on APIs that require sign-in. After authentication, `context.get('auth')` contains the current user and session.

```ts
const auth = app.container.resolve(authenticationToken);
const routes = new Hono<AuthEnv>();

routes.use('*', auth.required());
routes.get('/current-user', (context) => {
  const { user } = context.get('auth')!;
  return context.json({ data: { id: user.id, name: user.name } });
});
```

This is the central fragment of an application API route. Import `authenticationToken` and `AuthEnv` from `@nocobase/app-plugin-authentication`, and `Hono` from `hono`. See the [route reference](../../../app/reference/routes) for declaration and registration.

A public page may return different information depending on sign-in state. For example, visitors can view products while signed-in users also see favorites. Use `auth.optional()` to read an optional identity.

### Use the current user identity

Business features can use the signed-in identity to record who performs an action. For example, save the current user as the requester when creating an order:

```text
Automatically save the current signed-in user as the requester when creating an order.
The system fills in the requester. Users should not need to select it or be able to change it to someone else.
```

Your development Agent reads the current user from server authentication and saves it with the order.

### Page authentication

Declare a page's `auth` in `client/routes.ts`:

| Value      | Purpose                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `required` | Business pages that require sign-in; guests go to the sign-in page          |
| `guest`    | Pages such as sign-in and registration; signed-in users go to the home page |
| `optional` | Pages available to both visitors and signed-in users                        |

Child pages inherit their parent's authentication requirement. Page guards control browser navigation; APIs still need independent authentication requirements.

### API authentication results

Unauthenticated requests to APIs that require sign-in return 401. Signed-in requests without the required business permission return 403 through authorization checks.

By default, an API key accesses APIs as its creator, using that user's existing permissions. Keys with dedicated scopes or service accounts require explicit API support and remain subject to the application's access rules.

### Accounts and sessions

Administrators can disable accounts or revoke sessions. A disabled account cannot sign in or use existing sessions to access protected APIs. Related realtime connections also disconnect. After re-enabling an account, the user needs to sign in again.

For an integration with an employee management system, request:

```text
The HR system notifies this application when an employee leaves.
Find the account using the employee identifier agreed between the systems, disable it, and revoke existing sessions.
Authenticate the HR integration API and allow this operation only for authorized callers.
```

User management provides account administration actions. Business services can also reuse authentication's account and session management capabilities.

### Deployment configuration

The person responsible for deployment maintains these settings:

| Setting                                            | Purpose                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `secrets.keys` or `SECRETS_KEYS`                   | Application keys must match across instances; changing the current key affects existing sessions |
| `app.publicOrigin` and the public application path | Generate callbacks and links using the actual user-facing address                                |
| Cookie configuration                               | Match HTTPS, domains, and the application path                                                   |
| Shared cache for multiple instances                | Share rate-limit counts, one-time values, and session caches                                     |

Usually retain the template's Cookie configuration generated from the application name and public path. Separate frontend domains need trusted-origin configuration. Reverse proxies must forward the protocol, Host, and Cookies correctly. See [deployment](../../../deployment).
