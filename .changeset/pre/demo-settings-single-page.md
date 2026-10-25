---
"@nocobase/app-plugin-demo-mode": patch
---

Show the demo administration page as a single page instead of two tabs: the demo data, daily reset and demo accounts cards now appear together. The `TabsList` and `TabsTrigger` component slots and the `activeTabLabel` header prop are removed, and a `?tab=` query parameter is ignored.
