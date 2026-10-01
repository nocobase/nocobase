---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

The Compact preset left two controls out of proportion because their geometry is fixed in pixels while the box around it follows `--spacing`: a Switch thumb smaller than its track, and a donut chart whose ring grew visibly thinner. `compact.css` now derives the Switch track from the spacing token and renders a pie chart's subtree at the spacious density, so both look right in the preset that applications default to, without touching the shadcn primitives an application adds.
