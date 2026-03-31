:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Sincronizando Dados de Usuário via API HTTP

## Obtendo uma Chave de API

Consulte [Chaves de API](/auth-verification/api-keys). Certifique-se de que a função associada à chave de API tenha as permissões necessárias para sincronizar dados de usuário.

## Visão Geral da API

### Exemplo

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Veja os detalhes do corpo da requisição abaixo
```

### Endpoint

```bash
POST /api/userData:push
```

### Formato dos Dados de Usuário

#### UserData

| Parâmetro  | Tipo                               | Descrição                                                                 |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Obrigatório. Tipo de dado sendo enviado. Use `user` para enviar dados de usuário. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Opcional. Usado para encontrar usuários existentes no sistema com base no campo especificado. |
| `records`  | `UserRecord[]`                     | Obrigatório. Array de registros de dados de usuário.                      |

#### UserRecord

| Parâmetro     | Tipo       | Descrição                                                                                                 |
| ------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Obrigatório. Identificador único para os dados do usuário de origem, usado para associar os dados de origem ao usuário do sistema. Imutável para um usuário. |
| `nickname`    | `string`   | Opcional. Apelido do usuário.                                                                             |
| `username`    | `string`   | Opcional. Nome de usuário.                                                                                |
| `email`       | `string`   | Opcional. Endereço de e-mail do usuário.                                                                  |
| `phone`       | `string`   | Opcional. Número de telefone do usuário.                                                                  |
| `departments` | `string[]` | Opcional. Array de UIDs dos departamentos aos quais o usuário pertence.                                    |
| `isDeleted`   | `boolean`  | Opcional. Indica se o registro foi excluído.                                                              |
| `<field>`     | `any`      | Opcional. Campos personalizados na tabela de usuário.                                                     |

### Formato dos Dados de Departamento

:::info
Para enviar dados de departamento, o plugin [Departamentos](../../departments) precisa estar instalado e ativado.
:::

#### DepartmentData

| Parâmetro  | Tipo                     | Descrição                                                                |
| ---------- | ------------------------ | ------------------------------------------------------------------------ |
| `dataType` | `'user' \| 'department'` | Obrigatório. Tipo de dado sendo enviado. Use `department` para dados de departamento. |
| `records`  | `DepartmentRecord[]`     | Obrigatório. Array de registros de dados de departamento.                |

#### DepartmentRecord

| Parâmetro   | Tipo      | Descrição                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Obrigatório. Identificador único para os dados do departamento de origem, usado para associar os dados de origem ao departamento do sistema. Imutável. |
| `title`     | `string`  | Obrigatório. Título do departamento.                                                                                |
| `parentUid` | `string`  | Opcional. UID do departamento pai.                                                                                  |
| `isDeleted` | `boolean` | Opcional. Indica se o registro foi excluído.                                                                        |
| `<field>`   | `any`     | Opcional. Campos personalizados na tabela de departamento.                                                          |

:::info

1. O envio de dados é uma operação idempotente.
2. Se um departamento pai não existir ao enviar dados de departamento, a associação não poderá ser feita. Você pode enviar os dados novamente após a criação do departamento pai.
3. Se o departamento de um usuário não existir ao enviar dados de usuário, o usuário não poderá ser associado a esse departamento. Você pode enviar os dados do usuário novamente após o envio dos dados do departamento.

:::