:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Consulta de datos

El panel de configuración de gráficos se divide en tres secciones principales: **Consulta de datos**, **Opciones del gráfico** y **Eventos de interacción**, además de los botones de **Cancelar**, **Previsualizar** y **Guardar** en la parte inferior. Primero, exploremos el panel de "Consulta de datos" para entender sus dos modos de consulta (Builder/SQL) y sus funciones más comunes.

## Estructura del panel

![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> **Consejo:** Para configurar el contenido actual de forma más sencilla, puede plegar los otros paneles primero.

En la parte superior se encuentra la barra de acciones:
- **Modo:** **Builder** (gráfico, sencillo y práctico) / **SQL** (declaraciones escritas a mano, más flexible).
- **Ejecutar consulta:** Haga clic para ejecutar la solicitud de consulta de datos.
- **Ver resultado:** Abre el panel de resultados de datos, donde puede alternar entre las vistas de **Tabla** y **JSON**. Haga clic de nuevo para plegar el panel.

De arriba abajo, los elementos son:
- **Fuente de datos y colección:** Obligatorio. Seleccione la fuente de datos y la **colección** (tabla de datos).
- **Medidas (Measures):** Obligatorio. Son los campos numéricos que se mostrarán.
- **Dimensiones (Dimensions):** Permiten agrupar por campos (por ejemplo, fecha, categoría, región).
- **Filtro:** Establezca las condiciones de filtro (por ejemplo, =, ≠, >, <, contiene, rango). Se pueden combinar múltiples condiciones.
- **Ordenar:** Seleccione el campo por el que desea ordenar y el orden (ascendente/descendente).
- **Paginación:** Controle el rango de datos y el orden de retorno.

## Modo Builder

### Seleccionar fuente de datos y colección
- En el panel de "Consulta de datos", seleccione el modo **Builder**.
- Seleccione una fuente de datos y una **colección** (tabla de datos). Si la **colección** no es seleccionable o está vacía, verifique primero los permisos y si ha sido creada.

### Configurar Medidas (Measures)
- Seleccione uno o varios campos numéricos y establezca una agregación: `Sum` (Suma), `Count` (Conteo), `Avg` (Promedio), `Max` (Máximo), `Min` (Mínimo).
- Casos de uso comunes: `Count` para contar registros, `Sum` para calcular un total.

### Configurar Dimensiones (Dimensions)
- Seleccione uno o varios campos como dimensiones de agrupación.
- Los campos de fecha y hora se pueden formatear (por ejemplo, `YYYY-MM`, `YYYY-MM-DD`) para facilitar la agrupación por mes o día.

### Filtrar, ordenar y paginar
- **Filtro:** Añada condiciones (por ejemplo, =, ≠, contiene, rango). Se pueden combinar múltiples condiciones.
- **Ordenar:** Seleccione un campo y el orden de clasificación (ascendente/descendente).
- **Paginación:** Configure `Limit` y `Offset` para controlar el número de filas devueltas. Se recomienda establecer un `Limit` pequeño durante la depuración.

### Ejecutar consulta y ver resultado
- Haga clic en "Ejecutar consulta" para ejecutarla. Una vez que se devuelvan los resultados, alterne entre `Table` y `JSON` en "Ver resultado" para verificar las columnas y los valores.
- Antes de mapear los campos del gráfico, confirme aquí los nombres y tipos de las columnas para evitar que el gráfico aparezca vacío o con errores más adelante.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Mapeo de campos posterior

Posteriormente, al configurar las "Opciones del gráfico", realizará el mapeo de campos basándose en los campos de la tabla de la fuente de datos y la **colección** seleccionadas.

## Modo SQL

### Escribir consulta
- Cambie al modo **SQL**, introduzca su declaración de consulta y haga clic en "Ejecutar consulta".
- Ejemplo (monto total del pedido por fecha):
```sql
SELECT
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Ejecutar consulta y ver resultado

- Haga clic en "Ejecutar consulta" para ejecutarla. Una vez que se devuelvan los resultados, alterne entre `Table` y `JSON` en "Ver resultado" para verificar las columnas y los valores.
- Antes de mapear los campos del gráfico, confirme aquí los nombres y tipos de las columnas para evitar que el gráfico aparezca vacío o con errores más adelante.

### Mapeo de campos posterior

Posteriormente, al configurar las "Opciones del gráfico", realizará el mapeo de campos basándose en las columnas del resultado de la consulta.

> [!TIP]
> Para obtener más información sobre el modo SQL, consulte [Uso avanzado — Consulta de datos en modo SQL](#).