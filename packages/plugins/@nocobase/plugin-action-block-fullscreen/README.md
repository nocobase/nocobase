# Block Fullscreen Action

[![NPM version](https://img.shields.io/npm/v/@nocobase/plugin-action-block-fullscreen.svg?style=flat-square)](https://www.npmjs.com/package/@nocobase/plugin-action-block-fullscreen)
[![License](https://img.shields.io/badge/license-AGPL-blue.svg?style=flat-square)](https://www.nocobase.com/agreement)

This plugin for NocoBase provides a fullscreen toggle action that can be added to blocks in your application. The action allows users to expand any block to fullscreen mode for better viewing and interaction, and easily return to normal view with a single click.

## Features

- 🖥️ **Fullscreen Toggle**: Expand blocks to fullscreen for better viewing and return to normal view with a single click
- 🧩 **Compatible with Multiple Blocks**: Works with table blocks, gantt chart blocks, and other block types
- 🔧 **Easy Configuration**: Simple to add to any block through the block configuration menu
- 🌐 **Internationalization**: Fully supports English and Chinese languages
- 🖱️ **Intuitive UI**: Uses standard fullscreen icons for familiarity (FullscreenOutlined and FullscreenExitOutlined)

## Installation

```bash
# Via yarn
yarn add @nocobase/plugin-action-block-fullscreen
```

Or you can install it through the NocoBase Plugin Manager interface.

## Usage

1. Navigate to a block in your NocoBase application
2. Enter the block's configuration mode by clicking on the settings icon
3. Select "Configure actions"
4. Click "Add action" and choose "Support Fullscreen" from the actions list
5. Save your configuration

Now the block will display a fullscreen toggle button in its action bar.

## How It Works

The plugin uses a non-intrusive approach to fullscreen functionality:

- When activated, it applies a fixed position with full viewport dimensions to the target block
- Sibling elements are temporarily hidden to create a clean fullscreen experience
- The original state of the DOM is preserved for restoration when exiting fullscreen
- No iframe or browser fullscreen API is used, making it compatible across different environments

## Compatibility

This plugin is compatible with NocoBase v1.0 and above.

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
For more information, please refer to: https://www.nocobase.com/agreement

## Links

- [NocoBase Website](https://www.nocobase.com/)
- [Documentation](https://docs.nocobase.com/handbook/action-fullscreen)
- [GitHub Repository](https://github.com/nocobase/nocobase/tree/main/packages/plugins/@nocobase/plugin-action-block-fullscreen)