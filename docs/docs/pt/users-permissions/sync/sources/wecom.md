---
pkg: "@nocobase/plugin-wecom"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Sincronizar Dados de Usuários do WeChat Work



## Introdução

O **plugin** do WeChat Work permite sincronizar dados de usuários e departamentos do WeChat Work.

## Criar e Configurar um Aplicativo Personalizado do WeChat Work

Primeiro, você precisa criar um aplicativo personalizado no console de administração do WeChat Work e obter o **ID da Empresa**, **AgentId** e **Secret**.

Consulte [Autenticação de Usuário - WeChat Work](/auth-verification/auth-wecom/).

## Adicionar uma Fonte de Dados de Sincronização no NocoBase

Vá para Usuários e Permissões - Sincronizar - Adicionar, e preencha as informações obtidas.

![](https://static-docs.nocobase.com/202412041251867.png)

## Configurar Sincronização de Contatos

Acesse o console de administração do WeChat Work - Segurança e Gerenciamento - Ferramentas de Gerenciamento, e clique em Sincronização de Contatos.

![](https://static-docs.nocobase.com/202412041249958.png)

Configure conforme mostrado na imagem, e defina o IP confiável da empresa.

![](https://static-docs.nocobase.com/202412041250776.png)

Agora você pode prosseguir com a sincronização dos dados de usuários.

## Configurar o Servidor de Recebimento de Eventos

Se você deseja que as alterações nos dados de usuários e departamentos do WeChat Work sejam sincronizadas em tempo real com o aplicativo NocoBase, você pode realizar configurações adicionais.

Após preencher as informações de configuração anteriores, você pode copiar o URL de notificação de callback de contatos.

![](https://static-docs.nocobase.com/202412041256547.png)

Preencha-o nas configurações do WeChat Work, obtenha o Token e o EncodingAESKey, e conclua a configuração da fonte de dados de sincronização de usuários do NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)