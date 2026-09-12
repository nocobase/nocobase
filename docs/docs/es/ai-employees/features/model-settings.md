---
title: 'Configurar modelos de empleados de IA'
description: 'Configurar modelos de empleados de IA.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# Configurar modelos de empleados de IA

De forma predeterminada, los empleados de IA pueden usar todos los servicios LLM y modelos habilitados. Los administradores pueden activar modelos dedicados para un empleado y limitar su rango de modelos.

## Requisitos previos

- El plugin **AI Employees** está habilitado.
- Hay al menos un servicio LLM configurado.
- El empleado de IA objetivo está habilitado.

Para configurar el servicio LLM, consulte [Configurar servicio LLM](/ai-employees/features/llm-service).

## Puntos de entrada

Vaya a `System Settings -> AI Employees -> AI employees`, abra el empleado que desea configurar y cambie a `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Activar la configuración de modelo dedicado

Después de activar `Enable dedicated model configuration`, seleccione en `Models` los modelos permitidos.

- El selector de modelo del chat solo muestra modelos seleccionados.
- Las tareas rápidas y nodos de workflow solo pueden usar modelos seleccionados.

:::info{title=Consejo}
Si la configuración dedicada está activa pero no se selecciona ningún modelo, no se podrá resolver un modelo disponible.
:::

## Desactivar la configuración de modelo dedicado

Después de desactivar la opción, vuelven las reglas predeterminadas:

- Puede usar todos los modelos LLM habilitados.
- Si no se selecciona manualmente, el sistema usa el modelo global predeterminado.

## Reglas de resolución de modelos

Al ejecutar una tarea, el modelo final se resuelve en este orden:

1. Si la configuración dedicada está activada, resolver primero dentro del rango de modelos seleccionados.
2. Si la solicitud especifica un modelo y está permitido, usar ese modelo.
3. Si el modelo especificado no está permitido, usar el primer modelo permitido.
4. Si la configuración dedicada no está activada, preferir el modelo especificado por la solicitud.
5. Si no se especifica ningún modelo, usar el modelo global predeterminado.

## Recomendaciones

- Si no puede desplegar un modelo local, elija un modelo especializado en traducción en lugar de un modelo de chat general.
- Puede ajustar la concurrencia según la capacidad del modelo para controlar rendimiento, tiempo de respuesta y coste.

## FAQ

### ¿Por qué está vacía la lista de modelos?

Normalmente no hay servicio LLM configurado o ningún modelo habilitado. Revise `Enabled Models`.

### ¿Por qué los usuarios no pueden cambiar a otros modelos?

Si la configuración dedicada está activa, solo está disponible el rango de modelos seleccionado.

### ¿Qué entradas se ven afectadas?

Afecta a chats nuevos, tareas rápidas, nodos de AI Employee en workflow y tareas integradas del plugin. Los mensajes históricos no se regeneran.
