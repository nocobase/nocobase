---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Saída Estruturada

## Introdução

Em alguns cenários de aplicação, você pode querer que o modelo LLM responda com conteúdo estruturado no formato JSON. Isso pode ser alcançado configurando a "Saída Estruturada".

![](https://static-docs.nocobase.com/202503041306405.png)

## Configuração

- **JSON Schema** - Você pode especificar a estrutura esperada da resposta do modelo configurando um [JSON Schema](https://json-schema.org/).
- **Nome** - _Opcional_, usado para ajudar o modelo a entender melhor o objeto representado pelo JSON Schema.
- **Descrição** - _Opcional_, usado para ajudar o modelo a entender melhor a finalidade do JSON Schema.
- **Rigoroso (Strict)** - Exige que o modelo gere uma resposta estritamente de acordo com a estrutura do JSON Schema. Atualmente, apenas alguns modelos novos da OpenAI suportam este parâmetro. Por favor, confirme se o seu modelo é compatível antes de habilitá-lo.

## Método de Geração de Conteúdo Estruturado

A forma como um modelo gera conteúdo estruturado depende do **modelo** utilizado e da sua configuração de **Formato de Resposta (Response format)**:

1. Modelos onde o Formato de Resposta (Response format) suporta apenas `text`

   - Ao ser chamado, o nó irá vincular uma Ferramenta (Tool) que gera conteúdo no formato JSON com base no JSON Schema, orientando o modelo a gerar uma resposta estruturada ao chamar essa Ferramenta.

2. Modelos onde o Formato de Resposta (Response format) suporta o modo JSON (`json_object`)

   - Se o modo JSON for selecionado ao chamar, você precisará instruir explicitamente o modelo no Prompt para retornar no formato JSON e fornecer descrições para os campos de resposta.
   - Neste modo, o JSON Schema é usado apenas para analisar a string JSON retornada pelo modelo e convertê-la no objeto JSON de destino.

3. Modelos onde o Formato de Resposta (Response format) suporta JSON Schema (`json_schema`)

   - O JSON Schema é usado diretamente para especificar a estrutura de resposta de destino para o modelo.
   - O parâmetro opcional **Rigoroso (Strict)** exige que o modelo siga estritamente o JSON Schema ao gerar a resposta.

4. Modelos locais Ollama

   - Se um JSON Schema for configurado, o nó o passará como o parâmetro `format` para o modelo ao ser chamado.

## Usando o Resultado da Saída Estruturada

O conteúdo estruturado da resposta do modelo é salvo como um objeto JSON no campo "Conteúdo estruturado" do nó e pode ser usado por nós subsequentes.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)