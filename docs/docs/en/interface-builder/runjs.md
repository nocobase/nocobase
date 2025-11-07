# Online Write & Run JS

In NocoBase, **RunJS** provides a lightweight extension method suitable for scenarios of **quick experimentation and temporary logic processing**. Without creating plugins or modifying source code, you can personalize interfaces or interactions through JavaScript.

Through it, you can directly input JS code in the UI builder to achieve:

- Custom rendering content (fields, blocks, columns, items, etc.)  
- Custom interaction logic (button clicks, event linkage)  
- Dynamic behavior combined with contextual data  

## Supported Scenarios

### JS Block

Customize block rendering through JS, giving you complete control over the block's structure and styles.  
Suitable for displaying custom components, statistical charts, third-party content, and other highly flexible scenarios.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Documentation: [JS Block](/interface-builder/blocks/other-blocks/js-block)

### JS Action

Customize the click logic of action buttons through JS, allowing you to execute any frontend or API request operations.  
For example: dynamically calculate values, submit custom data, trigger pop-ups, etc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Documentation: [JS Action](/interface-builder/actions/types/js-action)

### JS Field

Customize field rendering logic through JS. You can dynamically display different styles, content, or states based on field values.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Documentation: [JS Field](/interface-builder/fields/specific/js-field)

### JS Item

Render independent items through JS without binding to specific fields. Commonly used for displaying custom information blocks.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Documentation: [JS Item](/interface-builder/fields/specific/js-item)

### JS Table Column

Customize table column rendering through JS.  
Can implement complex cell display logic, such as progress bars, status labels, etc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Documentation: [JS Table Column](/interface-builder/fields/specific/js-column)

### Linkage Rules

Control linkage logic between fields in forms or pages through JS.  
For example: when one field changes, dynamically modify another field's value or visibility.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Documentation: [Linkage Rules](/interface-builder/linkage-rule)

### Event Flow

Customize event flow trigger conditions and execution logic through JS to build more complex frontend interaction chains.

![](https://static-docs.nocobase.com/20251031092755.png)  

Documentation: [Event Flow](/interface-builder/event-flow)
