---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Importar Pro

## Introducción

El plugin Importar Pro ofrece funcionalidades mejoradas que complementan la función de importación estándar.

## Instalación

Este plugin depende del plugin de Gestión de Tareas Asíncronas. Antes de usarlo, debe habilitar el plugin de Gestión de Tareas Asíncronas.

## Mejoras de Funcionalidad

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Permite operaciones de importación asíncronas, ejecutadas en un hilo independiente, lo que facilita la importación de grandes volúmenes de datos.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Ofrece opciones de importación avanzadas.

## Manual de Usuario

### Importación Asíncrona

Una vez que inicie una importación, el proceso se ejecutará en un hilo de fondo independiente, sin necesidad de configuración manual por parte del usuario. En la interfaz de usuario, después de iniciar la operación de importación, verá la tarea de importación en curso en la esquina superior derecha, mostrando su progreso en tiempo real.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Una vez finalizada la importación, podrá consultar los resultados en las tareas de importación.

#### Sobre el Rendimiento

Para evaluar el rendimiento de la importación de grandes volúmenes de datos, realizamos pruebas comparativas en diferentes escenarios, tipos de campos y configuraciones de activación (tenga en cuenta que los resultados pueden variar según la configuración del servidor y la base de datos, y se proporcionan solo como referencia):

| Volumen de Datos | Tipos de Campo | Configuración de Importación | Tiempo de Procesamiento |
|------|---------|---------|---------|
| 1 millón de registros | Cadena de texto, Número, Fecha, Correo electrónico, Texto largo | • Activar flujo de trabajo: No<br>• Identificador de duplicados: Ninguno | Aprox. 1 minuto |
| 500.000 registros | Cadena de texto, Número, Fecha, Correo electrónico, Texto largo, Muchos a muchos | • Activar flujo de trabajo: No<br>• Identificador de duplicados: Ninguno | Aprox. 16 minutos|
| 500.000 registros | Cadena de texto, Número, Fecha, Correo electrónico, Texto largo, Muchos a muchos, Muchos a uno | • Activar flujo de trabajo: No<br>• Identificador de duplicados: Ninguno | Aprox. 22 minutos |
| 500.000 registros | Cadena de texto, Número, Fecha, Correo electrónico, Texto largo, Muchos a muchos, Muchos a uno | • Activar flujo de trabajo: Notificación de activación asíncrona<br>• Identificador de duplicados: Ninguno | Aprox. 22 minutos |
| 500.000 registros | Cadena de texto, Número, Fecha, Correo electrónico, Texto largo, Muchos a muchos, Muchos a uno | • Activar flujo de trabajo: Notificación de activación asíncrona<br>• Identificador de duplicados: Actualizar duplicados, con 50.000 registros duplicados | Aprox. 3 horas |

Basándonos en los resultados de las pruebas de rendimiento anteriores y en el diseño actual, a continuación, le ofrecemos algunas explicaciones y sugerencias sobre los factores que influyen:

1.  **Mecanismo de gestión de registros duplicados**: Cuando selecciona las opciones **Actualizar registros duplicados** o **Solo actualizar registros duplicados**, el sistema realiza operaciones de consulta y actualización fila por fila, lo que reduce significativamente la eficiencia de la importación. Si su archivo Excel contiene datos duplicados innecesarios, esto afectará aún más la velocidad de importación. Le recomendamos limpiar los datos duplicados innecesarios en el archivo Excel (por ejemplo, utilizando herramientas profesionales de deduplicación) antes de importarlos al sistema, para evitar perder tiempo.

2.  **Eficiencia en el procesamiento de campos de relación**: El sistema procesa los campos de relación consultando las asociaciones fila por fila, lo que puede convertirse en un cuello de botella de rendimiento en escenarios con grandes volúmenes de datos. Para estructuras de relación sencillas (como una asociación de uno a muchos entre dos colecciones), se recomienda una estrategia de importación en varios pasos: primero importe los datos base de la colección principal y, una vez completado, establezca la relación entre las colecciones. Si los requisitos de su negocio exigen importar datos de relación simultáneamente, consulte los resultados de las pruebas de rendimiento de la tabla anterior para planificar su tiempo de importación de manera razonable.

3.  **Mecanismo de activación de flujos de trabajo**: No se recomienda habilitar la activación de flujos de trabajo en escenarios de importación de datos a gran escala, principalmente por las siguientes dos razones:
    -   Aunque el estado de la tarea de importación muestre 100%, no finalizará de inmediato. El sistema aún necesita tiempo adicional para crear los planes de ejecución del flujo de trabajo. Durante esta fase, el sistema genera un plan de ejecución de flujo de trabajo correspondiente para cada registro importado, lo que ocupa el hilo de importación, pero no afecta el uso de los datos ya importados.
    -   Una vez que la tarea de importación ha finalizado por completo, la ejecución concurrente de un gran número de flujos de trabajo puede sobrecargar los recursos del sistema, afectando la velocidad de respuesta general del sistema y la experiencia del usuario.

Los 3 factores influyentes mencionados anteriormente serán considerados para futuras optimizaciones.

### Configuración de Importación

#### Opciones de Importación - ¿Activar flujo de trabajo?

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Al importar, puede elegir si desea activar flujos de trabajo. Si marca esta opción y la colección de datos está vinculada a un flujo de trabajo (evento de colección de datos), la importación activará la ejecución del flujo de trabajo fila por fila.

#### Opciones de Importación - Identificar registros duplicados

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Marque esta opción y seleccione el modo correspondiente para identificar y procesar registros duplicados durante la importación.

Las opciones de la configuración de importación se aplicarán como valores predeterminados. Los administradores pueden controlar si permiten que el usuario que sube los archivos modifique estas opciones (excepto la opción de activar flujo de trabajo).

**Configuración de Permisos del Cargador**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Permitir al cargador modificar las opciones de importación

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Deshabilitar la modificación de las opciones de importación por parte del cargador

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Descripción de los modos

- **Omitir registros duplicados**: Consulta los registros existentes basándose en el contenido del "Campo identificador". Si el registro ya existe, se omite esa fila; si no existe, se importa como un nuevo registro.
- **Actualizar registros duplicados**: Consulta los registros existentes basándose en el contenido del "Campo identificador". Si el registro ya existe, se actualiza; si no existe, se importa como un nuevo registro.
- **Solo actualizar registros duplicados**: Consulta los registros existentes basándose en el contenido del "Campo identificador". Si el registro ya existe, se actualiza; si no existe, se omite.

##### Campo identificador

El sistema identifica si una fila es un registro duplicado basándose en el valor de este campo.

- [Regla de Enlace](/interface-builder/actions/action-settings/linkage-rule): Muestra/oculta botones dinámicamente;
- [Botón de Edición](/interface-builder/actions/action-settings/edit-button): Edite el título, tipo e icono del botón;