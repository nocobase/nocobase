---
pkg: "@nocobase/plugin-data-source-manager"
title: "Основной источник данных — PostgreSQL"
description: "Узнайте о поддерживаемых версиях PostgreSQL в качестве основной базы данных NocoBase, способах установки плагина, инструкции по использованию и сопоставлении полей."
keywords: "основной источник данных,PostgreSQL,основная база данных,сопоставление полей,NocoBase"
---

# PostgreSQL

## Введение

PostgreSQL можно использовать в качестве основной базы данных NocoBase для хранения данных системных таблиц NocoBase и бизнес-данных основного источника данных. Основная база данных настраивается при развёртывании NocoBase и не может быть удалена после запуска приложения.

| Параметр конфигурации | Описание |
| --- | --- |
| Поддерживаемые версии | >= 10. |
| Коммерческие версии | Поддерживаются Community Edition, Standard Edition, Professional Edition и Enterprise Edition. |
| Тип базы данных | PostgreSQL. |

PostgreSQL поддерживает наследование таблиц и подходит для сценариев, требующих наследования моделей данных.

## Установка плагина

PostgreSQL — встроенная возможность, поэтому устанавливать отдельный плагин не требуется.

## Инструкция по использованию

1. При развёртывании NocoBase выберите или укажите соответствующие параметры подключения PostgreSQL в конфигурации подключения к базе данных.
2. После запуска NocoBase перейдите к источнику данных «Main» в разделе «Управление источниками данных», где можно управлять таблицами и полями основной базы данных.
3. Чтобы подключить уже существующие в базе данных таблицы, на странице управления основной базой данных используйте функцию «Синхронизация из базы данных».
4. При настройке полей таблицы данных можно обратиться к разделам [таблицы данных](../data-modeling/collection.md) и [поля](../data-modeling/collection-fields/index.md), чтобы выбрать типы полей и компоненты полей.

## Сопоставление типов полей

При создании полей через страницу NocoBase в основной базе данных NocoBase создаёт соответствующие поля PostgreSQL на основе конфигурации поля. При подключении существующих таблиц с помощью функции «Синхронизация из базы данных» NocoBase автоматически сопоставляет типы полей PostgreSQL с подходящими Field type и Field interface. Способ отображения в интерфейсе можно изменить в настройках поля.

Основные варианты сопоставления:

| Тип поля PostgreSQL | NocoBase Field type | Доступные Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Внимание

Неподдерживаемые типы полей PostgreSQL будут отдельно отображаться в настройках полей. Для использования таких полей в NocoBase в качестве обычных полей требуется разработать адаптацию.

:::

Дополнительные общие настройки см. в разделе [Введение в основные источники данных](./index.md).
