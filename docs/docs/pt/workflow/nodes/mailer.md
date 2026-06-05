---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Enviar e-mail

## Introdução

Usado para enviar e-mails. Suporta conteúdo nos formatos de texto e HTML.

## Criar nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição (“+”) no fluxo para adicionar um nó de “Enviar e-mail”:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Configuração do nó

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Cada opção pode usar variáveis do contexto do **fluxo de trabalho**. Para informações sensíveis, você também pode usar variáveis globais e segredos.

## Perguntas Frequentes

### Limite de frequência de envio do Gmail

Ao enviar alguns e-mails, você pode encontrar o seguinte erro:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Isso ocorre porque o Gmail limita a frequência de solicitações de envio de domínios não especificados. Ao implantar o aplicativo, você precisa configurar o nome do host do servidor para o domínio que você configurou no Gmail. Por exemplo, em uma implantação Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Defina para o seu domínio de envio configurado
```

Referência: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)