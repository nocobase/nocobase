---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Papéis

## Central de Gerenciamento

### Gerenciamento de Papéis

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

O aplicativo, após a instalação inicial, já vem com dois papéis predefinidos: "Admin" e "Member". Cada um deles possui configurações de permissões padrão diferentes.

### Adicionar, Excluir e Modificar Papéis

O identificador do papel é um identificador único do sistema. Você pode personalizar os papéis padrão, mas não é possível excluir os papéis predefinidos do sistema.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Definir o Papel Padrão

O papel padrão aqui se refere ao papel que será atribuído automaticamente a novos usuários caso nenhum papel específico seja definido no momento da criação.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## Central Pessoal

### Troca de Papéis

Você pode atribuir múltiplos papéis a um usuário. Quando um usuário possui vários papéis, ele pode alternar entre eles na Central Pessoal.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

A prioridade do papel padrão ao entrar no sistema é determinada da seguinte forma: o papel que foi trocado pela última vez (este valor é atualizado a cada troca de papel) > o primeiro papel (papel padrão do sistema).