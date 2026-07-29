---
title: "nb portal registry"
description: "Referência do nb portal registry: gerencie itens do Portal Registry fornecidos por plugins em um workspace de AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Gerencia itens do NocoBase Portal Registry em um workspace de AI Portal. Plugins habilitados no servidor podem fornecer integrações frontend reutilizáveis, como componentes, hooks, adaptadores e páginas de demonstração. Os comandos Registry instalam essas integrações no código-fonte do Portal.

## Uso

```bash
nb portal registry <comando>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Instala ou atualiza itens do Registry fornecidos pelos plugins NocoBase habilitados |

## Requisitos

- O workspace do Portal deve existir e conter `package.json` e `components.json`.
- O env NocoBase selecionado deve disponibilizar a API do Portal Registry.
- Somente itens de Registry fornecidos por plugins habilitados ficam disponíveis.

## Exemplos

Instalar todos os itens disponíveis no Portal `customer`:

```bash
nb portal registry sync customer
```

Instalar apenas itens específicos:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Comandos relacionados

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
