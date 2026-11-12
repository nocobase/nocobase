---
'@nocobase/document-extractor': patch
---

Use the npm-published @e965/xlsx 0.20.3 distribution of SheetJS to fix prototype pollution and regular expression denial of service while preserving XLS, XLSM, XLSX and CSV extraction. Registry dependencies allow applications to install with pnpm's default subdependency protections.
