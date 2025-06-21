# Cloud Component Block Plugin

A NocoBase plugin that enables creating cloud component blocks that can load external JavaScript libraries and CSS files, then render components using custom adapter code.

## Features

- **Dynamic Library Loading**: Load external JavaScript libraries via CDN using app.requirejs
- **CSS Support**: Load external CSS files for styling
- **Custom Adapter Code**: Write custom JavaScript code to render components using the loaded libraries
- **Flow Page Integration**: Automatically appears in the "Add Block" dropdown in flow pages

## Configuration

Each cloud component block has three main configurations:

1. **JS CDN URL**: The URL to the JavaScript library (e.g., `https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js`)
2. **CSS URL** (Optional): The URL to the CSS file for styling
3. **Adapter Code**: Custom JavaScript code that uses the loaded library to render components

## Example Usage

### ECharts Example

**JS CDN URL**: `https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js`
**Library Name**: `echarts`
**Adapter Code**:
```javascript
// Available variables:
// - element: The DOM element to render into
// - echarts: The loaded ECharts library
// - ctx: Flow context
// - model: Current model instance

const chart = echarts.init(element);
const option = {
  title: { text: 'Cloud Component Demo' },
  tooltip: {},
  xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
  yAxis: {},
  series: [{
    name: 'Demo',
    type: 'bar',
    data: [5, 20, 36, 10, 10]
  }]
};
chart.setOption(option);
```

## Installation

1. Place the plugin in `packages/plugins/@nocobase/plugin-block-cloud/`
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Enable the plugin in NocoBase admin panel

## Development

The plugin follows the standard NocoBase plugin structure:

- `src/server/`: Server-side plugin code
- `src/client/`: Client-side plugin code
- `src/client/CloudBlockFlowModel.tsx`: Main flow model implementation

## Architecture

The plugin extends the `BlockFlowModel` class and implements a default flow with two steps:

1. **loadLibrary**: Configures requirejs and loads the external JavaScript/CSS
2. **setupComponent**: Executes the adapter code to render the component

The plugin automatically registers with the flow engine and appears in the flow page's "Add Block" dropdown.
