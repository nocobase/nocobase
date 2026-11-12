# @onetwosmall/plugin-auth-email

Email authentication plugin for NocoBase with verification code (OTP) and auto-signup support.

## Features

- **Email OTP Authentication** — Users sign in using email + verification code sent via SMTP
- **Auto Signup** — Automatically register users who don't exist on first login
- **SMTP Provider Management** — Configurable SMTP settings (host, port, SSL, credentials, email templates)
- **Verification Code Settings** — Customizable code length, type (numeric/alphabetic/alphanumeric), expiry time, and resend interval
- **Authenticator Integration** — Registers as an authenticator type in the NocoBase Authentication plugin
- **V1 & V2 Client Support** — Compatible with both legacy SchemaComponent-based pages and modern FlowEngine-based v2 runtime

## Installation

```bash
yarn add @onetwosmall/plugin-auth-email
```

## Configuration

### Enable the Plugin

Enable the plugin via the Plugin Manager in the NocoBase admin panel.

### Configure SMTP

1. Go to **Authentication** > **Authenticators** > **Add new** > **Email**
2. Select a **Verifier** (created in Verification plugin)
3. Optionally enable **"Sign up automatically when the user does not exist"**
4. Configure SMTP settings under the selected verifier

### Verification Code Settings

- **Code Length** — Number of digits in the verification code
- **Code Type** — Numeric, Alphabetic, or Alphanumeric
- **Expires In (seconds)** — How long the verification code is valid
- **Resend Interval (seconds)** — Minimum interval before requesting a new code

## Dependencies

- `@nocobase/plugin-auth` — Core authentication plugin
- `@nocobase/plugin-verification` — Verification code infrastructure

## License

AGPL-3.0
