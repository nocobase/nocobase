:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Resumen

## Tipos de campo de fecha y hora

Los tipos de campo de fecha y hora incluyen los siguientes:

- **Fecha y hora (con zona horaria)**: Los valores de fecha y hora se estandarizan a UTC (Tiempo Universal Coordinado) y se ajustan a la zona horaria cuando es necesario.
- **Fecha y hora (sin zona horaria)**: Almacena la fecha y la hora sin información de zona horaria.
- **Fecha (sin hora)**: Almacena solo la fecha, sin incluir la parte de la hora.
- **Hora**: Almacena solo la hora, sin incluir la parte de la fecha.
- **Marca de tiempo Unix**: Se almacena como una marca de tiempo Unix, que generalmente representa los segundos transcurridos desde el 1 de enero de 1970.

A continuación, se muestran ejemplos para cada tipo de campo relacionado con la fecha y hora:

| **Tipo de campo**               | **Valor de ejemplo**         | **Descripción**                                       |
|---------------------------------|------------------------------|-------------------------------------------------------|
| Fecha y hora (con zona horaria) | 2024-08-24T07:30:00.000Z     | Se convierte a UTC y se puede ajustar según la zona horaria. |
| Fecha y hora (sin zona horaria) | 2024-08-24 15:30:00          | Almacena la fecha y la hora sin considerar la zona horaria. |
| Fecha (sin hora)                | 2024-08-24                   | Captura solo la fecha, sin información de hora.       |
| Hora                            | 15:30:00                     | Captura solo la hora, excluyendo cualquier detalle de fecha. |
| Marca de tiempo Unix            | 1724437800                   | Representa los segundos transcurridos desde el 01-01-1970 00:00:00 UTC. |

## Comparaciones de fuentes de datos

A continuación, se presenta una tabla comparativa para NocoBase, MySQL y PostgreSQL:

| **Tipo de campo**               | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|---------------------------------|----------------------------|----------------------------|----------------------------------------|
| Fecha y hora (con zona horaria) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Fecha y hora (sin zona horaria) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Fecha (sin hora)                | Date                       | DATE                       | DATE                                   |
| Hora                            | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Marca de tiempo Unix            | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Hora (con zona horaria)         | -                          | -                          | TIME WITH TIME ZONE                    |

**Nota:**
- El tipo TIMESTAMP de MySQL cubre un rango entre `1970-01-01 00:00:01 UTC` y `2038-01-19 03:14:07 UTC`. Para fechas y horas fuera de este rango, se recomienda usar DATETIME o BIGINT para almacenar marcas de tiempo Unix.

## Flujo de trabajo de procesamiento de almacenamiento de fecha y hora

### Con zona horaria

Esto incluye `Fecha y hora (con zona horaria)` y `Marca de tiempo Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Nota:**
- Para acomodar un rango más amplio de fechas, NocoBase utiliza el tipo DATETIME en MySQL para los campos de Fecha y hora (con zona horaria). El valor de fecha almacenado se convierte según la variable de entorno TZ del servidor, lo que significa que si esta variable cambia, el valor de fecha y hora almacenado también se modificará.
- Dado que existe una diferencia de zona horaria entre UTC y la hora local, mostrar directamente el valor UTC original podría llevar a confusión al usuario.

### Sin zona horaria

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Tiempo Universal Coordinado) es el estándar de tiempo global utilizado para coordinar y sincronizar la hora en todo el mundo. Es un estándar de tiempo de alta precisión, mantenido por relojes atómicos y sincronizado con la rotación de la Tierra.

La diferencia entre UTC y la hora local puede causar confusión al mostrar los valores UTC sin procesar. Por ejemplo:

| **Zona horaria** | **Fecha y hora**                 |
|------------------|----------------------------------|
| UTC              | 2024-08-24T07:30:00.000Z         |
| UTC+8            | 2024-08-24 15:30:00              |
| UTC+5            | 2024-08-24 12:30:00              |
| UTC-5            | 2024-08-24 02:30:00              |
| UTC+0            | 2024-08-24 07:30:00              |
| UTC-6            | 2024-08-23 01:30:00              |

Todas estas horas representan el mismo momento, solo que expresadas en diferentes zonas horarias.