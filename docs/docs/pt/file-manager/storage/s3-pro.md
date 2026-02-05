---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Motor de Armazenamento: S3 (Pro)

## Introdução

Com base no plugin de Gerenciamento de Arquivos, este adiciona suporte para tipos de armazenamento de arquivos compatíveis com o protocolo S3. Qualquer serviço de armazenamento de objetos que suporte o protocolo S3 pode ser facilmente integrado, como Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, etc., aumentando ainda mais a compatibilidade e flexibilidade dos serviços de armazenamento.

## Funcionalidades

1.  **Upload pelo lado do cliente**: O processo de upload de arquivos não passa pelo servidor NocoBase, conectando-se diretamente ao serviço de armazenamento de arquivos, proporcionando uma experiência de upload mais eficiente e rápida.
2.  **Acesso privado**: Ao acessar arquivos, todas as URLs são endereços temporários autorizados e assinados, garantindo a segurança e a validade do acesso aos arquivos.

## Casos de Uso

1.  **Gerenciamento de coleção de arquivos**: Gerencie e armazene centralmente todos os arquivos enviados, suportando vários tipos de arquivos e métodos de armazenamento para facilitar a classificação e recuperação.
2.  **Armazenamento de anexos em campos**: Usado para armazenamento de dados de anexos enviados em formulários ou registros, suportando a associação com registros de dados específicos.

## Configuração do Plugin

1.  Habilite o **plugin** `plugin-file-storage-s3-pro`.
2.  Clique em "Configurações -> Gerenciador de Arquivos" para acessar as configurações do gerenciador de arquivos.
3.  Clique no botão "Adicionar novo" e selecione "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Após o pop-up ser exibido, você verá um formulário com muitos campos para preencher. Você pode consultar a documentação a seguir para obter as informações de parâmetros relevantes para o serviço de arquivo correspondente e preenchê-las corretamente no formulário.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuração do Provedor de Serviço

### Amazon S3

#### Criação de Bucket

1.  Abra https://ap-southeast-1.console.aws.amazon.com/s3/home para acessar o console do S3.
2.  Clique no botão "Create bucket" (Criar bucket) à direita.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2.  Preencha o Nome do Bucket. Outros campos podem ser deixados com as configurações padrão. Role a página até o final e clique no botão "**Create**" (Criar) para concluir a criação.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuração de CORS

1.  Vá para a lista de buckets, encontre e clique no bucket que você acabou de criar para acessar sua página de detalhes.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  Clique na aba "Permission" (Permissão), depois role para baixo para encontrar a seção de configuração de CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Insira a seguinte configuração (você pode personalizá-la ainda mais) e salve.

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

