---
"@nocobase/concurrency": patch
---

Restore ordinary lock and executor acquisition without an overall waiting deadline, reserve timeouts for try methods, and require the initial backend protocol v1 with explicit unbounded waits.
