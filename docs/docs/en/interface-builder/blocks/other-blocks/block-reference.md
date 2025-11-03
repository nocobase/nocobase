---
pkg: "@nocobase/plugin-block-reference"
---

# Reference Block

## Introduction
The Reference block displays an existing block on the current page by specifying the target block's UID. No need to reconfigure the target block.

## Activate the plugin
This plugin is built‑in but disabled by default.
Open "Plugin manager" → find "Block: Reference" → click "Enable".

![Enable Reference block in Plugin Manager](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Add the block
1) Add a block → Other blocks → select "Reference block".  
2) In Reference settings, configure:
   - `Block UID`: the UID of the target block
   - `Reference mode`: choose `Reference` or `Copy`

![Reference block add and configure demo](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### How to get Block UID
- Open the target block’s settings menu and click `Copy UID` to copy its UID.

![Copy UID from block settings](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modes and behavior
- `Reference` (default)
  - Shares the same configuration as the original block; edits to the original or from any referenced place will update all references.

- `Copy`
  - Creates an independent block identical to the original at that moment; later changes do not sync between them.

## Configuration
- Reference block:
  - "Reference settings": set the target block UID and choose Reference/Copy mode;
  - You will also see the full settings of the referenced block itself (equivalent to configuring the original block directly).

![Reference block settings](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Copy result:
  - The new block has the same type as the original and only its own settings;
  - It does not include "Reference settings".

## Error and fallback states
- Invalid or missing target: shows an error state. Reconfigure in the Reference block settings (Reference settings → Block UID) and save to recover.  

![Error state when target block is invalid](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Notes and limitations
- Experimental feature — use with caution in production.
- When copying, some configurations that depend on the target UID may need to be reconfigured.
- All configurations of a referenced block are synchronized automatically, including data scope. However, a referenced block can have its own [event flow configuration](/interface-builder/event-flow/). With event flows and custom JavaScript actions, you can indirectly achieve different data scope or related configurations per reference.

