---
title: 'Protecting pages and APIs'
---

# Protecting pages and APIs

[← Authentication overview](./index.md) · [Open the related scenario](./index.md#protect)

Northstar can publish its transport service information while keeping customer records, orders, and its workspace internal. Authentication establishes whether a caller is signed in; authorization determines access afterward.

> The /main/services, /main/orders, and /main/api/northstar paths belong to this example. Ask the Agent to use your application’s actual routes, APIs, and base path.

[Public information and internal work](#public-information-and-internal-work) · [Use the current employee identity](#use-the-current-employee-identity) · [Page and API requirements](#page-and-api-requirements) · [Account lifecycle and deployment](#account-lifecycle-and-deployment)

## Public information and internal work

An application can include public pages and internal work. Visitors can browse public content without sign-in; protected records require authentication and authorization.

```text
Add a public transport services page for Northstar without requiring registration or sign-in.
Use Northstar’s blue brand style to introduce its Yangtze River Delta network, regional transport, business delivery, and shipment coordination.
Show a contact email and an Employee orders entry. Signed-in employees can visit the public page too.
Its public reading API must not return internal orders or customer records.
Keep authentication and business permissions on the workspace, customer and order pages, and their APIs.
Direct anonymous visitors to sign-in when they open internal pages.
```

### Browse company information without signing in

Open `/main/services` to browse Northstar’s public service page directly. Visitors can see the Shanghai, Hangzhou, and Suzhou service network and the three service areas without registering or signing in. Internal customer and order records are not shown.

![Public Northstar service information without sign-in](../assets/northstar-public-services-en.png)

The business prompt above produces this page. Branding, layout, and service information can follow the company’s needs.

### Require sign-in for employee orders

Choose **Open employee orders** to visit the internal `/main/orders` address. Anonymous visitors are redirected to sign-in. After signing in, business permissions determine their order access.

Entering the internal order URL directly also leads to sign-in. Knowing the address does not grant business access.

![Opening employee orders anonymously redirects to sign-in](../assets/northstar-internal-orders-login-en.png)

Compare these example addresses:

| Address                                | Anonymous result                              |
| -------------------------------------- | --------------------------------------------- |
| `http://localhost:13200/main/services` | Displays public transport service information |
| `http://localhost:13200/main/orders`   | Redirects to application sign-in              |

### Protect pages and APIs separately

The public page reads company information from `GET /main/api/public/company`. This separate endpoint returns only the company name, service regions, service entries, and contact email. It does not query or return internal customers, employees, or orders.

Internal APIs still require authentication. An anonymous call to `GET /main/api/northstar` returns **401** without order data. Browsers visiting internal pages are redirected to sign-in; scripts calling protected APIs receive an authentication error and must provide valid identity.

Pages and APIs declare their own access requirements. Hidden navigation and browser checks cannot replace server protection.

## Use the current employee identity

Use the current authenticated identity when records need actor traceability. Record it on the server rather than relying on manually supplied identities.

```text
When creating an order, obtain the acting employee from the server-side session and record them.
Do not ask employees to supply or impersonate another acting user.
Assign an order owner separately under business rules; do not confuse ownership with creation.
```

Order owner, creator, and assigned driver are distinct fields. Authentication provides the current identity; business rules define fields and access scopes.

## Page and API requirements

| Scenario                      | Page behavior                    | API requirement                          |
| ----------------------------- | -------------------------------- | ---------------------------------------- |
| Transport service information | Public and signed-in access      | Public content; optional identity        |
| Workspace, customers, orders  | Anonymous visitors enter sign-in | Authentication plus business permissions |
| Sign-in and password recovery | Guest-facing                     | Corresponding authentication flow        |
| Order-reading scripts         | No browser page required         | API key and owner permissions            |

Missing identity on a protected API returns 401; missing permission after authentication returns 403. API keys do not bypass authorization.

## Account lifecycle and deployment

Disable accounts and revoke sessions when employees leave or access is paused. An HR integration that performs those operations also requires authentication and authorization.

Deployment configuration covers application secrets, public address and path, cookies, and shared storage for multiple instances. Provider callbacks and password reset links must match the actual access address. Reverse proxies must forward protocol, Host, and cookies correctly.

Give the Agent these access requirements to implement page and API protection with the application’s authentication and authorization capabilities.

## Verify the result

- Visitors can read public information without receiving internal records.
- Internal pages redirect unauthenticated visitors to sign-in.
- Internal APIs enforce identity and business authorization on the server.

Return to the [related overview scenario](./index.md#protect) to adapt the prompt and continue with your Agent.
