---
"@nocobase/app-plugin-users": patch
---

The user locale provider no longer hides the application while an already known session refreshes. It keeps the last identity until the refresh answers and only hides the page to swap the language when the identity really changes (sign-in, sign-out or another account). A sign-up page with automatic sign-in turned off now shows its "Registration request submitted" result instead of being unmounted and showing an empty form.
