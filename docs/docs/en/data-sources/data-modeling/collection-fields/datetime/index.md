---
title: "Overview"
description: "Date and time field types: with and without time zone, date, time, and Unix timestamp, including NocoBase, MySQL, and PostgreSQL type mappings."
keywords: "date and time,DateTime,time field,with time zone,without time zone,Unix timestamp,NocoBase"
---

# Overview

## Date and time field types

Date and time field types include:

- **DateTime (with time zone)** - Date-time values are normalized to Coordinated Universal Time (UTC) and converted between time zones when needed
- **DateTime (without time zone)** - Stores a date and time without time-zone information
- **Date (without time)** - Stores only the date, without a time component
- **Time** - Stores only the time, without a date component
- **Unix timestamp** - Stores a Unix timestamp, usually the number of seconds since January 1, 1970

Examples of date-related field types:

| Field type | Example value | Description |
| --- | --- | --- |
| DateTime (with time zone) | 2024-08-24T07:30:00.000Z | A date-time value normalized to UTC. |
| DateTime (without time zone) | 2024-08-24 15:30:00 | A date-time value without time-zone information. |
| Date (without time) | 2024-08-24 | Stores only date information. |
| Time | 15:30:00 | Stores only time information. |
| Unix timestamp | 1724437800 | Seconds elapsed since 00:00:00 UTC on January 1, 1970. |

## Data-source mapping

The following table compares NocoBase, MySQL, and PostgreSQL types:

| Field type | NocoBase | MySQL | PostgreSQL |
| --- | --- | --- | --- |
| DateTime (with time zone) | Datetime with timezone | TIMESTAMP<br/>DATETIME | TIMESTAMP WITH TIME ZONE |
| DateTime (without time zone) | Datetime without timezone | DATETIME | TIMESTAMP WITHOUT TIME ZONE |
| Date (without time) | Date | DATE | DATE |
| Time | Time | TIME | TIME WITHOUT TIME ZONE |
| Unix timestamp | Unix timestamp | INTEGER<br/>BIGINT | INTEGER<br/>BIGINT |
| Time (with time zone) | - | - | TIME WITH TIME ZONE |

Notes:

- MySQL `TIMESTAMP` supports values from UTC `1970-01-01 00:00:01` through `2038-01-19 03:14:07`. Outside this range, use DATETIME or BIGINT to store a Unix timestamp.

## Date and time storage flow

### With time zone

This flow includes DateTime (without time zone) and Unix timestamp handling.

![Date and time storage flow](https://static-docs.nocobase.com/20240824191933.png)

Notes:

- To support a wider range of values, the NocoBase DateTime (with time zone) field uses DATETIME in MySQL. The stored date value is converted according to the server `TZ` environment variable. If the `TZ` environment variable changes, stored date-time values can change.
- UTC and local time differ by time zone. Displaying a raw UTC value directly can confuse users.

### Without time zone

![DateTime without time zone storage flow](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) is the global time standard used to coordinate and unify time around the world. It is a high-precision time standard based on atomic clocks and synchronized with the time of the Earth's rotation.

UTC and local time differ by time zone. Displaying a raw UTC value directly can confuse users. For example:

| Time zone | Date and time |
| --- | --- |
| UTC | 2024-08-24T07:30:00.000Z |
| China Standard Time (UTC+8) | 2024-08-24 15:30:00 |
| UTC+5 | 2024-08-24 12:30:00 |
| UTC-5 | 2024-08-24 02:30:00 |
| UK time (UTC+0) | 2024-08-24 07:30:00 |
| Central Time (UTC-6) | 2024-08-23 01:30:00 |

These values represent the same moment in time; only the time zone differs.
