---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Multi-aplicativo

## Introdução

O **plugin Multi-aplicativo** permite que você crie e gerencie dinamicamente múltiplos aplicativos independentes sem a necessidade de implantações separadas. Cada subaplicativo é uma instância completamente independente, com seu próprio banco de dados, **plugins** e configuração.

#### Casos de Uso
- **Multilocação**: Forneça instâncias de aplicativo independentes, onde cada cliente tem seus próprios dados, configurações de **plugins** e sistema de permissões.
- **Sistemas principais e subsistemas para diferentes domínios de negócio**: Um sistema grande composto por múltiplos aplicativos menores implantados independentemente.

:::warning
O **plugin** Multi-aplicativo, por si só, não oferece recursos de compartilhamento de usuários.
Se você precisar de usuários compartilhados entre múltiplos aplicativos, você pode usá-lo em conjunto com o **[plugin de Autenticação](/auth-verification)**.
:::

## Instalação

No gerenciador de **plugins**, encontre o **plugin Multi-aplicativo** e o ative.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Guia de Uso

### Criando um Subaplicativo

No menu de configurações do sistema, clique em "Multi-aplicativo" para acessar a página de gerenciamento de multiaplicativos.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Clique no botão "Adicionar Novo" para criar um novo subaplicativo:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descrição dos Campos do Formulário

* **Nome**: Identificador do subaplicativo, globalmente único.
* **Nome de Exibição**: O nome do subaplicativo exibido na interface.
* **Modo de Inicialização**:
  * **Iniciar no primeiro acesso**: O subaplicativo é iniciado somente quando um usuário o acessa pela primeira vez via URL;
  * **Iniciar com o aplicativo principal**: O subaplicativo é iniciado ao mesmo tempo que o aplicativo principal (isso aumentará o tempo de inicialização do aplicativo principal).
* **Porta**: O número da porta usado pelo subaplicativo em tempo de execução.
* **Domínio Personalizado**: Configure um subdomínio independente para o subaplicativo.
* **Fixar no menu**: Fixe a entrada do subaplicativo no lado esquerdo da barra de navegação superior.
* **Conexão com o Banco de Dados**: Usado para configurar a **fonte de dados** para o subaplicativo, suportando os três métodos a seguir:
  * **Novo banco de dados**: Reutilize o serviço de dados atual para criar um banco de dados independente;
  * **Nova conexão de dados**: Configure um serviço de banco de dados completamente novo;
  * **Modo Schema**: Crie um schema independente para o subaplicativo no PostgreSQL.
* **Atualização**: Se o banco de dados conectado contiver uma versão mais antiga da estrutura de dados do NocoBase, ele será automaticamente atualizado para a versão atual.

### Iniciando e Parando um Subaplicativo

Clique no botão **Iniciar** para iniciar o subaplicativo;
> Se a opção *"Iniciar no primeiro acesso"* foi marcada durante a criação, ele será iniciado automaticamente no primeiro acesso.

Clique no botão **Visualizar** para abrir o subaplicativo em uma nova aba.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Status e Logs do Subaplicativo

Na lista, você pode visualizar o uso de memória e CPU de cada aplicativo.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Clique no botão **Logs** para visualizar os logs de execução do subaplicativo.
> Se o subaplicativo estiver inacessível após a inicialização (por exemplo, devido a um banco de dados corrompido), você pode usar os logs para solucionar problemas.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Excluindo um Subaplicativo

Clique no botão **Excluir** para remover o subaplicativo.
> Ao excluir, você pode escolher se deseja excluir o banco de dados também. Por favor, prossiga com cautela, pois esta ação é irreversível.

### Acessando um Subaplicativo
Por padrão, os subaplicativos são acessados usando `/_app/:appName/admin/`, por exemplo:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Além disso, você pode configurar um subdomínio independente para o subaplicativo. Você precisará resolver o domínio para o IP atual e, se estiver usando Nginx, também precisará adicionar o domínio à configuração do Nginx.

### Gerenciando Subaplicativos via Linha de Comando

No diretório raiz do projeto, você pode usar a linha de comando para gerenciar instâncias de subaplicativos via **PM2**:

```bash
yarn nocobase pm2 list              # Visualiza a lista de instâncias em execução
yarn nocobase pm2 stop [appname]    # Para um processo de subaplicativo específico
yarn nocobase pm2 delete [appname]  # Exclui um processo de subaplicativo específico
yarn nocobase pm2 kill              # Encerra forçadamente todos os processos iniciados (pode incluir instâncias do aplicativo principal)
```

### Migrando Dados do Multi-aplicativo Antigo

Vá para a página de gerenciamento do multi-aplicativo antigo e clique no botão **Migrar dados para o novo multi-aplicativo** para migrar os dados.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Perguntas Frequentes

#### 1. Gerenciamento de Plugins
Os subaplicativos podem usar os mesmos **plugins** que o aplicativo principal (incluindo as versões), mas podem ser configurados e usados independentemente.

#### 2. Isolamento de Banco de Dados
Os subaplicativos podem ser configurados com bancos de dados independentes. Se você quiser compartilhar dados entre aplicativos, você pode fazer isso através de **fontes de dados** externas.

#### 3. Backup e Migração de Dados
Atualmente, os backups de dados no aplicativo principal não incluem dados de subaplicativos (apenas informações básicas do subaplicativo). Você precisa fazer backup e migrar os dados manualmente dentro de cada subaplicativo.

#### 4. Implantação e Atualizações
A versão de um subaplicativo será automaticamente atualizada junto com o aplicativo principal, garantindo a consistência da versão entre o aplicativo principal e os subaplicativos.

#### 5. Gerenciamento de Recursos
O consumo de recursos de cada subaplicativo é basicamente o mesmo que o do aplicativo principal. Atualmente, um único aplicativo usa cerca de 500-600MB de memória.