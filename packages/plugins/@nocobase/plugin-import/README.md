# import

English | [中文](./README.zh-CN.md)

Excel 数据导入插件。

## 安装激活

内置插件无需手动安装激活。

## 导入说明

### 数字类型字段

支持数字和百分比，`N/A` 或 `-` 的文案会被过滤掉

| 数字1 | 百分比 | 数字2 | 数字3 |
| -- | -- | -- | -- | 
| 123 | 25% | N/A | - |

转 JSON 之后为

```ts
{
  "数字1": 123,
  "百分比": 0.25,
  "数字2": null,
  "数字3": null,
}
```

### 布尔类型字段

输入文案支持（英文不区分大小写）：

- `Yes` `Y` `True` `1` `是` 
- `No` `N`  `False` `0` `否` 

| 字段1 | 字段2 | 字段3 | 字段4 | 字段4 |
| -- | -- |  -- |  -- |  -- | 
| 否 | 是 | Y | true | 0 |

转 JSON 之后为

```ts
{
  "字段1": false,
  "字段2": true,
  "字段3": true,
  "字段4": true,
  "字段5": false,
}
```

### 日期类型字段

| DateOnly | Local(+08:00) | GMT |
| -- | -- |  -- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22  | 2023-01-18 22:22:22 |

转 JSON 之后为

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### 选择类型字段

选项值和选项标签都可作为导入文案，多个选项之间以以逗号（`,` `，`）或顿号（`、`）区分

如字段 `优先级` 的可选项包括：

| 选项值 | 选项标签 |
| -- | -- |
| low | 低 |
| medium | 中 |
| high | 低 |

选项值和选项标签都可作为导入文案

| 优先级 |
| -- |
| 高 |
| low |

转 JSON 之后为

```ts
[
  { "优先级": "high" },
  { "优先级": "low" },
]
```

### 中国行政区字段

| 地区1 | 地区2 |
| -- | -- |
| 北京市/市辖区 | 天津市/市辖区 |

转 JSON 之后为

```ts
{
  "地区1": ["11","1101"],
  "地区2": ["12","1201"]
}
```

### 附件字段

| 附件 | 
| --|
| https://www.nocobase.com/images/logo.png |

转 JSON 之后为

```ts
{
  "附件": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### 关系类型字段

多条数据以逗号（`,` `，`）或顿号（`、`）区分

| 部门/名称 | 分类/标题 |
| -- | -- |
| 开发组 | 分类1、分类2 |

转 JSON 之后为

```ts
{
  "部门": [1], // 1 为部门名称为「开发组」的记录 ID
  "分类": [1,2], // 1,2 为分类标题为「分类1」和「分类2」的记录 ID
}
```

### JSON 类型字段

| JSON1 |
| -- |
| {"key":"value"} |

转 JSON 之后为

```ts
{
  "JSON": {"key":"value"}
}
```

### 地图几何图形类型

| Point | Line | Polygon | Circle |
| -- | -- | -- | -- |
| 1,2 | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3 | 

转 JSON 之后为

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## 自定义导入格式

通过 `db.registerFieldValueParsers()` 方法注册自定义的 `ValueParser`，如：

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

// type=point 的字段导入时，将通过 PointValueParser 解析数据
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

导入示例

| Point | 
| --|
| 1,2 |

转 JSON 之后为

```ts
{
  "Point": [1,2]
}
```
