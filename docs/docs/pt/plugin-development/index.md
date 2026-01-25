:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral do Desenvolvimento de Plugins

O NocoBase adota uma **arquitetura de microkernel**, onde o núcleo é responsável apenas pelo agendamento do ciclo de vida dos plugins, pelo gerenciamento de dependências e pela encapsulação de capacidades básicas. Todas as funcionalidades de negócio são fornecidas na forma de plugins. Portanto, entender a estrutura organizacional, o ciclo de vida e a forma de gerenciamento dos plugins é o primeiro passo para personalizar o NocoBase.

## Conceitos Essenciais

- **Plug and Play**: Você pode instalar, habilitar ou desabilitar plugins conforme a necessidade, permitindo a combinação flexível de funcionalidades de negócio sem a necessidade de modificar o código.
- **Integração Full-stack**: Os plugins geralmente incluem implementações tanto no lado do servidor quanto no lado do cliente, garantindo a consistência entre a lógica de dados e as interações da interface.

## Estrutura Básica de um Plugin

Cada plugin é um pacote npm independente e geralmente possui a seguinte estrutura de diretórios:

```bash
plugin-hello/
├─ package.json          # Nome do plugin, dependências e metadados do plugin NocoBase
├─ client.js             # Artefato de build frontend para carregamento em tempo de execução
├─ server.js             # Artefato de build backend para carregamento em tempo de execução
├─ src/
│  ├─ client/            # Código-fonte do lado do cliente, pode registrar blocos, ações, campos, etc.
│  └─ server/            # Código-fonte do lado do servidor, pode registrar recursos, eventos, comandos, etc.
```

## Convenções de Diretório e Ordem de Carregamento

Por padrão, o NocoBase verifica os seguintes diretórios para carregar plugins:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins em desenvolvimento (prioridade mais alta)
└── storage/
    └── plugins/          # Plugins compilados, por exemplo, plugins enviados ou publicados
```

- `packages/plugins`: É o diretório para o desenvolvimento local de plugins, com suporte a compilação e depuração em tempo real.
- `storage/plugins`: Armazena plugins compilados, como edições comerciais ou plugins de terceiros.

## Ciclo de Vida e Estados do Plugin

Um plugin geralmente passa pelas seguintes etapas:

1. **Criar (create)**: Cria um template de plugin via CLI.
2. **Puxar (pull)**: Baixa o pacote do plugin localmente, mas ainda não o grava no banco de dados.
3. **Habilitar (enable)**: Na primeira habilitação, executa "registro + inicialização"; habilitações subsequentes apenas carregam a lógica.
4. **Desabilitar (disable)**: Interrompe a execução do plugin.
5. **Remover (remove)**: Remove completamente o plugin do sistema.

:::tip

- O `pull` apenas baixa o pacote do plugin; o processo de instalação real é acionado pela primeira vez que você o `enable`.
- Se um plugin for apenas `pull`ed, mas não habilitado, ele não será carregado.

:::

### Exemplos de Comandos CLI

```bash
# 1. Cria o esqueleto do plugin
yarn pm create @my-project/plugin-hello

# 2. Puxa o pacote do plugin (baixa ou vincula)
yarn pm pull @my-project/plugin-hello

# 3. Habilita o plugin (instala automaticamente na primeira habilitação)
yarn pm enable @my-project/plugin-hello

# 4. Desabilita o plugin
yarn pm disable @my-project/plugin-hello

# 5. Remove o plugin
yarn pm remove @my-project/plugin-hello
```

## Interface de Gerenciamento de Plugins

Acesse o gerenciador de plugins no navegador para visualizar e gerenciar plugins de forma intuitiva:

**URL Padrão:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gerenciador de Plugins](https://static-docs.nocobase.com/20251030195350.png)