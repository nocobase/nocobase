---
pkg: '@nocobase/plugin-auth'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Política de seguridad de tokens

## Introducción

La política de seguridad de tokens es una configuración funcional diseñada para proteger la seguridad del sistema y mejorar la experiencia del usuario. Incluye tres elementos de configuración principales: el "Período de validez de la sesión", el "Período de validez del token" y el "Límite de tiempo para la actualización de tokens caducados".

## Acceso a la configuración

El acceso a la configuración se encuentra en Ajustes del plugin - Seguridad - Política de tokens:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Período de validez de la sesión

**Definición:**

El período de validez de la sesión se refiere a la duración máxima que el sistema permite a un usuario mantener una sesión activa después de iniciar sesión.

**Función:**

Una vez superado el período de validez de la sesión, el usuario recibirá una respuesta de error 401 al intentar acceder de nuevo al sistema, y será redirigido a la página de inicio de sesión para volver a autenticarse.
Ejemplo:
Si el período de validez de la sesión se establece en 8 horas, la sesión caducará 8 horas después de que el usuario inicie sesión, siempre que no haya interacciones adicionales.

**Configuración recomendada:**

- Escenarios de operación a corto plazo: Se recomienda de 1 a 2 horas para mejorar la seguridad.
- Escenarios de trabajo a largo plazo: Puede establecerse en 8 horas para adaptarse a las necesidades del negocio.

## Período de validez del token

**Definición:**

El período de validez del token se refiere al ciclo de vida de cada token emitido por el sistema durante la sesión activa del usuario.

**Función:**

Cuando un token caduca, el sistema emitirá automáticamente un nuevo token para mantener la sesión activa.
Cada token caducado solo puede ser actualizado una vez.

**Configuración recomendada:**

Por motivos de seguridad, se recomienda establecerlo entre 15 y 30 minutos.
Se pueden realizar ajustes según los requisitos del escenario. Por ejemplo:
- Escenarios de alta seguridad: El período de validez del token puede reducirse a 10 minutos o menos.
- Escenarios de bajo riesgo: El período de validez del token puede extenderse adecuadamente hasta 1 hora.

## Límite de tiempo para la actualización de tokens caducados

**Definición:**

El límite de tiempo para la actualización de tokens caducados se refiere a la ventana de tiempo máxima permitida para que un usuario obtenga un nuevo token mediante una operación de actualización después de que el token haya caducado.

**Características:**

- Si se supera el límite de tiempo de actualización, el usuario deberá iniciar sesión de nuevo para obtener un nuevo token.
- La operación de actualización no extiende el período de validez de la sesión, solo regenera el token.

**Configuración recomendada:**

Por motivos de seguridad, se recomienda establecerlo entre 5 y 10 minutos.