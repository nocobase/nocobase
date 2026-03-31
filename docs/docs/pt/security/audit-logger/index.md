---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Registro de Auditoria

## Introdução

O registro de auditoria é usado para registrar e rastrear as atividades dos usuários e o histórico de operações de recursos dentro do sistema.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Descrição dos Parâmetros

| Parâmetro                     | Descrição                                                                                                                               |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Recurso**                   | O tipo de recurso alvo da operação                                                                                                      |
| **Ação**                      | O tipo de operação realizada                                                                                                            |
| **Usuário**                   | O usuário que realizou a operação                                                                                                       |
| **Função**                    | A função do usuário durante a operação                                                                                                  |
| **Fonte de dados**            | A fonte de dados                                                                                                                        |
| **Coleção de destino**        | A coleção de destino                                                                                                                    |
| **ID Único do Registro de Destino** | O identificador único da coleção de destino                                                                                             |
| **Coleção de origem**         | A coleção de origem do campo de associação                                                                                              |
| **ID Único do Registro de Origem**  | O identificador único da coleção de origem                                                                                              |
| **Status**                    | O código de status HTTP da resposta da requisição da operação                                                                           |
| **Criado em**                 | A hora da operação                                                                                                                      |
| **UUID**                      | O identificador único da operação, consistente com o ID da Requisição da operação, pode ser usado para recuperar logs da aplicação. |
| **IP**                        | O endereço IP do usuário                                                                                                                |
| **UA**                        | As informações de UA do usuário                                                                                                         |
| **Metadados**                 | Metadados como parâmetros, corpo da requisição e conteúdo da resposta da requisição da operação.                                        |

## Descrição dos Recursos de Auditoria

Atualmente, as seguintes operações de recursos serão registradas no log de auditoria:

### Aplicação Principal

| Operação         | Descrição                  |
| :--------------- | :------------------------- |
| `app:restart`    | Reiniciar aplicativo       |
| `app:clearCache` | Limpar cache do aplicativo |

### Gerenciador de Plugins

| Operação     | Descrição         |
| :----------- | :---------------- |
| `pm:add`     | Adicionar plugin  |
| `pm:update`  | Atualizar plugin  |
| `pm:enable`  | Habilitar plugin  |
| `pm:disable` | Desabilitar plugin |
| `pm:remove`  | Remover plugin    |

### Autenticação de Usuário

| Operação              | Descrição     |
| :-------------------- | :------------ |
| `auth:signIn`         | Login         |
| `auth:signUp`         | Cadastro      |
| `auth:signOut`        | Logout        |
| `auth:changePassword` | Alterar senha |

### Usuário

| Operação              | Descrição       |
| :-------------------- | :-------------- |
| `users:updateProfile` | Atualizar perfil |

### Configuração da UI

| Operação                   | Descrição          |
| :------------------------- | :----------------- |
| `uiSchemas:insertAdjacent` | Inserir UI Schema  |
| `uiSchemas:patch`          | Modificar UI Schema |
| `uiSchemas:remove`         | Remover UI Schema  |

### Operações de Coleção

| Operação         | Descrição                             |
| :--------------- | :------------------------------------ |
| `create`         | Criar registro                        |
| `update`         | Atualizar registro                    |
| `destroy`        | Excluir registro                      |
| `updateOrCreate` | Atualizar ou criar registro           |
| `firstOrCreate`  | Consultar ou criar registro           |
| `move`           | Mover registro                        |
| `set`            | Definir registro de campo de associação |
| `add`            | Adicionar registro de campo de associação |
| `remove`         | Remover registro de campo de associação |
| `export`         | Exportar registro                     |
| `import`         | Importar registro                     |

## Adicionando Outros Recursos de Auditoria

Se você estendeu outras operações de recursos através de `plugins` e deseja registrar esses comportamentos de operação de recursos no log de auditoria, consulte a [API](/api/server/audit-manager.md).