---
title: "Sistema de Gestão Empresarial Integrado - Como instalar"
description: "Instalação e implantação do Sistema de Gestão Empresarial Integrado: restauração via gerenciador de backups (edições Profissional/Enterprise) ou importação do arquivo SQL (edição Community). Requer PostgreSQL 16; DB_UNDERSCORED não pode ser true."
keywords: "Sistema de Gestão Empresarial Integrado instalação, All-in-One, restauração de backup, gerenciador de backups, importação SQL, PostgreSQL, NocoBase"
---

# Instalação

O Sistema de Gestão Empresarial Integrado abrange seis módulos: **CRM (Gestão de Clientes), Gestão de Vendas, Help Desk (Tickets), Gestão de Projetos, Gestão de Ativos e Recursos Humanos**. Há duas formas de restauração — escolha uma conforme a sua versão do NocoBase e o seu perfil técnico.

:::tip Pré-requisitos

- Você já tem um ambiente NocoBase em execução. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs.nocobase.com/welcome/getting-started/installation)
- Versão do NocoBase **v2.1.0-alpha.34 ou superior**
- Já baixou um dos arquivos da solução integrada:
  - **Backup nbdata**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — para o método 1
  - **Pacote SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — para o método 2

:::

:::warning Atenção

- Esta solução foi construída sobre o **PostgreSQL 16**; o ambiente precisa ser PostgreSQL 16
- **`DB_UNDERSCORED` não pode ser `true`** — verifique o `docker-compose.yml`; se estiver `true`, a restauração falha

:::

Em geral, se você tem o plug-in Gerenciador de Backups, escolha o método 1; caso contrário, o método 2. A versão atual é implantada via **restauração de backup**; versões posteriores passarão a usar migração incremental, facilitando a integração em um NocoBase já existente.

---

## Método 1: Restauração com Gerenciador de Backup (recomendado para Pro/Enterprise)

Este método usa o plug-in nativo "[Gerenciador de Backups](https://docs.nocobase.com/handbook/backups)" do NocoBase para restaurar em um clique. É a opção mais simples pela interface, mas tem requisitos rígidos de ambiente e plug-ins.

### Características

**Vantagens:**

- **Operação simples** — feita pela interface, restaura todo o conteúdo, incluindo configurações de plug-ins
- **Restauração completa** — recupera todos os arquivos do sistema, como modelos de impressão, arquivos de campos de anexo, avatares de funcionários de AI etc.

**Limitações:**

- **Restrito a Profissional/Enterprise** — o Gerenciador de Backups é um plug-in enterprise, indisponível na Community
- **Requisitos rígidos de ambiente** — versão do banco, sensibilidade a maiúsculas/minúsculas etc. precisam ser altamente compatíveis com a origem do backup
- **Forte dependência de plug-ins** — os plug-ins comerciais presentes no backup também precisam existir no ambiente local, caso contrário a restauração falha

### Passos

**Passo 1: subir a aplicação com a imagem `full`**

Recomendamos fortemente a imagem Docker `full`, que já traz o cliente de banco e demais utilitários, sem configuração extra:

```bash
docker pull nocobase/nocobase:alpha-full
```

Use essa imagem para subir o serviço NocoBase.

:::tip

Sem a imagem `full`, pode ser necessário instalar manualmente o cliente `pg_dump` dentro do contêiner — processo trabalhoso e instável.

:::

**Passo 2: ativar o plug-in "Gerenciador de Backups"**

1. Faça login no NocoBase
2. Acesse **Gerenciador de Plugins**
3. Localize e ative o plug-in **Gerenciador de Backups**

**Passo 3: restaurar a partir do arquivo de backup local**

1. Após ativar o plug-in, atualize a página
2. No menu lateral, vá em **Administração / Gerenciador de Backups**
3. Clique em **Restaurar a partir de backup local** no canto superior direito
4. Arraste o arquivo `nocobase_all_in_one_backup_260521.nbdata` para a área de upload
5. Clique em **Enviar** e aguarde a conclusão; o processo pode levar de alguns segundos a poucos minutos

### Notas

- **Compatibilidade do banco** — versão do PostgreSQL, conjunto de caracteres e sensibilidade a maiúsculas/minúsculas precisam coincidir com o backup; em especial, o nome do `schema` precisa ser o mesmo
- **Plug-ins comerciais compatíveis** — antes da restauração, ative localmente todos os plug-ins comerciais presentes no backup, caso contrário a restauração é interrompida. Os plug-ins comerciais envolvidos nesta solução incluem: Gerenciador de Backups, Gestão de E-mails, Log de Auditoria, Funcionários de AI etc.

