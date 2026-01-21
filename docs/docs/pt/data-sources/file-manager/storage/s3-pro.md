---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---

# Armazenamento de Arquivos: S3 (Pro)

## Introdução

Com base no plugin de gerenciamento de arquivos, esta versão adiciona suporte para tipos de armazenamento de arquivos compatíveis com o protocolo S3. Qualquer serviço de armazenamento de objetos que suporte o protocolo S3 pode ser facilmente integrado, como Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, etc., aumentando a compatibilidade e a flexibilidade dos serviços de armazenamento.

## Recursos

1. **Upload pelo Cliente:** Os arquivos são enviados diretamente para o serviço de armazenamento, sem passar pelo servidor NocoBase, proporcionando uma experiência de upload mais eficiente e rápida.

2. **Acesso Privado:** Todas as URLs de arquivo são endereços de autorização temporária assinados, garantindo acesso seguro e com tempo limitado aos arquivos.

## Casos de Uso

1. **Gerenciamento de Tabelas de Arquivos:** Gerencie e armazene centralmente todos os arquivos enviados, suportando vários tipos de arquivo e métodos de armazenamento, para facilitar a classificação e recuperação de arquivos.

2. **Armazenamento de Campos de Anexo:** Armazene anexos enviados via formulários ou registros e associe-os a entradas de dados específicas.

## Configuração do Plugin

1. Habilite o plugin `plugin-file-storage-s3-pro`.

2. Vá para "Setting -> FileManager" para acessar as configurações de gerenciamento de arquivos.

3. Clique no botão "Add new" e selecione "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Na janela pop-up, você verá um formulário detalhado para preencher. Consulte a documentação a seguir para obter os parâmetros relevantes para o seu serviço de arquivo e insira-os corretamente no formulário.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuração do Provedor de Serviço

### Amazon S3

#### Criação de Bucket

