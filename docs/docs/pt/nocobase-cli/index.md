# Início rápido

Se esta é a primeira vez que usa esta CLI, você não precisa memorizar todos os comandos no início. Use `nb init --ui` para instalar um aplicativo primeiro e depois continue examinando o restante de acordo com o cenário.

## Primeiro estabeleça a mente mais importante

No NocoBase CLI, as operações subsequentes não giram em torno de "um determinado diretório" ou "uma determinada porta" por padrão, mas em torno de **env**.

Você pode pensar em env como "um conjunto de conexões de aplicativos e informações de execução lembradas pela CLI". Desde que tenha sido salvo com sucesso, muitos comandos subsequentes podem ser usados ​​diretamente:

- Use `nb init` para instalar um novo aplicativo e salvá-lo como env
- Use `nb env add` para conectar um aplicativo existente à CLI
- Gerencie este ambiente com `nb app start`, `nb app logs`, `nb app upgrade`
- Faça backup e restaure este ambiente usando `nb backup`
- Use `nb app autostart`, `nb proxy` para continuar a complementar os recursos do ambiente de produção

Tenha isso em mente primeiro e os documentos subsequentes serão muito mais fáceis.

## Caminho recomendado padrão

Se você não sabe por onde começar, geralmente é mais fácil seguir este caminho:

1. Primeiro leia [Instalação usando CLI (recomendado)](./installation/cli.md) e conclua `nb init` uma vez.
2. Depois que o aplicativo for salvo como ambiente, consulte [Gerenciamento de múltiplos ambientes](./operations/multi-environment.md) para confirmar o ambiente atual, alternar o ambiente e verificar o status.
3. Para inicialização diária, parada, registro e atualização, continue em [Gerenciar aplicativo](./operations/manage-app.md).
4. Antes de fazer atualizações, migrações ou alterações importantes, consulte [Backup e restauração](./operations/backup-restore.md).
5. Se você estiver pronto para ficar online oficialmente, insira [Visão geral da implantação do ambiente de produção] (./production/index.md).

As três primeiras etapas cobrem a maioria dos cenários de uso.

## Índice rápido

| Eu quero... | Onde procurar |
| --- | --- |
| Ainda não há aplicativo, primeiro instale um novo NocoBase e salve-o como CLI env | [Instalar usando CLI (recomendado)](./installation/cli.md) |
| Já possui um NocoBase em execução e deseja acessar o gerenciamento CLI | [Instalar usando CLI (recomendado)](./installation/cli.md) |
| Migre gradualmente métodos de instalação antigos para CLI | [Migrar de métodos de instalação antigos para CLI](./installation/migration.md) |
| Veja quais ambientes são salvos localmente, alterne o ambiente atual e verifique o status | [Gerenciamento de vários ambientes](./operations/multi-environment.md) |
| Iniciar, parar, reiniciar o aplicativo, visualizar logs ou continuar a atualização | [Gerenciar aplicativo](./operations/manage-app.md) |
| Faça um backup antes de atualizar, migrar ou alterar dados em lote e restaure-os quando necessário | [Backup e restauração](./operations/backup-restore.md) |
| Primeiro, confirme as principais variáveis ​​de ambiente necessárias para executar o aplicativo | [Variáveis ​​de ambiente do aplicativo](./installation/env.md) |
| Instale plug-ins de terceiros | [Instalação e atualização de plug-ins de terceiros](./plugins/third-party.md) |
| Deixe o aplicativo entrar no ambiente de produção: inicialização automática, acesso externo estável, proxy reverso | [Visão geral da implantação do ambiente de produção](./production/index.md) |

## Quando olhar a referência do comando

Este conjunto de documentos de início rápido é mais "o que eu quero fazer agora". Se você já sabe qual comando deseja executar e deseja apenas continuar a ver os parâmetros completos, basta acessar [Referência de comando CLI NocoBase](../api/cli/index.md).

As sugestões padrão são:

- Primeiro use o documento de início rápido para estabelecer uma noção do caminho
- Em seguida, verifique os detalhes dos parâmetros na página de comando específica

Isso torna mais fácil começar do que ler a árvore de comandos completa à primeira vista.
