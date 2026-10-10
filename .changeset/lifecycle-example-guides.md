---
'@nocobase/app-plugin-lifecycle-example': minor
---

Every page of `@nocobase/app-plugin-lifecycle-example` now opens with an **About this example** card that says what the page demonstrates and how to try it, step by step, in English and Chinese; it can be folded away, and the browser remembers that. The plugin also registers sample records on `sampleDataToken`, built when the application is installed with `APP_SAMPLE_DATA=true` or later with `pnpm nocobase db sample`: tickets and expense reports at different points of their lifecycles, and orders, exports, flash-sale purchases and a shipment ready to be played. They are created and moved on through the lifecycle runtime, so their transition logs and effect runs are real.
