---
name: Template upgrade acceptance follows the versioned entry point
description: Verify old application behavior through the supported version-selected template upgrade, including source reconciliation and retained customizations.
type: feedback
modified: 2026-10-27
---

Accept template-delivered behavior for existing applications only after exercising the supported upgrade entry point from an identified old template version to a target version containing the change. Include dependency resolution, copied-source reconciliation, application-owned consumers, preserved customizations and data, and the final template baseline marker in that verification.

**Why:** The owner clarified that the feature must take effect after a template version upgrade. A manually patched source sample proves behavior but does not prove that the normal version upgrade delivers it.

**How to apply:** Keep source reconciliation inside the normal upgrade workflow. Discover the target release's upgrade guidance before declaring the upgrade complete; resolve conflicts without discarding business intent. Distinguish locally versioned candidate-package verification from verification of the published target. Do not treat a dependency update, a version-marker change, or a standalone patch as completion.
