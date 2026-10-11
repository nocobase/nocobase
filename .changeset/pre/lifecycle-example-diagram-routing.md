---
"@nocobase/app-plugin-lifecycle-example": patch
---
Improve lifecycle diagram readability with neutral styling and focused current-state highlights and optimized port ordering that reduces edge crossings while preserving every transition. Place transition labels directly on their routed edges with opaque backgrounds to keep their associations clear. Use solid lines for every transition and retain the gear icon to identify automatic transitions.

Show the current state, visited states, and exact traversed edges with restrained execution highlighting derived from the record transition log.

Display a separate end marker for each explicitly final state, inheriting execution highlighting without merging terminal branches.

Use the application primary theme color for execution highlights and the diagram legend.

Align fractional self-loop bends with their ports to preserve orthogonal routing.
