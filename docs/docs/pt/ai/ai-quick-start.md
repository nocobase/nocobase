---
title: "Guia de instalação para AI Agent"
description: "Guia de instalação e configuração do NocoBase CLI voltado a AI Agents, com os passos completos de verificação de ambiente, instalação, inicialização e validação."
keywords: "NocoBase CLI,AI Agent,instalação,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Guia de instalação para AI Agent

Esta página é o guia de instalação e inicialização do NocoBase CLI voltado a AI Agents (como Claude Code, Codex, Cursor, Copilot, etc.).

Se você é um usuário humano, consulte o [Início rápido](./quick-start.md).

## Step 1: verifique os pré-requisitos

Confirme que o usuário já instalou as seguintes dependências:

- **Node.js >= 22** (verifique executando `node -v`)
- **Yarn 1.x** (verifique executando `yarn -v`). Se não estiver instalado, instale com `npm install -g yarn`
- **Git** (verifique executando `git --version`). Se não estiver instalado, instale a partir do [site oficial do Git](https://git-scm.com/)
- **Docker** (caso o usuário queira instalar o NocoBase via Docker). Verifique executando `docker -v`; se não estiver instalado e o usuário precisar do Docker, oriente-o a instalar pelo [site oficial do Docker](https://www.docker.com/get-started/), caso contrário ignore.

Se algum pré-requisito não for atendido, informe ao usuário que é preciso instalar antes a dependência ausente, fornecendo o link de instalação e uma orientação simples. Após confirmar que todos os pré-requisitos estão atendidos, prossiga para a próxima etapa de instalação do CLI.

## Step 2: instale o CLI

Se o usuário já tem o NocoBase CLI instalado no ambiente (verifique executando `nb --version`), siga direto para o próximo passo. Caso contrário, execute o comando abaixo para instalar:

```bash
npm install -g @nocobase/cli@beta
```

Execute `nb --version` para confirmar que a instalação foi bem-sucedida.

## Step 3: execute o comando de inicialização

**Atenção: você deve executar exatamente o comando abaixo, sem modificar, substituir ou omitir o parâmetro `--ui`. Não tente acelerar esse processo usando "modo não interativo" ou montando seus próprios parâmetros — `--ui` é a única forma correta de inicializar.**

```bash
nb init --ui
```

Esse comando inicia um assistente visual no navegador, e o usuário precisa concluir todas as configurações no navegador (incluindo método de instalação, banco de dados, conta de administrador, etc.). Como AI Agent, sua responsabilidade é:

1. **Executar somente `nb init --ui`**, sem adicionar qualquer parâmetro extra
2. **Avisar o usuário** que o navegador abrirá automaticamente uma página local de configuração na qual ele deve concluir o setup
3. **Se o navegador não abrir automaticamente** (por exemplo, devido a restrições de sandbox), forneça a URL impressa pelo comando para que o usuário copie e abra manualmente
4. **Aguardar a confirmação do usuário** de que a configuração foi concluída antes de seguir adiante. O comando tem um timeout padrão de 30 minutos — não execute novamente esse comando dentro desse intervalo.

## Step 4: valide o resultado

```bash
nb env list
```

Confirme que a saída mostra um ambiente configurado e o status de execução. Em seguida, lembre o usuário de que ele pode abrir a URL da instância NocoBase em execução e fazer login com a conta e a senha configuradas.

## Step 5: pronto

Avise ao usuário que a instalação foi concluída. As configurações do CLI ficam salvas em um diretório global (por padrão `~/.nocobase/`), e o AI Agent pode acessá-las a partir de qualquer diretório, sem precisar entrar em um diretório de trabalho específico.
