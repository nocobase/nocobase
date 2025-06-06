# Toggle Form Fields

This plugin adds a button to toggle the visibility of form fields. It helps users simplify form interfaces by showing only the most important fields while keeping the ability to view all fields when needed.

## Features

- Adds a toggle button to show or hide form fields
- Configurable number of top fields to always show
- Fully compatible with NocoBase form configurations
- Multi-language support (English and Chinese)

## Usage

### Adding the toggle button to a form

1. Edit a form in NocoBase
2. Click the "+" button in the form actions area
3. Select "Toggle Form Fields" from the dropdown menu
4. Configure the button properties (optional)

### Configuration options

Click the settings icon of the toggle button to configure:

- **Top fields to show**: Set the number of fields to always show at the top, the remaining fields will be toggled

## How it works

The plugin adds an action button to the form that when clicked:

1. Always keeps the configured number of top fields visible
2. Toggles the visibility of the remaining fields

## License

AGPL-3.0

```
plugin-action-expand-collapse/
├── src/
│   ├── client/         # 客户端代码
│   │   ├── index.tsx   # 客户端入口和主要逻辑
│   │   └── locale.ts   # 国际化工具函数
│   ├── locale/         # 多语言配置
│   │   ├── en-US.json  # 英文翻译
│   │   └── zh-CN.json  # 中文翻译
│   ├── server/         # 服务端代码
│   │   ├── index.ts    # 服务端导出
│   │   └── plugin.ts   # 服务端插件类
│   └── index.ts        # 主入口文件
└── package.json
```

### 构建和测试

```bash
# 安装依赖
yarn install

# 构建插件
yarn build

# 开发模式
yarn dev
```
