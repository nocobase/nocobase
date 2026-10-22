# Visitor entry and settings presentation

## Quick sign-in

While demo mode is on, visitors enter the imported demo accounts without a password, and switch between them, with no application code: the Client plugin contributes the `/demo-sign-in` page and a corner switcher on every page. `demoMode.quickSignIn: false` in application configuration turns it off.

- `GET /api/demoMode/accounts` (public) lists `{ username, name, role, current }` for the accounts `accounts(language)` lists for the imported language whose user the dataset created (`demoModeAccounts`) and is not disabled. Passwords are never returned. Empty when demo mode is off, quick sign-in is off or no data is imported.
- `POST /api/demoMode/accounts/{username}/signIn` signs the request's own session out, then signs in through Better Auth's `/sign-in/email` with the email of that user and the password `accounts(language)` lists, and forwards Better Auth's `Set-Cookie`. The session is ordinary. `DEMO_ACCOUNT_NOT_FOUND` (404) for an account the list does not offer; `DEMO_ACCOUNT_SIGN_IN_FAILED` (400) when the listed password is not the account's password. Email-and-password sign-in must be enabled.
- So `accounts(language)` must list the real password of every account: the spec's `password`, or the username followed by `123` when the spec leaves it out. Every listed account can be entered by anyone who reaches the demo, so give each one only what a visitor may see and do.
- An application with an account menu registers `demoMode({ accountSwitcher: 'menu' })` and places `DemoAccountMenu` from `@nocobase/app-plugin-demo-mode/client/account-menu` inside that menu's Base UI content, before signing out; the corner button then shows only to visitors who have not signed in.
- Embed a demo, for example in a product page's iframe, by opening `<base path>/demo-sign-in?as=<username>&redirect=/path`. `redirect` must be a path inside the application. Signing in reloads the page, so nothing of the previous account stays. A session cookie is `SameSite=Lax`: serve the demo on the same site as the embedding page, such as a subdomain of it, or the browser will not send the cookie inside the iframe.

## Host settings presentation

Use the public `DemoSettingsComponents` and `DemoSettingsHeaderProps` types from `client/settings` to pass a stable module-level `components` map to `DemoModeSettings`. Supply the host Header, Button, card parts and TabsList/TabsTrigger when its conventions differ. Header receives localized text, a mode badge, activeTabLabel, refreshDisabled, refreshing and onRefresh; preserve the badge and refresh guard, and reuse a frame-aware header inside a parent settings page. Forward children, refs, event and accessibility props; compatible tabs must share the host Base UI peer instance with the plugin. Keep the plugin-owned permission checks, mounted panels, URL query state, confirmations and revision handling. Keep one owning PageContainer and wrap tab/action/footer rows at narrow widths. Omitted components retain plugin defaults. Never define replacement components inside render or patch private plugin imports.

To hide the floating guest/account entry, register the client with `showFloatingAccountSwitcher: false`. This is presentation only: `DemoAccountMenu`, the direct sign-in route and server authorization remain unchanged. The default stays enabled for existing hosts.
