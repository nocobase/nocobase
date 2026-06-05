---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Documentação da API

## Introdução

Este **plugin** gera a documentação da API HTTP do NocoBase com base no Swagger.

## Instalação

Este é um **plugin** integrado, então não é necessário instalá-lo. Basta ativá-lo para começar a usar.

## Instruções de Uso

### Acessando a Página de Documentação da API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Visão Geral da Documentação

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd30592e72385b.png)

- Documentação total da API: `/api/swagger:get`
- Documentação da API do núcleo: `/api/swagger:get?ns=core`
- Documentação da API de todos os **plugins**: `/api/swagger:get?ns=plugins`
- Documentação de cada **plugin**: `/api/swagger:get?ns=plugins/{name}`
- Documentação da API para **coleções** personalizadas: `/api/swagger:get?ns=collections`
- Recursos específicos de `${collection}` e relacionados a `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Guia do Desenvolvedor

### Como Escrever a Documentação Swagger para Plugins

Adicione um arquivo `swagger/index.ts` na pasta `src` do **plugin** com o seguinte conteúdo:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Para regras de escrita detalhadas, consulte a [Documentação Oficial do Swagger](https://swagger.io/docs/specification/about/).