:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/ticket-system/installation).
:::

# Como instalar

> A versão atual utiliza o formato de **backup e restauração** para implantação. Em versões futuras, poderemos mudar para o formato de **migração incremental**, a fim de facilitar a integração da solução em seus sistemas existentes.

Para que você possa implantar a solução de chamados em seu próprio ambiente NocoBase de forma rápida e suave, oferecemos dois métodos de restauração. Escolha o mais adequado para você com base na sua versão de usuário e conhecimento técnico.

Antes de começar, certifique-se de que:

- Você já possui um ambiente de execução básico do NocoBase. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation) detalhada.
- Versão do NocoBase **2.0.0-beta.5 ou superior**
- Você já baixou os arquivos correspondentes do sistema de chamados:
  - **Arquivo de backup**: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata) - Aplicável ao Método 1
  - **Arquivo SQL**: [nocobase_tickets_v2_sql_260324.zip](https://static-docs.nocobase.com/nocobase_tickets_v2_sql_260324.zip) - Aplicável ao Método 2

**Instruções importantes**:
- Esta solução foi criada com base no banco de dados **PostgreSQL 16**, certifique-se de que seu ambiente utilize o PostgreSQL 16.
- **DB_UNDERSCORED não pode ser true**: Verifique seu arquivo `docker-compose.yml` e garanta que a variável de ambiente `DB_UNDERSCORED` não esteja definida como `true`, caso contrário, haverá conflito com o backup da solução, resultando em falha na restauração.

---

## Método 1: Restaurar usando o Gerenciador de Backup (Recomendado para usuários Pro/Enterprise)

Esta forma realiza a restauração com um clique através do plugin "[Gerenciador de Backup](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) integrado ao NocoBase, sendo a operação mais simples. No entanto, possui certos requisitos de ambiente e versão de usuário.

### Características principais

* **Vantagens**:
  1. **Operação conveniente**: Pode ser concluída na interface UI, restaurando completamente todas as configurações, incluindo plugins.
  2. **Restauração completa**: **Capaz de restaurar todos os arquivos do sistema**, incluindo arquivos de modelos de impressão, arquivos enviados em campos de arquivo de tabelas, etc., garantindo a integridade das funções.
* **Limitações**:
  1. **Restrito a Pro/Enterprise**: O "Gerenciador de Backup" é um plugin de nível empresarial, disponível apenas para usuários Pro/Enterprise.
  2. **Requisitos rigorosos de ambiente**: Exige que o ambiente do seu banco de dados (versão, configurações de sensibilidade a maiúsculas e minúsculas, etc.) seja altamente compatível com o ambiente onde o backup foi criado.
  3. **Dependência de plugins**: Se a solução incluir plugins comerciais que você não possui em seu ambiente local, a restauração falhará.

### Passos da operação

**Passo 1: [Fortemente recomendado] Inicie a aplicação usando a imagem `full`**

Para evitar falhas na restauração devido à falta de clientes de banco de dados, recomendamos fortemente o uso da versão `full` da imagem Docker. Ela possui todos os programas de suporte necessários integrados, eliminando a necessidade de configurações extras.

Exemplo de comando para baixar a imagem:

```bash
docker pull nocobase/nocobase:beta-full
```

Em seguida, use esta imagem para iniciar seu serviço NocoBase.

> **Nota**: Se não usar a imagem `full`, você poderá precisar instalar manualmente o cliente de banco de dados `pg_dump` dentro do contêiner, um processo complicado e instável.

**Passo 2: Ative o plugin "Gerenciador de Backup"**

1. Faça login no seu sistema NocoBase.
2. Vá em **`Gerenciamento de Plugins`**.
3. Encontre e ative o plugin **`Gerenciador de Backup`**.

**Passo 3: Restaurar a partir de um arquivo de backup local**

1. Após ativar o plugin, atualize a página.
2. Vá ao menu à esquerda em **`Gerenciamento do Sistema`** -> **`Gerenciador de Backup`**.
3. Clique no botão **`Restaurar de backup local`** no canto superior direito.
4. Arraste o arquivo de backup baixado para a área de upload.
5. Clique em **`Enviar`** e aguarde pacientemente o sistema concluir a restauração; este processo pode levar de alguns segundos a alguns minutos.

### Observações

* **Compatibilidade do banco de dados**: Este é o ponto mais crítico deste método. A **versão, o conjunto de caracteres e as configurações de sensibilidade a maiúsculas e minúsculas** do seu banco de dados PostgreSQL devem corresponder ao arquivo de origem do backup. Especialmente o nome do `schema` deve ser consistente.
* **Correspondência de plugins comerciais**: Certifique-se de que você possui e ativou todos os plugins comerciais exigidos pela solução, caso contrário, a restauração será interrompida.

---

## Método 2: Importar arquivo SQL diretamente (Universal, mais adequado para a versão Community)

Esta forma restaura os dados operando diretamente no banco de dados, ignorando o plugin "Gerenciador de Backup", portanto, não possui as restrições de plugins Pro/Enterprise.

### Características principais

* **Vantagens**:
  1. **Sem restrição de versão**: Aplicável a todos os usuários do NocoBase, incluindo a versão Community.
  2. **Alta compatibilidade**: Não depende da ferramenta `dump` interna da aplicação; funciona desde que seja possível conectar ao banco de dados.
  3. **Alta tolerância a falhas**: Se a solução contiver plugins comerciais que você não possui, as funções relacionadas não serão ativadas, mas isso não afetará o uso normal de outras funções e a aplicação poderá ser iniciada com sucesso.
* **Limitações**:
  1. **Exige capacidade de operação de banco de dados**: Exige que o usuário tenha conhecimentos básicos de operação de banco de dados, como por exemplo, como executar um arquivo `.sql`.
  2. **Perda de arquivos do sistema**: **Este método perderá todos os arquivos do sistema**, incluindo arquivos de modelos de impressão, arquivos enviados em campos de arquivo de tabelas, etc.

### Passos da operação

**Passo 1: Preparar um banco de dados limpo**

Prepare um banco de dados novo e vazio para os dados que você está prestes a importar.

**Passo 2: Importar o arquivo `.sql` para o banco de dados**

Obtenha o arquivo de banco de dados baixado (geralmente no formato `.sql`) e importe seu conteúdo para o banco de dados preparado no passo anterior. Existem várias formas de fazer isso, dependendo do seu ambiente:

* **Opção A: Via linha de comando do servidor (exemplo com Docker)**
  Se você usa Docker para instalar o NocoBase e o banco de dados, pode enviar o arquivo `.sql` para o servidor e usar o comando `docker exec` para realizar a importação. Supondo que o nome do seu contêiner PostgreSQL seja `my-nocobase-db` e o nome do arquivo seja `ticket_system.sql`:

  ```bash
  # Copiar o arquivo sql para dentro do contêiner
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Entrar no contêiner e executar o comando de importação
  docker exec -it my-nocobase-db psql -U seu_usuario -d nome_do_seu_banco -f /tmp/ticket_system.sql
  ```
* **Opção B: Via cliente de banco de dados remoto**
  Se a porta do seu banco de dados estiver exposta, você pode usar qualquer cliente gráfico de banco de dados (como DBeaver, Navicat, pgAdmin, etc.) para se conectar ao banco, abrir uma nova janela de consulta, colar todo o conteúdo do arquivo `.sql` e executá-lo.

**Passo 3: Conectar ao banco de dados e iniciar a aplicação**

Configure os parâmetros de inicialização do seu NocoBase (como as variáveis de ambiente `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) para apontar para o banco de dados onde você acabou de importar os dados. Em seguida, inicie o serviço NocoBase normalmente.

### Observações

* **Permissões do banco de dados**: Este método exige que você tenha uma conta e senha que possam operar diretamente o banco de dados.
* **Status dos plugins**: Após a importação bem-sucedida, embora os dados dos plugins comerciais existam no sistema, se você não tiver instalado e ativado os plugins correspondentes localmente, as funções relacionadas não serão exibidas ou utilizadas, mas isso não causará o travamento da aplicação.

---

## Resumo e Comparação

| Característica | Método 1: Gerenciador de Backup | Método 2: Importação direta de SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Usuários aplicáveis** | Usuários **Pro/Enterprise** | **Todos os usuários** (incluindo Community) |
| **Facilidade de operação** | ⭐⭐⭐⭐⭐ (Muito simples, operação via UI) | ⭐⭐⭐ (Exige conhecimentos básicos de banco de dados) |
| **Requisitos de ambiente** | **Rigorosos**, versões de banco de dados e sistema devem ser altamente compatíveis | **Comuns**, exige compatibilidade de banco de dados |
| **Dependência de plugins** | **Dependência forte**, os plugins são validados na restauração; a falta de qualquer plugin causará **falha na restauração**. | **Funções dependem fortemente de plugins**. Os dados podem ser importados de forma independente e o sistema terá funções básicas. Mas se faltarem os plugins correspondentes, as funções relacionadas ficarão **completamente inutilizáveis**. |
| **Arquivos do sistema** | **Totalmente preservados** (modelos de impressão, arquivos enviados, etc.) | **Serão perdidos** (modelos de impressão, arquivos enviados, etc.) |
| **Cenário recomendado** | Usuários empresariais com ambiente controlado e consistente, que precisam de funcionalidade completa | Falta de alguns plugins, busca por alta compatibilidade e flexibilidade, usuários não Pro/Enterprise, aceitam a perda de funções de arquivos |

Esperamos que este tutorial ajude você a implantar o sistema de chamados com sucesso. Se encontrar qualquer problema durante o processo, sinta-se à vontade para entrar em contato conosco!
---

*Last updated: 2026-03-24*
