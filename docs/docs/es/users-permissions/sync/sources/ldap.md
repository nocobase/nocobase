---
pkg: '@nocobase/plugin-auth-ldap'
title: "Sincronizar datos de usuario desde LDAP"
description: "Sincronice usuarios y departamentos LDAP con NocoBase reutilizando un autenticador LDAP existente."
keywords: "LDAP,sincronización de usuarios,sincronización de departamentos,Bind DN,Search DN,NocoBase"
---

# Sincronizar datos de usuario desde LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introducción

El plugin **Autenticación: LDAP** permite usar un autenticador LDAP existente como fuente de sincronización. Reutiliza la conexión, Bind DN, Search DN, ámbito de búsqueda y mapeo de atributos, y escribe los usuarios y la jerarquía opcional de departamentos en NocoBase.

## Antes de comenzar

1. Instale y active **Autenticación: LDAP** y **Sincronización de datos de usuario**.
2. Cree y verifique un autenticador LDAP. Consulte [Autenticación: LDAP](/auth-verification/auth-ldap/).
3. Compruebe que el mapeo incluye los campos necesarios, como usuario o correo, apodo y teléfono.

## Añadir una fuente LDAP

Vaya a **Usuarios y permisos > Sincronizar**, haga clic en **Añadir** y seleccione **LDAP**.

| Campo | Descripción |
| --- | --- |
| Nombre de la fuente | Nombre único de la fuente. |
| Activada | Permite ejecutar sincronizaciones LDAP manuales y programadas. |
| Autenticador LDAP | Autenticador existente cuya conexión y mapeo se reutilizan. |
| Filtro de sincronización | Filtro LDAP para usuarios. Valor predeterminado: `(&(objectCategory=person)(objectClass=user))`. |
| Límite de tamaño | Número máximo de entradas por búsqueda; vacío usa el límite del servidor. |
| Tamaño de página | Tamaño para búsquedas LDAP paginadas. |
| Sincronizar departamentos | Sincroniza la jerarquía LDAP como departamentos de NocoBase. |
| DN de búsqueda de departamentos | Obligatorio al sincronizar departamentos, por ejemplo `ou=departments,dc=example,dc=com`. |

:::info
La fuente usa el Bind DN y la contraseña del autenticador seleccionado; no guarda una segunda copia de las credenciales.
:::

## Sincronizar usuarios

Guarde y active la fuente y pulse **Sincronizar**. En **Tarea** puede revisar el resultado y reintentar tareas fallidas.

La coincidencia de usuarios depende de **Usar este campo para vincular al usuario** en el autenticador. Mantenga estable este ajuste y el mapeo después de la primera sincronización para evitar duplicados.

## Sincronizar departamentos

Active **Sincronizar departamentos** e introduzca el **DN de búsqueda de departamentos**. El plugin busca unidades organizativas, conserva su jerarquía y asocia al usuario con un departamento mediante su Distinguished Name.

## Campos sincronizados

### Campos de usuario

| Atributo o ajuste LDAP | Campo o uso en NocoBase |
| --- | --- |
| Atributo de cuenta de acceso | Identificador único de origen y usuario o correo seleccionado para la vinculación. Normalmente se deduce de `{{account}}` en el filtro, por ejemplo `uid`, `sAMAccountName` o `mail`. Se omite el usuario si falta. |
| Mapeo a `username` | Nombre de usuario. |
| Mapeo a `nickname` | Apodo. |
| Mapeo a `email` | Correo electrónico. |
| Mapeo a `phone` | Teléfono. |
| `distinguishedName`, o DN de la entrada | Departamento sincronizado más cercano en la ruta DN, establecido como principal. |

En atributos multivalor solo se sincroniza el primer valor. No se sincronizan atributos sin mapeo.

### Campos de departamento

| Atributo o estructura LDAP | Campo o uso en NocoBase |
| --- | --- |
| `objectGUID` | Identificador único de origen. Se omiten unidades organizativas sin este atributo. |
| `ou`, `cn`, `name` | El primer valor no vacío se usa como nombre del departamento. |
| `distinguishedName`, o DN de la entrada | Identifica el departamento y su superior para construir la jerarquía. |

De forma predeterminada se buscan objetos `organizationalUnit` y `container`. Actualmente no se sincronizan varios departamentos desde `memberOf` ni responsables de departamento.

## Solución de problemas

- Si no hay usuarios, revise Search DN, ámbito, permisos del Bind DN y filtro de sincronización.
- Si el resultado está truncado, configure el tamaño de página y revise los límites del servidor LDAP.
- Si faltan departamentos, compruebe que la sincronización esté activada y que el DN cubra las unidades necesarias.
- Revise los detalles de la tarea y los logs para detectar errores de conexión, enlace y búsqueda.
