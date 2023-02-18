# import

[English](./README.md) | 中文

Excel 数据导入插件。

## 安装激活

内置插件无需手动安装激活。

## 导入文案说明

### 数字类型字段

支持数字和百分比

| 数字 | 百分比 |
| -- | -- | 
| 123 | 25% |

### 勾选类型字段

输入文案支持：

- `是` `Yes` `Y` `True`
- `否` `No` `N`  `False`

| 已激活 | 已安装 |
| -- | -- | 
| 否 | 是 |

注：英文不区分大小写

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

### 中国行政区字段

| 中国行政区 | 
| --|
| 北京市/市辖区 |

### 附件字段

| 附件 | 
| --|
| https://www.nocobase.com/images/logo.png |

### 关系类型字段

多条数据以逗号（`,` `，`）或顿号（`、`）区分

| 部门/名称 | 分类/标题 |
| -- | -- |
| 开发组 | 分类1、分类2 |

### JSON 类型字段

| JSON | 
| --|
| {"key":"value"} |

### 地图几何图形类型

| Point | Line | Polygon | Circle |
| -- | -- | -- | -- |
| 116.349323,39.918024 | (122.086182,37.519631),(122.122574,37.521128),(122.130642,37.504653),(122.113476,37.503155),(122.113476,37.503155),(122.110558,37.49689) | (122.112649,37.507229),(122.120202,37.492521),(122.094968,37.484893),(122.086557,37.501918),(122.098058,37.511995) | 122.018,37.476977,3769.584 | 

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
