---
title: "Impressão por template - Formatação de campos de mídia"
description: "Formatadores de campos de mídia para impressão por template: attachment e signature exibem imagens de anexo e de assinatura manuscrita no template."
keywords: "impressão por template,campos de mídia,attachment,signature,NocoBase"
---

### Formatação de campos de mídia

#### 1. :attachment

##### Descrição da sintaxe

Exibe a imagem de um campo de anexo. Em geral, basta copiar a variável a partir da "Lista de campos".

##### Exemplo

```text
{d.contractFiles[0].id:attachment()}
```

##### Resultado

Exibe a imagem do anexo correspondente.

#### 2. :signature

##### Descrição da sintaxe

Exibe a imagem de assinatura associada a um campo de assinatura manuscrita. Em geral, basta copiar a variável a partir da "Lista de campos".

##### Exemplo

```text
{d.customerSignature:signature()}
```

##### Resultado

Exibe a imagem de assinatura manuscrita correspondente.

> **Atenção:** para campos de anexo e de assinatura manuscrita, é recomendado copiar a variável diretamente da lista de campos em "Configuração do template", evitando erros ao digitar manualmente.
