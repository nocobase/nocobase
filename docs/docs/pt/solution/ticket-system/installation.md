# Como instalar

> A versão atual utiliza o formato de **backup e restauração** para implantação. Em versões futuras, poderemos mudar para o formato de **migração incremental**, a fim de facilitar a integração da solução em seus sistemas existentes.

> **O plugin Gerenciador de Backup agora é de código aberto**: o plugin "[Gerenciador de Backup](https://docs-cn.nocobase.com/handbook/backups)" necessário para restaurar a solução agora é de código aberto e está disponível para todas as edições (incluindo a Community). Recomendamos restaurar diretamente por meio deste plugin.

Antes de começar, certifique-se de que:

- Você já possui um ambiente de execução básico do NocoBase. Para a instalação do sistema principal, consulte a [documentação oficial de instalação](https://docs-cn.nocobase.com/welcome/getting-started/installation) detalhada.
- Versão do NocoBase **2.0.0-beta.5 ou superior**
- Você já baixou o arquivo de backup do sistema de chamados: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Instruções importantes**:
- Esta solução foi criada com base no banco de dados **PostgreSQL 16**, certifique-se de que seu ambiente utilize o PostgreSQL 16.
- **DB_UNDERSCORED não pode ser true**: Verifique seu arquivo `docker-compose.yml` e garanta que a variável de ambiente `DB_UNDERSCORED` não esteja definida como `true`, caso contrário, haverá conflito com o backup da solução, resultando em falha na restauração.

---

## Restaurar usando o Gerenciador de Backup

Esta forma realiza a restauração com um clique através do plugin "[Gerenciador de Backup](https://docs-cn.nocobase.com/handbook/backups)" integrado ao NocoBase, sendo a operação mais simples. Este plugin agora é de código aberto e está disponível para todas as edições (incluindo a Community).

### Características principais

* **Vantagens**:
  1. **Operação conveniente**: Pode ser concluída na interface UI, restaurando completamente todas as configurações, incluindo plugins.
  2. **Restauração completa**: **Capaz de restaurar todos os arquivos do sistema**, incluindo arquivos de modelos de impressão, arquivos enviados em campos de arquivo de tabelas, etc., garantindo a integridade das funções.
* **Limitações**:
  1. **Requisitos rigorosos de ambiente**: Exige que o ambiente do seu banco de dados (versão, configurações de sensibilidade a maiúsculas e minúsculas, etc.) seja altamente compatível com o ambiente onde o backup foi criado.
  2. **Dependência de plugins**: Se a solução incluir plugins comerciais que você não possui em seu ambiente local, a restauração falhará.

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

Esperamos que este tutorial ajude você a implantar o sistema de chamados com sucesso. Se encontrar qualquer problema durante o processo, sinta-se à vontade para entrar em contato conosco!
---

*Last updated: 2026-03-24*
