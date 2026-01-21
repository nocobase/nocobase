# Implantação no Kubernetes

Este artigo tem como objetivo guiar você na implantação rápida do NocoBase em modo de cluster em um ambiente Kubernetes. Presume-se que você já esteja familiarizado com o ambiente Kubernetes e tenha concluído as etapas em [Preparações](./preparations.md).

:::info{title="Dica"}
Para verificar rapidamente o processo de implantação no Kubernetes, o ambiente operacional deste artigo é um cluster K3s de nó único (SO: Ubuntu). Este guia também é aplicável a clusters Kubernetes padrão. Se você encontrar alguma diferença ao implantar em um cluster Kubernetes padrão, por favor, nos avise.
:::

## Ambiente de Cluster

Se você já possui um ambiente de cluster Kubernetes, pode pular esta etapa.

Prepare um servidor com Debian / Ubuntu instalado e execute um cluster K3s em modo de nó único nele. Para saber mais sobre o K3s, visite o [site oficial do K3s](https://docs.k3s.io/).

Siga os passos abaixo:

1. Acesse o servidor via SSH.
2. No servidor, use o script oficial para instalar o nó mestre do cluster K3s.

```bash
# Após a instalação, o arquivo kubeconfig padrão é /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifique se a configuração está correta
kubectl get node
```

## Implantação da Aplicação em Cluster

Implante a aplicação NocoBase em modo de cluster em um ambiente Kubernetes.

### Variáveis de Ambiente

Geralmente, as variáveis de ambiente devem ser separadas do arquivo de configuração de implantação da aplicação. Este artigo usa um ConfigMap como exemplo de orquestração. Em um ambiente de produção, você pode usar Secrets para separar ainda mais informações sensíveis.

Siga os passos abaixo:

1. Crie o arquivo `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Defina seu fuso horário, por exemplo, America/Sao_Paulo, UTC
  TZ: America/Sao_Paulo
  # As configurações de banco de dados e Redis abaixo usam os serviços PostgreSQL e Redis do cluster, conforme o documento "Implantação de Middleware no Kubernetes".
  # Se o seu ambiente já possui serviços de banco de dados e Redis existentes, modifique as configurações correspondentes abaixo.
  CACHE_DEFAULT_STORE: redis
  # Use um serviço Redis existente ou implantado por você.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Use um serviço PostgreSQL existente ou implantado por você.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # nome de usuário da plataforma de serviço
  NOCOBASE_PKG_USERNAME: "<seu usuário>"
  # senha da plataforma de serviço
  NOCOBASE_PKG_PASSWORD: "<sua senha>"

  # ... outras variáveis de ambiente
```

2. Execute o comando `kubectl` para implantar o ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Armazenamento Compartilhado

Diferentes nós de uma aplicação NocoBase implantada em modo de cluster precisam montar o mesmo diretório de armazenamento (`storage`). Para isso, você precisará criar um Volume Persistente (PV) que suporte acesso de leitura e escrita por múltiplos nós (ReadWriteMany). Geralmente, você criaria um disco na nuvem na plataforma do seu provedor de serviços e o vincularia como um PV, ou pode montar um diretório de armazenamento compartilhado usando outros métodos, como NFS.

### Implantação da Aplicação

Para a implantação inicial, comece com um único nó. Após a conclusão, você pode escalar para múltiplos nós.

1. Crie o arquivo `nocobase-apps.yaml`.

```yaml
# Crie um PVC. Múltiplos Pods implantados por este Deployment montarão o mesmo diretório de armazenamento persistente através deste PVC.
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nocobase-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: "" # Definido explicitamente como vazio, pois o exemplo usa o serviço NFS do nó mestre, evitando o StorageClass padrão.
---
# O Service da aplicação, que fornece serviços para fora do cluster após ser vinculado a um Ingress.
apiVersion: v1
kind: Service
metadata:
  name: nocobase
spec:
  ports:
    - name: nocobase
      port: 13000
      targetPort: 13000
  selector:
    app: nocobase
  type: ClusterIP
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# O Deployment da aplicação, que pode implantar múltiplos contêineres da aplicação.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Implantação inicial com apenas um nó.
  selector:
    matchLabels:
      app: nocobase
  template:
    metadata:
      labels:
        app: nocobase
    spec:
      containers:
        - name: nocobase
          image: nocobase/nocobase:1.6
          ports:
            - containerPort: 13000
          # Carrega as variáveis de ambiente do ConfigMap implantado anteriormente.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Declara as requisições e limites de recursos para o serviço.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Comando de liveness probe. O cluster usa isso para determinar se o Pod precisa ser reiniciado.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Comando de readiness probe. O cluster usa isso para determinar se deve direcionar o tráfego do Service para o Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Monta o armazenamento persistente via PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Execute o comando `kubectl` para implantar o serviço da aplicação NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verifique o status do serviço da aplicação NocoBase.

```bash
# Verifique o status dos Pods do serviço NocoBase
kubectl get pods -l app=nocobase
```

A saída de exemplo é a seguinte. Um `STATUS` de `Running` indica que o serviço foi iniciado com sucesso:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Na primeira inicialização da aplicação, você precisará habilitar manualmente os seguintes **plugins** na interface de administração:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Depois disso, você pode escalar. Por exemplo, para escalar para 4 nós:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Alterações na Aplicação

Alterações na aplicação referem-se às seguintes situações:

- Atualização da versão da aplicação
- Instalação de novos **plugins**
- Ativação de **plugins**

O NocoBase ainda não oferece suporte à sincronização automática de alterações entre múltiplas instâncias em um cluster para os cenários acima. Portanto, você precisará lidar com eles manualmente, seguindo os passos abaixo. Estes passos envolvem apenas alterações no serviço da aplicação. Antes de fazer qualquer alteração, por favor, faça backup do seu banco de dados e do armazenamento persistente.

### Atualização Contínua da Versão da Aplicação

1. Execute o comando `kubectl set image` para alterar a versão da imagem do contêiner do Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Verifique o status da atualização contínua.

    ```bash
    # Verifique o progresso geral da atualização contínua do Deployment
    kubectl rollout status deployment/nocobase

    # Verifique o status de cada Pod
    kubectl get pods -l app=nocobase
    ```

Se você encontrar algum problema durante ou após a atualização da versão da aplicação e precisar reverter, execute o comando abaixo para reverter a versão da imagem do contêiner:

```bash
kubectl rollout undo deployment/nocobase
```

### Reinício Suave da Aplicação

Após instalar ou ativar novos **plugins**, você precisará atualizar a configuração ou o estado da aplicação. Você pode usar o comando abaixo para reiniciar suavemente cada Pod.

1. Execute o comando `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Verifique o status do reinício contínuo.

    ```bash
    # Verifique o progresso geral do reinício do Deployment
    kubectl rollout status deployment/nocobase

    # Verifique o status de cada Pod
    kubectl get pods -l app=nocobase
    ```

## Gateway da Aplicação

Para que uma aplicação implantada em um cluster Kubernetes seja acessível externamente, você precisará vincular um Ingress ao Service da aplicação. O ambiente de cluster usado neste artigo é o K3s, que vem com Traefik como o Ingress Controller padrão.

### Traefik IngressRoute

Siga os passos abaixo:

1. Crie o arquivo `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Aqui, 'nocobase.local' deve ser substituído por um nome de domínio real que aponte para o IP do cluster.
        # Se você não tiver um domínio para verificação, pode modificar o arquivo hosts local para adicionar um registro para nocobase.local apontando para o IP do cluster.
        # Você poderá então acessar a aplicação NocoBase no cluster abrindo http://nocobase.local no seu navegador.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Este é o Service criado ao implantar a aplicação nocobase na seção "Implantação da Aplicação" acima.
            - name: nocobase
              port: 13000
    ```

2. Execute o comando `kubectl` para implantar o Ingress da aplicação NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

A maioria dos clusters Kubernetes usa Ingress-Nginx como o Ingress Controller. Abaixo está um arquivo `nocobase-ingress.yaml` baseado em Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Aqui, 'nocobase.local' deve ser substituído por um nome de domínio real que aponte para o IP do cluster.
    # Se você não tiver um domínio para verificação, pode modificar o arquivo hosts local para adicionar um registro para nocobase.local apontando para o IP do cluster.
    # Você poderá então acessar a aplicação NocoBase no cluster abrindo http://nocobase.local no seu navegador.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Usando Helm Charts

Criamos Helm Charts para a aplicação NocoBase, permitindo que você implante o serviço da aplicação NocoBase no Kubernetes usando o Helm CLI.

### Pré-requisitos

Certifique-se de que clientes como `kubectl` e `helm` estejam instalados no seu ambiente operacional e que o `kubectl` possa se conectar corretamente ao cluster de destino.

### Adicionar Repositório

Adicione o repositório dos Helm Charts do NocoBase:

```bash
# Adicione o repositório dos Helm Charts do NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Atualize o índice do Helm
helm repo update
```

### Implantação com Helm

1. Crie o arquivo `values.yaml`.

    ```yaml
    persistent:
      # Tamanho necessário para o armazenamento compartilhado do cluster NocoBase
      size: 10Gi
      # Classe de armazenamento fornecida pelo Kubernetes do serviço de nuvem
      # Assim como na seção "Implantação da Aplicação", este é explicitamente definido como vazio porque usa o serviço NFS do nó mestre.
      storageClassName: ""

    configMap:
      data:
        # Defina seu fuso horário, por exemplo, America/Sao_Paulo, UTC
        TZ: America/Sao_Paulo
        # As configurações de banco de dados e Redis abaixo usam os serviços PostgreSQL e Redis do cluster, conforme o documento "Implantação de Middleware no Kubernetes".
        # Se o seu ambiente já possui serviços de banco de dados e Redis existentes, modifique as configurações correspondentes abaixo.
        CACHE_DEFAULT_STORE: redis
        # Use um serviço Redis existente ou implantado por você.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Use um serviço PostgreSQL existente ou implantado por você.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # nome de usuário da plataforma de serviço
        NOCOBASE_PKG_USERNAME: "<seu usuário>"
        # senha da plataforma de serviço
        NOCOBASE_PKG_PASSWORD: "<sua senha>"

        # ... outras variáveis de ambiente
    ```

2. Execute o comando `helm install` para iniciar a instalação.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```