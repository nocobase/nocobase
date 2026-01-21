---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Autenticação: LDAP

## Introdução

O plugin Autenticação: LDAP segue o padrão do protocolo LDAP (Lightweight Directory Access Protocol), permitindo que os usuários façam login no NocoBase usando as credenciais da sua conta no servidor LDAP.

## Ativar o plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Adicionar Autenticação LDAP

Acesse a página de gerenciamento de plugins de autenticação de usuários.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Adicionar - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuração

### Configuração Básica

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Cadastrar automaticamente quando o usuário não existir - Define se um novo usuário deve ser criado automaticamente caso nenhum usuário existente correspondente seja encontrado para vinculação.
- URL do LDAP - Endereço do servidor LDAP
- DN de Bind - DN usado para testar a conectividade do servidor e pesquisar usuários.
- Senha de Bind - Senha do DN de Bind.
- Testar conexão - Clique no botão para testar a conectividade do servidor e a validade do DN de Bind.

### Configuração de Busca

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- DN de Busca - DN usado para buscar usuários.
- Filtro de Busca - Condição de filtro para buscar usuários, usando `{{account}}` para representar a conta de usuário usada no login.
- Escopo - `Base`, `Um nível`, `Subárvore`, padrão `Subárvore`.
- Limite de tamanho - Tamanho da página de busca.

### Mapeamento de Atributos

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Usar este campo para vincular o usuário - Campo usado para vincular a usuários existentes. Selecione 'nome de usuário' se a conta de login for um nome de usuário, ou 'e-mail' se for um endereço de e-mail. O padrão é nome de usuário.
- Mapeamento de atributos - Mapeamento dos atributos do usuário para os campos da tabela de usuários do NocoBase.

## Login

Acesse a página de login e insira o nome de usuário e a senha do LDAP no formulário de login.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>