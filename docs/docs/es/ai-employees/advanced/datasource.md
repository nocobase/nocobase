---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Avanzado

## Introducción

En el plugin de empleado de IA, usted puede configurar fuentes de datos y predefinir algunas consultas de colección. Estas se envían como contexto de aplicación al conversar con el empleado de IA, quien responderá basándose en los resultados de esas consultas de colección.

## Configuración de la fuente de datos

Vaya a la página de configuración del plugin de empleado de IA, haga clic en la pestaña `Data source` para acceder a la página de gestión de fuentes de datos del empleado de IA.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Haga clic en el botón `Add data source` para entrar en la página de creación de la fuente de datos.

Primer paso: Introduzca la información básica de la colección:
- En el campo `Title`, introduzca un nombre fácil de recordar para la fuente de datos;
- En el campo `Collection`, seleccione la fuente de datos y la colección que desea utilizar;
- En el campo `Description`, introduzca una descripción para la fuente de datos.
- En el campo `Limit`, introduzca el límite de consultas para la fuente de datos para evitar que se devuelvan demasiados datos que excedan el contexto de la conversación de IA.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Segundo paso: Seleccione los campos a consultar:

En la lista `Fields`, marque los campos que desea consultar.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Tercer paso: Establezca las condiciones de consulta:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Cuarto paso: Establezca las condiciones de ordenación:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Finalmente, antes de guardar la fuente de datos, usted puede previsualizar los resultados de la consulta de la fuente de datos.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Envío de fuentes de datos en conversaciones

En el cuadro de diálogo del empleado de IA, haga clic en el botón `Add work context` en la esquina inferior izquierda, seleccione `Data source`, y verá la fuente de datos que acaba de añadir.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Marque la fuente de datos que desea enviar, y la fuente de datos seleccionada se adjuntará al cuadro de diálogo.

![20251022105401](https://static-docs.nocobase.com/2025105401.png)

Después de introducir su pregunta, al igual que al enviar un mensaje normal, haga clic en el botón de enviar, y el empleado de IA responderá basándose en la fuente de datos.

La fuente de datos también aparecerá en la lista de mensajes.

![20251022105611](https://static-docs.nocobase.com/2025105611.png)

## Notas

La fuente de datos filtrará automáticamente los datos según los permisos ACL del usuario actual, mostrando solo aquellos a los que el usuario tiene acceso.