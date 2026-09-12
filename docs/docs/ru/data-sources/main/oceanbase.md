---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Основной источник данных — OceanBase"
description: "Информация о поддерживаемых версиях, установке плагина, использовании и сопоставлении полей при использовании OceanBase в качестве основной базы данных NocoBase."
keywords: "основной источник данных,OceanBase,основная база данных,сопоставление полей,NocoBase"
---

# OceanBase

## Введение

OceanBase можно использовать в качестве основной базы данных NocoBase для хранения данных системных таблиц NocoBase и бизнес-данных основного источника данных. Основная база данных настраивается при развертывании NocoBase и не может быть удалена после запуска приложения.

| Параметр | Описание |
| --- | --- |
| Поддерживаемая версия | >= 4.3. |
| Коммерческая версия | Поддерживается корпоративной версией. |
| Тип базы данных | Режим совместимости с MySQL. |

:::warning Внимание

При использовании OceanBase в качестве основной базы данных поддерживается только режим совместимости с MySQL.

:::

## Установка плагина

OceanBase предоставляется `@nocobase/plugin-data-source-oceanbase` и требует коммерческой лицензии.

## Инструкции по использованию

1. При развертывании NocoBase в конфигурации подключения к базе данных выберите или укажите соответствующие параметры подключения OceanBase.
2. После запуска NocoBase перейдите к источнику данных «Main» в разделе «Управление источниками данных», чтобы управлять таблицами и полями в основной базе данных.
3. Чтобы подключить уже существующие в базе данных таблицы, на странице управления основной базой данных можно использовать функцию «Синхронизация из базы данных».
4. При настройке полей таблицы данных можно обратиться к каталогам [таблицы данных](../data-modeling/collection.md) и [поля](../data-modeling/collection-fields/index.md), чтобы выбрать типы полей и компоненты полей.

## Сопоставление типов полей

При создании полей через страницу NocoBase в основной базе данных NocoBase создает соответствующие поля OceanBase на основе конфигурации поля. При подключении существующей таблицы с помощью функции «Синхронизация из базы данных» NocoBase распознает типы полей OceanBase по логике совместимости с MySQL и автоматически сопоставляет их с подходящими Field type и Field interface. Способ отображения в интерфейсе можно изменить в конфигурации поля.

Ниже приведены распространенные варианты сопоставления:

| Тип поля OceanBase | NocoBase Field type | Доступный Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Внимание

Неподдерживаемые типы полей OceanBase отображаются отдельно в конфигурации полей. Для использования таких полей в NocoBase в качестве обычных полей требуется разработка соответствующей адаптации.

:::

Дополнительные общие параметры см. в разделе [Введение в основные источники данных](./index.md).
