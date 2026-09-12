---
pkg: '@nocobase/plugin-app-supervisor'
title: 'SSO de aplicaciones'
description: 'SSO de aplicaciones en multiaplicación: iniciar sesión automáticamente en subaplicaciones desde la aplicación principal o el selector, con mapeo por nombre de usuario y registro automático.'
keywords: 'multiaplicación,SSO de aplicaciones,inicio de sesión automático,selector de aplicaciones,subaplicación,NocoBase'
---

# SSO de aplicaciones

El SSO de aplicaciones simplifica el proceso de inicio de sesión cuando los usuarios entran en subaplicaciones en un entorno multiaplicación.

Después de habilitarlo, cuando un usuario entra en una subaplicación desde la entrada de la aplicación principal o cambia entre subaplicaciones, el sistema intenta iniciar sesión automáticamente en la subaplicación de destino con el usuario actual. El usuario no necesita introducir su cuenta y contraseña repetidamente en cada subaplicación.

## Escenarios de uso

El SSO de aplicaciones es adecuado para los siguientes escenarios:

- La aplicación principal actúa como entrada unificada y los usuarios acceden desde ella a diferentes subaplicaciones de negocio
- Un sistema se divide en varias subaplicaciones de negocio, pero se quiere mantener una experiencia de inicio de sesión continua
- Los usuarios necesitan cambiar frecuentemente entre varias subaplicaciones
- Las cuentas de usuario entre subaplicaciones se mapean con el mismo nombre de usuario

## Habilitar SSO de aplicaciones

Vaya a "App Supervisor", cree o edite una subaplicación y habilite "SSO de aplicaciones" en "Configuración de autenticación".

Después de habilitarlo, la subaplicación puede activar el inicio de sesión automático desde la entrada de la aplicación principal o desde el selector de aplicaciones.

> Después de modificar la configuración de autenticación, normalmente debe reiniciar la subaplicación para que el cambio surta efecto.

![](https://static-docs.nocobase.com/202605271406542.png)

## Registro automático de usuarios

Si el usuario correspondiente no existe en la subaplicación de destino, puede habilitar "Registrar automáticamente si el usuario no existe".

Después de habilitarlo, cuando un usuario entra por primera vez en una subaplicación mediante SSO de aplicaciones, el sistema crea un usuario básico en la subaplicación con la información del usuario de la aplicación principal.

El mapeo de usuarios se basa principalmente en el nombre de usuario. Esto significa:

- Si el nombre de usuario es el mismo en la aplicación principal y la subaplicación, se inicia sesión con el usuario correspondiente de la subaplicación
- Si el nombre de usuario no existe en la subaplicación, solo se crea si el registro automático está habilitado
- Si el registro automático no está habilitado, el administrador debe crear el usuario previamente en la subaplicación

Los roles y permisos tras la creación del usuario dependen de la configuración de usuarios y permisos de la propia subaplicación.

## Entradas que activan el inicio de sesión automático

El SSO de aplicaciones se activa principalmente desde:

- Entrada a una subaplicación desde la entrada de aplicaciones de la aplicación principal
- Entrada a una subaplicación desde el selector de aplicaciones de la esquina superior izquierda
- Cambio de una subaplicación a otra

El acceso directo a la página de inicio de sesión de una subaplicación o a su propia dirección no fuerza el estado de inicio de sesión de la aplicación principal. Esto conserva los métodos de inicio de sesión propios de la subaplicación y permite gestionar sus cuentas por separado cuando sea necesario.

## Preguntas frecuentes

### ¿Por qué no se inicia sesión automáticamente después de habilitarlo?

Compruebe lo siguiente:

- Si el SSO de aplicaciones está habilitado para la subaplicación
- Si la subaplicación se ha reiniciado para que la configuración de autenticación surta efecto
- Si el usuario entró desde la aplicación principal o desde el selector de aplicaciones
- Si existe en la subaplicación un usuario con el mismo nombre de usuario
- Si el usuario no existe, si el registro automático está habilitado

### ¿Por qué el acceso directo a una subaplicación no inicia sesión automáticamente?

Es el comportamiento esperado. Al acceder directamente a una subaplicación, esta puede necesitar usar su propio método de inicio de sesión, por lo que no se fuerza el estado de inicio de sesión de la aplicación principal.