1. Acesse [Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Clique no botão "Create bucket" no lado direito.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Preencha o `Bucket Name` (Nome do Bucket), deixe os outros campos como padrão, role até o final da página e clique no botão **"Create"** para concluir o processo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuração de CORS

1. Na lista de buckets, encontre e clique no bucket recém-criado para acessar seus detalhes.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Vá para a aba "Permission" (Permissão) e role para baixo até a seção de configuração de CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Insira a seguinte configuração (personalize conforme necessário) e salve.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Obtenção de AccessKey e SecretAccessKey

1. Clique no botão "Security credentials" (Credenciais de segurança) no canto superior direito.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Role para baixo até a seção "Access Keys" (Chaves de Acesso) e clique em "Create Access Key" (Criar Chave de Acesso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Concorde com os termos (o uso de IAM é recomendado para ambientes de produção).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Salve o Access Key e o Secret Access Key exibidos.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtenção e Configuração de Parâmetros

1. Use o `AccessKey ID` e o `AccessKey Secret` obtidos.

2. Acesse o painel de propriedades do bucket para encontrar o `Bucket Name` (Nome do Bucket) e a `Region` (Região).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acesso Público (Opcional)

Esta é uma configuração opcional. Configure-a quando precisar tornar os arquivos enviados completamente públicos.

1. No painel de Permissões, role até "Object Ownership" (Propriedade do Objeto), clique em "Edit" (Editar) e habilite ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Role até "Block public access" (Bloquear acesso público), clique em "Edit" (Editar) e defina para permitir o controle de ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Marque "Public access" (Acesso público) no NocoBase.

#### Configuração de Miniaturas (Opcional)

Esta configuração é opcional e deve ser usada quando você precisar otimizar o tamanho ou o efeito da pré-visualização da imagem. **Atenção: esta implantação pode gerar custos adicionais. Para mais detalhes, consulte os termos e preços da AWS.**

1. Acesse [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Clique no botão `Launch in the AWS Console` (Iniciar no Console da AWS) na parte inferior da página para iniciar a implantação.

![](https://static-docs.nocobase.com/20250221164214117.png)

3. Siga as instruções para concluir a configuração. As seguintes opções exigem atenção especial:
   1. Ao criar a pilha, você precisa especificar o nome do bucket do Amazon S3 que contém as imagens de origem. Por favor, insira o nome do bucket que você criou anteriormente.
   2. Se você optou por implantar a UI de demonstração, após a implantação, você pode usar a UI para testar a funcionalidade de processamento de imagem. No console do AWS CloudFormation, selecione sua pilha, vá para a aba "Outputs" (Saídas), encontre o valor correspondente à chave `DemoUrl` e clique no link para abrir a interface de demonstração.
   3. Esta solução usa a biblioteca `sharp` do Node.js para processamento eficiente de imagens. Você pode baixar o código-fonte do repositório do GitHub e personalizá-lo conforme necessário.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4. Assim que a configuração estiver concluída, aguarde o status da implantação mudar para `CREATE_COMPLETE`.

5. Na configuração do NocoBase, observe o seguinte:
   1. `Thumbnail rule`: Preencha os parâmetros de processamento de imagem, como `?width=100`. Para detalhes, consulte a [documentação da AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Insira o valor de Outputs -> ApiEndpoint após a implantação.
   3. `Full access URL style`: Selecione **Ignore** (já que o nome do bucket já foi preenchido na configuração, ele não é necessário para o acesso).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Criação de Bucket

1. Abra o [Console OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Selecione "Buckets" no menu esquerdo e clique em "Create Bucket" (Criar Bucket).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Preencha os detalhes do bucket e clique em "Create" (Criar).

   - `Bucket Name`: Escolha com base nas suas necessidades de negócio.
   - `Region`: Selecione a região mais próxima para seus usuários.
   - Outras configurações podem permanecer padrão ou ser personalizadas conforme necessário.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configuração de CORS

1. Vá para a página de detalhes do bucket que você acabou de criar.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Clique em "Content Security -> CORS" (Segurança de Conteúdo -> CORS) no menu central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Clique no botão "Create Rule" (Criar Regra), preencha os campos, role para baixo e clique em "OK". Você pode consultar a captura de tela abaixo ou configurar definições mais detalhadas.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obtenção de AccessKey e SecretAccessKey

1. Clique em "AccessKey" abaixo do avatar da sua conta no canto superior direito.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Para fins de demonstração, criaremos um AccessKey usando a conta principal. Em um ambiente de produção, é recomendado usar o RAM para criar o AccessKey. Para instruções, consulte a [documentação do Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. Clique no botão "Create AccessKey" (Criar Chave de Acesso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Conclua a verificação da conta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Salve o Access Key e o Secret Access Key exibidos.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Obtenção e Configuração de Parâmetros

1. Use o `AccessKey ID` e o `AccessKey Secret` obtidos na etapa anterior.

2. Vá para a página de detalhes do bucket para obter o nome do `Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Role para baixo para obter a `Region` (Região) (o sufixo ".aliyuncs.com" não é necessário).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtenha o endereço do endpoint e adicione o prefixo `https://` ao inseri-lo no NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuração de Miniaturas (Opcional)

Esta configuração é opcional e deve ser usada apenas quando for necessário otimizar o tamanho ou o efeito da pré-visualização da imagem.

1. Preencha os parâmetros relevantes para `Thumbnail rule`. Para configurações de parâmetros específicos, consulte a documentação do Alibaba Cloud sobre [Processamento de Imagens](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. Mantenha as configurações de `Full upload URL style` e `Full access URL style` iguais.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Criação de Bucket

1. Clique no menu **Buckets** à esquerda -> Clique em **Create Bucket** (Criar Bucket) para abrir a página de criação.
2. Insira o nome do Bucket e clique no botão **Save** (Salvar).

#### Obtenção de AccessKey e SecretAccessKey

1. Vá para **Access Keys** (Chaves de Acesso) -> Clique no botão **Create access key** (Criar chave de acesso) para abrir a página de criação.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Clique no botão **Save** (Salvar).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Salve o **Access Key** e o **Secret Key** da janela pop-up para configuração futura.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuração de Parâmetros

1. Vá para a página **File manager** (Gerenciador de arquivos) no NocoBase.

2. Clique no botão **Add new** (Adicionar novo) e selecione **S3 Pro**.

3. Preencha o formulário:
   - **AccessKey ID** e **AccessKey Secret**: Use os valores salvos na etapa anterior.
   - **Region**: O MinIO implantado privadamente não possui o conceito de região; você pode configurá-lo como `"auto"`.
   - **Endpoint**: Insira o nome de domínio ou endereço IP do seu serviço implantado.
   - Defina **Full access URL style** (Estilo de URL de acesso completo) como **Path-Style**.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Consulte as configurações dos serviços de arquivo acima. A lógica é semelhante.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Consulte as configurações dos serviços de arquivo acima. A lógica é semelhante.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414154500264.png)

## Guia do Usuário

Consulte a [documentação do plugin de gerenciamento de arquivos](/data-sources/file-manager).