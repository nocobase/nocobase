:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Consultar datos en modo SQL

En el panel de "Consulta de datos", cambie al modo SQL, escriba y ejecute su consulta, y utilice el resultado directamente para el mapeo y la renderización de gráficos.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Escribir sentencias SQL
- En el panel de "Consulta de datos", seleccione el modo "SQL".
- Ingrese su SQL y haga clic en "Ejecutar consulta" para ejecutarla.
- Admite sentencias SQL completas y complejas, incluyendo JOIN de múltiples tablas y VIEWs.

Ejemplo: Monto de pedidos por mes
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Ver resultados
- Haga clic en "Ver datos" para abrir el panel de vista previa de los resultados.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Los datos admiten paginación; puede alternar entre "Tabla" y "JSON" para verificar los nombres y tipos de las columnas.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mapeo de campos
- En la configuración de "Opciones del gráfico", mapee los campos basándose en las columnas del resultado de la consulta.
- Por defecto, la primera columna se utiliza como dimensión (eje X o categoría), y la segunda columna como medida (eje Y o valor). Por favor, preste atención al orden de las columnas en su SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- Campo de dimensión en la primera columna
  SUM(total_amount) AS total -- Campo de medida después
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Uso de variables de contexto
Haga clic en el botón "x" en la esquina superior derecha del editor SQL para seleccionar variables de contexto.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Después de confirmar, la expresión de la variable se insertará en la posición del cursor (o reemplazará el texto seleccionado) dentro del SQL.

Por ejemplo, `{{ ctx.user.createdAt }}`. Tenga en cuenta que no debe añadir comillas adicionales.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Más ejemplos
Para más ejemplos de uso, puede consultar la [aplicación de demostración](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) de NocoBase.

**Recomendaciones:**
- Estabilice los nombres de las columnas antes de mapearlas a los gráficos para evitar errores posteriores.
- Durante la depuración, establezca un `LIMIT` para reducir el número de filas devueltas y acelerar la vista previa.

## Previsualizar, guardar y revertir
- Haga clic en "Ejecutar consulta" para solicitar los datos y actualizar la vista previa del gráfico.
- Haga clic en "Guardar" para guardar el texto SQL actual y la configuración relacionada en la base de datos.
- Haga clic en "Cancelar" para volver al último estado guardado y descartar los cambios no guardados.