---

## Método 2: Importar arquivo SQL diretamente (universal)

Este método restaura os dados diretamente no banco, contornando o Gerenciador de Backups, sem restrição de versão ou de plug-ins.

### Características

**Vantagens:**

- **Sem restrição de versão** — serve para todos os usuários do NocoBase, incluindo a Community
- **Alta compatibilidade** — independe da ferramenta `dump` da aplicação; basta poder conectar ao banco
- **Alta tolerância a falhas** — plug-ins comerciais presentes no backup que não estiverem instalados localmente simplesmente não são ativados, sem prejuízo dos demais módulos

**Limitações:**

- **Exige conhecimento de banco** — você precisa saber, por exemplo, executar um arquivo `.sql`
- **Perda de arquivos do sistema** — este método perde todos os arquivos do sistema, incluindo modelos de impressão, arquivos de campos de anexo, avatares de funcionários de AI etc.

### Passos

**Passo 1: preparar um banco de dados limpo**

Crie um banco PostgreSQL 16 novo e vazio para receber os dados.

**Passo 2: importar o arquivo `.sql` no banco**

Descompacte `nocobase_all_in_one_sql_260521.zip` para obter o arquivo `.sql` e importe-o no banco preparado. Há duas formas:

**Opção A: linha de comando no servidor (exemplo com Docker)**

Se o NocoBase e o banco rodam em Docker, envie o `.sql` ao servidor e use `docker exec` para importar. Supondo que o contêiner do PostgreSQL se chame `my-nocobase-db`:

```bash
# Copiar o sql para dentro do contêiner
docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
# Executar a importação dentro do contêiner
docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
```

**Opção B: cliente remoto de banco (Navicat etc.)**

Se o banco expõe portas, conecte-se com qualquer cliente gráfico (Navicat, DBeaver, pgAdmin etc.) e:

1. Clique com o botão direito no banco de destino
2. Escolha **Executar arquivo SQL** ou **Executar script SQL**
3. Selecione o `.sql` descompactado e execute

**Passo 3: conectar ao banco e subir a aplicação**

