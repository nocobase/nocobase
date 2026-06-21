# Capítulo 5: Usuários e Permissões — Quem Pode Ver o Quê

No capítulo anterior, terminamos o formulário e a página de detalhes; o sistema de tickets já consegue inserir e consultar dados normalmente. Mas há um problema — todos os usuários veem a mesma coisa após login. Funcionários comuns que abrem tickets veem páginas de gerenciamento, técnicos podem excluir categorias... isso não pode acontecer.

Neste capítulo vamos colocar uma "portaria" no sistema: criar [funções](/users-permissions/acl/role), configurar [permissões de menu](/users-permissions/acl/permissions) e [escopo de dados](/users-permissions/acl/permissions), implementando **pessoas diferentes vendo menus diferentes e operando dados diferentes**.

## 5.1 Entendendo [Funções](/users-permissions/acl/role) (Role)

No NocoBase, **uma função é um conjunto de [permissões](/users-permissions/acl/role)**. Você não precisa configurar permissão para cada usuário individualmente; em vez disso, define algumas funções e coloca cada usuário na função correspondente.

Após instalar o NocoBase, ele já vem com três funções:

- **Root**: super administrador, com todas as permissões, não pode ser excluído
- **Admin**: administrador, com permissão padrão para configurar a interface
- **Member**: membro comum, com permissões padrão limitadas

Mas essas três funções embutidas não bastam. Nosso sistema de tickets precisa de divisões mais finas, então vamos criar 3 funções personalizadas.

## 5.2 Criar Três Funções

Abra o menu de configurações no canto superior direito, vá em **Usuários e Permissões → Gerenciamento de Funções**.

Clique em **Adicionar função**, e crie em sequência:

| Nome da função | Identificador da função | Descrição |
|---------|---------|------|
| Administrador | admin-helpdesk | Vê todos os tickets, gerencia categorias, atribui atendentes |
| Técnico | technician | Só vê tickets atribuídos a si próprio, pode tratar e fechar |
| Usuário comum | user | Só pode submeter tickets, só vê os próprios |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> O **identificador da função** é um ID único usado internamente pelo sistema, não pode ser alterado após criação; recomenda-se usar letras minúsculas em inglês. O nome da função pode ser alterado a qualquer momento.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Após criar, você deve ver as três funções recém-criadas na lista de funções.


## 5.3 Configurar Permissões de Menu

Funções criadas, em seguida vamos dizer ao sistema: cada função pode ver quais menus.

Clique em uma função para entrar na página de configuração de permissão e encontre a aba **Permissão de acesso a menu**. Aqui são listados todos os itens de menu do sistema; marcar é permitir acesso, desmarcar é esconder.

**Administrador (admin-helpdesk)**: marcar tudo
- Gerenciamento de Tickets, Gerenciamento de Categorias, Dashboard — tudo visível

**Técnico (technician)**: marcar parte
- ✅ Gerenciamento de Tickets
- ✅ Dashboard
- ❌ Gerenciamento de Categorias (técnicos não precisam gerenciar categorias)

**Usuário comum (user)**: permissão mínima
- ✅ Gerenciamento de Tickets (só vê os próprios tickets)
- ❌ Gerenciamento de Categorias
- ❌ Dashboard

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Dica**: o NocoBase tem uma configuração útil — "Permitir acesso a novos itens de menu por padrão". Se você não quer ter que marcar manualmente toda vez que adicionar uma página, ative isso na função de administrador. Para a função de usuário comum, recomenda-se desativar.

## 5.4 Configurar Permissões de Dados

Permissões de menu controlam "se dá pra entrar nessa página"; permissões de dados controlam "ao entrar na página, quais dados se vê".

Conceito-chave: **[Escopo de dados](/users-permissions/acl/permissions) (Data Scope)**.

Na configuração de permissão da função, mude para a aba **Permissão de operação de [tabela](/data-sources/data-modeling/collection)**. Encontre a tabela "Tickets", clique para entrar em configuração específica.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Usuário comum: só vê tickets que abriu

1. Encontre a permissão **Visualizar** da tabela "Tickets"
2. Em escopo de dados, escolha → **Dados próprios**
3. Assim, o usuário comum só vê tickets cujo "criador é ele mesmo" (Atenção, a opção padrão usa o campo de criador do sistema, não o campo Criador, mas pode ser modificado)

Da mesma forma, defina as permissões "Editar" e "Excluir" como **Dados próprios** (ou simplesmente não dê permissão de excluir).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


Sobre a configuração global: se você só configurar a tabela de tickets, pode ser que outros dados/configurações (como tabela de categorias, atendente) fiquem invisíveis. Nosso sistema atual é simples; aqui vamos marcar diretamente «Visualizar todos os dados» na configuração global e configurar permissões individuais para tabelas com escopo sensível.

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Técnico: só vê tickets atribuídos a si

