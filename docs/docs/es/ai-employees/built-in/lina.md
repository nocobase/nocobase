---
title: 'Lina: Ingeniera de localización'
description: 'Documentación de empleados de IA de NocoBase.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Ingeniera de localización

## Rol

Lina: Ingeniera de localización se especializa en este escenario integrado de NocoBase y ayuda a completar las tareas relacionadas de forma más eficiente.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Consejo}
Lina está dedicada a escenarios de localización y no usa Skills ni Tools generales.
:::

## Escenarios

- Traducir entradas del sistema y plugins por lotes.
- Traducir contenido de colecciones, campos y menús.
- Traducir solo entradas seleccionadas en la tabla.

## Requisitos previos

Antes de usar Lina, complete la siguiente configuración:

- Active el plugin **Gestión de Localización**.
- Configure un servicio LLM disponible y asigne un modelo predeterminado a Lina. Consulte [Configurar modelos de empleados de IA](/ai-employees/features/model-settings) y [Recomendaciones de modelo](#recomendaciones-de-modelo).
- Active el idioma de destino en la configuración del sistema.
- Sincronice las entradas que desea traducir en la página de Gestión de Localización.

:::info{title=Consejo}
Lina crea tareas de traducción para el idioma actual.
:::

## Uso

En la página de Gestión de Localización, haga clic en el avatar de Lina y elija el alcance de la tarea de traducción con IA.

### Traducción incremental

Solo traduce entradas que aún no tienen traducción en el idioma actual.

### Traducción seleccionada

Seleccione primero entradas en la tabla y traduzca solo el contenido seleccionado.

Si no hay entradas seleccionadas, el sistema pedirá seleccionar registros.

### Traducción completa

Traduce todas las entradas aplicables del idioma actual.

:::warning{title=Nota}
La traducción completa puede sobrescribir traducciones existentes. Confirme el idioma, el número de entradas y el modelo antes de iniciar.
:::

## Confirmación de tarea

Antes de crear la tarea, el sistema muestra un diálogo de confirmación con:

- Número de entradas a traducir.
- Proveedor que se usará.
- Modelo que se usará.

Después de confirmar, el sistema crea una tarea en segundo plano. Puede ver el progreso en tareas asíncronas. Al completarse, las traducciones se escriben en el idioma correspondiente.

![](https://static-docs.nocobase.com/202605121233608.png)

## Estrategia de traducción

Lina sigue estas reglas al traducir:

- Devolver solo el texto traducido, sin explicación ni contenido adicional.
- Conservar variables, marcadores, etiquetas HTML, sintaxis ICU y formato.
- Mantener los textos de interfaz concisos y naturales.

## Traducciones de referencia

Las entradas cortas como campos, botones y estados usan traducciones de referencia existentes para mejorar la consistencia.

- Las entradas integradas prefieren traducciones chinas como referencia.
- Las entradas no integradas prefieren el idioma predeterminado del sistema.

Cuando existe una referencia, Lina usa un prompt con semántica similar:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Recomendaciones de modelo

La traducción de localización suele procesar muchas entradas. Si es posible, use primero un modelo pequeño especializado desplegado localmente, porque los modelos online suelen tener límites de frecuencia, concurrencia o tokens.

Si no puede desplegar un modelo local, elija un modelo especializado en traducción en lugar de un modelo de chat general.

Puede ajustar la concurrencia según la capacidad del modelo para controlar rendimiento, tiempo de respuesta y coste.

Para una práctica completa con un modelo pequeño especializado desplegado localmente, consulte [Usar Lina y HY-MT1.5-1.8B local para traducir entradas de localización](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Consejo}
La concurrencia se controla con `AI_LOCALIZATION_CONCURRENCY`. El valor predeterminado es `10`, rango permitido `1` a `20`; valores fuera del rango usan el predeterminado.
:::

## Progreso y gestión de fallos

Las tareas de traducción de Lina se ejecutan como tareas asíncronas en segundo plano y escriben resultados entrada por entrada.

![](https://static-docs.nocobase.com/202605121235761.png)

Si una entrada falla, se registra el error y la tarea se detiene para evitar resultados no controlados.

- El plugin AI o Async Task Manager no está habilitado.
- Lina no tiene un modelo disponible configurado.
- El servicio del modelo no está disponible o agota el tiempo de espera.

Revise detalles de la tarea asíncrona y logs del servidor para proveedor, modelo, idioma, ID de entrada y duración.

## Revisión antes de publicar

Después de la traducción con IA, revise antes de publicar:

- Las entradas cortas como menús, botones y campos encajan con el contexto del producto.
- Variables, marcadores y etiquetas HTML se conservan.
- La terminología de negocio es consistente.
- Publique después de revisar.
