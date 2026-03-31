:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Configuración

### Activación de la impresión de plantillas
La impresión de plantillas actualmente es compatible con los bloques de detalles y los bloques de tabla. A continuación, le mostraremos cómo configurar cada uno de ellos.

#### Bloques de detalles

1.  **Abra el bloque de detalles**:
    -   En la aplicación, navegue hasta el bloque de detalles donde necesite usar la función de impresión de plantillas.

2.  **Acceda al menú "Configurar operaciones"**:
    -   En la parte superior de la interfaz, haga clic en el menú "Configurar operaciones".

3.  **Seleccione "Impresión de plantillas"**:
    -   En el menú desplegable, haga clic en la opción "Impresión de plantillas" para activar la funcionalidad del plugin.

![Activar impresión de plantillas](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Configuración de plantillas

1.  **Acceda a la página de configuración de plantillas**:
    -   En el menú de configuración del botón "Impresión de plantillas", seleccione la opción "Configuración de plantillas".

![Opción de configuración de plantillas](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Agregue una nueva plantilla**:
    -   Haga clic en el botón "Agregar plantilla" para acceder a la página de adición de plantillas.

![Botón Agregar plantilla](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Complete la información de la plantilla**:
    -   En el formulario de la plantilla, complete el nombre de la plantilla y seleccione su tipo (Word, Excel, PowerPoint).
    -   Suba el archivo de plantilla correspondiente (compatible con los formatos `.docx`, `.xlsx`, `.pptx`).

![Configurar nombre y archivo de plantilla](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Edite y guarde la plantilla**:
    -   Vaya a la página "Lista de campos", copie los campos y péguelos en la plantilla.
    ![Lista de campos](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Una vez que haya completado los detalles, haga clic en el botón "Guardar" para finalizar la adición de la plantilla.

5.  **Gestión de plantillas**:
    -   Haga clic en el botón "Usar" a la derecha de la lista de plantillas para activar la plantilla.
    -   Haga clic en el botón "Editar" para modificar el nombre de la plantilla o reemplazar el archivo de la plantilla.
    -   Haga clic en el botón "Descargar" para bajar el archivo de plantilla ya configurado.
    -   Haga clic en el botón "Eliminar" para quitar las plantillas que ya no necesite. El sistema le pedirá confirmación para evitar eliminaciones accidentales.
    ![Gestión de plantillas](https://static-docs.nocobase.com/20250107140436.png)

#### Bloques de tabla

El uso de los bloques de tabla es básicamente el mismo que el de los bloques de detalles, con las siguientes diferencias:

1.  **Compatibilidad con la impresión de múltiples registros**: Primero, debe seleccionar los registros que desea imprimir marcándolos. Puede imprimir hasta 100 registros a la vez.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Gestión de aislamiento de plantillas**: Las plantillas para los bloques de tabla y los bloques de detalles no son intercambiables, ya que sus estructuras de datos son diferentes (una es un objeto y la otra es una matriz).