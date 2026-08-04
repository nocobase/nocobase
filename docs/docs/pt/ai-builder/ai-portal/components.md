---
title: "Componentes padrão e extensões"
description: "A base de componentes shadcn/ui do AI Portal e o seu mecanismo de extensão — um diretório por extensão, descoberto e montado automaticamente."
keywords: "AI Portal,shadcn/ui,componentes,extensões,AppExtension,Registry,Tailwind CSS"
---

# Componentes padrão e extensões

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você já colocou o seu primeiro Portal no ar seguindo o [Início rápido do AI Portal](./index.md).

:::

A interface de um Portal tem duas partes: `src/components/ui` fornece os componentes base e `src/extensions` guarda os módulos de negócio. Esta página explica como usar as duas.

## Base de componentes

`src/components/ui` tem mais de 60 componentes [shadcn/ui](https://ui.shadcn.com/) — botões, formulários, diálogos, gavetas, tabelas, gráficos, todos os mais comuns. O estilo é configurado em `components.json` e os ícones vêm do lucide.

Diferente de trazer uma biblioteca de componentes, **o código-fonte desses componentes pertence ao seu projeto**. Eles ficam no seu repositório, você pode alterá-los à vontade e as atualizações do upstream nunca os sobrescrevem.

Por causa disso, customize por composição em vez de editá-los diretamente:

```tsx
// Recomendado: envolva o componente, para que o componente base continue substituível
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Editar `src/components/ui/button.tsx` diretamente também funciona, mas dificulta incorporar correções de bugs do upstream mais tarde. Quando você realmente precisar alterar um componente base, compare antes com a versão do upstream e faça um merge seletivo em vez de sobrescrever por completo as suas alterações locais.

:::warning Atenção

Não traga o Ant Design, nem os componentes de cliente do NocoBase baseados em Ant Design, para dentro de um Portal. O sistema de estilos do Portal é Tailwind CSS mais shadcn/ui, e misturá-los causa conflitos de estilo. Essa convenção já está escrita no `AGENTS.md` do template.

:::

## Mecanismo de extensão

As funcionalidades de negócio são escritas como extensões em `src/extensions/`, um diretório por módulo funcional:

```text
src/extensions/
├── nocobase-acl/               Componentes de permissão
├── nocobase-ai/                Capacidades de conversa com IA
├── nocobase-route-surfaces/    Rotas em página, gaveta e modal
└── nocobase-users-example/     Exemplo de gerenciamento de usuários
```

Cada diretório tem um `extension.tsx` com um export default de um `AppExtension`. O template varre e carrega tudo automaticamente — **basta colocar no diretório e já funciona, sem código de registro para alterar**.

## AppExtension

Uma extensão pode fornecer o seguinte:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador da extensão, obrigatório |
| `priority` | Ordem de carregamento, números menores primeiro, 100 por padrão |
| `resources` | Definições de recursos do Refine, que determinam o menu de navegação e o mapeamento de rotas |
| `routes` | Elementos de rota, montados na árvore de rotas autenticadas |
| `Provider` | Um Provider que envolve toda a aplicação |
| `AuthRuntimeProvider` | Provider do runtime de autenticação, ativo antes do login |
| `UserMenuItems` | Entradas a serem adicionadas ao menu do usuário |
| `authAdapters` | Adaptadores de métodos de autenticação |
| `dev` | Recursos e rotas que só valem em modo de desenvolvimento |

Uma extensão mínima fica assim:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Participa da verificação de permissão de tabela do NocoBase
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Extensões nativas

O template vem com quatro extensões. Elas estão prontas para uso e também são a melhor referência na hora de escrever código novo:

**`nocobase-users-example`** — Um módulo CRUD completo sobre a tabela `users` padrão do NocoBase, com listagem, criação, edição e detalhe. Aponte a IA para ela ao montar uma página nova.

**`nocobase-acl`** — Componentes de permissão: `CanAccess`, `AclPage`, `AclRegion`, `AclField` e `RoleSwitcher`.

**`nocobase-route-surfaces`** — Três formas de rota: página inteira, gaveta e modal. O mesmo conteúdo pode abrir como página independente ou surgir como gaveta dentro de uma página de listagem, com o estado da rota sempre sincronizado.

**`nocobase-ai`** — Leva as capacidades de conversa com IA do NocoBase para o frontend, incluindo a janela de chat, streaming, histórico de conversas e contexto da página. Use para construir um assistente de IA dentro do seu próprio Portal.

## Regras de importação

Duas convenções de caminho valem ao escrever uma extensão:

- Use o alias `@/` para tudo que vem da aplicação hospedeira, como `@/components/ui/button`
- Não deixe as importações relativas dentro da extensão saírem do diretório dela

Isso mantém toda extensão autocontida, de modo que você pode copiar o diretório inteiro para outro Portal e continuar usando.

## Extensões oficiais instaláveis

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Além das quatro nativas, o NocoBase vai oferecer um conjunto de extensões oficiais que você pode instalar conforme a necessidade. Depois de instalada, o código-fonte fica em `src/extensions/` e passa a ser código do seu próprio projeto, igual a uma extensão nativa, pronto para ser alterado e comitado junto com a aplicação.

## Internacionalização

Os textos ficam em `src/locales/`, e o template já vem com inglês e chinês. Uma extensão também pode ter o seu próprio pacote de idiomas — crie um diretório `locales/` dentro da extensão e importe-o a partir do `extension.tsx`.

## Links relacionados

- [Início rápido do AI Portal](./index.md) — Coloque no ar a sua primeira entrada de frontend escrita pela IA
- [Estrutura do projeto e stack técnica](./project-structure.md) — As convenções completas de diretórios e os comandos mais usados
- [Construção com AI Agent](./agent-workflow.md) — Faça a IA seguir uma extensão nativa ao escrever um módulo novo
