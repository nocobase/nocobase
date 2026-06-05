:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Sincronizar datos de usuario a través de la API HTTP

## Obtener una clave API

Consulte [Claves API](/auth-verification/api-keys). Asegúrese de que el rol asociado a la clave API tenga los permisos necesarios para sincronizar los datos de usuario.

## Descripción general de la API

### Ejemplo

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Consulte los detalles del cuerpo de la solicitud a continuación
```

### Endpoint

```bash
POST /api/userData:push
```

### Formato de datos de usuario

#### UserData

| Parámetro  | Tipo                               | Descripción                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Obligatorio. Tipo de datos que se envían. Use `user` para enviar datos de usuario. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Opcional. Se utiliza para buscar y emparejar usuarios existentes en el sistema basándose en el campo especificado. |
| `records`  | `UserRecord[]`                     | Obligatorio. Array de registros de datos de usuario.                        |

#### UserRecord

| Parámetro     | Tipo       | Descripción                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Obligatorio. Identificador único para los datos de usuario de origen, utilizado para asociar los datos de origen con el usuario del sistema. Inmutable para un usuario. |
| `nickname`    | `string`   | Opcional. Apodo del usuario.                                                                                |
| `username`    | `string`   | Opcional. Nombre de usuario.                                                                                |
| `email`       | `string`   | Opcional. Dirección de correo electrónico del usuario.                                                      |
| `phone`       | `string`   | Opcional. Número de teléfono del usuario.                                                                   |
| `departments` | `string[]` | Opcional. Array de UIDs de los departamentos a los que pertenece el usuario.                                |
| `isDeleted`   | `boolean`  | Opcional. Indica si el registro ha sido eliminado.                                                          |
| `<field>`     | `any`      | Opcional. Campos personalizados en la tabla de usuarios.                                                    |

### Formato de datos de departamento

:::info
Para enviar datos de departamento, es necesario tener instalado y habilitado el [plugin de Departamentos](../../departments).
:::

#### DepartmentData

| Parámetro  | Tipo                     | Descripción                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Obligatorio. Tipo de datos que se envían. Use `department` para datos de departamento. |
| `records`  | `DepartmentRecord[]`     | Obligatorio. Array de registros de datos de departamento.                  |

#### DepartmentRecord

| Parámetro   | Tipo      | Descripción                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Obligatorio. Identificador único para los datos de departamento de origen, utilizado para asociar los datos de origen con el departamento del sistema. Inmutable. |
| `title`     | `string`  | Obligatorio. Título del departamento.                                                                               |
| `parentUid` | `string`  | Opcional. UID del departamento padre.                                                                               |
| `isDeleted` | `boolean` | Opcional. Indica si el registro ha sido eliminado.                                                                  |
| `<field>`   | `any`     | Opcional. Campos personalizados en la tabla de departamentos.                                                     |

:::info

1. El envío de datos es una operación idempotente.
2. Si un departamento padre no existe al enviar datos de departamento, la asociación no se podrá realizar. Puede volver a enviar los datos una vez que el departamento padre haya sido creado.
3. Si el departamento de un usuario no existe al enviar datos de usuario, el usuario no podrá ser asociado a ese departamento. Puede volver a enviar los datos de usuario después de haber enviado los datos del departamento.

:::