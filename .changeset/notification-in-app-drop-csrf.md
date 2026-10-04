---
'@nocobase/app-plugin-notification-in-app': major
---

The in-app inbox no longer has a CSRF mechanism of its own. `GET /api/notificationInApp/csrfToken` (previously `GET /api/notifications/in-app/csrf`) and its `notification_in_app_csrf` cookie are removed, writes no longer require an `x-csrf-token` header, and the `IN_APP_NOTIFICATION_INVALID_CSRF` reason is gone. Cross-site writes are rejected by the authentication plugin's origin check instead, which every inbox route already runs through `auth.required()`: a cookie-authenticated write from an untrusted origin answers 403 `PERMISSION_DENIED` with reason `INVALID_CSRF_ORIGIN` in the `authentication` domain. The client helpers no longer request a token or send the header; a client that calls the inbox API directly drops both.
