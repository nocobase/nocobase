---
name: Applications own comment message semantics
description: The owner rejected application-specific message variants in Projects; keep its display envelope generic so host applications can add messages without a framework change.
type: feedback
modified: 2026-10-28
---

Projects validates and projects a generic comment display envelope. The host application defines its message names, validates their specific parameters before writing, and translates known types with a fallback for unknown ones.

**Why:** The owner rejected a discriminated union containing one host application's message variants in this shared plugin. That design would require a framework release for every new application message.

**How to apply:** Keep the framework's type namespace and size limits, primitive parameter bounds, server-only write boundary and provenance isolation. Do not add host-specific message variants, translations or dispatch semantics to Projects.
