---
title: 'Segurança e Auditoria'
description: 'Conheça os métodos de autenticação utilizados quando um AI Agent constrói no NocoBase, as estratégias de controle de permissão, as boas práticas recomendadas e como rastrear cada operação.'
keywords: 'Construtor de IA,segurança,permissão,autenticação,Token,OAuth,registro de operações,auditoria'
---

# Segurança e Auditoria

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

Quando um usuário utiliza um AI Agent para operar o NocoBase via [NocoBase CLI](../ai/quick-start.md), é fundamental dar atenção à autenticação, ao controle de permissões e à rastreabilidade de auditoria, garantindo limites de operação claros e processos auditáveis.

## Autenticação

Há principalmente duas formas de o AI Agent se conectar ao NocoBase:

- **Autenticação por API key**: você gera uma API Key através do plugin [API keys](/auth-verification/api-keys/index.md), configura no ambiente do CLI e as requisições subsequentes acessam a API com essa chave.
- **Autenticação por OAuth**: você conclui um login OAuth no navegador e, depois disso, acessa a API com a identidade do usuário atual.

Ambas as formas funcionam com o comando `nb`. A diferença está na origem da identidade, nos cenários de uso e na estratégia de controle de risco.

### Autenticação por API key

A API key é usada principalmente em tarefas automatizadas, com scripts e de longa duração, por exemplo:

- Permitir que o AI Agent sincronize dados em horários programados.
- Chamar `nb api` com frequência em ambiente de desenvolvimento.
- Executar tarefas de construção bem definidas e estáveis com um papel fixo.

Fluxo básico:

1. Habilite o plugin API keys no NocoBase e crie uma API Key.
2. Vincule essa API Key a um papel dedicado, em vez de associar diretamente ao `root` ou às permissões totais de um administrador.
3. Use `nb env add` para salvar a URL da API e o Token no ambiente do CLI.

Por exemplo:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Após a configuração, o AI Agent pode executar chamadas de API através desse ambiente:

```bash
nb api resource list --env local --resource users
```

Esse modelo é estável, indicado para automação e não exige novo login do usuário toda vez. Enquanto o Token estiver válido, qualquer pessoa que o tenha em mãos pode acessar o sistema com as permissões do papel vinculado. Por isso, atenção especial:

- O Token deve estar associado apenas a um papel dedicado.
- Salve-o apenas nos ambientes de CLI necessários.
- Faça rotação periódica e evite usar "nunca expira" como padrão.
- Em caso de suspeita de vazamento, exclua e gere um novo imediatamente.

Para mais orientações gerais, consulte o [Guia de Segurança do NocoBase](../security/guide.md).

### Autenticação por OAuth

OAuth é usada principalmente em tarefas em que as ações são executadas com a identidade do usuário logado, por exemplo:

- Pedir à IA para fazer um ajuste pontual de configuração em nome do administrador atual.
- Atribuir a operação a um usuário logado de forma clara.
- Evitar manter Tokens de alta permissão por longos períodos.

Fluxo básico:

1. Adicione um ambiente CLI com método de autenticação `oauth`.
2. Execute `nb env auth`.
3. O navegador abre a página de autenticação, faça login e conclua a autenticação.
4. O CLI armazena as informações de autenticação e as requisições subsequentes do `nb api` acessam o NocoBase com a identidade do usuário atual.
5. Se o usuário tiver vários papéis, é possível indicar o papel com `--role`.

