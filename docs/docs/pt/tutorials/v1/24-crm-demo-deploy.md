# Guia de Deploy do Demo CRM

Para que você possa fazer deploy desse Demo no seu próprio ambiente NocoBase de forma rápida e suave, oferecemos duas formas de restauração. Escolha conforme sua versão e perfil técnico.

Antes de começar, garanta que

- Você já tem um ambiente NocoBase básico funcionando. Para a instalação do sistema principal, consulte a [documentação oficial detalhada de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Você baixou os arquivos correspondentes do nosso Demo CRM (versão chinesa):
  - **Arquivo de backup** (cerca de 21,2MB): [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) - para o método 1
  - **Arquivo SQL** (compactado, cerca de 9MB): [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) - para o método 2

**Importante**: o Demo é baseado em **PostgreSQL**, garanta que seu ambiente usa PostgreSQL.

---

### Método 1: Restaurar com Backup Manager (recomendado para profissional/enterprise)

Esse método usa o plugin embutido «[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)» (profissional/enterprise) para restauração com um clique — operação mais simples. Mas tem requisitos sobre ambiente e versão.

#### Características

* **Vantagens**:
  1. **Operação prática**: tudo no UI, restaura toda a configuração inclusive plugins.
  2. **Restauração completa**: **restaura todos os arquivos do sistema**, incluindo arquivos de template de impressão, arquivos de campos de arquivo das tabelas, etc., garantindo a integridade do Demo.
* **Limitações**:
  1. **Apenas profissional/enterprise**: o «Backup Manager» é plugin enterprise, só disponível para profissional/enterprise.
  2. **Requisitos rígidos**: exige que seu ambiente de banco (versão, sensibilidade a maiúsculas, etc.) seja altamente compatível com o ambiente do nosso backup.
  3. **Dependência de plugins**: se o Demo contém plugins comerciais que você não tem, a restauração falha.

#### Passos

**Passo 1: [Fortemente recomendado] Iniciar a aplicação com imagem `full`**

Para evitar falhas por falta de cliente de banco, recomendamos fortemente usar a imagem Docker versão `full`. Ela contém todos os utilitários necessários, sem precisar de configuração extra. (Atenção: nossa imagem foi feita com 1.9.0-alpha.1, observe a compatibilidade de versão)

Exemplo de comando para baixar a imagem:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

E inicie seu serviço NocoBase com essa imagem.

> **Nota**: sem usar a imagem `full`, talvez você precise instalar manualmente o cliente `pg_dump` no contêiner — processo trabalhoso e instável.

**Passo 2: Habilitar o plugin «Backup Manager»**

1. Faça login no NocoBase.
2. Vá em **`Gerenciamento de Plugins`**.
3. Encontre e ative o plugin **`Backup Manager`**.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Passo 3: Restaurar a partir do backup local**

1. Após habilitar o plugin, atualize a página.
2. Vá no menu lateral **`Administração do Sistema`** -\> **`Backup Manager`**.
3. Clique no botão **`Restaurar a partir de backup local`** no canto superior direito.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Arraste o arquivo de backup do Demo (geralmente formato `.zip`) para a área de upload.
5. Clique em **`Submeter`** e aguarde a conclusão. O processo pode levar de alguns segundos a alguns minutos.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### ⚠️ Atenção

* **Compatibilidade de banco**: o ponto mais crítico. **Versão do PostgreSQL, charset, sensibilidade a maiúsculas** devem combinar com o ambiente do backup. Especialmente o nome do `schema` deve ser igual.
* **Combinação de plugins comerciais**: garanta que tem habilitados todos os plugins comerciais que o Demo precisa, ou a restauração interrompe.

---

### Método 2: Importar SQL Diretamente (universal, mais adequado para community)

Esse método restaura os dados operando direto no banco, contornando o plugin «Backup Manager», sem limites de versão profissional/enterprise.

#### Características

* **Vantagens**:
  1. **Sem limite de versão**: vale para todos os usuários NocoBase, incluindo community.
  2. **Alta compatibilidade**: não depende do `dump` da aplicação; basta poder conectar ao banco.
  3. **Alta tolerância**: se o Demo tem plugins comerciais que você não tem (como gráficos ECharts), as funcionalidades correspondentes não ativam, mas não impedem o uso das outras funcionalidades, e a aplicação inicia com sucesso.
* **Limitações**:
  1. **Necessária habilidade de banco**: o usuário precisa ter habilidade básica de banco, como executar um arquivo `.sql`.
  2. **⚠️ Perda de arquivos do sistema**: **esse método perde todos os arquivos do sistema**, incluindo arquivos de template de impressão, arquivos de campos de arquivo, etc. Significa:
     - Funcionalidade de impressão de template pode não funcionar
     - Imagens, documentos, etc. enviados serão perdidos
     - Funcionalidades que envolvem campos de arquivo serão afetadas

#### Passos

**Passo 1: Preparar um banco limpo**

Prepare um banco novo e vazio para os dados do Demo a serem importados.

**Passo 2: Importar o `.sql` no banco**

Pegue o arquivo de banco do Demo (geralmente formato `.sql`) e importe seu conteúdo no banco preparado. Há várias formas, conforme seu ambiente:

* **Opção A: Linha de comando do servidor (exemplo Docker)**
  Se você instala o NocoBase e o banco com Docker, pode subir o `.sql` para o servidor e usar `docker exec` para importar. Suponha que o contêiner PostgreSQL chama-se `my-nocobase-db` e o arquivo é `crm_demo.sql`:

  ```bash
  # Copia o sql para dentro do contêiner
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Entra no contêiner e executa a importação
  docker exec -it my-nocobase-db psql -U seu_usuario -d nome_do_banco -f /tmp/crm_demo.sql
  ```
* **Opção B: Cliente remoto de banco**
  Se seu banco expõe a porta, use qualquer cliente gráfico (DBeaver, Navicat, pgAdmin, etc.) para conectar, abra uma janela de query, cole o conteúdo do `.sql` e execute.

**Passo 3: Conectar ao banco e iniciar a aplicação**

Configure os parâmetros de inicialização do NocoBase (variáveis `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) apontando para o banco que você acabou de preencher. Em seguida, inicie o NocoBase normalmente.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### ⚠️ Atenção

* **Permissão de banco**: esse método exige conta e senha que possa operar diretamente no banco.
* **Status dos plugins**: após a importação, os dados de plugins comerciais existem, mas se você não tem instalado e habilitado o plugin correspondente localmente, as funcionalidades (gráficos Echarts, campos específicos, etc.) não aparecem nem funcionam, mas isso não derruba a aplicação.

---

### Resumo e Comparação


| Característica       | Método 1: Backup Manager                                            | Método 2: Importar SQL diretamente                                                                |
| :------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ |
| **Usuário**          | Usuários **profissional/enterprise**                                | **Todos os usuários** (incluindo community)                                                       |
| **Facilidade**       | ⭐⭐⭐⭐⭐ (muito simples, UI)                                      | ⭐⭐⭐ (requer conhecimento básico de banco)                                                      |
| **Requisitos**       | **Rígidos**, banco e versão de sistema precisam ser muito compatíveis | **Comum**, requer banco compatível                                                              |
| **Plugins**          | **Forte dependência**, restauração valida plugins; faltar qualquer plugin causa **falha**. | **Funcionalidade depende muito de plugins**. Dados podem ser importados independentemente, sistema tem funcionalidade básica. Mas se faltar plugin correspondente, a função fica **totalmente indisponível**. |
| **Arquivos**         | **✅ Mantidos integralmente** (templates, uploads, etc.)             | **❌ Perdidos** (templates, uploads, etc.)                                                       |
| **Cenário recomendado** | Usuários enterprise, ambiente controlado e consistente, precisa de demo completo | Sem alguns plugins, busca compatibilidade e flexibilidade, usuário não-profissional/enterprise, aceita perda de arquivos |

Esperamos que este tutorial te ajude a fazer o deploy do Demo CRM com sucesso. Se encontrar qualquer problema, fale com a gente!
