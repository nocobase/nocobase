---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modo de memória compartilhada

## Introdução

Use este modo para separar domínios de negócio por aplicação sem introduzir uma arquitetura operacional complexa.

## Guia de uso

### Variáveis de ambiente

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Criar aplicação

Em **System Settings**, entre em **App supervisor** e clique em **Add**.

![](https://static-docs.nocobase.com/202512291056215.png)
![](https://static-docs.nocobase.com/202512291057696.png)

### Opções principais

- **Application display name**: nome da app
- **Application ID**: identificador único
- **Start mode**: iniciar na primeira visita ou junto da app principal
- **Environments**: apenas `local`
- **Database**: novo banco, nova conexão ou novo schema (PostgreSQL)
- **Upgrade**: atualizar dados legados para a versão atual
- **JWT Secret**: segredo independente para isolar sessão
- **Custom domain**: domínio próprio

### Operações

- **Start**: iniciar app
- **Visit**: abrir app
- **Stop**: parar app
- **Delete**: remover app

Exemplo de URL:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

![](https://static-docs.nocobase.com/202512291121065.png)
![](https://static-docs.nocobase.com/202512291122113.png)
![](https://static-docs.nocobase.com/202512291122339.png)
![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### Plugins

As apps podem usar os mesmos plugins da app principal, mas com configuração isolada.

### Banco de dados

É possível isolar banco por app. Para compartilhamento, use fonte de dados externa.

### Backup e migração

Backup da app principal não inclui dados das outras apps.

### Versão

As subapps seguem a versão da app principal.

### Sessão

- Com JWT próprio: melhor isolamento, pode exigir novo login ao alternar apps no mesmo domínio.
- Sem JWT próprio: experiência mais simples, porém com risco de segurança em caso de IDs sobrepostos.
