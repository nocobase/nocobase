---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Autenticación: CAS

## Introducción

El plugin de Autenticación: CAS sigue el estándar del protocolo CAS (Central Authentication Service). Esto permite a los usuarios iniciar sesión en NocoBase utilizando las cuentas proporcionadas por proveedores de servicios de autenticación de identidad (IdP) de terceros.

## Instalación

## Manual de Usuario

### Activar el plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Añadir autenticación CAS

Visite la página de gestión de autenticación de usuarios:

http://localhost:13000/admin/settings/auth/authenticators

Añada un método de autenticación CAS:

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Configure CAS y actívelo:

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Visite la página de inicio de sesión

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)