---
"@nocobase/app-plugin-demo-mode": minor
---

Make daily reset deployment-managed and always enabled in Demo Mode. Configure its hour, minute, time zone and dataset language with NOCOBASE_DEMO_RESET_HOUR, NOCOBASE_DEMO_RESET_MINUTE, NOCOBASE_DEMO_RESET_TIMEZONE and NOCOBASE_DEMO_RESET_LANGUAGE (defaults: 03:00 UTC, en-US), then restart the application. Display the resolved schedule and next run as read-only information without save controls or an enable switch. Ignore previously saved schedules and remove schedule writes from the configuration API and service.
