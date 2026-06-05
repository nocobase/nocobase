
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Despliegue en Kubernetes

Este artículo tiene como objetivo guiarle para desplegar rápidamente NocoBase en modo clúster dentro de un entorno Kubernetes. Asumimos que usted ya está familiarizado con Kubernetes y ha completado los pasos descritos en [Preparativos](./preparations.md).

:::info{title="Consejo"}
Para verificar rápidamente el proceso de despliegue en Kubernetes, el entorno operativo de este artículo es un clúster K3s de un solo nodo (sistema operativo: Ubuntu). Esta guía también es aplicable a clústeres Kubernetes estándar. Si encuentra alguna discrepancia al desplegar en un clúster Kubernetes estándar, por favor, háganoslo saber.
:::

## Entorno del clúster

Si ya dispone de un entorno de clúster Kubernetes, puede omitir este paso.

Prepare un servidor con Debian / Ubuntu instalado y ejecute un clúster K3s en modo de nodo único. Para obtener más información sobre K3s, visite el [sitio web oficial de K3s](https://docs.k3s.io/).

Pasos:

1. Acceda al servidor mediante SSH.
2. Utilice el script oficial para instalar el nodo maestro del clúster K3s en el servidor.

```bash
# Después de la instalación, el archivo kubeconfig predeterminado es /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifique que la configuración sea correcta
kubectl get node
```

## Despliegue de la aplicación en el clúster

Despliegue la aplicación NocoBase en modo clúster en un clúster Kubernetes.

### Variables de entorno

Normalmente, las variables de entorno deberían separarse del archivo de configuración del despliegue de la aplicación. En este artículo, usamos un ConfigMap como ejemplo de orquestación. En un entorno de producción, puede utilizar Secrets para separar aún más la información sensible.

Pasos:

1. Cree un archivo `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Configure su zona horaria, por ejemplo, UTC, America/New_York
  TZ: Asia/Shanghai
  # Las configuraciones de base de datos y Redis a continuación utilizan los servicios PostgreSQL y Redis del clúster, tal como se describe en el documento "Despliegue de middleware en Kubernetes".
  # Si su entorno ya cuenta con servicios de base de datos y Redis existentes, modifique las configuraciones correspondientes a continuación.
  CACHE_DEFAULT_STORE: redis
  # Utilice un servicio Redis existente o desplegado por usted mismo.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Utilice un servicio PostgreSQL existente o desplegado por usted mismo.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # nombre de usuario de la plataforma de servicio
  NOCOBASE_PKG_USERNAME: "<your user>"
  # contraseña de la plataforma de servicio
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... otras variables de entorno
```

2. Ejecute el comando `kubectl` para desplegar el ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Almacenamiento compartido

Los diferentes nodos de una aplicación NocoBase desplegada en modo clúster necesitan montar el mismo directorio de almacenamiento (`storage`). Para lograr esto, debe crear un volumen persistente (Persistent Volume, PV) que admita acceso de lectura y escritura desde múltiples nodos (ReadWriteMany). Normalmente, crearía un disco en la nube en la plataforma de su proveedor de servicios en la nube y lo vincularía como un PV, o podría montar un directorio de almacenamiento compartido utilizando otros métodos como NFS.

### Despliegue de la aplicación

Para el despliegue inicial, comience con un solo nodo. Una vez completado, podrá escalar a múltiples nodos.

1. Cree un archivo `nocobase-apps.yaml`.

```yaml
# Crea un PVC. Múltiples Pods desplegados por el Deployment a continuación montarán el mismo directorio de almacenamiento persistente a través de este PVC.
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
  storageClassName: "" # Se establece explícitamente en vacío ya que el ejemplo utiliza el servicio NFS del nodo maestro, evitando la StorageClass predeterminada.
---
# El Service de la aplicación, que proporciona servicios fuera del clúster después de ser vinculado a un Ingress.
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
# El Deployment de la aplicación, que puede desplegar múltiples contenedores de aplicación.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Despliegue inicial con un solo nodo.
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
          # Carga las variables de entorno desde el ConfigMap desplegado previamente.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Declara las solicitudes y límites de recursos para el servicio.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Comando de sondeo de actividad (liveness probe). El clúster lo utiliza para determinar si el Pod necesita ser reiniciado.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Comando de sondeo de disponibilidad (readiness probe). El clúster lo utiliza para determinar si se debe dirigir el tráfico del Service al Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Monta el almacenamiento persistente a través del PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Ejecute el comando `kubectl` para desplegar el servicio de la aplicación NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verifique el estado del servicio de la aplicación NocoBase.

```bash
# Verifique el estado de los Pods del servicio NocoBase
kubectl get pods -l app=nocobase
```

La salida de ejemplo es la siguiente. Un `STATUS` de `Running` indica que el servicio se ha iniciado correctamente:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. En el primer inicio de la aplicación, deberá habilitar manualmente los siguientes **plugins** en la interfaz de administración:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Después de esto, podrá escalar. Por ejemplo, para escalar a 4 nodos:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Cambios en la aplicación

Los cambios en la aplicación se refieren a las siguientes situaciones:

- Actualización de la versión de la aplicación
- Instalación de nuevos **plugins**
- Activación de **plugins**

NocoBase aún no soporta la sincronización automática de cambios entre múltiples instancias en un clúster para los escenarios anteriores. Por lo tanto, deberá gestionarlos manualmente siguiendo los pasos que se indican a continuación. Estos pasos solo implican cambios en el servicio de la aplicación. Antes de realizar cualquier cambio, asegúrese de hacer una copia de seguridad de su base de datos y de su almacenamiento persistente.

### Actualización gradual de la versión de la aplicación

1. Ejecute el comando `kubectl set image` para cambiar la versión de la imagen del contenedor del Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Verifique el estado de la actualización gradual.

    ```bash
    # Verifique el progreso general de la actualización gradual del Deployment
    kubectl rollout status deployment/nocobase

    # Verifique el estado de cada Pod
    kubectl get pods -l app=nocobase
    ```

Si encuentra alguna anomalía durante o después de la actualización de la versión de la aplicación y necesita revertir la versión, ejecute el siguiente comando para revertir la versión de la imagen del contenedor:

```bash
kubectl rollout undo deployment/nocobase
```

### Reinicio gradual de la aplicación

Después de instalar o activar nuevos **plugins**, deberá actualizar la configuración o el estado de la aplicación. Puede utilizar el siguiente comando para reiniciar gradualmente cada Pod.

1. Ejecute el comando `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Verifique el estado del reinicio gradual.

    ```bash
    # Verifique el progreso general del reinicio del Deployment
    kubectl rollout status deployment/nocobase

    # Verifique el estado de cada Pod
    kubectl get pods -l app=nocobase
    ```

## Pasarela de aplicación

Para que una aplicación desplegada en un clúster Kubernetes sea accesible desde el exterior, necesita vincular un Ingress al Service de la aplicación. El entorno de clúster utilizado en este artículo es K3s, que viene con Traefik como componente Ingress Controller predeterminado.

### IngressRoute de Traefik

Pasos:

1. Cree un archivo `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Aquí, 'nocobase.local' debe ser reemplazado por un nombre de dominio real que apunte a la IP del clúster.
        # Si no tiene un dominio para la verificación, puede modificar su archivo hosts local para añadir un registro para nocobase.local que apunte a la IP del clúster.
        # Luego podrá acceder a la aplicación NocoBase en el clúster abriendo http://nocobase.local en su navegador.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Este es el Service creado al desplegar la aplicación nocobase en la sección "Despliegue de la aplicación" anterior.
            - name: nocobase
              port: 13000
    ```

2. Ejecute el comando `kubectl` para desplegar el Ingress de la aplicación NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

La mayoría de los clústeres Kubernetes utilizan Ingress-Nginx como Ingress Controller. A continuación, se muestra un archivo `nocobase-ingress.yaml` basado en Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Aquí, 'nocobase.local' debe ser reemplazado por un nombre de dominio real que apunte a la IP del clúster.
    # Si no tiene un dominio para la verificación, puede modificar su archivo hosts local para añadir un registro para nocobase.local que apunte a la IP del clúster.
    # Luego podrá acceder a la aplicación NocoBase en el clúster abriendo http://nocobase.local en su navegador.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Uso de Helm Charts

Hemos creado Helm Charts para la aplicación NocoBase, lo que le permite desplegar el servicio de la aplicación NocoBase en Kubernetes utilizando la CLI de Helm.

### Requisitos previos

Asegúrese de que clientes como `kubectl` y `helm` estén instalados en su entorno operativo y de que `kubectl` pueda conectarse correctamente al clúster de destino.

### Añadir repositorio

Añada el repositorio de Helm Charts de NocoBase:

```bash
# Añada el repositorio de Helm Charts de NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Actualice el índice de Helm
helm repo update
```

### Despliegue con Helm

1.  Cree un archivo `values.yaml`.

    ```yaml
    persistent:
      # Tamaño requerido para el almacenamiento compartido del clúster NocoBase
      size: 10Gi
      # Clase de almacenamiento proporcionada por Kubernetes del servicio en la nube
      # Al igual que en la sección "Despliegue de la aplicación", se establece explícitamente en vacío porque utiliza el servicio NFS del nodo maestro.
      storageClassName: ""

    configMap:
      data:
        # Configure su zona horaria, por ejemplo, UTC, America/New_York
        TZ: Asia/Shanghai
        # Las configuraciones de base de datos y Redis a continuación utilizan los servicios PostgreSQL y Redis del clúster, tal como se describe en el documento "Despliegue de middleware en Kubernetes".
        # Si su entorno ya cuenta con servicios de base de datos y Redis existentes, modifique las configuraciones correspondientes a continuación.
        CACHE_DEFAULT_STORE: redis
        # Utilice un servicio Redis existente o desplegado por usted mismo.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Utilice un servicio PostgreSQL existente o desplegado por usted mismo.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # nombre de usuario de la plataforma de servicio
        NOCOBASE_PKG_USERNAME: "<your user>"
        # contraseña de la plataforma de servicio
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... otras variables de entorno
    ```

2.  Ejecute el comando `helm install` para iniciar la instalación.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```