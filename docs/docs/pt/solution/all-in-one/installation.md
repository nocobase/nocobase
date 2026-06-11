---
title: "Sistema de Gestão Empresarial Integrado - Como instalar"
description: "Instalação e implantação do Sistema de Gestão Empresarial Integrado: restauração em um clique do arquivo de backup nbdata via plugin Gerenciador de Backups. Requer NocoBase v2.1.0-alpha.40 ou superior, PostgreSQL 16; DB_UNDERSCORED não pode ser true."
keywords: "Sistema de Gestão Empresarial Integrado instalação, All-in-One, restauração de backup, gerenciador de backups, nbdata, PostgreSQL, NocoBase"
---

# Instalação

O Sistema de Gestão Empresarial Integrado abrange seis módulos: **CRM (Gestão de Clientes), Gestão de Vendas, Help Desk (Tickets), Gestão de Projetos, Gestão de Ativos e Recursos Humanos**. Basta restaurar o arquivo de backup `.nbdata` em um clique usando o plug-in nativo "Gerenciador de Backups" do NocoBase para obter os dados completos.

:::tip Pré-requisitos

- Você já tem um ambiente NocoBase em execução. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs.nocobase.com/welcome/getting-started/installation)
- Versão do NocoBase **v2.1.0-alpha.40 ou superior** (o plug-in Gerenciador de Backups tornou-se open source a partir desta versão, disponível na edição Community)
- Já baixou o arquivo de backup: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Atenção

- Esta solução foi construída sobre o **PostgreSQL 16**; o ambiente precisa ser PostgreSQL 16
- **`DB_UNDERSCORED` não pode ser `true`** — verifique o `docker-compose.yml`; se estiver `true`, a restauração falha
- **A restauração sobrescreve TODOS os dados do aplicativo de destino** — se o ambiente de destino já tiver dados, faça backup do aplicativo atual antes e execute a restauração com cuidado

:::

A versão atual é implantada via **restauração de backup**; versões posteriores passarão a usar migração incremental, facilitando a integração em um NocoBase já existente.

---

## Passos

### Passo 1: subir a aplicação com a imagem `full`

Recomendamos fortemente a imagem Docker `full`, que já traz o cliente de banco e demais utilitários, sem configuração extra:

```bash
docker pull nocobase/nocobase:alpha-full
```

Use essa imagem para subir o serviço NocoBase.

:::tip

Sem a imagem `full`, pode ser necessário instalar manualmente o cliente `pg_dump` dentro do contêiner — processo trabalhoso e instável.

:::

### Passo 2: ativar o plug-in "Gerenciador de Backups"

1. Faça login no NocoBase
2. Acesse **Gerenciador de Plugins**
3. Localize e ative o plug-in **Gerenciador de Backups**

### Passo 3: restaurar a partir do arquivo de backup local

1. Após ativar o plug-in, atualize a página
2. No menu lateral, vá em **Administração / Gerenciador de Backups**

   ![Interface principal do Backup Manager](https://static-docs.nocobase.com/202510302154966.png)

3. Clique em **Restaurar a partir de backup local** no canto superior direito
4. Arraste o arquivo `nocobase_all_in_one_backup_260521.nbdata` para a área de upload

   ![Restaurar a partir do arquivo de backup local (caixa de diálogo de upload)](https://static-docs.nocobase.com/202510302155602.png)

5. Clique em **Enviar** e aguarde a conclusão; o processo pode levar de alguns segundos a poucos minutos

---

## Notas

- **Compatibilidade do banco** — versão do PostgreSQL, conjunto de caracteres e sensibilidade a maiúsculas/minúsculas precisam coincidir com o backup; em especial, o nome do `schema` precisa ser o mesmo
- **Plug-ins comerciais compatíveis** — antes da restauração, ative localmente todos os plug-ins comerciais presentes no backup, caso contrário a restauração é interrompida. Os plug-ins comerciais envolvidos nesta solução incluem: Gestão de E-mails, Log de Auditoria, Funcionários de AI. Quando ausentes na edição Community, os pontos de entrada correspondentes simplesmente não aparecem, sem afetar os demais módulos

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

### Funciona na edição Community? Vai dar erro?

Funciona normalmente, sem erros. O Gerenciador de Backups é open source a partir do `v2.1.0-alpha.40`, e pode ser instalado na edição Community. O Demo utiliza alguns plug-ins enterprise (Gestão de E-mails, Log de Auditoria, AI Employees etc.); quando ausentes na edição Community, os pontos de entrada correspondentes simplesmente não aparecem, sem afetar os demais módulos. Por exemplo, o menu de Log de Auditoria some, mas CRM, Vendas, Tickets, Projetos, Ativos, RH e os demais módulos centrais continuam totalmente operacionais.

### Qual versão devo usar após a restauração?

Recomendamos a imagem mais recente `alpha-full` (`nocobase/nocobase:alpha-full`). A imagem `full` já inclui o cliente de banco e outras dependências, evitando falhas durante a restauração por falta de utilitários.

### O logo não aparece após a restauração?

O logo do Demo oficial tem restrição por domínio e não carrega em domínios locais. Acesse **Configurações do sistema** e envie o seu próprio logo.

### Erro de upload (erro de OSS Key)?

O motor de armazenamento pré-configurado no backup do Demo aponta para o OSS que usamos em demonstração, e a Key não é aberta ao público. Vá em **Gerenciador de Plugins / Gerenciador de Arquivos** e defina **Local Storage (armazenamento local)** como armazenamento padrão; depois disso o upload funciona normalmente.

Detalhes na seção [Motor de armazenamento](#1-motor-de-armazenamento-oss--local) acima.

### Como trocar de idioma?

A solução integrada já conta com localização em mais de 20 idiomas (namespace `nb_demo`). Por padrão o idioma é chinês; para trocar: **Configurações do sistema / ative o idioma desejado**.

### E quanto às atualizações incrementais?

A atualização atual substitui o conteúdo por completo, então personalizações são sobrescritas. Faça sempre um backup antes da atualização. A migração incremental está em planejamento.
