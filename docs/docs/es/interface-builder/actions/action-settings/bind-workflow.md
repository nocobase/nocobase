:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Vincular flujos de trabajo

## Introducción

En algunos botones de acción, usted puede configurar un **flujo de trabajo** vinculado para asociar esa acción con un **flujo de trabajo**, logrando así el procesamiento automatizado de datos.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Acciones y tipos de flujo de trabajo compatibles

Los botones de acción y los tipos de **flujo de trabajo** compatibles actualmente son los siguientes:

| Botón de acción \ Tipo de flujo de trabajo | Evento previo a la acción | Evento posterior a la acción | Evento de aprobación | Evento de acción personalizada |
| --- | --- | --- | --- | --- |
| Botones "Enviar", "Guardar" del formulario | ✅ | ✅ | ✅ | ❌ |
| Botón "Actualizar registro" en filas de datos (Tabla, Lista, etc.) | ✅ | ✅ | ✅ | ❌ |
| Botón "Eliminar" en filas de datos (Tabla, Lista, etc.) | ✅ | ❌ | ❌ | ❌ |
| Botón "Disparar flujo de trabajo" | ❌ | ❌ | ❌ | ✅ |

## Vincular varios flujos de trabajo

Un botón de acción puede vincularse a varios **flujos de trabajo**. Cuando se vinculan múltiples **flujos de trabajo**, su orden de ejecución sigue las siguientes reglas:

1. Para **flujos de trabajo** del mismo tipo de disparador, los **flujos de trabajo** síncronos se ejecutan primero, seguidos por los asíncronos.
2. Los **flujos de trabajo** del mismo tipo de disparador se ejecutan en el orden configurado.
3. Entre **flujos de trabajo** de diferentes tipos de disparador:
    1. Los eventos previos a la acción siempre se ejecutan antes que los eventos posteriores a la acción y los eventos de aprobación.
    2. Los eventos posteriores a la acción y los eventos de aprobación no tienen un orden específico, y la lógica de negocio no debería depender del orden de configuración.

## Más información

Para conocer los diferentes tipos de eventos de **flujo de trabajo**, consulte la documentación detallada de los **plugins** relevantes:

* [Evento posterior a la acción]
* [Evento previo a la acción]
* [Evento de aprobación]
* [Evento de acción personalizada]