---
pkg: "@nocobase/plugin-action-import"
---
# Импорт

## Введение

Импортируйте данные с помощью Excel-шаблона. Вы можете настроить, какие поля будут импортированы, а шаблон будет сгенерирован автоматически.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Инструкции по импорту

### Поля числового типа

Поддерживаются числа и проценты. Текст вроде `N/A` или `-` будет отфильтрован.

| Number1 | Percentage | Number2 | Number3 |
| ------- | ---------- | ------- | ------- |
| 123     | 25%        | N/A     | -       |

После преобразования в JSON:

```ts
{
  "Number1": 123,
  "Percentage": 0.25,
  "Number2": null,
  "Number3": null
}
```

### Поля булевого типа

Поддерживается ввод в виде текста (английский, без учета регистра):

- `Yes`, `Y`, `True`, `1`
- `No`, `N`, `False`, `0`

| Field1 | Field2 | Field3 | Field4 | Field5 |
| ------ | ------ | ------ | ------ | ------ |
| No     | Yes    | Y      | true   | 0      |

После преобразования в JSON:

```ts
{
  "Field1": false,
  "Field2": true,
  "Field3": true,
  "Field4": true,
  "Field5": false
}
```

### Поля типа дата

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

После преобразования в JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z"
}
```

### Поля типа выбор

Значения опций и метки опций можно использовать как текст для импорта. Несколько опций разделяются запятыми (`,` `,`) или разделителями перечисления (`、`).

Например, опции поля `Priority` включают:

| Option Value | Option Label |
| ------------ | ------------ |
| low          | Low          |
| medium       | Medium       |
| high         | High         |

Значения опций и метки опций можно использовать как текст для импорта.

| Priority |
| -------- |
| High     |
| low      |

После преобразования в JSON:

```ts
[{ "Priority": "high" }, { "Priority": "low" }]
```

### Поля китайского административного деления

| Region1             | Region2             |
| ------------------- | ------------------- |
| 北京市/市辖区 | 天津市/市辖区 |

После преобразования в JSON:

```ts
{
  "Region1": ["11", "1101"],
  "Region2": ["12", "1201"]
}
```

### Поля вложений

| Attachment                               |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

После преобразования в JSON:

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

### Поля типа связь

Несколько записей данных разделяются запятыми (`,` `,`) или разделителями перечисления (`、`).

| Department/Name  | Category/Title       |
| ---------------- | -------------------- |
| Development Team | Category1, Category2 |

После преобразования в JSON:

```ts
{
  "Department": [1], // 1 — идентификатор записи департамента с названием "Development Team"
  "Category": [1, 2] // 1,2 — идентификаторы записей категорий с заголовками "Category1" и "Category2"
}
```

### Поля типа JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

После преобразования в JSON:

```ts
{
  "JSON": { "key": "value" }
}
```

### Поля геометрии на карте

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

После преобразования в JSON:

```ts
{
  "Point": [1, 2],
  "Line": [[1, 2], [3, 4]],
  "Polygon": [[1, 2], [3, 4], [1, 2]],
  "Circle": [1, 2, 3]
}
```

## Пользовательский формат импорта

Зарегистрируйте пользовательский `ValueParser` через метод `db.registerFieldValueParsers()`, например:

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

// При импорте поля с типом=point данные будут разбираться с помощью PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Импорт-пример

| Point |
| ----- |
| 1,2   |

После преобразования в JSON:

```ts
{
  "Point": [1, 2]
}
```

## Настройки действия

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- Настроить поля, доступные для импорта

- [Правила связывания](/interface-builder/actions/action-settings/linkage-rule): динамически показывать/скрывать кнопку;
- [Кнопка редактирования](/interface-builder/actions/action-settings/edit-button): редактировать заголовок, тип и значок кнопки;