---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Configuração de Bloco

## Bloco de Mensagens de E-mail

### Adicionar Bloco

Na página de configuração, clique no botão **Criar bloco** e selecione o bloco **Mensagens de E-mail (Todas)** ou **Mensagens de E-mail (Pessoais)** para adicionar um bloco de mensagens de e-mail.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Configuração de Campos

Clique no botão **Campos** do bloco para selecionar os campos que deseja exibir. Para operações detalhadas, consulte o método de configuração de campos para tabelas.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Configuração de Filtro de Dados

Clique no ícone de configuração no lado direito da tabela e selecione **Escopo de dados** para definir o intervalo de dados para filtrar os e-mails.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Você pode filtrar e-mails com o mesmo sufixo usando variáveis:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Bloco de Detalhes do E-mail

Primeiro, ative a função **Habilitar clique para abrir** em um campo do bloco de mensagens de e-mail:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Adicione o bloco **Detalhes do e-mail** na janela pop-up:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Você pode visualizar o conteúdo detalhado do e-mail:
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Na parte inferior, você pode configurar os botões necessários.

## Bloco de Envio de E-mail

Existem duas maneiras de criar um formulário de envio de e-mail:

1. Adicione um botão **Enviar e-mail** na parte superior da tabela:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Adicione um bloco **Enviar e-mail**:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Ambos os métodos podem criar um formulário completo de envio de e-mail:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Cada campo no formulário de e-mail é consistente com um formulário comum e pode ser configurado com **Valor padrão** ou **Regras de vinculação**, etc.

> Os formulários de resposta e encaminhamento na parte inferior dos detalhes do e-mail vêm com algum processamento de dados padrão, que pode ser modificado através do **fluxo de trabalho**.