---
title: "Sistema de Gestão Empresarial Integrado - Como instalar"
description: "Instalação e implantação do Sistema de Gestão Empresarial Integrado: restauração via gerenciador de backups (edições Profissional/Enterprise) ou importação do arquivo SQL (edição Community). Requer PostgreSQL 16; DB_UNDERSCORED não pode ser true."
keywords: "Sistema de Gestão Empresarial Integrado instalação, All-in-One, restauração de backup, gerenciador de backups, importação SQL, PostgreSQL, NocoBase"
---

# Como instalar

> A versão atual é implantada via **restauração de backup**. Versões posteriores poderão passar a usar **migração incremental**, facilitando a integração da solução em um ambiente NocoBase já existente.

O Sistema de Gestão Empresarial Integrado abrange seis módulos: **CRM (Gestão de Clientes), Gestão de Vendas, Help Desk (Tickets), Gestão de Projetos, Gestão de Ativos e Recursos Humanos**. Para que a implantação no seu ambiente NocoBase seja rápida e tranquila, oferecemos duas formas de restauração — escolha a mais adequada à sua edição e ao seu perfil técnico.

Antes de começar, verifique se:

- Você já tem um ambiente NocoBase em execução. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs.nocobase.com/welcome/getting-started/installation).
- A versão do NocoBase é **v2.1.0-alpha.34 ou superior**.
- Você já baixou os arquivos correspondentes da solução integrada:
  - **Arquivo de backup**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — para o método 1
  - **Arquivo SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — para o método 2

**Observações importantes**:

- Esta solução foi construída sobre o **PostgreSQL 16**; confirme que seu ambiente utiliza PostgreSQL 16.
- **DB_UNDERSCORED não pode ser true**: verifique o `docker-compose.yml` para garantir que a variável de ambiente `DB_UNDERSCORED` não esteja definida como `true`, pois isso conflita com o backup da solução e leva a falha na restauração.

---

## Método 1: Restauração pelo gerenciador de backups (recomendado para edições Profissional/Enterprise)

Esta opção utiliza o plug-in nativo "[Gerenciador de Backups](https://docs.nocobase.com/handbook/backups)" (edições Profissional/Enterprise) para uma restauração em um clique. É a opção mais simples, mas impõe alguns requisitos ao ambiente e à edição.

### Características

* **Vantagens**:
  1. **Operação simples**: feita pela interface, recupera todas as configurações, incluindo plug-ins.
  2. **Restauração completa**: **recupera todos os arquivos do sistema**, como modelos de impressão, arquivos enviados em campos de tabela, avatares de funcionários de AI etc.
* **Limitações**:
  1. **Restrito às edições Profissional/Enterprise**: o "Gerenciador de Backups" é um plug-in enterprise.
  2. **Requisitos rígidos**: o ambiente de banco (versão, sensibilidade a maiúsculas/minúsculas etc.) precisa ser altamente compatível com o ambiente em que o backup foi gerado.
  3. **Dependência de plug-ins**: se a solução incluir plug-ins comerciais que você não tem localmente, a restauração falha.

### Passo a passo

**Passo 1: [Altamente recomendado] Iniciar a aplicação com a imagem `full`**

Para evitar falhas na restauração por falta do cliente de banco, recomendamos fortemente usar a imagem Docker na versão `full`. Ela já inclui todos os utilitários necessários.

Exemplo de pull:

```bash
docker pull nocobase/nocobase:alpha-full
```

Use essa imagem para subir o seu serviço NocoBase.

> **Nota**: sem a imagem `full`, pode ser necessário instalar manualmente o cliente `pg_dump` no contêiner — um processo trabalhoso e instável.

**Passo 2: Ativar o plug-in "Gerenciador de Backups"**

1. Faça login no NocoBase.
2. Acesse **`Gerenciamento de plug-ins`**.
3. Localize e ative o plug-in **`Gerenciador de Backups`**.

**Passo 3: Restaurar a partir do arquivo de backup local**

1. Após ativar o plug-in, atualize a página.
2. No menu lateral, vá em **`Administração`** → **`Gerenciador de Backups`**.
3. Clique em **`Restaurar a partir de backup local`** no canto superior direito.
4. Arraste o arquivo `nocobase_all_in_one_backup_260521.nbdata` para a área de upload.
5. Clique em **`Enviar`** e aguarde a conclusão; o processo pode levar de alguns segundos a poucos minutos.

### Atenção

* **Compatibilidade do banco**: é o ponto mais crítico. A **versão, o conjunto de caracteres e a sensibilidade a maiúsculas/minúsculas** do PostgreSQL devem coincidir com o backup; em especial, o nome do `schema` precisa ser o mesmo.
* **Compatibilidade de plug-ins comerciais**: certifique-se de ter todos os plug-ins comerciais exigidos, caso contrário a restauração é interrompida. Os plug-ins comerciais envolvidos nesta solução são: Gerenciador de Backups, Gestão de E-mails, Log de Auditoria, Funcionários de AI etc.

---

## Método 2: Importação direta do arquivo SQL (universal, mais indicado para a edição Community)

Esta opção restaura os dados diretamente no banco, contornando o plug-in "Gerenciador de Backups", e portanto não exige as edições Profissional/Enterprise.

### Características

* **Vantagens**:
  1. **Sem restrição de edição**: serve para todos os usuários do NocoBase, incluindo a Community.
  2. **Alta compatibilidade**: independe da ferramenta `dump` da aplicação; basta poder conectar ao banco.
  3. **Tolerância a falhas**: se a solução contiver plug-ins comerciais que você não possui, as funcionalidades correspondentes simplesmente não são ativadas, mas as demais permanecem operacionais e a aplicação sobe normalmente.
