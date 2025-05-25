# Block Fullscreen Action Plugin

[![NPM version](https://img.shields.io/npm/v/@nocobase/plugin-action-block-fullscreen.svg?style=flat-square)](https://www.npmjs.com/package/@nocobase/plugin-action-block-fullscreen)
[![License](https://img.shields.io/badge/license-AGPL-blue.svg?style=flat-square)](https://www.nocobase.com/agreement)

A NocoBase plugin that adds fullscreen toggle functionality to blocks, allowing users to expand blocks to fullscreen mode for better viewing and interaction.

## Features

- 🖥️ **Smart Fullscreen Toggle**
  - One-click fullscreen mode
  - Preserves original layout and styles
  - Smooth transition between normal and fullscreen views

- 🎯 **Precise Element Control**
  - Configurable target element selection
  - Customizable block and target class names
  - Smart sibling element handling

- 🎨 **Flexible Styling**
  - Custom fullscreen styles support
  - Dynamic style injection
  - Clean style restoration

- 🌐 **Internationalization**
  - Built-in English and Chinese support
  - Easy to extend to other languages
  - Consistent UI text across languages

- 🧩 **Block Compatibility**
  - Works with table blocks
  - Supports gantt chart blocks
  - Extensible to other block types

## Installation

```bash
# Using yarn
yarn add @nocobase/plugin-action-block-fullscreen

# Using npm
npm install @nocobase/plugin-action-block-fullscreen
```

## Configuration

### Basic Usage

1. Navigate to your block in NocoBase
2. Click the settings icon to enter configuration mode
3. Select "Configure actions"
4. Add "Support Fullscreen" action
5. Save your configuration

### Advanced Configuration

The plugin supports the following configuration options:

```typescript
interface FullscreenActionConfig {
  custom?: {
    // Class name for the block element
    blockStyleClass?: string;
    // Class name for the target element to be fullscreened
    targetStyleClass?: string;
    // Custom CSS styles for fullscreen mode
    fullscreenStyle?: string;
  }
}
```

Default values:
- `blockStyleClass`: 'nb-block-item'
- `targetStyleClass`: 'ant-card'

### Custom Styles

You can provide custom styles for fullscreen mode using the `fullscreenStyle` option. The styles can use the following variables:
- `${targetId}`: ID of the target element
- `${blockId}`: ID of the block element

Example:
```css
#${targetId} {
  background: #f5f5f5;
  padding: 20px;
}
```

## Technical Details

### Architecture

The plugin consists of several key components:

- `FullscreenAction`: Main action component
- `FullscreenActionInitializer`: Action initializer for block configuration
- `FullscreenDesigner`: Design-time component for action configuration
- `FullscreenPluginProvider`: Plugin provider for global state and context

### State Management

- Uses React context for global state
- Maintains element states in memory
- Preserves original DOM structure
- Handles style injection and cleanup

### Style Handling

- Dynamic style injection
- Scoped style application
- Clean style restoration
- Sibling element management

## Development

### Project Structure

```
src/
├── client/
│   ├── FullscreenAction.tsx
│   ├── FullscreenActionInitializer.tsx
│   ├── FullscreenDesigner.tsx
│   ├── FullscreenPluginProvider.tsx
│   ├── constants.ts
│   ├── context.ts
│   ├── locale/
│   └── schemaSettings.tsx
├── server/
└── index.ts
```

### Building

```bash
# Install dependencies
yarn install

# Build the plugin
yarn build
```

## Compatibility

- NocoBase v1.0 and above
- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 18+

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
For more information, please refer to: https://www.nocobase.com/agreement

## Links

- [NocoBase Website](https://www.nocobase.com/)
- [Documentation](https://docs.nocobase.com/handbook/action-fullscreen)
- [GitHub Repository](https://github.com/nocobase/nocobase/tree/main/packages/plugins/@nocobase/plugin-action-block-fullscreen)
- [Issue Tracker](https://github.com/nocobase/nocobase/issues)