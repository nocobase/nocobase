---
title: 'Customize sign-in pages'
description: 'Use business requirements to change sign-in branding, copy, and the layout of authentication options.'
---

# Customize sign-in pages

Sign-in pages can use the application's own branding and business description. Change logos, titles, promotional content, and the layout of sign-in options while reusing existing authentication actions.

## Example: a transport company's sign-in page

Customize the Northstar Logistics sign-in page with a full-page background, brand colors, and business copy. Ask your development Agent:

```text
Customize the sign-in page for Northstar Logistics' transport management application.

Use a photograph of a truck on a mountain road as the full-page background.
Add a dark blue overlay to keep text readable.
Show the company name and icon at the top. On the left, display “Welcome back”
and explain how the application manages dispatch, tracks deliveries, and connects the team.
Place the sign-in form on the right, with white text, white inputs, and an orange sign-in button.

Keep password sign-in, company account sign-in, and password recovery.
Administrators create accounts, so do not show self-registration.
Reuse the existing sign-in logic and open the application home page after sign-in.
```

If you have an application logo, provide the file. When different themes need different images, explain where each image should be used.

## View the result

Open the sign-in page to see a full-page truck and mountain-road background, company branding, and a transport business description. The form sits directly over the background, with white text and an orange button. Backgrounds, colors, and content layout can all follow the company's needs.

![Transport company sign-in page with a full-page truck background](../../../../cn/capabilities/auth/assets/branded-login.png)

Authentication follows the same flow as before. Changing branding, titles, and layout does not require reimplementing sign-in or sessions.

## Display multiple sign-in methods

Arrange sign-in options for your application:

```text
Keep the password form and add a Company account button below it.
Make password sign-in the default. Use the identity platform already connected to the application for company account sign-in.
```

First complete the integration described in [add authentication methods](./sign-in-methods). This page concerns displaying and arranging entries; adding a button does not connect an identity platform automatically.

## Further changes

Sign-in, registration, and password pages are in the application's `client/pages/auth/`. Form and layout components are in `client/extensions/`. Your development Agent can change these files within the application without modifying the authentication plugin.

You can also change the destination after sign-in, such as opening customer lists for salespeople or pending orders for buyers. See [password authentication](../methods/password) for registration, password requirements, and recovery rules.
