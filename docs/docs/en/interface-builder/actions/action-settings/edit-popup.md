# Edit Modal

## Introduction

Any action or field that opens a popup when clicked supports configuring the popup's open mode, size, etc.


![20251027212617](https://static-docs.nocobase.com/20251027212617.png)



![20251027212800](https://static-docs.nocobase.com/20251027212800.png)


## Open Mode

- Drawer


![20251027212832](https://static-docs.nocobase.com/20251027212832.png)


- Dialog


![20251027212905](https://static-docs.nocobase.com/20251027212905.png)


- Sub-page


![20251027212940](https://static-docs.nocobase.com/20251027212940.png)


## Modal Size

- Large
- Medium (default)
- Small

## Popup UID

“Popup UID” is the UID of the component that opens the popup; it also appears in the URL as the viewUid of `view/:viewUid`. You can obtain it from the triggering field or button via the settings menu action “Copy popup UID”. Setting the popup uid enables popup reuse.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Internal popup (default)
- "Popup uid" equals the current action button's UID (by default it uses this button's UID).

### External popup (reuse an existing popup)
- Enter another button's UID (the popup UID) in "Popup UID" to reuse that popup elsewhere.
- Typical use: share the same popup UI and logic across pages/blocks without duplicating configuration.
- When using an external popup, some options become read-only (see below).

## Other related options

- `Data source / Collection`: Read-only. Indicates the data source and collection the popup is bound to; by default it follows the current block’s collection. In external popup mode, it follows the target popup’s configuration and cannot be changed.
- `Association name`: Optional. Open the popup from an association field; shown only when a default value exists. In external popup mode, it follows the target popup’s configuration and cannot be changed.
- `Source ID`: Shown only when `Association name` is set; defaults to the current context’s `sourceId`; may be a variable or fixed value.
- `filterByTk`: Can be empty, a variable, or a fixed value to constrain which record(s) the popup loads.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)
