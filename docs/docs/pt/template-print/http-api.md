---
title: "HTTP API de impressão por template"
description: "HTTP API de impressão por template do NocoBase: use o Action templatePrint para imprimir registros selecionados, o resultado filtrado atual ou todos os dados que atendem às condições, baixando o arquivo gerado em Word, Excel, PowerPoint ou PDF."
keywords: "impressão por template,HTTP API,templatePrint,PDF,imprimir registros selecionados,imprimir tudo,NocoBase"
---

# HTTP API

A impressão por template suporta o disparo direto da renderização e do download do documento via HTTP API. Tanto para Block de detalhe quanto para Block de tabela, o que ocorre por trás é uma chamada ao Action `templatePrint` sobre o Resource de negócio atual.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Observações:
- `<resource_name>` é o nome do Resource correspondente à tabela atual.
- A resposta retorna um stream binário do arquivo, e não JSON.
- O chamador precisa ter permissão de consulta sobre o Resource e permissão de uso do botão de impressão por template correspondente.
- A chamada exige enviar um JWT baseado no login do usuário no cabeçalho Authorization, do contrário será rejeitada.

## Parâmetros do corpo da requisição

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `templateName` | `string` | Sim | Nome do template, correspondente ao identificador configurado no Gerenciamento de Templates. |
| `blockName` | `string` | Sim | Tipo de Block. Para Block de tabela use `table`; para Block de detalhe use `details`. |
| `timezone` | `string` | Não | Fuso horário, por exemplo `Asia/Shanghai`. Usado para renderizar datas/horas no template. |
| `uid` | `string` | Não | Schema uid do botão de impressão por template, usado para validação de permissão. |
| `convertedToPDF` | `boolean` | Não | Define se o resultado é convertido em PDF. Quando `true`, retorna um arquivo `.pdf`. |
| `queryParams` | `object` | Não | Parâmetros passados à consulta de dados subjacente. |
| `queryParams.page` | `number \| null` | Não | Página da paginação. Quando `null`, indica que não há paginação. |
| `queryParams.pageSize` | `number \| null` | Não | Itens por página. Quando `null`, indica que não há paginação. |
| `queryParams.filter` | `object` | Não | Condição de filtro. É combinada automaticamente com o filtro fixo do ACL. |
| `queryParams.appends` | `string[]` | Não | Campos relacionais a serem incluídos na consulta. |
| `queryParams.filterByTk` | `string \| object` | Não | Comum no Block de detalhe, especifica o valor da chave primária. |
| Outros parâmetros como `queryParams.sort` | `any` | Não | Demais parâmetros de consulta são repassados como vieram à consulta do Resource. |

## Block de tabela

O Block de tabela usa a mesma API e indica o modo de impressão de lista por meio de `blockName: "table"`. O servidor executa um `find` no Resource e injeta o array resultante no template.

### Imprimir registros selecionados ou o resultado da página atual

Útil quando se imprime alguns registros selecionados na tabela ou quando se preserva o contexto da paginação atual. Em geral:

- Defina `queryParams.page` e `queryParams.pageSize` com a página e o tamanho atuais da tabela.
- Combine as chaves primárias dos registros selecionados em uma condição `filter.id.$in`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Significado da requisição:

- `blockName` igual a `table` indica renderização do template a partir de dados de lista.
- `filter.id.$in` define o conjunto de registros que serão impressos.
- `page` e `pageSize` preservam o contexto de paginação atual, alinhando com o comportamento da UI.
- `appends` pode ser usado para incluir campos relacionais conforme necessário.

### Imprimir todos os dados que atendem às condições

Útil ao clicar em "Imprimir todos os registros" no Block de tabela. Aqui não se aplica o recorte da paginação atual; o servidor traz todos os registros que atendem ao filtro.

O ponto chave é definir explicitamente `queryParams.page` e `queryParams.pageSize` como `null`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Significado da requisição:

- `page: null` e `pageSize: null` desativam o limite de paginação.
- `filter: {}` indica nenhuma condição extra; se a UI já tem condições de filtro, é possível repassá-las aqui.
- O servidor consulta todos os dados que atendem às condições e renderiza o template em lote.

> Atenção: o Block de tabela imprime no máximo 300 registros por chamada. Acima desse limite, a API retorna erro `400`.

## Block de detalhe

O Block de detalhe também usa o Action `templatePrint`, mas tipicamente envia:

- `blockName: "details"`
- `queryParams.filterByTk` para indicar a chave primária do registro atual
- `queryParams.appends` para incluir campos relacionais adicionais

O servidor executa um `findOne` no Resource e injeta o objeto resultante no template.

## Resposta

Em caso de sucesso, a API retorna um stream do arquivo, com cabeçalhos típicos:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Observações:

- Quando `convertedToPDF` é `true`, a extensão do arquivo retornado é `.pdf`.
- Caso contrário, o arquivo retornado mantém o tipo original do template, por exemplo `.docx`, `.xlsx` ou `.pptx`.
- O front-end normalmente dispara o download do navegador a partir do `Content-Disposition`.

## Outros recursos
- [Usando API Keys no NocoBase](../integration/api-keys/usage.md)
