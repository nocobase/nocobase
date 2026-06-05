[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md) | [Français](./README.fr.md) | [Español](./README.es.md) | Português | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Índice

- [O que é o NocoBase](#o-que-é-o-nocobase)
- [Notas de versão](#notas-de-versão)
- [Diferenciais](#diferenciais)
- [Conexão de AI Agent](#conexão-de-ai-agent)
- [Instalação](#instalação)

## O que é o NocoBase

NocoBase e uma plataforma open source de IA + no-code para criar sistemas de negocio com mais rapidez. Em vez de gerar tudo do zero, a IA trabalha sobre uma infraestrutura ja validada em producao e uma interface visual WYSIWYG, combinando velocidade com confiabilidade.

Site oficial:  
https://www.nocobase.com/pt

Demo online:  
https://demo.nocobase.com/new

Documentação:  
https://docs.nocobase.com/pt/

Fórum:  
https://forum.nocobase.com/

Casos de clientes:  
https://www.nocobase.com/pt/blog/tags/customer-stories

## Notas de versão

As [notas de versão](https://www.nocobase.com/pt/blog/timeline) são atualizadas regularmente no blog.

## Diferenciais

### 1. Colaborativo: IA e pessoas constroem juntas

Agentes de codigo contam com CLI e skills completas, enquanto pessoas usam uma interface visual WYSIWYG. Assim, os dois lados colaboram com fluidez.

#### Construa com os agentes de codigo com IA que voce ja conhece

Saia da implantacao para um sistema em funcionamento em poucos minutos com agentes amplamente adotados.

- Funciona com agentes amplamente usados como Claude Code, Cursor, Codex, OpenCode e TRAE
- Os agentes podem cuidar de implantacao, desenvolvimento, migracao e release de ponta a ponta

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### Construa manualmente em uma interface WYSIWYG no-code

Mesmo sem IA, equipes podem criar e ajustar tudo visualmente na interface no-code.

- Alterne entre modo de uso e modo de configuracao com um clique
- Revise e configure visualmente modelos de dados, paginas, workflows e permissoes
- Feito para usuarios de negocio, nao apenas para desenvolvedores

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### Combine desenvolvimento com IA e construcao manual da forma que fizer sentido

Divida o trabalho como quiser: pessoas refinam o que a IA cria, e a IA continua a partir do que as pessoas configuram.

- A IA pode criar rapidamente modelos de dados, paginas e workflows
- As pessoas podem refinar rapidamente a interface e as interacoes
- Colabore quando fizer sentido e siga iterando

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. Inteligente: a IA ajuda a operar o negocio, nao apenas a construir o sistema

A NocoBase inclui funcionarios de IA, para que a IA atue diretamente dentro do proprio sistema.

#### Funcionarios de IA integrados aos workflows de negocio

Funcionarios de IA recebem o contexto do negocio automaticamente e executam tarefas diretamente dentro do sistema.

- No front-end, ajudam com analise, perguntas e respostas, preenchimento de formularios e mais
- No back-end, cuidam automaticamente de reconhecimento de documentos, monitoramento de risco e roteamento de tarefas
- Integrados aos workflows, os funcionarios de IA participam da decisao e da execucao

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### Interfaces abertas para o ecossistema de agentes

MCP, HTTP APIs, CLI e um conjunto rico de skills permitem conectar agentes externos com seguranca.

- Plataformas como OpenClaw, Hermes, Dify, Coze e n8n se conectam por protocolos padrao
- Conecta-se a Telegram, WhatsApp, Slack e Gmail para consultar dados, disparar acoes e executar workflows de negocio
- Um mesmo modelo de interface mantem agentes internos e externos dentro dos mesmos limites

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### Controles de permissao mantem o comportamento da IA sob controle

Toda acao da IA segue o mesmo modelo granular de permissoes aplicado aos usuarios humanos.

- Cada funcionario de IA tem seu proprio papel, com permissoes de leitura e escrita ate o nivel de campo
- Logs de auditoria tornam rastreavel toda alteracao de dados e todo disparo de workflow
- Administradores podem ajustar as permissoes da IA a qualquer momento para manter limites claros

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. Confiavel: infraestrutura pronta para o negocio real

Modelos de dados, permissoes e workflows sao complexos e sensiveis a erros.  
A NocoBase entrega tudo isso como infraestrutura nativa, testada e validada em producao.

#### Infraestrutura completa, sem recomecar do zero

Dezenas de modulos nativos cobrem as necessidades mais comuns de sistemas de negocio.

- Data models, permissions, workflows, and audit logs work out of the box
- Proven in production, instead of regenerated as black-box code each time
- Built-in guardrails keep AI output aligned with the system architecture

![core](https://static-docs.nocobase.com/f-core.png)

#### Orientado por modelo de dados, com dados desacoplados da interface

Os dados do negocio permanecem em estruturas relacionais padrao, separados da camada de interface.

- Use the main database, external databases, and third-party APIs as data sources
- AI and people work on the same data model, so results stay transparent
- Your data always stays in your own database, without platform lock-in

![model](https://static-docs.nocobase.com/model.png)

#### Arquitetura de plugins para evolucao sustentavel

Com design de microkernel, tudo pode evoluir por plugins, sem perder consistencia nem controle.

- Novos recursos entram por plugins composiveis, com convencoes compartilhadas
- Combine plugins oficiais e personalizados para atender ao seu negocio
- A mesma arquitetura vale tanto para plugins criados por IA quanto para plugins criados manualmente

![plugins](https://static-docs.nocobase.com/plugins.png)

## Conexão de AI Agent

Se voce quer que um AI Agent participe diretamente da criacao e operacao no NocoBase, a forma mais simples e instalar o NocoBase CLI, concluir a inicializacao e depois iniciar ou reiniciar a sessao do agente dentro desse diretorio.

- O NocoBase CLI e responsavel por instalar, conectar e gerenciar aplicacoes NocoBase
- Durante a inicializacao, o CLI instala automaticamente NocoBase Skills para que o agente entenda modelos de dados, paginas, workflows, permissoes e plugins
- Quando a inicializacao termina, o AI Agent pode comecar a operar desde que o workspace aponte para esse diretorio

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
cd my-nocobase && codex
```

Mais detalhes:  
https://docs.nocobase.com/pt/ai/quick-start

## Instalação

O NocoBase oferece tres formas de instalacao:

- <a target="_blank" href="https://docs.nocobase.com/pt/welcome/getting-started/installation/docker-compose">Instalar com Docker (recomendado)</a>

  E a melhor opcao para cenarios no-code e nao exige escrever codigo. Para atualizar, basta baixar a imagem mais recente e reiniciar.

- <a target="_blank" href="https://docs.nocobase.com/pt/welcome/getting-started/installation/create-nocobase-app">Instalar com create-nocobase-app</a>

  O codigo de negocio do projeto permanece totalmente independente e atende bem a cenarios de low-code.

- <a target="_blank" href="https://docs.nocobase.com/pt/welcome/getting-started/installation/git-clone">Instalar a partir do código-fonte Git</a>

  Se voce quer testar a versao mais recente ainda nao publicada, ou contribuir modificando e depurando diretamente o codigo-fonte, este metodo e o mais indicado. Ele exige um nivel tecnico mais alto, e voce podera obter as atualizacoes mais recentes pelo Git quando o codigo mudar.
