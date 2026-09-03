---
pkg: '@nocobase/plugin-file-manager'
title: "URL estável (URL de proxy)"
description: "Explica o formato, as permissões, os redirecionamentos e o comportamento das URLs estáveis de arquivos no NocoBase."
keywords: "URL estável,URL de proxy,URL permanente,acesso a arquivos,pré-visualização do Office,NocoBase"
---

# URL estável

Arquivos gerenciados por um mecanismo de armazenamento são acessados por uma **URL estável**. O NocoBase verifica o registro e as permissões e depois redireciona para a URL real gerada pelo armazenamento.

## Formato

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Com `APP_PUBLIC_PATH=/nocobase`, o caminho começa com `/nocobase/files/`. O ID e a extensão não podem ser alterados após a criação, mantendo a URL estável enquanto o registro existir.

| Uso | URL | Comportamento |
|---|---|---|
| Abrir | `/files/.../42.pdf` | Verifica a permissão e redireciona para o arquivo |
| Pré-visualizar | `/files/.../42.png?preview=1` | Redireciona para a miniatura ou pré-visualização |
| Baixar | `/files/.../42.pdf?download=1` | Redireciona com semântica de download |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Acesso temporário para o Office Online Viewer |

## Comportamento no NocoBase

- Campos de anexo, tabelas de arquivos e a [HTTP API](./http-api.md) retornam URLs estáveis em `url` e `preview`
- O Markdown salva a URL estável e pode usar S3, OSS, COS ou S3 Pro privados
- O campo URL de anexo preserva URLs externas inseridas manualmente e usa a URL estável para uploads gerenciados
- As pré-visualizações comuns usam a sessão e as permissões atuais do NocoBase
- Formulários públicos concedem acesso limitado apenas aos arquivos enviados na sessão atual do formulário

## Pré-visualização do Office

O Microsoft Office Online Viewer não pode usar o cookie do usuário. Ao abrir a pré-visualização, o NocoBase verifica a permissão e emite uma URL temporária vinculada ao arquivo. Ela dura 10 minutos por padrão e pode ser configurada entre 5 e 10 minutos com `TEMPORARY_FILE_ACCESS_EXPIRES_IN`.

Não salve essa URL em campos, Markdown ou dados de negócio e não a use como link de compartilhamento.

## Cuidados

- Estável não significa público; o destinatário ainda precisa de permissão
- Excluir ou mover o registro para outro contexto invalida a URL antiga
- A resposta é um redirecionamento `302`, que o cliente deve seguir
- Não persista `302 Location` nem `temporaryAccessToken`
- O proxy reverso deve encaminhar ao NocoBase a rota `/files/` sob `APP_PUBLIC_PATH`. Em implantações em subcaminhos, mantenha também a rota compatível `/files/` na raiz. As configurações geradas pela CLI do NocoBase incluem ambas as regras automaticamente
- Em implantações nas quais as páginas acessam a API entre origens (`API_BASE_URL` apontando para outra origem), adicione a origem da página a `CORS_ORIGIN_WHITELIST`. Caso contrário, o cookie de login nunca será armazenado e as URLs estáveis retornarão `403` por falta de credenciais. Consulte [Variáveis de ambiente](../get-started/installation/env.md#api_base_url)
- Use um `hostname` diferente para cada serviço NocoBase independente, em vez de diferenciá-los apenas pela porta. Os cookies do navegador não são isolados por porta; consulte [Implantação em produção](../get-started/deployment/production.md)
- Os subaplicativos da mesma implantação do NocoBase são diferenciados pelo nome do aplicativo e não precisam de hostnames separados. No entanto, um serviço independente em outra porta ainda precisa ser isolado por hostname se contiver um aplicativo principal ou subaplicativo com o mesmo nome

## Links relacionados

- [HTTP API](./http-api.md) — Enviar e consultar arquivos
- [Pré-visualização de arquivos](./file-preview/index.md) — Formatos compatíveis
- [Pré-visualização do Office](./file-preview/ms-office.md) — Configurar o Office Viewer
- [Mecanismos de armazenamento](./storage/index.md) — Configurar o armazenamento
