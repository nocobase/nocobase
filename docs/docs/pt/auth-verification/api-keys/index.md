---
pkg: '@nocobase/plugin-api-keys'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Chaves de API

## Introdução

## Instruções de Uso

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Adicionar Chave de API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Observações**

- A chave de API adicionada é criada para o usuário atual e herda o papel (role) ao qual ele pertence.
- Por favor, garanta que a variável de ambiente `APP_KEY` esteja configurada e seja mantida em sigilo. Se a `APP_KEY` for alterada, todas as chaves de API já adicionadas serão invalidadas.

### Como configurar a APP_KEY

Para a versão Docker, modifique o arquivo `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Para instalações via código-fonte ou `create-nocobase-app`, você pode modificar diretamente a `APP_KEY` no arquivo `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```