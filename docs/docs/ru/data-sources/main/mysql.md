---
pkg: "@nocobase/plugin-data-source-manager"
title: "Основной источник данных — MySQL"
description: "Узнайте о поддерживаемых версиях MySQL в качестве основной базы данных NocoBase, способах установки плагина, инструкциях по использованию и сопоставлении полей."
keywords: "основной источник данных,MySQL,основная база данных,сопоставление полей,NocoBase"
---

# MySQL

## Введение

MySQL можно использовать в качестве основной базы данных NocoBase для хранения данных системных таблиц NocoBase и бизнес-данных основного источника данных. Основная база данных настраивается при развёртывании NocoBase и не может быть удалена после запуска приложения.

| Параметр конфигурации | Описание |
| --- | --- |
| Поддерживаемая версия | >= 8.0.17. |
| Коммерческие версии | Поддерживаются Community Edition, Standard Edition, Professional Edition и Enterprise Edition. |
| Тип базы данных | MySQL. |

MySQL подходит в качестве основной базы данных для обычных бизнес-систем.

## Установка плагина

MySQL является встроенной возможностью, поэтому отдельная установка плагина не требуется.

## Инструкции по использованию

1. При развёртывании NocoBase выберите или укажите соответствующие параметры подключения MySQL в конфигурации подключения к базе данных.
2. После запуска NocoBase откройте источник данных «Main» в разделе «Управление источниками данных», чтобы управлять таблицами и полями основной базы данных.
3. Если требуется подключить уже существующие в базе данных таблицы, на странице управления основной базой данных можно использовать функцию «Синхронизация из базы данных».
4. При настройке полей таблицы данных можно обратиться к каталогам [Таблицы данных](../data-modeling/collection.md) и [Поля](../data-modeling/collection-fields/index.md), чтобы выбрать тип поля и компонент поля.

## Сопоставление типов полей

При создании полей через страницу NocoBase в основной базе данных NocoBase создаёт соответствующие поля MySQL на основе конфигурации поля. При подключении существующих таблиц с помощью функции «Синхронизация из базы данных» NocoBase автоматически сопоставляет типы полей MySQL с подходящими типом поля и интерфейсом поля. Способ отображения в интерфейсе можно изменить в настройках поля.

Основные варианты сопоставления:

| Тип поля MySQL | Тип поля NocoBase | Доступные интерфейсы поля |
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

Неподдерживаемые типы полей MySQL отображаются отдельно в настройках полей. Для использования таких полей в NocoBase в качестве обычных полей требуется разработать адаптер.

:::

Дополнительные общие настройки см. в разделе [Обзор основного источника данных](./index.md).
