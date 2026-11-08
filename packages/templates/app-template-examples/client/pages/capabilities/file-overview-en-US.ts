const fileOverview = {
  current: {
    storageTitle: 'File storage',
    default: 'Default disk',
    disks: 'Configured disks',
    storageUnavailable:
      'The disk inventory is not available yet. The current configuration cannot be confirmed.',
    tablesTitle: 'File collections',
    count: 'Configured file collections',
    tablesUnavailable:
      'The file collection inventory is not available yet. The configured count cannot be confirmed.',
    unknown: 'Not available',
    scope:
      'Configuration availability does not establish storage connectivity. A file collection can contain records stored on different disks.',
  },
  actionsTitle: 'Configure through Agent',
  exampleTitle: 'config.yml example',
  exampleHint:
    'Reference example only. Merge with the current drive configuration and replace the sample directory with an accessible absolute path. Changing the default disk does not move existing files.',
  fileConfigTitle: 'File collection configuration example',
  fileConfigHint:
    'Create the collection through a new application migration and declare its File Repository resource in application code. Adding a drive disk in config.yml does not create a file collection.',
  fields: {
    diskName: 'Disk name',
    driver: 'Driver',
    visibility: 'Visibility',
    connection: 'Database connection',
    collection: 'File collection',
    disk: 'Upload disk',
    resource: 'API resource',
  },
  actions: {
    drive: {
      title: 'Configure file storage (drive)',
      description:
        'Use a local directory, S3-compatible storage or Aliyun OSS; add disks or change the default.',
      prompt:
        'Add [Aliyun OSS] file storage to this application for [contract attachments]. Set it up alongside the existing configuration and tell me what information you need.',
      inspect:
        'Inspect drive.default and drive.disks, including configuration defaults and overrides. Confirm the desired storage type and preserve disk names used by existing records.',
      configure:
        'For fs, configure an accessible absolute location; for s3 or oss, follow the driver Skill for the bucket, region, credentials and supported options. Keep secrets out of the overview and use supported environment mappings or credential providers.',
      apply:
        'Restart the application to apply the change and confirm the effective disk configuration. Handle existing-file migration separately; configured visibility is not a substitute for content-route authorization.',
    },
    collection: {
      title: 'Add or configure a file collection',
      description:
        'Choose the database connection and upload disk, then configure file records, the API resource and access rules.',
      prompt:
        'Set up a file collection for [contract attachments]. Save file records in [the current default database] and files on [the local disk]. Allow [people working on the contract] to upload, view and download them. Reuse a suitable existing file collection if available.',
      inspect:
        'Confirm the connection, logical collection name, resource name and existing disk. Reuse suitable file collections and distinguish one collection from multiple resource exposures.',
      configure:
        'Create a new migration with id, disk, key, filename, ext, mimeType, size, createdAt and updatedAt using the types required by the File plugin. Apply the migration through the application workflow; contentUrl is derived rather than stored.',
      apply:
        'Declare the File Repository resource mapping, upload limits, required actions and policy. Add scoped authentication and authorization to both API and content routes. Reuse the application’s existing business association flow.',
    },
  },
};

export default fileOverview;
