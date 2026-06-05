:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Entrar com o Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Obter Credenciais OAuth 2.0 do Google

[Console do Google Cloud](https://console.cloud.google.com/apis/credentials) - Criar Credenciais - ID do Cliente OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Acesse a interface de configuração e preencha a URL de redirecionamento autorizada. Você pode obter a URL de redirecionamento ao adicionar um autenticador no NocoBase; geralmente, ela é `http(s)://host:port/api/oidc:redirect`. Consulte a seção [Manual do Usuário - Configuração](../index.md#configuração).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Adicionar um novo Autenticador no NocoBase

Configurações do Plugin - Autenticação de Usuário - Adicionar - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Consulte os parâmetros apresentados em [Manual do Usuário - Configuração](../index.md#configuração) para concluir a configuração do autenticador.