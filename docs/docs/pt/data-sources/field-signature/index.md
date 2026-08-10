---
pkg: "@nocobase/plugin-field-signature"
---

# Campo de tabela de dados: assinatura manuscrita

## Introdução

O campo de assinatura manuscrita permite que os usuários escrevam suas assinaturas na tela usando o mouse ou uma tela sensível ao toque. Após ser salva, a imagem da assinatura será gravada na **tabela de dados de arquivos** selecionada, reutilizando o processo de upload e armazenamento de arquivos fornecido pelo **gerenciador de arquivos**.

## Instalação

1. Confirme se o ambiente atual é a **Edição Profissional ou superior** e se a licença está válida.
2. Abra o **gerenciador de plugins**, localize **Campo de tabela de dados: assinatura manuscrita** (`@nocobase/plugin-field-signature`) e ative-o.
3. Certifique-se de que o **gerenciador de arquivos** (`@nocobase/plugin-file-manager`) esteja ativado. O campo de assinatura manuscrita depende dele para fornecer a tabela de dados de arquivos e os recursos de upload e armazenamento; quando não está ativado, não será possível salvar as imagens das assinaturas.

## Instruções de uso

### Adicionar campo

Em **Fonte de dados** → selecione uma tabela de dados → **Configurar campos** → **Adicionar campo** → no grupo multimídia, selecione **Assinatura manuscrita**.

### Configuração do campo

- **Tabela de dados de arquivos**: obrigatório; selecione uma tabela de dados de arquivos para salvar os arquivos (por exemplo, `attachments`). As imagens das assinaturas serão salvas nela.
- A configuração de armazenamento e as regras de upload efetivamente usadas pelas imagens das assinaturas são determinadas pela própria tabela de dados de arquivos selecionada.

### Configuração da interface

- Após adicionar o campo de assinatura manuscrita a um formulário, você pode ajustar as **configurações da assinatura** na configuração da interface do campo, incluindo a cor do traço, a cor de fundo, a largura e a altura da tela de assinatura, além da largura e da altura da miniatura.
- Em cenários de exibição somente leitura, também é possível ajustar a largura e a altura da miniatura da assinatura para controlar as dimensões de exibição da imagem.
### Operação na interface

- Clique na área do campo para abrir a tela de assinatura. Após concluir a escrita, confirme para fazer o upload e associar o arquivo correspondente.
- Em dispositivos com telas pequenas, pode-se usar uma interface de assinatura em modo paisagem ou tela cheia, facilitando a escrita.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)
