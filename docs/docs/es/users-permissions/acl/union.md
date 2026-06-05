---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Unión de Roles

La unión de roles es un modo de gestión de permisos. Según la configuración del sistema, los desarrolladores pueden elegir entre usar `Roles independientes`, `Permitir unión de roles` o `Solo unión de roles` para satisfacer diferentes necesidades de permisos.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Roles independientes

Por defecto, el sistema utiliza roles independientes. Esto significa que no se usa la unión de roles y los usuarios deben cambiar entre los roles que poseen de forma individual.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Permitir unión de roles

Esta opción permite a los desarrolladores del sistema habilitar la unión de roles. De este modo, los usuarios pueden tener simultáneamente los permisos de todos los roles asignados, al mismo tiempo que se les permite cambiar entre sus roles de forma individual.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Solo unión de roles

Con esta configuración, los usuarios están obligados a usar únicamente la unión de roles y no pueden cambiar entre roles de forma individual.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Reglas para la Unión de Roles

La unión de roles otorga los permisos máximos de todos los roles combinados. A continuación, explicamos cómo se resuelven los conflictos de permisos cuando los roles tienen configuraciones diferentes para el mismo permiso.

### Fusión de Permisos de Operación

Ejemplo: El Rol 1 está configurado para `Permitir configurar la interfaz` y el Rol 2 está configurado para `Permitir instalar, activar y deshabilitar plugins`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Al iniciar sesión con el rol de **Permisos Completos**, el usuario tendrá ambos permisos simultáneamente.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Fusión del Ámbito de Datos

#### Filas de Datos

Escenario 1: Múltiples roles establecen condiciones en el mismo campo.

Rol A, condición: Edad < 30

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B, condición: Edad > 25

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Después de la fusión:

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Escenario 2: Diferentes roles establecen condiciones en campos distintos.

Rol A, condición: Edad < 30

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B, condición: Nombre contiene "Ja"

| ID de Usuario | Nombre   | Edad |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

Después de la fusión:

| ID de Usuario | Nombre   | Edad |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Columnas de Datos

Rol A, campos visibles: Nombre, Edad

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B, campos visibles: Nombre, Sexo

| ID de Usuario | Nombre | Sexo   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

Después de la fusión:

| ID de Usuario | Nombre | Edad | Sexo   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Filas y Columnas Mixtas

Rol A, condición: Edad < 30, campos visibles: Nombre, Edad

| ID de Usuario | Nombre | Edad |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B, condición: Nombre contiene "Ja", campos visibles: Nombre, Sexo

| ID de Usuario | Nombre  | Sexo   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

Después de la fusión:

| ID de Usuario | Nombre  | Edad                                              | Sexo                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Nota: Las celdas con fondo rojo indican datos que eran invisibles en roles individuales, pero que ahora son visibles en el rol fusionado.**

#### Resumen

Reglas de fusión de roles para el ámbito de datos:

1. Entre filas, si se cumple alguna condición, la fila tiene permisos.
2. Entre columnas, los campos se combinan.
3. Cuando se configuran tanto filas como columnas, estas se fusionan por separado (filas con filas, columnas con columnas), y no como combinaciones de (fila + columna) con (fila + columna).