1. Encontre a permissão **Visualizar** da tabela "Tickets"
2. Em escopo de dados, escolha → **Dados próprios**
3. Mas aqui há um detalhe — o "Dados próprios" do NocoBase, por padrão, filtra pelo criador. Se quisermos filtrar pelo "Atendente", podemos ajustar nas [permissões de operação](/users-permissions/acl/permissions) globais ou implementar via **condição de filtro do [bloco](/interface-builder/blocks) de dados** na página frontend

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Dica prática**: também pode definir condições de filtro padrão no bloco de tabela como auxílio ao controle de permissão, por exemplo "Atendente = Usuário atual". Mas a configuração de página tem efeito global, e o administrador também ficaria limitado. Solução intermediária: configurar "Atendente = Usuário atual **ou** Criador = Usuário atual", compatibilizando usuários comuns e técnicos; se o administrador precisa ter visão global, basta criar uma página separada sem filtro.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Administrador: vê todos os dados

Para a função de administrador, escolha **Todos os dados** como escopo, e abra todas as operações. Simples e direto.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Operação de Atribuição de Tickets

Antes de finalizar as permissões, vamos adicionar uma funcionalidade prática à lista de tickets: **atribuir atendente**. O administrador pode atribuir o ticket a um técnico diretamente na lista, sem precisar entrar na página de edição e mexer em vários campos.

Implementação simples — adicionar um botão de popup personalizado na coluna de operações da tabela:

1. Entre no modo UI Editor, na coluna de operações da tabela de lista de tickets, clique em **«+»** para adicionar um botão de ação **«Popup»**.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Mude o título do botão para **«Atribuir»** (clique nas configurações do botão para alterar o título).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Como temos só uma simples informação de atribuição, é mais adequado um popup simples do que uma gaveta. No canto superior direito do botão escolha configuração de popup, escolha caixa de diálogo estreita > confirmar
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Clique no botão «Atribuir» para abrir o popup; no popup **«Criar bloco → bloco de dados → Formulário (Editar)»**, escolha tabela atual.
4. No formulário, marque apenas o campo **«Atendente»**, e nas configurações do campo defina como **obrigatório**.
5. Adicione o botão de ação **«Submeter»**.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Assim, o administrador na lista de tickets clica em «Atribuir», abre um formulário minimalista, escolhe o atendente e submete. Rápido, preciso, sem alterar acidentalmente outros campos.

### Usar regras de vinculação para controlar exibição/ocultação do botão

O botão «Atribuir» só é necessário para administradores; usuários comuns e técnicos vendo isso só causa confusão. Podemos usar **regras de vinculação** baseadas na função do usuário atual para controlar exibição/ocultação do botão:

1. No modo UI Editor, clique nas configurações do botão «Atribuir» e encontre **«Regras de vinculação»**.
2. Adicione uma regra com a condição: **Usuário atual / Função / Nome da função** diferente de **Administrador** (ou seja, o nome correspondente à função admin-helpdesk).
3. Ação ao satisfazer a condição: **esconder** o botão.

Assim, só usuários com a função de administrador veem o botão «Atribuir»; outras funções, ao logar, veem esse botão escondido automaticamente.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Criar Usuários de Teste e Experimentar

Permissões configuradas, vamos validar de verdade.

Vá em **Gerenciamento de Usuários** (centro de configurações ou a página de gerenciamento de usuários que você montou antes), e crie 3 usuários de teste:

| Usuário | Função |
|-------|------|
| Alice | Administrador (admin-helpdesk) |
| Bob | Técnico (technician) |
| Charlie | Usuário comum (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Após criar, faça login com cada uma dessas três contas e verifique duas coisas:

**1. Os menus aparecem como esperado?**
- Alice → vê todos os menus

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → só vê Gerenciamento de Tickets e Dashboard

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → só vê "Meus Tickets"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. Os dados são filtrados como esperado?**
- Use Alice para criar alguns tickets, atribuindo a diferentes atendentes
- Mude para a conta Bob → vê só os tickets atribuídos a si
- Mude para a conta Charlie → vê só os tickets que ele criou

Não é incrível? Mesmo sistema, usuários diferentes veem conteúdos completamente diferentes! Esse é o poder das permissões.

## Resumo

Neste capítulo concluímos o sistema de permissões do sistema de tickets:

- **3 funções**: Administrador, Técnico, Usuário comum
- **Permissões de menu**: controlam quais páginas cada função pode acessar
- **Permissões de dados**: controlam quais dados cada função pode ver (via escopo de dados)
- **Validação por teste**: login com diferentes contas, confirmando que as permissões funcionam

Até aqui, o sistema de tickets já está bem encaminhado — consegue inserir, consultar, e controlar acesso por função. Mas todas as operações ainda são manuais.

## Prévia do Próximo Capítulo

No próximo capítulo vamos aprender **Workflow** — fazer o sistema agir sozinho. Por exemplo, ticket submetido notifica o atendente automaticamente; mudança de status registra log automaticamente.

## Recursos Relacionados

- [Gerenciamento de usuários](/users-permissions/user) — explicação detalhada do gerenciamento de usuários
- [Funções e permissões](/users-permissions/acl/role) — explicação da configuração de funções
- [Escopo de dados](/users-permissions/acl/permissions) — controle de permissão em nível de dados
