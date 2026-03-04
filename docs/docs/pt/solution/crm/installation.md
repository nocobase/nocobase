:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/crm/installation).
:::

# Como instalar

> A versão atual adota a forma de **backup e restauração** para a implantação. Em versões posteriores, poderemos mudar para a forma de **migração incremental**, a fim de facilitar a integração da solução aos seus sistemas existentes.

Para que você possa implantar a solução CRM 2.0 de forma rápida e suave em seu próprio ambiente NocoBase, fornecemos dois métodos de restauração. Escolha o mais adequado para você com base na sua versão de usuário e conhecimento técnico.

Antes de começar, certifique-se de que:

- Você já possui um ambiente de execução básico do NocoBase. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation) mais detalhada.
- Versão do NocoBase **v2.1.0-beta.2 e superior**
- Você já baixou os arquivos correspondentes do sistema CRM:
  - **Arquivo de backup**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - Aplicável ao Método Um
  - **Arquivo SQL**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - Aplicável ao Método Dois

**Instruções Importantes**:
- Esta solução foi criada com base no banco de dados **PostgreSQL 16**, certifique-se de que seu ambiente utilize o PostgreSQL 16.
- **DB_UNDERSCORED não pode ser true**: Verifique seu arquivo `docker-compose.yml` e certifique-se de que a variável de ambiente `DB_UNDERSCORED` não esteja definida como `true`, caso contrário, haverá conflito com o backup da solução, resultando em falha na restauração.

---

## Método Um: Restaurar usando o Gerenciador de Backup (Recomendado para usuários das versões Profissional/Enterprise)

Este método realiza a restauração com um clique através do plugin "[Gerenciador de Backup](https://docs-cn.nocobase.com/handbook/backups)" (versão Profissional/Enterprise) integrado ao NocoBase, sendo a operação mais simples. No entanto, ele possui certos requisitos de ambiente e versão do usuário.

### Características principais

* **Vantagens**:
  1. **Operação conveniente**: Pode ser concluída na interface UI, restaurando completamente todas as configurações, incluindo plugins.
  2. **Restauração completa**: **Capaz de restaurar todos os arquivos do sistema**, incluindo arquivos de impressão de modelos, arquivos enviados em campos de arquivo de coleções, etc., garantindo a integridade funcional.
* **Limitações**:
  1. **Limitado às versões Profissional/Enterprise**: O "Gerenciador de Backup" é um plugin de nível empresarial, disponível apenas para usuários das versões Profissional/Enterprise.
  2. **Requisitos rigorosos de ambiente**: Exige que o ambiente do seu banco de dados (versão, configurações de sensibilidade a maiúsculas e minúsculas, etc.) seja altamente compatível com o ambiente onde o backup foi criado.
  3. **Dependência de plugins**: Se a solução incluir plugins comerciais que você não possui em seu ambiente local, a restauração falhará.

### Passos

**Passo 1: 【Fortemente recomendado】 Use a imagem `full` para iniciar a aplicação**

Para evitar falhas na restauração devido à falta de um cliente de banco de dados, recomendamos fortemente que você use a versão `full` da imagem Docker. Ela vem com todos os programas de suporte necessários integrados, para que você não precise realizar configurações adicionais.

Exemplo de comando para baixar a imagem:

```bash
docker pull nocobase/nocobase:beta-full
```

Em seguida, use esta imagem para iniciar seu serviço NocoBase.

> **Nota**: Se não usar a imagem `full`, você poderá precisar instalar manualmente o cliente de banco de dados `pg_dump` dentro do contêiner, um processo complicado e instável.

**Passo 2: Ativar o plugin "Gerenciador de Backup"**

1. Faça login no seu sistema NocoBase.
2. Vá em **`Gerenciamento de plugins`**.
3. Encontre e ative o plugin **`Gerenciador de Backup`**.

**Passo 3: Restaurar a partir de um arquivo de backup local**

1. Após ativar o plugin, atualize a página.
2. Vá ao menu à esquerda em **`Gerenciamento do sistema`** -> **`Gerenciador de Backup`**.
3. Clique no botão **`Restaurar de backup local`** no canto superior direito.
4. Arraste o arquivo de backup baixado para a área de upload.
5. Clique em **`Enviar`**, e aguarde pacientemente o sistema concluir a restauração; este processo pode levar de alguns segundos a vários minutos.

### Observações

* **Compatibilidade do banco de dados**: Este é o ponto mais crítico deste método. A **versão, o conjunto de caracteres e as configurações de sensibilidade a maiúsculas e minúsculas** do seu banco de dados PostgreSQL devem corresponder ao arquivo de origem do backup. Especialmente o nome do `schema` deve ser consistente.
* **Correspondência de plugins comerciais**: Certifique-se de que você já possui e ativou todos os plugins comerciais exigidos pela solução, caso contrário, a restauração será interrompida.

---

## Método Dois: Importar arquivo SQL diretamente (Universal, mais adequado para a versão Community)

