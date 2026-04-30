---
title: "Início rápido do desenvolvimento de plugins com IA"
description: "Use IA para auxiliar no desenvolvimento de plugins NocoBase. Descreva sua necessidade em uma frase e gere automaticamente código frontend e backend, tabelas de dados, configurações de permissão e internacionalização."
keywords: "Desenvolvimento com IA,AI Development,NocoBase AI,desenvolvimento de plugins,programação com IA,Skills,início rápido"
---

# Início rápido do desenvolvimento de plugins com IA

O desenvolvimento de plugins com IA é um recurso oferecido pelo NocoBase que utiliza IA para auxiliar na criação de plugins. Você pode descrever suas necessidades em linguagem natural e a IA gera automaticamente todo o código de frontend e backend, incluindo tabelas de dados, API, blocos de frontend, permissões e internacionalização. Isso oferece uma experiência de desenvolvimento de plugins mais moderna e eficiente.

O recurso de desenvolvimento de plugins com IA é baseado na Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Se você já inicializou através do NocoBase CLI (`nb init`), essa Skill será instalada automaticamente.

## Início rápido

Se você já instalou o [NocoBase CLI](../ai/quick-start.md), pode pular esta etapa.

### Instalação automática com IA

Copie o prompt abaixo para o seu assistente de IA (Claude Code, Codex, Cursor, Trae, etc.) para concluir automaticamente a instalação e configuração:

```
Ajude-me a instalar o NocoBase CLI e concluir a inicialização: https://docs.nocobase.com/cn/ai/ai-quick-start.md (acesse o conteúdo do link diretamente)
```

### Instalação manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

O navegador abrirá automaticamente uma página de configuração visual, guiando você na instalação das NocoBase Skills, configuração do banco de dados e inicialização da aplicação. Para etapas detalhadas, consulte o [início rápido](../ai/quick-start.md).

:::warning Atenção

- O NocoBase está em processo de migração de `client` (v1) para `client-v2`. No momento, o `client-v2` ainda está em desenvolvimento. O código cliente gerado pelo desenvolvimento com IA é baseado no `client-v2` e só pode ser usado no caminho `/v2/`. É uma prévia experimental e não é recomendado para uso direto em produção.
- O código gerado pela IA pode não estar 100% correto. Recomenda-se revisá-lo antes de habilitar. Se encontrar problemas em tempo de execução, envie a mensagem de erro para a IA continuar investigando e corrigindo. Geralmente, algumas trocas de mensagens resolvem o problema.
- Recomenda-se usar modelos da família GPT ou Claude para o desenvolvimento, pois oferecem os melhores resultados. Outros modelos também funcionam, mas a qualidade da geração pode variar.

:::

## De uma frase a um plugin completo

Após a instalação, você pode usar linguagem natural para dizer à IA qual plugin você quer desenvolver. Abaixo estão alguns cenários reais que mostram a capacidade do desenvolvimento de plugins com IA.

### Desenvolva um plugin de marca d'água com uma frase

Com um único prompt, a IA pode gerar um plugin de marca d'água completo, incluindo a lógica de renderização do frontend, detecção contra adulteração, API de armazenamento de configurações no backend e a página de configurações do plugin.

```
Ajude-me a usar a skill nocobase-plugin-development para desenvolver um plugin de marca d'água para o NocoBase.
Requisitos: sobreponha uma marca d'água semitransparente nas páginas, exibindo o nome do usuário logado, para evitar vazamentos via captura de tela.
Verifique periodicamente se o DOM da marca d'água foi removido. Se foi, regenere-o.
Na página de configurações do plugin, permita configurar o texto da marca d'água, a opacidade e o tamanho da fonte.
O nome do plugin é @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

Durante todo o processo, você só precisa descrever os requisitos e tomar decisões. O resto a IA cuida automaticamente. Quer ver o processo completo? → [Prática: desenvolvendo o plugin de marca d'água](./watermark-plugin)

### Crie um componente de campo personalizado com uma frase

Quer fazer com que um campo integer seja exibido como uma avaliação por estrelas? Diga à IA o efeito visual desejado e ela gerará um FieldModel personalizado, substituindo o componente padrão de renderização de campo.

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-rating,
crie um componente de exibição de campo personalizado (FieldModel) que renderize campos do tipo integer como ícones de estrela,
suportando notas de 1 a 5. Clicar nas estrelas deve modificar o valor da avaliação diretamente e salvá-lo no banco de dados.
```

![Demonstração do componente Rating](https://static-docs.nocobase.com/20260422170712.png)

Para saber mais sobre como usar os recursos disponíveis, consulte [Recursos suportados](./capabilities).

## O que a IA pode fazer por você

| Eu quero...                                  | A IA pode fazer                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Criar um novo plugin                         | Gerar o scaffold completo, incluindo a estrutura de diretórios frontend e backend |
| Definir uma tabela de dados                  | Gerar a definição da Collection, com suporte a todos os tipos de campo e relacionamentos |
| Criar um bloco personalizado                 | Gerar BlockModel + painel de configuração + registro no menu "Adicionar bloco" |
| Criar um campo personalizado                 | Gerar FieldModel + vinculação à interface de campo                       |
| Adicionar botões de ação personalizados      | Gerar ActionModel + popup/drawer/caixa de confirmação                    |
| Criar uma página de configurações de plugin  | Gerar formulário no frontend + API no backend + armazenamento            |
| Escrever uma API personalizada               | Gerar Resource Action + registro de rotas + configuração de ACL          |
| Configurar permissões                        | Gerar regras de ACL, controlando o acesso por papel                      |
| Suporte multilíngue                          | Gerar automaticamente pacotes de idiomas em chinês e inglês              |
| Escrever scripts de upgrade                  | Gerar Migration, com suporte a DDL e migração de dados                   |

Para a descrição detalhada de cada recurso e exemplos de prompts → [Recursos suportados](./capabilities)

## Links relacionados

- [Prática: desenvolvendo o plugin de marca d'água](./watermark-plugin) — Caso prático completo de desenvolvimento de plugin com IA, da frase única ao plugin pronto para uso
- [Recursos suportados](./capabilities) — Tudo o que a IA pode fazer por você, com exemplos de prompts
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [Referência do NocoBase CLI](../api/cli/index.md) — Descrição completa dos parâmetros de todos os comandos
- [Desenvolvimento de plugins](../plugin-development/index.md) — Guia completo de desenvolvimento de plugins NocoBase
- [Início rápido da construção com IA](../ai-builder/index.md) — Use IA para construir aplicações NocoBase (sem precisar escrever código)
