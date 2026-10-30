---
pkg: '@nocobase/plugin-feishu'
---

# Autenticação: Feishu / Lark

## Introdução

O plugin **Feishu / Lark** permite que usuários entrem no NocoBase com a conta Feishu ou Lark, com login automático opcional.

## Ativar o plugin

Feishu / Lark é um plugin comercial. Instale e ative no gerenciador de plugins junto com o plugin **Autenticação de usuários**.

## Criar um aplicativo na plataforma aberta

Acesse a [plataforma aberta do Feishu](https://open.feishu.cn/) e crie um **aplicativo interno da empresa** (para Lark use a [plataforma aberta do Lark](https://open.larksuite.com/)). Anote o **App ID** e o **App Secret**.

O login não exige permissões de API adicionais. Para sincronização de contatos, veja [Sincronizar dados de usuário do Feishu](/users-permissions/sync/sources/feishu).

## Configurar a URL de redirecionamento

Em **Configurações de segurança** → **URLs de redirecionamento** do aplicativo, adicione a URL de callback exibida pelo NocoBase:

```
https://seu-dominio/api/feishu:redirect
```

O mais simples é copiar a **URL de redirecionamento** exibida na página de configuração do autenticador no NocoBase.

:::warning
Se o NocoBase estiver em um subcaminho (ex. `APP_PUBLIC_PATH=/nocobase/`), a URL de callback inclui o prefixo, ex. `https://seu-dominio/nocobase/api/feishu:redirect`. A URL na lista de permissões da plataforma deve ser idêntica à URL real.
:::

## Adicionar autenticação Feishu no NocoBase

Abra **Autenticação de usuários** e adicione um autenticador **Feishu / Lark**:

| Campo | Descrição |
| --- | --- |
| Cadastro automático | Cria a conta no primeiro login. Ativado por padrão. |
| Região | `Feishu China` ou `Lark Global`. |
| App ID / App Secret | Credenciais do aplicativo Feishu. Variáveis de ambiente e segredos são suportados. |
| Origin | Endereço público do site, ex. `https://example.com`. Somente protocolo e domínio, sem caminho (barra final opcional); vazio usa o endereço da requisição atual. |
| Campo de identificador único | A chave de identidade do usuário, veja abaixo. |
| Login automático | Login silencioso ao abrir o app dentro do Feishu, veja abaixo. |

## Escolher o campo de identificador único

| Campo | Descrição |
| --- | --- |
| `union_id` | Recomendado. Estável e compartilhado por todos os apps da mesma conta de desenvolvedor. |
| `open_id` | Único por aplicativo; muda ao trocar de app. |
| `user_id` | Único dentro do tenant; pode conflitar em cenários multi-tenant. |
| `mobile` / `email` | Mutáveis e podem estar vazios; inadequados como identificador. |

Mantenha essa escolha estável após usuários entrarem. Se usar sincronização de dados, selecione o mesmo campo na fonte.

## Login e cadastro automático

O usuário clica em **Feishu / Lark** na página de login para concluir o OAuth. Com cadastro automático:

- usuários são localizados ou criados pelo **campo de identificador único**;
- telefone, e-mail e apelido só são preenchidos se o perfil estiver vazio; valores existentes nunca são sobrescritos.

## Login automático

Com **Login automático**, abrir o app dentro do cliente Feishu inicia o OAuth sem clicar em botão. Apenas um autenticador Feishu pode ativá-lo por vez.

Requisitos:

- a URL de callback está na lista de **URLs de redirecionamento**;
- o aplicativo está publicado e o usuário dentro do escopo de disponibilidade;
- o app é aberto dentro do cliente Feishu.

O primeiro uso mostra uma página de consentimento única; depois o acesso é silencioso. Abrir no navegador do sistema não dispara login automático — comportamento esperado.

## Acesso pelo workbench do Feishu (opcional)

Configure a página inicial desktop/mobile em **Recursos do aplicativo** → **Aplicativo web** para que usuários abram o NocoBase direto do workbench do Feishu. A URL deve coincidir com o endereço real (incluindo o prefixo de subcaminho).
