:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Chave de API

## Introdução

## Instalação

## Instruções de Uso

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Adicionar Chave de API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Observações**

- A chave de API que você adicionar pertencerá ao usuário atual e herdará a função (role) desse usuário.
- Certifique-se de que a variável de ambiente `APP_KEY` esteja configurada e seja mantida em sigilo. Se a `APP_KEY` for alterada, todas as chaves de API adicionadas anteriormente se tornarão inválidas.

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