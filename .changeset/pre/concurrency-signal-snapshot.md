---
"@nocobase/concurrency": patch
---

Capture each acquisition call’s cancellation signal once so later options changes cannot misclassify cancellation or leak abort listeners.
