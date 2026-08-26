---
pkg: "@nocobase/plugin-field-signature"
---

# Campo de tabela: Assinatura manuscrita

## Introdução

O campo de assinatura manuscrita permite que o usuário escreva uma assinatura sobre uma tela usando mouse ou tela sensível ao toque. Ao salvar, a imagem da assinatura é gravada na **tabela de arquivos** escolhida, reutilizando o fluxo de upload e armazenamento provido pelo **Gerenciador de Arquivos**.

## Instalação

1. Confirme que seu ambiente é **Pro ou superior** e que a licença está válida.
2. Abra o **Gerenciador de Plugins**, localize **Campo de tabela: Assinatura manuscrita** (`@nocobase/plugin-field-signature`) e ative-o.
3. Garanta que o **Gerenciador de Arquivos** (`@nocobase/plugin-file-manager`) também esteja ativado. O campo de assinatura manuscrita depende dele para fornecer a tabela de arquivos, o upload e o armazenamento; sem ele não será possível salvar a imagem da assinatura.

## Como usar

### Adicionar o campo

Vá em **Data Source** → escolha a tabela → **Configurar campos** → **Adicionar campo** → no grupo Multimídia, selecione **Assinatura manuscrita**.

### Configuração do campo

- **Tabela de arquivos**: obrigatório; selecione uma tabela de arquivos (por exemplo, `attachments`) onde a imagem da assinatura será salva.
- A configuração de armazenamento e as regras de upload usadas pela imagem da assinatura são determinadas pela tabela de arquivos escolhida.

### Configuração na UI

- Após adicionar o campo de assinatura manuscrita ao formulário, é possível ajustar **Configurações da assinatura** na configuração de UI do campo, incluindo cor do traço, cor de fundo, largura e altura da tela de assinatura, além da largura e altura da miniatura.
- Em cenários somente leitura, também é possível ajustar a largura e a altura da miniatura para controlar o tamanho de exibição da imagem.

### Operação na UI

- Clique sobre a área do campo para abrir a tela de assinatura. Após escrever, confirme para fazer o upload e vincular o registro de arquivo correspondente.
- Em telas pequenas, é possível usar a interface de assinatura em modo paisagem ou tela cheia para facilitar a escrita.
