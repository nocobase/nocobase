# Implementando Revisão de Cadastro de Usuário

Este documento apresenta duas abordagens para implementar a revisão de cadastro de usuário, projetadas para diferentes cenários de negócio:

- **Abordagem 1**: adequada para cenários que precisam de um fluxo simples e rápido de revisão de cadastro. Essa abordagem usa a função padrão de cadastro do sistema, atribui a todos os novos usuários uma role «Visitante» sem permissões, e o administrador, depois, faz a revisão manual no backend e atualiza a role.
- **Abordagem 2**: adequada para cenários que precisam de um fluxo de revisão mais flexível e personalizado. Por meio do projeto de uma tabela de informações de aplicação dedicada, configuração de workflow de revisão e ativação do [plugin de Formulário Público](https://docs-cn.nocobase.com/handbook/public-forms), implementa o gerenciamento completo do envio do cadastro até a criação automática do usuário.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Abordagem 1: Usar a Role «Visitante» Sem Permissões

### 1.0 Cenário

Adequado para casos com requisitos de revisão de cadastro mais simples, em que se quer usar a função de cadastro nativa do sistema e fazer revisão manual de usuário no backend.

### 1.1 Habilitar autenticação por senha, permitir cadastro de usuário

#### 1.1.1 Acessar a página de autenticação de usuário

Primeiro, precisamos confirmar se a função de cadastro está habilitada. Em configurações do sistema, vá até [Autenticação de Usuário](https://docs-cn.nocobase.com/handbook/auth/user) — essa página gerencia todos os canais de autenticação, como «login com conta e senha», [login com Google](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google) (extensível via plugins).

![](https://static-docs.nocobase.com/20250208164554.png)

O interruptor de cadastro está aqui:
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Definir Role Padrão (Crítico)

#### 1.2.1 Criar role «Visitante»

O sistema vem com cadastro habilitado por padrão, mas a role padrão pode não ser adequada.

Então primeiro precisamos criar uma role «Visitante» na 【lista de roles】, como role padrão, sem nenhuma permissão. Todos os novos usuários cadastrados serão automaticamente atribuídos a essa role.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Configurar Tela de Revisão de Usuário (Crítico)

Mude para o modo de edição e configure no backend um simples bloco de tabela, escolhendo a tabela de usuários, para exibir e gerenciar os usuários cadastrados.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Testar Fluxo de Revisão, Atualizar Role Manualmente

- Após o cadastro, a página exibe vazio por padrão
  ![](https://static-docs.nocobase.com/20250219084449.png)
- Na tela de gerenciamento, para os usuários cuja informação está correta, mude manualmente a role para a role designada, concluindo a revisão.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Configurar Página de Aviso (Opcional)

#### 1.5.1 Crie uma nova página, por exemplo «Cadastro Concluído», com a mensagem informativa

> **Passo opcional**: nessa página em branco podemos adicionar uma mensagem amigável, como «Sua conta está sob revisão, aguarde a aprovação», para informar o status atual.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Atribuir permissão da página de aviso

Em seguida, vá ao gerenciamento de permissões e atribua essa página à role «Visitante». Após o cadastro, será redirecionado automaticamente.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Estender Campos da Tabela de Usuários (Opcional)

> **Passo opcional**: se precisar coletar informações adicionais no cadastro para auxiliar na revisão, adicione campos relevantes à tabela de usuários (por exemplo «Motivo da aplicação» ou «Código de convite»). Se basta o cadastro com revisão básica, esse passo pode ser ignorado.

#### 1.6.1 Adicionar campos de aplicação

Vá em 【Tabela de usuários】 e adicione um campo, para registrar o motivo da aplicação ou o código de convite preenchido pelo usuário no cadastro.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Habilitar campos em «Autenticação de Usuário»

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Após configurar, vá à página de login e clique em 【Cadastrar conta】 — verá os campos correspondentes no formulário (se configurados como opcionais aparecem; senão, é o formulário básico).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Adicionar campos correspondentes na tela de revisão

Adicione esses dois campos também na tela de revisão, podendo revisar e modificar a role do usuário em tempo real.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Abordagem 2: Não Abrir Canal de Cadastro, Adicionar Tabela Intermediária de Revisão

### 2.0 Cenário

Adequada para cenários que precisam de um fluxo de revisão de cadastro mais flexível e personalizado.

Essa abordagem, com uma tabela de informações de aplicação independente, configuração de workflow e [plugin de Formulário Público](https://docs-cn.nocobase.com/handbook/public-forms), implementa o fluxo completo da submissão da aplicação até a criação automática do usuário; os passos centrais garantem a funcionalidade básica, e mais funções podem ser adicionadas posteriormente conforme necessidade.

### 2.1 Preparação Inicial (Crítico)

#### 2.1.1 Projetar a tabela de informações de aplicação

##### 2.1.1.1 Criar a tabela «Informações de Aplicação»

- **Criar tabela**
  No backend do NocoBase, crie uma nova tabela para armazenar as informações de aplicação de cadastro de usuário.
- **Configurar campos**
  Adicione os seguintes campos, garantindo que os tipos e descrições estão corretos:


  | Field display name     | Field name         | Field interface  | Description                                      |
  | ---------------------- | ------------------ | ---------------- | ------------------------------------------------ |
  | **ID**                 | id                 | Integer          | ID único do registro, gerado automaticamente     |
  | **Username**           | username           | Single line text | Nome de usuário do solicitante                   |
  | **Email**              | email              | Email            | Endereço de e-mail do solicitante                |
  | **Phone**              | phone              | Phone            | Telefone de contato do solicitante               |
  | **Full Name**          | full_name          | Single line text | Nome completo do solicitante                     |
  | **Application Reason** | application_reason | Long text        | Motivo ou justificativa da aplicação             |
  | **User Type**          | user_type          | Single select    | Tipo de usuário futuro (e-mail, cadastro aberto) |
  | **Status**             | status             | Single select    | Status atual da aplicação (aguardando, aprovado, recusado) |
  | **Initial Password**   | initial_password   | Single line text | Senha inicial do novo usuário (padrão nocobase)  |
  | **Created at**         | createdAt          | Created at       | Data de criação registrada pelo sistema          |
  | **Created by**         | createdBy          | Created by       | Criador registrado pelo sistema                  |
  | **Last updated at**    | updatedAt          | Last updated at  | Última atualização registrada pelo sistema       |
  | **Last updated by**    | updatedBy          | Last updated by  | Último a modificar registrado pelo sistema       |
- **Pré-visualizar estrutura**
  Confirme que a estrutura está como na figura abaixo:
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Inserção e exibição de dados

- **Configurar tela de revisão**
  Na tela principal, configure uma tela de gerenciamento «Revisão de Cadastro» para exibir as informações de aplicação submetidas pelos usuários.
- **Inserir dados de teste**
  Vá à tela de gerenciamento e insira dados de teste, garantindo que os dados sejam exibidos corretamente.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Configuração do Workflow

Esta seção apresenta como configurar o workflow para criar automaticamente novos usuários após a aprovação.

#### 2.2.1 Criar workflow de revisão

##### 2.2.1.1 Criar novo workflow

- **Acessar tela de workflow**
  No backend do NocoBase, vá à página de configuração de workflow e escolha «Novo workflow».
- **Escolher evento de gatilho**
  Pode escolher [«Evento Pós-Ação»](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) ou [«Evento Pré-Ação»](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action); aqui usamos como exemplo o evento pré-ação.
- **Configurar nós do workflow**
  Crie um nó «Adicionar Usuário» que converte os dados do formulário atual em dados de novo usuário, e configure o mapeamento de campos e a lógica de processamento.
  Veja a figura:
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Configurar Botões de Revisão do Formulário

##### 2.2.2.1 Adicionar botões «Aprovar» e «Recusar»

No formulário de informações de aplicação, adicione os botões «Aprovar revisão» e «Recusar revisão».
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Configurar funcionalidades dos botões

- **Configurar botão «Aprovar revisão»**
  - Vincular ao workflow recém-criado;
  - Ao submeter, definir o valor do campo 【Status】 como «Aprovado».
    Veja:
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **Configurar botão «Recusar revisão»**
  - Ao submeter, definir o valor do campo 【Status】 como «Recusado».

##### 2.2.2.3 Configurar regras de vinculação dos botões

Para evitar operações repetidas, configure regras de vinculação: quando 【Status】 não for 【Aguardando revisão】, esconder os botões.
Veja:
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Ativar e Configurar o Plugin de Formulário Público

Use o [plugin de Formulário Público](https://docs-cn.nocobase.com/handbook/public-forms) para que o usuário possa submeter o cadastro pela página.

#### 2.3.1 Ativar o plugin de formulário público

##### 2.3.1.1 Operação de ativação do plugin

- **Acessar gerenciamento de plugins**
  Na tela de administração do backend, encontre e ative o plugin «Formulário Público».
  Veja:
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Criar e configurar formulário público

##### 2.3.2.1 Criar formulário público

- **Criar novo formulário**
  No backend, crie um formulário público para submissão de aplicação de cadastro.
- **Configurar elementos do formulário**
  Adicione os elementos necessários (nome de usuário, e-mail, telefone, etc.) e configure as regras de validação correspondentes.
  Veja:
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Ativar e configurar o plugin de formulário público (Crítico)

##### 2.3.3.1 Testar formulário público

- **Abrir página**
  Acesse a página do formulário público, preencha e submeta os dados.
- **Validar funcionalidade**
  Verifique se os dados entram corretamente na tabela de informações de aplicação, e se após a aprovação no workflow o novo usuário é criado automaticamente.
  Veja o teste:
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Extensões Posteriores (Passos opcionais)

Após concluir o fluxo básico de cadastro e revisão, podemos estender outras funcionalidades conforme necessidade:

#### 2.4.1 Cadastro com código de convite

- **Descrição**: usando código de convite para limitar o escopo e a quantidade de usuários cadastrados.
- **Ideia de configuração**: adicione um campo de código de convite na tabela de aplicação; use «Evento Pré-Ação» para validar e interceptar esse campo antes da submissão.

#### 2.4.2 Notificação automática por e-mail

- **Descrição**: implementar notificação automática por e-mail de resultado de revisão, sucesso de cadastro etc.
- **Ideia de configuração**: combine o nó de e-mail do NocoBase, adicionando uma operação de envio de e-mail no workflow.

---

Se encontrar qualquer problema durante o processo, sinta-se à vontade para conversar na [comunidade NocoBase](https://forum.nocobase.com) ou consultar a [documentação oficial](https://docs-cn.nocobase.com). Esperamos que este guia possa ajudar você a implementar a revisão de cadastro de usuário conforme necessidades reais e a estendê-la flexivelmente. Bom uso e sucesso no projeto!
