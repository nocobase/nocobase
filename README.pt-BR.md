# NocoBase 3

> Esta branch contém o NocoBase 3. Se você procura a plataforma no-code NocoBase 2, acesse o [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | Português | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Crie sistemas de negócio confiáveis**

NocoBase é a plataforma open source para criar, operar e evoluir sistemas de negócio com IA. Os agentes escrevem o código e fazem o trabalho, o NocoBase fornece a base e a governança, e as pessoas tomam as decisões.

[▶ Ver a demo](https://static-docs.nocobase.com/nocobase-3-pt.mp4)

[Site](https://www.nocobase.com/pt-BR/) · [Documentação](https://docs.nocobase.com/) · [Início rápido](#quick-start) · [Comunidade](https://forum.nocobase.com/)

## Por que NocoBase

**A IA escreve código rápido. Construir sistemas de negócio confiáveis continua difícil.**

Sua equipe já desenvolve com IA ou faz vibe coding. O código sai rápido, mas novos problemas aparecem junto.

- **Cada projeto reconstrói a base**

  Mesmo com a IA escrevendo o código, permissões, motores de workflow e aprovações continuam difíceis de projetar do zero. Há muitos casos-limite, e a manutenção dá muito trabalho.

- **A arquitetura sai do controle**

  Troque de desenvolvedor, de modelo ou até de sessão, e a IA pode improvisar de um jeito diferente a cada vez. O sistema fica cada vez mais difícil de manter.

- **Mais trabalho em paralelo do que dá para revisar**

  Você alterna entre vários projetos e tarefas, entre terminais e chats, enquanto os agentes entregam cada vez mais mudanças. É mais do que alguém consegue revisar, mas soltar o controle parece arriscado demais.

- **Conhecimento difícil de registrar e compartilhar**

  Contexto dos requisitos, documentos de negócio e lições aprendidas ficam espalhados em chats de computadores diferentes. Quando mudam as pessoas ou os agentes, fica difícil encontrá-los.

<a id="quick-start"></a>

## Início rápido

Requer Node.js 24+ e pnpm 11. No Windows, use o WSL. Os exemplos usam SQLite, sem necessidade de um servidor de banco de dados separado.

### Com um agente de programação

Abra um agente de programação compatível com Skills em um diretório vazio e instale a Skill de criação de aplicações:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Selecione seu agente durante a instalação. Se ele não reconhecer a nova Skill, inicie uma nova sessão. Em seguida, envie:

```text
Siga a Skill nocobase-create-app para criar e iniciar uma aplicação NocoBase 3 no diretório vazio atual, usando o template padrão e SQLite.
```

### Pelo terminal

Execute os comandos a seguir no diretório pai onde você mantém seus projetos:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Consulte a [documentação](https://docs.nocobase.com/) para mais instruções de configuração e guias de desenvolvimento.

## O ecossistema NocoBase

- **[NocoBase Core](https://www.nocobase.com/pt-BR/core/)**

  **Deixe os agentes focarem na sua lógica de negócio. A base já está pronta.**

  O NocoBase Core é a base de aplicações open source para sistemas de negócio criados e operados com IA. Permissões, workflows, arquivos e outros componentes básicos já vêm prontos, então os agentes desenvolvem só o que é específico do seu negócio, tudo em uma arquitetura consistente.

- **[NocoBase Studio](https://www.nocobase.com/pt-BR/studio/)**

  **Os agentes fazem o trabalho avançar. Sua equipe mantém o controle.**

  O NocoBase Studio é a plataforma de governança para pessoas e agentes que desenvolvem software juntos. Ele reúne o Claude Code, o Codex e o OpenCode em uma única equipe de agentes que faz as tarefas avançarem sozinha. O progresso fica à vista, e as decisões importantes ficam com as pessoas.

- **[NocoBase Solution](https://www.nocobase.com/pt-BR/solutions/)**

  **Apps de negócio open source. Movidos por IA, prontos para usar.**

  O NocoBase Solution é uma linha de apps de negócio movidos por agentes e construídos sobre o Core. Os agentes fazem a maior parte do trabalho, e as pessoas tomam só as decisões importantes.

## Comunidade e contribuições

- Faça perguntas e compartilhe sua experiência no [fórum da comunidade](https://forum.nocobase.com/).
- Relate bugs reproduzíveis e solicite melhorias pelo [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Leia a [documentação](https://docs.nocobase.com/) para conhecer o framework e os plugins.

Contribuições são bem-vindas. Antes de alterar este repositório, leia [AGENTS.md](./AGENTS.md) e as instruções de desenvolvimento relevantes.
