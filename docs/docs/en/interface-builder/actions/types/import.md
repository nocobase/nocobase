---
pkg: "@nocobase/plugin-action-import"
---
# Import

## Introduction

Import data using an Excel template. You can configure which fields to import, and the template will be generated automatically.


![20251029165818](https://static-docs.nocobase.com/20251029165818.png)


## Import Instructions

### Number Type Fields

Supports numbers and percentages. Text like `N/A` or `-` will be filtered out.

| Number1 | Percentage | Number2 | Number3 |
| ------- | ---------- | ------- | ------- |
| 123     | 25%        | N/A     | -       |

After converting to JSON:

```ts
{
  "Number1": 123,
  "Percentage": 0.25,
  "Number2": null,
  "Number3": null
}
```

### Boolean Type Fields

Supported input text (English is case-insensitive):

- `Yes`, `Y`, `True`, `1`
- `No`, `N`, `False`, `0`

| Field1 | Field2 | Field3 | Field4 | Field5 |
| ------ | ------ | ------ | ------ | ------ |
| No     | Yes    | Y      | true   | 0      |

After converting to JSON:

```ts
{
  "Field1": false,
  "Field2": true,
  "Field3": true,
  "Field4": true,
  "Field5": false
}
```

### Date Type Fields

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

After converting to JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z"
}
```

### Select Type Fields

Both option values and option labels can be used as import text. Multiple options are separated by commas (`,` `,`) or enumeration commas (`、`).

For example, the options for the `Priority` field include:

| Option Value | Option Label |
| ------------ | ------------ |
| low          | Low          |
| medium       | Medium       |
| high         | High         |

Both option values and option labels can be used as import text.

| Priority |
| -------- |
| High     |
| low      |

After converting to JSON:

```ts
[{ "Priority": "high" }, { "Priority": "low" }]
```

### China Administrative Division Fields

| Region1             | Region2             |
| ------------------- | ------------------- |
| 北京市/市辖区 | 天津市/市辖区 |

After converting to JSON:

```ts
{
  "Region1": ["11", "1101"],
  "Region2": ["12", "1201"]
}
```

### Attachment Fields

| Attachment                               |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

After converting to JSON:

```ts
{
  "Attachment": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Relationship Type Fields

Multiple data entries are separated by commas (`,` `,`) or enumeration commas (`、`).

| Department/Name  | Category/Title       |
| ---------------- | -------------------- |
| Development Team | Category1, Category2 |

After converting to JSON:

```ts
{
  "Department": [1], // 1 is the record ID for the department named "Development Team"
  "Category": [1, 2] // 1,2 are the record IDs for categories titled "Category1" and "Category2"
}
```

### JSON Type Fields

| JSON1           |
| --------------- |
| {"key":"value"} |

After converting to JSON:

```ts
{
  "JSON": { "key": "value" }
}
```

### Map Geometry Types

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

After converting to JSON:

```ts
{
  "Point": [1, 2],
  "Line": [[1, 2], [3, 4]],
  "Polygon": [[1, 2], [3, 4], [1, 2]],
  "Circle": [1, 2, 3]
}
```

## Custom Import Format

Register a custom `ValueParser` via the `db.registerFieldValueParsers()` method, for example:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// When importing a field of type=point, the data will be parsed by PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Import Example

| Point |
| ----- |
| 1,2   |

After converting to JSON:

```ts
{
  "Point": [1, 2]
}
```

## Action Settings


![20251029170959](https://static-docs.nocobase.com/20251029170959.png)


- Configure importable fields


![20251029171036](https://static-docs.nocobase.com/20251029171036.png)


- [Linkage Rules](/interface-builder/actions/action-settings/linkage-rule): Dynamically show/hide the button;
- [Edit Button](/interface-builder/actions/action-settings/edit-button): Edit the button's title, type, and icon;