* **Limitações**:
  1. **Exige conhecimento de banco**: o usuário precisa saber executar um arquivo `.sql`.
  2. **Perda de arquivos do sistema**: **este método perde todos os arquivos do sistema**, incluindo modelos de impressão, arquivos enviados em campos de tabela e avatares de funcionários de AI.

### Passo a passo

**Passo 1: Preparar um banco de dados limpo**

Crie um banco PostgreSQL 16 novo e vazio para receber os dados.

**Passo 2: Importar o arquivo `.sql` no banco**

Descompacte o arquivo `nocobase_all_in_one_sql_260521.zip` para obter o `.sql` e importe seu conteúdo no banco do passo anterior. Há várias formas, dependendo do seu ambiente:

* **Opção A: Linha de comando no servidor (exemplo com Docker)**

  Se você roda o NocoBase e o banco em Docker, envie o `.sql` ao servidor e use `docker exec` para importar. Supondo que o contêiner do PostgreSQL se chame `my-nocobase-db`:

  ```bash
  # Copiar o sql para dentro do contêiner
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Executar a importação dentro do contêiner
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Opção B: Cliente remoto de banco (Navicat etc.)**

  Se o banco expõe portas, conecte-se com qualquer cliente gráfico (Navicat, DBeaver, pgAdmin etc.) e:

  1. Clique com o botão direito no banco de destino.
  2. Escolha "Executar arquivo SQL" ou "Executar script SQL".
  3. Selecione o `.sql` baixado e execute.

**Passo 3: Conectar ao banco e subir a aplicação**

Configure as variáveis de ambiente do NocoBase (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` etc.) apontando para o banco recém-importado e suba o serviço normalmente.

### Atenção

* **Permissões de banco**: o método exige usuário e senha com acesso direto ao banco.
* **Estado dos plug-ins**: após a importação, os dados dos plug-ins comerciais incluídos na solução permanecem no banco; sem o plug-in instalado e ativo localmente, a funcionalidade correspondente não aparece nem fica disponível, mas a aplicação continua funcionando sem travar.

---

## Resumo e comparação

| Característica | Método 1: Gerenciador de Backups | Método 2: Importação direta de SQL |
| :--- | :--- | :--- |
| **Público** | Usuários das edições **Profissional/Enterprise** | **Todos os usuários** (inclusive Community) |
| **Facilidade de operação** | ⭐⭐⭐⭐⭐ (muito simples, via interface) | ⭐⭐⭐ (exige conhecimento básico de banco) |
| **Requisitos do ambiente** | **Rígidos**, banco e versão do sistema precisam ser altamente compatíveis | **Moderados**, basta compatibilidade do banco |
| **Dependência de plug-ins** | **Forte**: a restauração valida plug-ins e falha se algum estiver ausente | **Funcionalidades dependem dos plug-ins**. Os dados são importados de forma independente e o sistema mantém as funções básicas, mas funcionalidades sem o plug-in correspondente ficam **indisponíveis** |
| **Arquivos do sistema** | **Mantidos integralmente** (modelos de impressão, uploads, avatares etc.) | **Perdidos** (modelos de impressão, uploads, avatares etc.) |
| **Cenário recomendado** | Clientes enterprise, com ambiente controlado e consistente, que precisam de todas as funções | Usuários sem alguns plug-ins, que priorizam compatibilidade e flexibilidade, fora das edições Profissional/Enterprise, e aceitam perder os arquivos |

---

## Perguntas frequentes

### Funciona na edição Profissional? Vai dar erro?

Funciona normalmente, sem erros. O Demo utiliza alguns plug-ins enterprise (Gestão de E-mails, Log de Auditoria, Funcionários de AI etc.); quando ausentes na edição Profissional, os pontos de entrada correspondentes simplesmente não aparecem, mas **isso não afeta os demais módulos**. Por exemplo, o menu de Log de Auditoria some, mas CRM, Vendas, Tickets, Projetos, Ativos, RH e os demais módulos centrais continuam totalmente operacionais.

### Qual versão devo usar após a restauração?

Recomendamos a imagem mais recente `alpha-full` (por exemplo, `nocobase/nocobase:alpha-full`). A versão `full` já inclui o cliente de banco e outras dependências, evitando falhas durante a restauração.

### O logo não aparece após a restauração

O logo do Demo oficial tem restrição por domínio e não carrega em domínios locais. Acesse **Configurações do sistema** e envie o seu próprio logo.

### Erro de upload (erro de OSS Key)

Após a instalação via SQL, o upload pode apresentar erros relacionados a OSS. Para resolver: vá em **Gerenciamento de plug-ins → Gerenciador de arquivos** e defina **Local Storage (armazenamento local)** como armazenamento padrão; depois disso o upload funciona normalmente.

### Como trocar de idioma?

A solução integrada já conta com localização em mais de 20 idiomas (namespace `nb_demo`). Por padrão o idioma é chinês; para trocar: **Configurações do sistema → ative o idioma desejado** (evite ativar `ar-SA`, pois atualmente causa problemas de renderização no NocoBase).

### E quanto às atualizações incrementais?

A atualização atual substitui o conteúdo por completo, então personalizações são sobrescritas — faça sempre um backup antes. A migração incremental está sendo planejada, com prioridade para as edições Profissional/Enterprise. Na edição Community, a ausência do plug-in de migração dificulta esse suporte por enquanto.

Esperamos que este guia ajude na implantação do Sistema de Gestão Empresarial Integrado. Se aparecerem dúvidas durante o processo, entre em contato com a gente.
