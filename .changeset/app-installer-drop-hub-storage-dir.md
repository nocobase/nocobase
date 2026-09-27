---
'@nocobase/app-installer': patch
---

A Hub installation no longer gets `HUB_STORAGE_DIR` in `app.env`: every Hub release from this one on reads `APP_STORAGE_DIR`. Installing an earlier Hub with `--template hub@<version>` is refused with `STORAGE_IN_RELEASE`.
