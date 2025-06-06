# NocoBase Field Content Formatter Plugin

A NocoBase plugin that provides field content formatting capabilities, supporting custom JavaScript functions to format field content and render as HTML in read-only mode.

## ✨ Features

- **🎨 HTML Rendering Support** - Supports rendering formatted results as HTML content
- **📝 Custom Formatters** - Use JavaScript functions to customize formatting logic
- **🔒 Read-Only Mode Only** - Designed specifically for read-only (display) mode to ensure data security
- **🌐 Multi-Component Support** - Supports Input, InputNumber and other field types
- **🎯 Precise Control** - Only shows configuration options in read-only fields

## 📦 Installation

This plugin is already integrated into your NocoBase installation, no additional installation required.

## 🚀 Usage

### 1. Enable Plugin
Enable the "Field Content Formatter" plugin in the NocoBase admin panel.

### 2. Configure Formatter
1. Enter page design mode
2. Select a **read-only field** (such as table columns, detail page fields, etc.)
3. Click the field settings button (gear icon)
4. Find the "Field content formatter" option
5. In the configuration popup:
   - Enter JavaScript formatting function
   - Save configuration

### 3. View Results
After configuration, the field will automatically apply formatting effects in read-only mode.

## 📝 Formatter Syntax

A formatter is a JavaScript function that receives a field value and returns a formatted result:

```javascript
(value) => {
  // Formatting logic
  return formattedResult;
}
```

### Basic Examples

**Bold Text:**
```javascript
(value) => `<strong>${value}</strong>`
```

**Add Color:**
```javascript
(value) => `<span style="color: red;">${value}</span>`
```

**Conditional Formatting:**
```javascript
(value) => {
  if (value > 100) {
    return `<span style="color: green; font-weight: bold;">${value}</span>`;
  } else {
    return `<span style="color: orange;">${value}</span>`;
  }
}
```

**Number Formatting:**
```javascript
(value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `<span style="font-family: monospace;">$${num.toLocaleString()}</span>`;
}
```

**Status Tags:**
```javascript
(value) => {
  const colors = {
    'pending': 'orange',
    'in-progress': 'blue', 
    'completed': 'green',
    'cancelled': 'red'
  };
  const color = colors[value] || 'gray';
  return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${value}</span>`;
}
```

## 🎯 Supported Field Types

- **Input** - Single-line text input
- **InputNumber** - Number input

## ⚠️ Important Notes

### Security
- Formatters only execute in read-only mode, won't affect data editing
- Uses `dangerouslySetInnerHTML` to render HTML, ensure content security
- Avoid executing dangerous operations in formatters

### Performance
- Formatters execute on every render, avoid complex calculations
- Consider performance impact for large datasets

### Compatibility
- Supports modern browser JavaScript ES6+ syntax
- HTML content renders directly, ensure correct tags

## 🔧 Technical Implementation

- **HOC Pattern** - Uses Higher-Order Components to extend original field components
- **Schema Integration** - Deep integration with NocoBase's Schema system
- **React Rendering** - Uses `dangerouslySetInnerHTML` for safe HTML rendering
- **Formily Compatible** - Fully compatible with Formily form system

## 📚 FAQ

**Q: Why can it only be used in read-only mode?**
A: This ensures data security and prevents formatting from affecting data editing and storage.

**Q: What if the formatter doesn't work?**
A: Please check: 1) Is the field in read-only mode; 2) Is the JavaScript syntax correct; 3) Use testing functionality to debug.

**Q: Can I access values from other fields?**
A: Current version only accesses the current field's value. For accessing other fields, consider handling at the data layer.

**Q: Does it support async operations?**
A: Currently doesn't support async operations. Formatters should be synchronous functions.

## 🔄 Changelog

### v1.0.0
- ✨ Initial release
- 🎨 HTML formatting and rendering support
- 🔒 Read-only mode security restrictions
- 🌐 Multiple field type support

## What is NocoBase

NocoBase is a scalability-first, open-source no-code development platform.  
Instead of investing years of time and millions of dollars in research and development, deploy NocoBase in a few minutes and you'll have a private, controllable, and extremely scalable no-code development platform!

Homepage: https://www.nocobase.com/  
Online Demo: https://demo.nocobase.com/new  
Documents: https://docs.nocobase.com/  
Commercial license & plugins: https://www.nocobase.com/en/commercial  
License agreement: https://www.nocobase.com/en/agreement  

Contact Us: hello@nocobase.com