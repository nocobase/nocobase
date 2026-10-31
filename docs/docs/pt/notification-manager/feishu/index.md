---
pkg: '@nocobase/plugin-feishu'
---

# Notificação: Feishu / Lark

## Introdução

O plugin **Feishu / Lark** permite enviar mensagens de notificação a usuários do Feishu.

## Adicionar e configurar autenticador Feishu

Adicione e configure primeiro um autenticador Feishu no NocoBase, veja [Autenticação: Feishu / Lark](/auth-verification/auth-feishu/). Somente usuários que entraram via Feishu recebem notificações do sistema pelo Feishu.

As mensagens são enviadas pelo aplicativo Feishu do autenticador escolhido, que adicionalmente exige:

1. O recurso **Bot** adicionado em **Recursos do aplicativo** na plataforma aberta — sem ele o envio falha;
2. A permissão **Enviar mensagens como bot** (`im:message:send_as_bot`) ativa em **Gerenciamento de permissões**, com nova versão publicada;
3. Destinatários dentro do **escopo de permissões de contatos** (disponibilidade) do aplicativo.

Após alterar recursos ou permissões, publique uma nova versão e tente novamente.

## Adicionar canal de notificação Feishu

Abra **Gerenciamento de notificações** → canais, adicione um canal **Feishu / Lark** e selecione o autenticador configurado.

Opcionalmente configure o **Tipo de ID do destinatário** (`open_id`, `user_id`, `union_id` ou `email`); o padrão segue o campo identificador do autenticador.

## Tipos de mensagem

| Tipo | Descrição |
| --- | --- |
| Mensagem de texto | Texto simples. |
| Mensagem Post | Texto rico no formato Post do Feishu. |
| Cartão interativo | Cartão Feishu configurado via JSON. |

Destinatários são resolvidos pela identidade Feishu vinculada ao autenticador (conforme o tipo de ID); não vinculados caem para e-mail ou nome de usuário.

## Nó de notificação no fluxo de trabalho

Selecione o canal Feishu configurado no nó de notificação do fluxo de trabalho para enviar mensagens aos usuários do contexto.

## Solução de problemas

- Falha com erro de permissão (ex. código `230002`): verifique o recurso **Bot**, a permissão **Enviar mensagens como bot** e a publicação da versão mais recente.
- Falha com destinatário inválido (erros `receive_id`): usuário fora do escopo de contatos ou tipo de ID incompatível com o canal.
- A tarefa exibe apenas erro genérico: procure `FeishuNotificationChannel.send failed` nos logs do servidor; versões recentes do plugin registram também o código e a mensagem de erro do Feishu.
