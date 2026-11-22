import type { MailPagesResource } from './pages.en-US.js';

const pagesEsES: MailPagesResource = {
  navigation: {
    mail: 'Correo',
    mailTeam: 'Correo del equipo',
    mailAccounts: 'Cuentas de correo',
    mailAccountsDescription:
      'Conecta tus buzones y gestiona firmas, plantillas y etiquetas.',
    mailSettings: 'Correo',
    mailSettingsDescription:
      'Proveedores de correo, el estado de cada cuenta y los registros de sincronización y envío.',
  },
  access: {
    section: 'Correo',
    team: {
      title: 'Correo del equipo',
      description: 'Correo sincronizado de los miembros, solo lectura.',
      actions: {
        view: 'Ver',
        process: 'Procesar (marcar como leído, destacar, archivar)',
      },
    },
    settings: {
      title: 'Correo',
      actions: {
        read: 'Ver',
        manage:
          'Gestionar (reintentar y cancelar sincronizaciones y envíos de los miembros)',
      },
    },
  },
  pages: {
    loading: 'Cargando…',
    empty: 'No hay nada que mostrar.',
    member: 'Miembro',
    allMembers: 'Todos los miembros',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} debe volver a conectarse: hasta entonces no sincroniza ni envía.',
      reauthorize: 'Volver a conectar en Cuentas de correo',
      needsReauthorization: 'requiere reautorización',
    },
    accounts: {
      title: 'Cuentas de correo',
      description:
        'Conecta tus buzones para enviar y recibir en Correo. Solo tú puedes ver tu correo; las personas con acceso a Correo del equipo pueden leerlo sin modificarlo.',
      reauthorizationNotice:
        'La autorización de {{addresses}} ya no se acepta: no sincroniza ni envía hasta que vuelvas a conectarla con el mismo proveedor.',
      reauthorize: 'Volver a conectar',
      tabs: {
        accounts: 'Cuentas',
        signatures: 'Firmas',
        templates: 'Plantillas',
        labels: 'Etiquetas',
        activity: 'Actividad',
      },
    },
    activity: {
      sends: 'Envíos',
      syncs: 'Sincronizaciones',
    },
    logs: {
      started: 'Inicio',
      time: 'Hora',
      account: 'Cuenta',
      accountMember: 'Cuenta · miembro',
      mode: 'Modo',
      initial: 'Primera sincronización',
      incremental: 'Incremental',
      result: 'Resultado',
      allResults: 'Todos los resultados',
      detail: 'Detalle',
      reason: 'Motivo',
      processed: '{{count}} mensajes',
      subject: 'Asunto',
      recipients: 'Destinatarios',
      recipientCount: 'Destinatarios',
      bulk: 'Envío masivo',
      bulkCount: '{{count}} (masivo)',
      scheduled: 'Programado',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      window: 'Periodo',
      windows: {
        day: 'Últimas 24 horas',
        week: 'Últimos 7 días',
        month: 'Últimos 30 días',
        all: 'Todo el tiempo',
      },
    },
    team: {
      title: 'Correo del equipo',
      description:
        'Lee el correo que han sincronizado los miembros, para traspasos de trabajo y controles de cumplimiento. Abrir un mensaje no lo marca como leído y no puedes responder.',
      account: 'Cuenta',
      allAccounts: 'Todas las cuentas',
      participant: 'Dirección o @dominio',
      keyword: 'Palabra clave del asunto',
      memberAccount: 'Miembro · cuenta',
      counterpart: 'Con',
      view: 'Ver',
      selectAll: 'Seleccionar todo en esta página',
      empty: 'Ningún correo sincronizado coincide.',
      readOnly: 'Solo lectura. Abrirlo no lo marca como leído.',
      applied: '{{succeeded}} actualizados, {{failed}} con error.',
      actions: {
        markRead: 'Marcar como leído',
        star: 'Destacar',
        archive: 'Archivar',
      },
    },
    settings: {
      title: 'Correo',
      description:
        'Los proveedores de correo que pueden conectar los miembros y el estado de conexión, sincronización y envío de cada cuenta. Aquí no se muestra el contenido de ningún mensaje. Los correos de notificación del sistema se configuran en Notificaciones.',
      tabs: {
        providers: 'Proveedores',
        accounts: 'Cuentas',
        syncRuns: 'Registros de sincronización',
        submissions: 'Registros de envío',
        runtime: 'Configuración de ejecución',
      },
      sources: {
        environment: 'Variable de entorno',
        config: 'config.yml',
        default: 'Predeterminado',
        code: 'Código',
      },
      providers: {
        name: 'Nombre',
        type: 'Tipo',
        capabilities: 'Capacidades',
        accounts: 'Cuentas',
        source: 'Origen',
        attention: '{{count}} requieren reautorización',
        howTo: 'Cómo añadir un proveedor',
        howToDescription:
          'Añade una entrada en mail.providers de la configuración de la aplicación y guarda los secretos en variables de entorno. Reinicia la aplicación para aplicarla.',
        callbackHint:
          'Registra esta URL de redirección de OAuth en Google o Microsoft:',
      },
      accounts: {
        filter: {
          all: 'Todas',
          attention: 'Requieren reautorización',
          suspended: 'Desactivadas',
        },
        provider: 'Proveedor',
        allProviders: 'Todos los proveedores',
        search: 'Miembro o dirección',
        lastSynced: 'Última sincronización',
        status: 'Estado',
        showRuns: 'Sincronizaciones',
        note: 'Los administradores no pueden autorizar ni eliminar las cuentas de los miembros. Cada miembro vuelve a conectar su propia cuenta en Configuración personal › Cuentas de correo.',
      },
      runtime: {
        setting: 'Ajuste',
        value: 'Valor actual',
        effect: 'Qué afecta',
        automaticSyncInterval: 'Intervalo de sincronización automática',
        automaticSyncIntervalEffect:
          'Con qué frecuencia se comprueba si hay correo nuevo en las cuentas sin notificaciones push.',
        syncBatchSize: 'Mensajes por lote de sincronización',
        syncBatchSizeEffect:
          'Los lotes más grandes terminan antes la primera sincronización, pero alcanzan con más facilidad los límites de frecuencia del proveedor.',
        oauthCallbackUrl: 'URL de redirección de OAuth',
        oauthCallbackUrlEffect:
          'Regístrala en la consola para desarrolladores de Google o Microsoft.',
        oauthReturnUrl: 'Página tras la autorización',
        oauthReturnUrlEffect:
          'Adónde vuelve una persona después de conectar una cuenta OAuth.',
        pushWebhook: 'Webhook de push',
        pushWebhookEffect:
          'Sin él, Gmail y Microsoft 365 también se comprueban con el intervalo de sincronización.',
        jobs: 'Tareas en segundo plano',
        jobsEffect:
          'Las implementaciones con varias instancias necesitan una cola compartida.',
        logRetention: 'Retención de registros',
        logRetentionEffect:
          'Las sincronizaciones y envíos finalizados con más antigüedad se eliminan automáticamente.',
        credentialVault: 'Almacenamiento de credenciales',
        credentialVaultEffect:
          'Dónde se guardan los tokens de OAuth y las contraseñas de las cuentas conectadas.',
        minutes: '{{count}} minutos',
        days: '{{count}} días',
        keepForever: 'Se conservan siempre',
        notConfigured: 'No configurado',
        secretConfigured: 'Secreto configurado',
        secretMissing: 'Sin secreto configurado',
        jobsDefault: 'Sigue jobs.default',
        vaultBuiltin: 'Integrado, en la base de datos de la aplicación',
        vaultApplication: 'Registrado por la aplicación',
        copy: 'Copiar',
        copied: 'Copiado',
        readOnly:
          'Solo lectura: estos ajustes proceden de config.yml y de las variables de entorno MAIL_* y se aplican tras un reinicio.',
      },
    },
  },
};

export default pagesEsES;
