# Capítulo 1: Primeiros passos com NocoBase

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 Experimente rapidamente

Primeiro, recomendamos que você experimente rapidamente o NocoBase para conhecer sua potência. Você pode acessar o [Demo Online](https://demo-cn.nocobase.com/new), preencher seu e-mail e informações relacionadas, e clicar em ativar. Você receberá um sistema de avaliação válido por 2 dias, com todos os plugins comerciais inclusos:

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

Após receber o e-mail oficial do NocoBase, você pode explorar à vontade e sentir a flexibilidade e a potência do NocoBase. Sinta-se livre para experimentar tudo no sistema de avaliação, sem qualquer preocupação.

## 1.2 A interface básica do NocoBase

Bem-vindo ao NocoBase! No primeiro uso, a interface pode parecer um pouco estranha e talvez você não saiba por onde começar. Não se preocupe, vamos conhecer aos poucos as principais áreas funcionais para você se familiarizar rapidamente.

### 1.2.1 **Configuração da UI**

Ao entrar pela primeira vez no NocoBase, você verá uma interface simples e intuitiva. No canto superior direito está o botão de [**Configuração da UI**](https://docs-cn.nocobase.com/handbook/ui/ui-editor); ao clicar, o sistema entra no modo de configuração da interface. Esta é a área principal onde você monta as páginas do sistema.

![Modo de configuração da UI](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**Passos:**

1. **Entre no modo de configuração**: clique no botão "Configuração da UI" no canto superior direito para entrar no modo de configuração.
2. **Adicionar página de [menu](https://docs-cn.nocobase.com/handbook/ui/menus)**:
   - Clique em "Adicionar item de menu".
   - Digite o nome do menu (por exemplo, "Página de teste") e confirme.
   - O sistema cria automaticamente a nova página de teste e redireciona para ela.

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **Criar [bloco](https://docs-cn.nocobase.com/handbook/ui/blocks)**:
   - Na página de teste, clique no botão "Criar bloco".
   - Selecione um bloco de dados, por exemplo, "Bloco de tabela".
   - Conecte uma tabela, como a tabela "Usuários", embutida no sistema.
   - Selecione os campos que deseja exibir e confirme.
4. Pronto, um bloco de tabela exibindo a lista de usuários está concluído!

![Criar bloco](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

Não é simples? O design dos blocos do NocoBase é inspirado no Notion, mas mais poderoso, capaz de suportar a construção de sistemas mais complexos. Nos próximos tutoriais, vamos explorar a fundo os recursos dos diversos blocos, fique ligado!

### 1.2.2 **Gerenciador de Plugins**

Plugins são ferramentas essenciais para estender as funcionalidades do NocoBase. No [**Gerenciador de Plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager), você pode visualizar, instalar, ativar ou desativar diversos plugins, atendendo a diferentes necessidades de negócio.

Por meio de extensões via plugin, você pode implementar integrações práticas e até inesperadas, facilitando ainda mais a sua criação e desenvolvimento.

![Gerenciador de Plugins](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**Passos:**

1. **Ver plugins instalados**: clique em "Gerenciador de Plugins" para ver a lista de todos os plugins instalados.
2. **Ativar plugin**:
   - Encontre o plugin desejado, por exemplo, o plugin "Editor de Temas".
   - Clique em "Ativar" para ativar o plugin.
3. **Testar funcionalidade do plugin**:
   - Após ativar o "Editor de Temas", no menu pessoal no canto superior direito você pode mudar rapidamente o tema do sistema.
     ![Mudar tema do sistema](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - Na central de configurações, você verá a interface do editor de temas, onde pode personalizar o tema (cores, fontes etc.).
     ![Interface do editor de temas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **Página de Configurações**

A **página de configurações** integra as opções do sistema e de alguns plugins, ajudando você a gerenciar todos os aspectos do NocoBase.

![Página de Configurações](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**Algumas configurações de plugins comuns:**

- [**Gerenciamento de Data Source**](https://docs-cn.nocobase.com/handbook/data-source-manager): gerencia todas as tabelas, configura o banco de dados principal ou bancos externos.
- [**Configurações do Sistema**](https://docs-cn.nocobase.com/handbook/system-settings): altera nome do sistema, logo, idioma e outras informações básicas.
- [**Usuários e Permissões**](https://docs-cn.nocobase.com/handbook/users): gerencia contas de usuário e configura permissões de diferentes papéis.
- [**Configurações de Plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager): faça configurações detalhadas para os plugins instalados.

### 1.2.4 **Informações de versão e suporte**

No canto superior direito da interface você encontra as **informações de versão do NocoBase**. Se tiver dúvidas durante o uso, visite a **homepage** e o **manual do usuário** para obter ajuda.

![Informações de versão](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **Menu pessoal**

O menu pessoal fica no canto superior direito; ali você pode **editar suas informações pessoais** e **trocar de papel**, além de executar algumas operações importantes do sistema.
Naturalmente, alguns plugins também estendem as funcionalidades disponíveis aqui.

![Menu pessoal](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 Instalando o NocoBase

Depois de decidir adotar o NocoBase, precisamos instalá-lo em seu computador ou servidor. O NocoBase oferece várias formas de instalação; escolha a que mais combina com você e comece sua jornada no desenvolvimento no-code.

### 1.3.1 **Métodos de instalação**

1. **Instalação via Docker (recomendado)**

   - **Vantagens**: rápido e simples, ideal para usuários familiarizados com Docker.
   - **Escolha de versão**:
     - **Versão main & latest**: a versão estável mais recente, indicada para a maioria dos usuários.
     - **Versão next**: versão de testes internos, para quem quer experimentar novidades. Note que ainda pode não estar totalmente estável; recomendamos backup dos dados importantes antes de usar.
   - **Passos**:
     - Consulte o [guia oficial de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose) e implante o NocoBase com Docker Compose.
2. **Instalação via Create-NocoBase-App**

   - **Indicado para**: desenvolvedores frontend ou usuários familiarizados com npm.
   - **Passos**:
     - Consulte o [guia de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app) e instale via pacote npm.
3. **Instalação a partir do código-fonte**

   - **Indicado para**: desenvolvedores que precisam de personalização profunda do NocoBase.
   - **Passos**:
     - Consulte o [guia de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone), clone o código-fonte do GitHub e instale conforme suas necessidades.

### 1.3.2 **Guia detalhado de instalação (exemplo com Docker)**

Independentemente do método escolhido, você encontrará passos detalhados na **documentação de instalação do NocoBase**. Abaixo está um resumo da instalação via Docker, para você começar rápido:

1. **Instale o Docker**: certifique-se de que seu sistema já tem o Docker instalado. Caso contrário, acesse o [site oficial do Docker](https://www.docker.com/) para baixar e instalar.
2. **Obtenha o arquivo Docker Compose**:

   - Abra o terminal ou linha de comando.
   - Crie a pasta nocobase e o arquivo de configuração do Docker Compose.

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. Dentro de `docker-compose.yml`, cole a configuração abaixo, ajuste conforme necessário e salve o arquivo.

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # Chave secreta da aplicação, usada para gerar tokens de usuário etc.
          # Se a APP_KEY for alterada, os tokens antigos serão invalidados.
          # Pode ser qualquer string aleatória; mantenha-a em sigilo.
          - APP_KEY=your-secret-key
          # Tipo de banco de dados: postgres, mysql, mariadb, sqlite
          - DB_DIALECT=postgres
          # Host do banco; pode ser substituído pelo IP de um servidor de banco existente
          - DB_HOST=postgres
          # Nome do banco
          - DB_DATABASE=nocobase
          # Usuário do banco
          - DB_USER=nocobase
          # Senha do banco
          - DB_PASSWORD=nocobase
          # Fuso horário
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # Se você usa um banco de dados existente, não precisa subir o postgres
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **Inicie o NocoBase**:
   - Na pasta nocobase, execute o comando abaixo para iniciar os serviços:

```bash
docker-compose up -d
```

- Isso irá baixar as imagens necessárias e iniciar os serviços do NocoBase.

5. **Acesse o NocoBase**:
   - Abra o navegador e acesse `http://localhost:13000` (pode variar conforme sua configuração) para ver a tela de login do NocoBase.

Após esses passos, você instalou e iniciou o NocoBase com sucesso! Em seguida, você pode seguir o guia do tutorial para começar a construir o seu próprio sistema.

---

Esperamos que, com este passo a passo, você tenha se familiarizado com a interface básica e o processo de instalação do NocoBase. No [próximo capítulo (Capítulo 2: Projetando o sistema de gerenciamento de tarefas)](https://www.nocobase.com/cn/tutorials/task-tutorial-system-design), exploraremos mais a fundo o poder do NocoBase, ajudando você a construir aplicações ricas em funcionalidades. Vamos juntos dar o próximo passo nessa jornada do desenvolvimento no-code!
