---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/multi-space/multi-app).
:::

# Multi-app

## Introdução

O **plugin Multi-app** permite a criação e o gerenciamento dinâmico de múltiplos aplicativos independentes sem a necessidade de implantações separadas. Cada sub-aplicativo é uma instância completamente independente, com seu próprio banco de dados, plugins e configurações.

#### Casos de Uso
- **Multi-tenancy (Multilocação)**: Fornece instâncias de aplicativos independentes, onde cada cliente possui seus próprios dados, configurações de plugins e sistemas de permissão.
- **Sistemas principais e secundários para diferentes domínios de negócios**: Um sistema de grande porte composto por vários aplicativos pequenos implantados de forma independente.


:::warning
O plugin Multi-app, por si só, não oferece recursos de compartilhamento de usuários.  
Para habilitar a integração de usuários entre múltiplos aplicativos, ele pode ser usado em conjunto com o **[Plugin de Autenticação](/auth-verification)**.
:::


## Instalação

Encontre o plugin **Multi-app** no gerenciador de plugins e ative-o.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Manual do Usuário


### Criando um sub-aplicativo

No menu de configurações do sistema, clique em "Multi-app" para acessar a página de gerenciamento de múltiplos aplicativos:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Clique no botão "Adicionar novo" para criar um novo sub-aplicativo:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descrição dos campos do formulário

* **Nome**: Identificador do sub-aplicativo, globalmente exclusivo.
* **Nome de exibição**: O nome do sub-aplicativo exibido na interface.
* **Modo de inicialização**:
  * **Iniciar no primeiro acesso**: O sub-aplicativo inicia apenas quando você o acessa via URL pela primeira vez.
  * **Iniciar com o aplicativo principal**: O sub-aplicativo inicia simultaneamente com o aplicativo principal (isso aumenta o tempo de inicialização do aplicativo principal).
* **Porta**: O número da porta usado pelo sub-aplicativo durante a execução.
* **Domínio personalizado**: Configure um subdomínio independente para o sub-aplicativo.
* **Fixar no menu**: Fixa a entrada do sub-aplicativo no lado esquerdo da barra de navegação superior.
* **Conexão com o banco de dados**: Usado para configurar a fonte de dados do sub-aplicativo, suportando três métodos:
  * **Novo banco de dados**: Reutiliza o serviço de dados atual para criar um banco de dados independente.
  * **Nova conexão de dados**: Configura um serviço de banco de dados completamente novo.
  * **Modo Schema**: Cria um Schema independente para o sub-aplicativo no PostgreSQL.
* **Atualização**: Se o banco de dados conectado contiver uma versão antiga da estrutura de dados do NocoBase, ele será atualizado automaticamente para a versão atual.


### Executando e parando sub-aplicativos

Clique no botão **Iniciar** para iniciar um sub-aplicativo.  
> Se a opção *"Iniciar no primeiro acesso"* foi marcada durante a criação, ele iniciará automaticamente na primeira visita.  

Clique no botão **Visualizar** para abrir o sub-aplicativo em uma nova aba.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Status e logs do sub-aplicativo

Você pode visualizar o uso de memória e CPU de cada aplicativo na lista.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Clique no botão **Logs** para visualizar os logs de execução do sub-aplicativo.  
> Se um sub-aplicativo estiver inacessível após o início (por exemplo, devido à corrupção do banco de dados), você pode solucionar o problema usando os logs.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Excluindo um sub-aplicativo

Clique no botão **Excluir** para remover um sub-aplicativo.  
> Ao excluir, você pode escolher se deseja excluir também o banco de dados. Prossiga com cautela, pois esta ação é irreversível.


### Acessando sub-aplicativos
Por padrão, use `/_app/:appName/admin/` para acessar os sub-aplicativos, por exemplo:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Além disso, você também pode configurar subdomínios independentes para os sub-aplicativos. É necessário apontar o domínio para o IP atual. Se estiver usando Nginx, o domínio também deve ser adicionado à configuração do Nginx.


### Gerenciando sub-aplicativos via CLI

No diretório raiz do projeto, você pode usar a linha de comando para gerenciar instâncias de sub-aplicativos via **PM2**:

```bash
yarn nocobase pm2 list              # Visualizar a lista de instâncias em execução
yarn nocobase pm2 stop [appname]    # Parar um processo de sub-aplicativo específico
yarn nocobase pm2 delete [appname]  # Excluir um processo de sub-aplicativo específico
yarn nocobase pm2 kill              # Encerrar forçadamente todos os processos iniciados (pode incluir a instância do aplicativo principal)
```

### Migração de dados de Multi-app legado

Acesse a página de gerenciamento de multi-app legado e clique no botão **Migrar dados para o novo Multi-app** para realizar a migração de dados.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Perguntas Frequentes (FAQ)

#### 1. Gerenciamento de Plugins
Os sub-aplicativos podem usar os mesmos plugins que o aplicativo principal (incluindo as versões), mas os plugins podem ser configurados e usados de forma independente.

#### 2. Isolamento de Banco de Dados
Os sub-aplicativos podem ser configurados com bancos de dados independentes. Se você deseja compartilhar dados entre aplicativos, isso pode ser feito por meio de fontes de dados externas.

#### 3. Backup e Migração de Dados
Atualmente, o backup de dados no aplicativo principal não inclui os dados dos sub-aplicativos (inclui apenas informações básicas do sub-aplicativo). Backups e migrações devem ser realizados manualmente dentro de cada sub-aplicativo.

#### 4. Implantação e Atualizações
As versões dos sub-aplicativos seguirão automaticamente as atualizações do aplicativo principal, garantindo a consistência de versão entre o principal e os secundários.

#### 5. Gerenciamento de Recursos
O consumo de recursos de cada sub-aplicativo é basicamente o mesmo do aplicativo principal. Atualmente, o uso de memória de um único aplicativo é de cerca de 500-600 MB.