Este método restaura os dados operando diretamente no banco de dados, ignorando o plugin "Gerenciador de Backup", portanto, não há restrições de plugins das versões Profissional/Enterprise.

### Características principais

* **Vantagens**:
  1. **Sem restrição de versão**: Aplicável a todos os usuários do NocoBase, incluindo a versão Community.
  2. **Alta compatibilidade**: Não depende da ferramenta `dump` dentro da aplicação; desde que você consiga se conectar ao banco de dados, poderá operar.
  3. **Alta tolerância a falhas**: Se a solução contiver plugins comerciais que você não possui, as funções relacionadas não serão ativadas, mas isso não afetará o uso normal de outras funções, e a aplicação poderá ser iniciada com sucesso.
* **Limitações**:
  1. **Requer habilidades de operação de banco de dados**: Exige que o usuário tenha conhecimentos básicos de operação de banco de dados, como por exemplo, como executar um arquivo `.sql`.
  2. **Perda de arquivos do sistema**: **Este método perderá todos os arquivos do sistema**, incluindo arquivos de impressão de modelos, arquivos enviados em campos de arquivo de coleções, etc.

### Passos

**Passo 1: Preparar um banco de dados limpo**

Prepare um banco de dados novo e vazio para os dados que você está prestes a importar.

**Passo 2: Importar o arquivo `.sql` para o banco de dados**

Obtenha o arquivo de banco de dados baixado (geralmente no formato `.sql`) e importe seu conteúdo para o banco de dados preparado no passo anterior. Existem várias formas de execução, dependendo do seu ambiente:

* **Opção A: Via linha de comando do servidor (exemplo com Docker)**
  Se você usa Docker para instalar o NocoBase e o banco de dados, pode enviar o arquivo `.sql` para o servidor e usar o comando `docker exec` para realizar a importação. Supondo que o nome do seu contêiner PostgreSQL seja `my-nocobase-db` e o nome do arquivo seja `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Copiar o arquivo sql para dentro do contêiner
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Entrar no contêiner e executar o comando de importação
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Opção B: Via cliente de banco de dados remoto (Navicat, etc.)**
  Se a porta do seu banco de dados estiver exposta, você pode usar qualquer cliente gráfico de banco de dados (como Navicat, DBeaver, pgAdmin, etc.) para se conectar ao banco de dados e então:
  1. Clique com o botão direito no banco de dados de destino
  2. Selecione "Executar arquivo SQL" ou "Executar script SQL"
  3. Selecione o arquivo `.sql` baixado e execute

**Passo 3: Conectar ao banco de dados e iniciar a aplicação**

Configure os parâmetros de inicialização do seu NocoBase (como as variáveis de ambiente `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) para apontar para o banco de dados onde você acabou de importar os dados. Em seguida, inicie o serviço NocoBase normalmente.

### Observações

* **Permissões do banco de dados**: Este método exige que você tenha uma conta e senha que possam operar diretamente no banco de dados.
* **Status dos plugins**: Após a importação bem-sucedida, embora os dados dos plugins comerciais incluídos no sistema existam, se você não tiver instalado e ativado os plugins correspondentes localmente, as funções relacionadas não serão exibidas nem poderão ser usadas, mas isso não causará o travamento da aplicação.

---

## Resumo e Comparação

| Característica | Método Um: Gerenciador de Backup | Método Dois: Importação direta de SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Usuários aplicáveis** | Usuários **Profissional/Enterprise** | **Todos os usuários** (incluindo versão Community) |
| **Facilidade de operação** | ⭐⭐⭐⭐⭐ (Muito simples, operação via UI) | ⭐⭐⭐ (Requer conhecimentos básicos de banco de dados) |
| **Requisitos de ambiente** | **Rigorosos**, banco de dados e versões do sistema devem ser altamente compatíveis | **Gerais**, requer compatibilidade do banco de dados |
| **Dependência de plugins** | **Dependência forte**, os plugins são validados durante a restauração; a falta de qualquer plugin causará **falha na restauração**. | **As funções dependem fortemente dos plugins**. Os dados podem ser importados de forma independente e o sistema terá funcionalidades básicas. No entanto, se faltarem os plugins correspondentes, as funções relacionadas ficarão **completamente inutilizáveis**. |
| **Arquivos do sistema** | **Totalmente preservados** (modelos de impressão, arquivos enviados, etc.) | **Serão perdidos** (modelos de impressão, arquivos enviados, etc.) |
| **Cenários recomendados** | Usuários empresariais com ambientes controlados e consistentes que precisam de funcionalidade completa | Falta de alguns plugins, busca por alta compatibilidade e flexibilidade, usuários que não são Profissional/Enterprise ou que aceitam a perda de funções de arquivo |

Esperamos que este tutorial ajude você a implantar o sistema CRM 2.0 com sucesso. Se encontrar qualquer problema durante o processo, sinta-se à vontade para entrar em contato conosco!