1.  Clique no botão "Security credentials" (Credenciais de segurança) no canto superior direito da página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Role para baixo até a seção "Access Keys" (Chaves de Acesso) e clique no botão "Create Access Key" (Criar Chave de Acesso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Clique para concordar (esta é uma demonstração com a conta root; é recomendado usar IAM em um ambiente de produção).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Salve a Access key e a Secret access key exibidas na página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtenção e Configuração de Parâmetros

1.  O AccessKey ID e o AccessKey Secret são os valores que você obteve na etapa anterior. Por favor, preencha-os com precisão.
2.  Vá para o painel de propriedades da página de detalhes do bucket, onde você pode obter o nome do Bucket e as informações da Região.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acesso Público (Opcional)

Esta é uma configuração opcional. Configure-a quando precisar tornar os arquivos enviados completamente públicos.

1.  Vá para o painel de Permissões, role para baixo até "Object Ownership" (Propriedade de Objetos), clique em editar e habilite ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Role até "Block public access" (Bloquear acesso público), clique em editar e defina para permitir o controle de ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  Marque a opção "Acesso público" no NocoBase.

#### Configuração de Miniaturas (Opcional)

Esta configuração é opcional e é usada para otimizar o tamanho ou os efeitos da pré-visualização de imagens. **Observe que esta solução de implantação pode gerar custos adicionais. Para taxas específicas, consulte os termos relevantes da AWS.**

1.  Visite [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  Clique no botão `Launch in the AWS Console` (Iniciar no Console AWS) na parte inferior da página para iniciar a implantação da solução.
    ![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Siga as instruções para concluir a configuração. Preste atenção especial às seguintes opções:
    1.  Ao criar a pilha, você precisará especificar o nome de um bucket do Amazon S3 que contém as imagens de origem. Por favor, insira o nome do bucket que você criou anteriormente.
    2.  Se você optar por implantar a interface de demonstração, poderá testar os recursos de processamento de imagem por meio desta interface após a implantação. No console do AWS CloudFormation, selecione sua pilha, vá para a aba "Outputs" (Saídas), encontre o valor correspondente à chave DemoUrl e clique no link para abrir a interface de demonstração.
    3.  Esta solução usa a biblioteca Node.js `sharp` para processamento eficiente de imagens. Você pode baixar o código-fonte do repositório GitHub e personalizá-lo conforme necessário.

    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Após a conclusão da configuração, aguarde até que o status da implantação mude para `CREATE_COMPLETE`.

5.  Na configuração do NocoBase, há vários pontos a serem observados:
    1.  `Thumbnail rule` (Regra de miniatura): Preencha os parâmetros relacionados ao processamento de imagem, por exemplo, `?width=100`. Para detalhes, consulte a [documentação da AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint` (Endpoint de acesso): Preencha o valor de Outputs -> ApiEndpoint após a implantação.
    3.  `Full access URL style` (Estilo de URL de acesso completo): Você precisa marcar **Ignorar** (porque o nome do bucket já foi preenchido durante a configuração, não é mais necessário para o acesso).

    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Criação de Bucket

1.  Abra o console do OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Clique em "Buckets" no menu esquerdo e, em seguida, clique no botão "Create Bucket" (Criar Bucket) para começar a criar um bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Preencha as informações relacionadas ao bucket e, finalmente, clique no botão "Create" (Criar).
    1.  O Nome do Bucket deve atender às suas necessidades de negócio; o nome pode ser arbitrário.
    2.  Selecione a Região mais próxima dos seus usuários.
    3.  Outras configurações podem ser deixadas como padrão ou configuradas com base em suas necessidades.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configuração de CORS

1.  Vá para a página de detalhes do bucket criado na etapa anterior.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Clique em "Content Security -> CORS" (Segurança de Conteúdo -> CORS) no menu central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  Clique no botão "Create Rule" (Criar Regra), preencha o conteúdo relevante, role para baixo e clique em "OK". Você pode consultar a captura de tela abaixo ou configurar definições mais detalhadas.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obtenção de AccessKey e SecretAccessKey

1.  Clique em "AccessKey" abaixo da sua foto de perfil no canto superior direito.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Para fins de demonstração, estamos criando um AccessKey usando a conta principal. Em um ambiente de produção, é recomendado usar RAM para criá-lo. Você pode consultar https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
3.  Clique no botão "Create AccessKey" (Criar AccessKey).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Realize a verificação da conta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Salve a Access key e a Secret access key exibidas na página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Obtenção e Configuração de Parâmetros

1.  O AccessKey ID e o AccessKey Secret são os valores obtidos na etapa anterior.
2.  Vá para a página de detalhes do bucket para obter o Nome do Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Role para baixo para obter a Região (o sufixo ".aliyuncs.com" não é necessário).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Obtenha o endereço do endpoint e adicione o prefixo `https://` ao preenchê-lo no NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuração de Miniaturas (Opcional)

Esta configuração é opcional e deve ser usada apenas quando você precisar otimizar o tamanho ou os efeitos da pré-visualização de imagens.

1.  Preencha os parâmetros relacionados à `Thumbnail rule` (Regra de miniatura). Para configurações de parâmetros específicos, consulte [Parâmetros de Processamento de Imagem](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).
2.  Os estilos de URL de upload completo (`Full upload URL style`) e de acesso completo (`Full access URL style`) podem ser mantidos iguais.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Criação de Bucket

1.  Clique no menu "Buckets" à esquerda -> Clique em "Create Bucket" (Criar Bucket) para ir para a página de criação.
2.  Preencha o nome do Bucket e clique no botão "Salvar".

#### Obtenção de AccessKey e SecretAccessKey

1.  Vá para "Access Keys" -> Clique no botão "Create access key" (Criar chave de acesso) para ir para a página de criação.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Clique no botão "Salvar".

![](https://static-docs.nocobase.com/20250106111850639.png)

1.  Salve a Access Key e a Secret Key da janela pop-up para configuração posterior.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuração de Parâmetros

1.  Vá para a página NocoBase -> Gerenciador de Arquivos.
2.  Clique no botão "Adicionar novo" e selecione "S3 Pro".
3.  Preencha o formulário:
    *   **AccessKey ID** e **AccessKey Secret** são os textos salvos na etapa anterior.
    *   **Região**: Um MinIO auto-hospedado não tem o conceito de Região, então pode ser configurado como "auto".
    *   **Endpoint**: Preencha o nome de domínio ou endereço IP da sua implantação.
    *   O estilo de URL de acesso completo (`Full access URL style`) deve ser definido como Path-Style.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Você pode consultar a configuração dos serviços de arquivo mencionados acima, pois a lógica é similar.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Você pode consultar a configuração dos serviços de arquivo mencionados acima, pois a lógica é similar.

#### Exemplo de Configuração

![](https://static-docs.nocobase.com/20250414154500264.png)