Configure as variáveis de inicialização do NocoBase (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` etc.) apontando para o banco recém-importado e suba o serviço normalmente.

### Notas

- **Permissões do banco** — o método exige usuário e senha com acesso direto ao banco
- **Estado dos plug-ins** — após a importação, os dados dos plug-ins comerciais permanecem no banco; sem o plug-in instalado localmente, a funcionalidade correspondente fica indisponível, mas a aplicação não trava

---

## Comparação dos dois métodos

| Característica | Método 1: Gerenciador de Backups | Método 2: Importação direta de SQL |
| :--- | :--- | :--- |
| **Público** | Profissional/Enterprise | Todos os usuários (inclusive Community) |
| **Facilidade de operação** | ⭐⭐⭐⭐⭐ (via interface) | ⭐⭐⭐ (exige conhecimento de banco) |
| **Requisitos de ambiente** | Rígidos: banco e versão do sistema precisam ser altamente compatíveis | Moderados: basta compatibilidade do banco |
| **Dependência de plug-ins** | Forte: a restauração falha se faltar algum plug-in | Dados importados de forma independente; sem o plug-in, a funcionalidade fica indisponível |
| **Arquivos do sistema** | Mantidos integralmente (modelos de impressão, uploads, avatares etc.) | Perdidos (modelos de impressão, uploads, avatares etc.) |
| **Cenário recomendado** | Clientes enterprise, ambiente controlado | Plug-ins ausentes, foco em compatibilidade, edição Community |

---

## Configuração necessária após a instalação

Depois da restauração, o sistema já abre, mas duas configurações ainda **apontam para o nosso ambiente de demonstração** e precisam ser ajustadas.

### 1. Motor de armazenamento (OSS / local)

O backup do Demo aponta por padrão para um OSS da Aliyun usado no nosso ambiente de demonstração, com Access Key que não é aberta ao público. Qualquer envio de arquivo de campo de anexo, modelo de impressão ou avatar de funcionário de AI vai falhar.

Em geral, mudar para armazenamento local resolve; use o seu próprio OSS apenas se precisar de CDN ou for trabalhar com arquivos grandes.

**Passos para trocar:**

1. Acesse **Gerenciador de Plugins / Gerenciador de Arquivos** (ou abra `/admin/settings/file-manager`)

2. **Opção A — usar armazenamento local** (mais simples, ideal para auto-hospedagem):

   - Encontre o item **Local Storage (armazenamento local)** criado automaticamente
   - Clique em **Editar**, marque **Definir como motor de armazenamento padrão** no rodapé do painel e envie

   ![Configuração comum do motor de armazenamento (no rodapé: "Definir como motor de armazenamento padrão")](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Atenção

   Em implantação via Docker, o armazenamento local fica dentro do contêiner; se o contêiner for removido, os arquivos se perdem. Em produção, monte um volume ou use armazenamento na nuvem.

   :::

3. **Opção B — usar seu próprio OSS / S3 / COS**:

   - Clique em **Adicionar novo** e escolha o tipo (Aliyun OSS / Amazon S3 / Tencent Cloud COS / S3 Pro)
   - Preencha Access Key, Bucket, Region, domínio etc., marque **Definir como motor de armazenamento padrão** e envie

   ![Exemplo de configuração do motor Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

4. Apague ou desative o item de OSS pré-configurado pelo Demo para evitar uso indevido

Detalhes de parâmetros em [Visão geral do motor de armazenamento](../../file-manager/storage/index.md).

### 2. Chaves de serviço LLM dos AI Employees

O backup do Demo já traz vários serviços LLM pré-configurados (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi etc.), mas as API Keys são nossas e **não funcionam fora do nosso ambiente**. Os AI Employees ficam indisponíveis até a troca.

**Passos:**

1. Acesse **Configurações do sistema / AI Employees / LLM service** (ou abra `/admin/settings/ai/llm-services`)

   ![Acessando a página de configuração do LLM service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. Na lista pré-configurada, você pode arrastar para reordenar e usar o switch `Enabled` para ativar ou desativar

   ![Lista de serviços LLM (ativar/desativar + reordenar)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Para cada serviço que pretende usar:

   - Clique em **Editar**
   - Substitua a **API Key** pela sua (obtida na conta do provedor: OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi etc.)
   - Se usar proxy ou um gateway intermediário, ajuste a **Base URL**
   - Em **Enabled Models**, mantenha apenas os modelos que vai usar e remova o restante

   ![Editar serviço LLM (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Clique em **Test flight** no rodapé para testar a conectividade; passando, clique em **Submit** para salvar

   ![Test flight para testar a conexão](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Serviços que você não vai usar podem simplesmente ficar como Disabled, sem precisar excluir

Detalhes em [Configurar serviço LLM](../../ai-employees/features/llm-service.md).

:::tip

Estes dois itens são os únicos ajustes obrigatórios após a restauração do Demo. Outras configurações (logo do site, SMTP, plug-ins enterprise etc.) são opcionais.

:::

---

## Perguntas frequentes

### Funciona na edição Profissional? Vai dar erro?

Funciona normalmente, sem erros. O Demo utiliza alguns plug-ins enterprise (Gestão de E-mails, Log de Auditoria, AI Employees etc.); quando ausentes na edição Profissional, os pontos de entrada correspondentes simplesmente não aparecem, sem afetar os demais módulos. Por exemplo, o menu de Log de Auditoria some, mas CRM, Vendas, Tickets, Projetos, Ativos, RH e os demais módulos centrais continuam totalmente operacionais.

### Qual versão devo usar após a restauração?

Recomendamos a imagem mais recente `alpha-full` (`nocobase/nocobase:alpha-full`). A imagem `full` já inclui o cliente de banco e outras dependências, evitando falhas durante a restauração por falta de utilitários.

### O logo não aparece após a restauração?

O logo do Demo oficial tem restrição por domínio e não carrega em domínios locais. Acesse **Configurações do sistema** e envie o seu próprio logo.

### Erro de upload (erro de OSS Key)?

Após a instalação via SQL, o upload pode apresentar erros relacionados a OSS. Vá em **Gerenciador de Plugins / Gerenciador de Arquivos** e defina **Local Storage (armazenamento local)** como armazenamento padrão; depois disso o upload funciona normalmente.

Detalhes na seção [Motor de armazenamento](#1-motor-de-armazenamento-oss--local) acima.

### Como trocar de idioma?

A solução integrada já conta com localização em mais de 20 idiomas (namespace `nb_demo`). Por padrão o idioma é chinês; para trocar: **Configurações do sistema / ative o idioma desejado**.

### E quanto às atualizações incrementais?

A atualização atual substitui o conteúdo por completo, então personalizações são sobrescritas. Faça sempre um backup antes da atualização. A migração incremental está em planejamento, com prioridade para as edições Profissional/Enterprise. Na edição Community, a ausência do plug-in de migração dificulta o suporte por enquanto.
