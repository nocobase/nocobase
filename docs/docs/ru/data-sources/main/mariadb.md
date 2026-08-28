---
pkg: "@nocobase/plugin-data-source-manager"
title: "Основной источник данных — MariaDB"
description: "Узнайте о поддерживаемых версиях MariaDB в качестве основной базы данных NocoBase, способах установки плагина, инструкциях по использованию и сопоставлении полей."
keywords: "основной источник данных,MariaDB,основная база данных,сопоставление полей,NocoBase"
---

# MariaDB

## Введение

MariaDB можно использовать в качестве основной базы данных NocoBase для хранения данных системных таблиц NocoBase и бизнес-данных в основном источнике данных. Основная база данных настраивается при развертывании NocoBase и не может быть удалена после запуска приложения.

| Параметр конфигурации | Описание |
| --- | --- |
| Поддерживаемые версии | >= 10.9. |
| Коммерческие версии | Поддерживаются редакции Community, Standard, Professional и Enterprise. |
| Тип базы данных | MariaDB. |

MariaDB похожа на MySQL и подходит для использования в качестве основной базы данных обычных бизнес-систем.

## Установка плагина

MariaDB является встроенной возможностью, поэтому устанавливать плагин отдельно не требуется.

## Инструкции по использованию

1. При развертывании NocoBase в конфигурации подключения к базе данных выберите или укажите соответствующие параметры подключения MariaDB.
2. После запуска NocoBase перейдите к источнику данных «Main» в разделе «Управление источниками данных», где можно управлять таблицами и полями в основной базе данных.
3. Если необходимо подключить уже существующие в базе данных таблицы, на странице управления основной базой данных можно использовать функцию «Синхронизировать из базы данных».
4. При настройке полей таблицы данных можно обратиться к каталогам [таблиц данных](../data-modeling/collection.md) и [полей](../data-modeling/collection-fields/index.md), чтобы выбрать типы полей и компоненты полей.

## Сопоставление типов полей

При создании поля через страницу NocoBase в основной базе данных NocoBase создает соответствующее поле MariaDB на основе конфигурации поля. При подключении существующей таблицы с помощью функции «Синхронизировать из базы данных» NocoBase автоматически сопоставляет тип поля MariaDB с подходящими Field type и Field interface. Распространенные сопоставления полей MariaDB в основном совпадают с MySQL; способ отображения в интерфейсе можно изменить в настройках поля.

Основные сопоставления:

| Тип поля MariaDB | NocoBase Field type | Доступные Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Внимание

Неподдерживаемые типы полей MariaDB будут отдельно отображаться в настройках полей. Для использования таких полей в NocoBase в качестве обычных полей требуется разработать соответствующую адаптацию.

:::

Дополнительные общие настройки см. в разделе [Введение в основной источник данных](./index.md).
