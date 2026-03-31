---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Gerenciador de Notificações

## Introdução

O Gerenciador de Notificações é um serviço centralizado que integra múltiplos canais de notificação. Ele oferece uma interface unificada para configuração de canais, gerenciamento de envio e registro de logs, e suporta expansão flexível para canais adicionais.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Seção roxa**: O Gerenciador de Notificações fornece um serviço abrangente que inclui configuração de canais e registro de logs, com a opção de expandir para canais de notificação adicionais.
- **Seção verde**: Mensagem no Aplicativo (In-App Message), um canal integrado que permite que os usuários recebam notificações diretamente dentro do aplicativo.
- **Seção vermelha**: E-mail, um canal extensível que permite que os usuários recebam notificações por e-mail.

## Gerenciamento de Canais

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Os canais atualmente suportados são:

- [Mensagem no Aplicativo](/notification-manager/notification-in-app-message)
- [E-mail](/notification-manager/notification-email) (usando transporte SMTP integrado)

Você também pode estender para mais canais, consulte a documentação de [Extensão de Canais](/notification-manager/development/extension).

## Logs de Notificação

O sistema registra informações detalhadas e o status de cada notificação, facilitando a análise e a solução de problemas.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Nó de Notificação do Fluxo de Trabalho

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)