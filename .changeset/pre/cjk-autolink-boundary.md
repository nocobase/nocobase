---
'@nocobase/app-plugin-projects': patch
'@nocobase/app-skills': patch
---

End a bare URL in issue descriptions and comments at the first CJK character or full-width punctuation mark, so `PR：https://example.com/pull/8（分支 x）` links `https://example.com/pull/8` instead of `https://example.com/pull/8（分支`. The UI Library catalog in the application Skill lists the `remark-cjk-autolink.ts` file the `markdown-view` item now installs.
