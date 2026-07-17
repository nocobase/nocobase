---
title: "Descripción general"
description: "Tipos de campos de fecha y hora: con zona horaria/sin zona horaria, fecha, hora, marca de tiempo Unix y correspondencia entre los tipos de NocoBase/MySQL/PostgreSQL."
keywords: "fecha y hora,DateTime,campo de hora,con zona horaria,sin zona horaria,marca de tiempo Unix,NocoBase"
---

# Descripción general

## Tipos de campos de fecha y hora

Los tipos de campos de fecha y hora incluyen los siguientes:

- **Fecha y hora (con zona horaria)** - La fecha y hora se convierten uniformemente a UTC (Tiempo Universal Coordinado) y se convierten a la zona horaria correspondiente cuando es necesario;
- **Fecha y hora (sin zona horaria)** - Almacena la fecha y hora sin información de zona horaria;
- **Fecha (sin hora)** - Almacena únicamente la fecha, sin incluir la hora;
- **Hora** - Almacena únicamente la hora, sin incluir la fecha;
- **Marca de tiempo Unix** - Se almacena como una marca de tiempo Unix, normalmente como el número de segundos transcurridos desde el 1 de enero de 1970.

Ejemplos de los distintos tipos de campos relacionados con fechas:

| **Tipo de campo**                  | **Valor de ejemplo**          | **Descripción**                                             |
|------------------------------------|-------------------------------|-------------------------------------------------------------|
| Fecha y hora (con zona horaria)    | 2024-08-24T07:30:00.000Z      | La fecha y hora se convierten uniformemente a UTC (Tiempo Universal Coordinado) |
| Fecha y hora (sin zona horaria)   | 2024-08-24 15:30:00           | Fecha y hora sin zona horaria; solo registra la fecha y la hora |
| Fecha (sin hora)                  | 2024-08-24                    | Almacena únicamente la fecha, sin incluir la hora           |
| Hora                               | 15:30:00                      | Almacena únicamente la hora, sin incluir la fecha          |
| Marca de tiempo Unix               | 1724437800                    | Número de segundos transcurridos desde las 00:00:00 UTC del 1 de enero de 1970 |

## Correspondencia entre fuentes de datos

Tabla de correspondencias entre NocoBase, MySQL y PostgreSQL:

| **Tipo de campo**                 | **NocoBase**                 | **MySQL**              | **PostgreSQL**                  |
|-----------------------------------|------------------------------|------------------------|---------------------------------|
| Fecha y hora (con zona horaria)   | Datetime with timezone       | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE        |
| Fecha y hora (sin zona horaria)  | Datetime without timezone    | DATETIME               | TIMESTAMP WITHOUT TIME ZONE     |
| Fecha (sin hora)                  | Date                         | DATE                   | DATE                            |
| Hora                              | Time                         | TIME                   | TIME WITHOUT TIME ZONE          |
| Marca de tiempo Unix               | Unix timestamp               | INTEGER<br/>BIGINT     | INTEGER<br/>BIGINT               |
| Hora (con zona horaria)            | -                            | -                      | TIME WITH TIME ZONE             |

Nota:
- El rango de datos de TIMESTAMP de MySQL se encuentra entre la hora UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`; cuando se exceda este rango, se recomienda utilizar DATETIME o BIGINT para almacenar la marca de tiempo Unix.

## Proceso de almacenamiento de fechas y horas

### Con zona horaria

Incluye`日期时间（不含时区）` y `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Nota:
- Para admitir un rango de datos más amplio, el campo de fecha y hora (con zona horaria) de NocoBase utiliza DATETIME en la base de datos MySQL. El valor de fecha almacenado es el valor convertido según la variable de entorno TZ del servidor. Si cambia la variable de entorno TZ, el valor almacenado de la fecha y hora también cambiará.
- Existe una diferencia de zona horaria entre la hora UTC y la hora local; mostrar directamente el valor UTC original puede inducir a error a los usuarios.

### Sin zona horaria

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Tiempo Universal Coordinado, Coordinated Universal Time) es el estándar horario mundial utilizado para coordinar y unificar la hora en todo el mundo. Se basa en un estándar de alta precisión determinado por relojes atómicos y se mantiene sincronizado con la rotación de la Tierra.

Existe una diferencia de zona horaria entre la hora UTC y la hora local; mostrar directamente el valor UTC original puede inducir a error a los usuarios. Por ejemplo:

| **Zona horaria**       | **Fecha y hora**                 |
|------------------------|----------------------------------|
| UTC                    | 2024-08-24T07:30:00.000Z         |
| UTC+8                  | 2024-08-24 15:30:00              |
| UTC+5                  | 2024-08-24 12:30:00              |
| UTC-5                  | 2024-08-24 02:30:00              |
| Hora del Reino Unido (UTC+0) | 2024-08-24 07:30:00          |
| Hora central (UTC-6)   | 2024-08-23 01:30:00              |

Todos los valores anteriores representan el mismo instante; solo difiere la zona horaria.