Por exemplo:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` inicia o fluxo de login pelo navegador. Após o sucesso, o CLI salva as informações de autenticação na configuração do ambiente atual e o AI Agent pode continuar a chamar `nb api`.

Na implementação padrão atual:

- O access token OAuth tem validade de **10 minutos**.
- O refresh token OAuth tem validade de **30 dias**.

Quando o access token estiver perto de expirar, o CLI tenta renovar a sessão automaticamente usando o refresh token. Se o refresh token estiver expirado, indisponível ou se o servidor não tiver retornado um refresh token, será necessário executar `nb env auth` novamente.

A característica do OAuth é que as requisições normalmente são executadas com o usuário logado e o contexto de papel atuais, e os registros de auditoria refletem com mais facilidade quem realmente operou. Esse modelo é mais adequado para operações com participação humana e que exigem confirmação de identidade.

### Boas práticas recomendadas

Recomenda-se escolher seguindo estes princípios:

- **Desenvolvimento, testes e tarefas automatizadas**: prefira API key, mas sempre vincule a um papel dedicado.
- **Produção, com participação humana e necessidade de forte atribuição de identidade**: prefira OAuth.
- **Operações de alto risco**: mesmo que tecnicamente seja possível usar Token, prefira OAuth e que a autenticação seja feita por um usuário com as permissões adequadas antes da execução.

Sem requisitos específicos, você pode adotar os seguintes padrões:

- **Use OAuth por padrão.**
- **Use API key apenas quando explicitamente houver necessidade de automação, execução não supervisionada ou em lote.**

## Controle de permissões

O AI Agent não tem "permissões extras" — o que ele pode fazer depende totalmente da identidade e do papel atualmente em uso.

Ou seja:

- Ao acessar via API key, o limite de permissões é definido pelo papel vinculado ao Token.
- Ao acessar via OAuth, o limite é definido pelo usuário logado e pelo papel atual.

A IA não contorna o sistema ACL do NocoBase. Se um papel não tem permissão para uma tabela, campo, página ou configuração de plugin, o AI Agent não conseguirá executar com sucesso, mesmo que conheça o comando correspondente.

### Papéis e políticas de permissão

Recomenda-se preparar um papel exclusivo para o AI Agent, em vez de reutilizar papéis administrativos existentes.

Esse papel normalmente precisa apenas de permissões dentro dos seguintes escopos:

- Quais tabelas pode operar.
- Quais ações pode executar, por exemplo: visualizar, criar, atualizar, excluir.
- Se pode acessar determinadas páginas ou menus.
- Se pode entrar em áreas de alto risco como configurações do sistema, gerenciamento de plugins e configuração de permissões.

Por exemplo, você pode criar um papel `ai_builder_editor` que só permite:

- Gerenciar as tabelas relacionadas ao CRM.
- Editar páginas específicas.
- Disparar alguns workflows.
- Não permitir alterar permissões de papéis.
- Não permitir habilitar, desabilitar ou instalar plugins.
- Não permitir excluir tabelas críticas.

Se for necessário que a IA ajude a configurar permissões, isso pode ser feito junto com [Configuração de Permissões](./acl.md), mas ainda assim recomenda-se que o limite de permissões seja definido manualmente primeiro.

### Princípio do menor privilégio

O princípio do menor privilégio é especialmente importante em cenários de Construtor de IA. Você pode adotar a seguinte abordagem:

1. Crie um papel dedicado para a IA.
2. Comece liberando apenas a permissão de visualização.
3. Conforme as tarefas evoluem, adicione gradualmente as permissões necessárias de criação, edição etc.
4. Mantenha o controle humano sobre exclusão, alteração de permissões, gerenciamento de plugins e demais operações de alto risco.

Por exemplo:

- Para uma IA voltada à entrada de conteúdo, basta liberar permissões de visualização e criação na tabela de destino.
- Para uma IA voltada à construção de páginas, basta liberar as páginas relevantes e as permissões de configuração de UI.
- Para uma IA voltada à modelagem de dados, libere permissões de alteração de estrutura apenas no ambiente de testes — nunca direto em produção.

Não é recomendado vincular diretamente ao AI Agent papéis como `root`, `admin` ou qualquer papel com capacidade global de configuração do sistema. Embora a implantação seja mais simples, isso aumenta significativamente a superfície de exposição de permissões.

## Logs

No cenário de Construtor de IA, os logs servem para suportar rastreamento de operações e diagnóstico de problemas.

Vale prestar atenção especial a estes dois tipos de log:

- **Log de requisições**: registra caminho, método, código de status, tempo e origem das requisições da API.
- **Log de auditoria**: registra o sujeito da execução, o objeto da operação, o resultado e os metadados associados das operações em recursos críticos.

Ao iniciar requisições via `nb api`, o CLI inclui automaticamente o cabeçalho `x-request-source: cli`, que o servidor usa para identificar que a requisição veio do CLI.

### Log de requisições

O log de requisições registra informações de chamadas de API, incluindo caminho da requisição, status de resposta, duração e marcador de origem.

Os arquivos de log normalmente ficam em:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

No cenário de chamadas via `nb api`, o log de requisições inclui:

- `req.header.x-request-source`

Com base nele, é possível diferenciar requisições do CLI de requisições comuns do navegador.

Sobre o diretório dos logs de requisição e a descrição dos campos, consulte [Logs do servidor NocoBase](../log-and-monitor/logger/index.md).

### Log de auditoria

O log de auditoria registra o sujeito da execução, o recurso de destino, o resultado da execução e as informações relacionadas à requisição das operações críticas.

Para operações dentro do escopo de auditoria, o log registra:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Por exemplo, quando a IA chama via CLI `collections:apply`, `fields:apply` ou outras operações de escrita com auditoria habilitada, o log de auditoria registra `x-request-source: cli`, facilitando distinguir operações da interface daquelas iniciadas pelo CLI.

Para detalhes do log de auditoria, consulte [Log de Auditoria](../security/audit-logger/index.md).

## Recomendações de segurança

A seguir, algumas práticas mais adequadas ao cenário de Construtor de IA:

- Não vincule diretamente ao AI Agent os papéis `root`, `admin` ou qualquer papel com configuração global do sistema.
- Crie um papel dedicado para o AI Agent e divida os limites de permissão por tarefa.
- Faça rotação periódica das API keys, evitando reutilizar por muito tempo um mesmo Token de alto privilégio.
- Valide modelagem de dados, estrutura de páginas e mudanças em workflows primeiro em ambiente de testes, antes de sincronizar para produção.
- Habilite e revise periodicamente os logs de requisição e de auditoria, garantindo a rastreabilidade das operações críticas.
- Para operações de alto risco como excluir dados, alterar permissões, ativar/desativar plugins e ajustar configurações do sistema, recomenda-se confirmação humana antes da execução.
- Se a IA precisar rodar por longos períodos, prefira dividir em múltiplos ambientes de baixa permissão em vez de concentrar tudo em um único ambiente de alta permissão.

## Links relacionados

- [Início Rápido do Construtor de IA](./index.md) — Instalação e preparação de ambiente
- [Gerenciamento de Ambiente](./env-bootstrap) — Verificação de ambiente, criação de ambientes e diagnóstico de falhas
- [Configuração de Permissões](./acl.md) — Configurar papéis, políticas de permissão e avaliação de risco
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [Guia de Segurança do NocoBase](../security/guide.md) — Recomendações de configuração de segurança mais abrangentes
- [Logs do servidor NocoBase](../log-and-monitor/logger/index.md) — Diretório dos logs de requisição e descrição dos campos
- [Log de Auditoria](../security/audit-logger/index.md) — Campos e uso dos registros de auditoria
- [NocoBase MCP](../ai/mcp/index.md) — Conectar AI Agents pelo protocolo MCP
