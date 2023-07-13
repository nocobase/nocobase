export default {
  openapi: '3.0.1',
  info: {
    title: 'Swagger Generator',
    description:
      'This is an online swagger codegen server.  You can find out more at https://github.com/swagger-api/swagger-codegen or on [irc.freenode.net, #swagger](http://swagger.io/irc/).',
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: '3.0.46',
  },
  servers: [
    {
      url: '/api',
    },
  ],
  tags: [
    {
      name: 'clients',
    },
    {
      name: 'servers',
    },
    {
      name: 'documentation',
    },
    {
      name: 'config',
    },
  ],
  paths: {
    '/generate': {
      get: {
        tags: ['clients', 'servers', 'documentation', 'config'],
        summary:
          'Generates and download code. GenerationRequest input provided as JSON available at URL specified in parameter codegenOptionsURL.',
        operationId: 'generateFromURL',
        parameters: [
          {
            name: 'codegenOptionsURL',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
      post: {
        tags: ['clients', 'servers', 'documentation', 'config'],
        summary: 'Generates and download code. GenerationRequest input provided as request body.',
        operationId: 'generate',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerationRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/clients': {
      get: {
        tags: ['clients', 'documentation'],
        summary:
          "Deprecated, use '/{type}/{version}' instead. List generator languages of type 'client' or 'documentation' for given codegen version (defaults to V3)",
        operationId: 'clientLanguages',
        parameters: [
          {
            $ref: '#/components/parameters/version',
          },
          {
            name: 'clientOnly',
            in: 'query',
            description: 'flag to only return languages of type `client`',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        deprecated: true,
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/servers': {
      get: {
        tags: ['servers'],
        summary:
          "Deprecated, use '/{type}/{version}' instead. List generator languages of type 'server' for given codegen version (defaults to V3)",
        operationId: 'serverLanguages',
        parameters: [
          {
            $ref: '#/components/parameters/version',
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        deprecated: true,
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/documentation': {
      get: {
        tags: ['documentation'],
        summary:
          "Deprecated, use '/{type}/{version}' instead. List generator languages of type 'documentation' for given codegen version (defaults to V3)",
        operationId: 'documentationLanguages',
        parameters: [
          {
            $ref: '#/components/parameters/version',
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        deprecated: true,
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/{type}/{version}': {
      get: {
        tags: ['clients', 'servers', 'documentation', 'config'],
        summary: 'List generator languages of the given type and version',
        operationId: 'languages',
        parameters: [
          {
            $ref: '#/components/parameters/type',
          },
          {
            name: 'version',
            in: 'path',
            description: 'generator version used by codegen engine',
            required: true,
            schema: {
              type: 'string',
              enum: ['V2', 'V3'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/types': {
      get: {
        tags: ['clients', 'servers', 'documentation', 'config'],
        summary:
          "List generator languages of version defined in 'version parameter (defaults to V3) and type included in 'types' parameter; all languages",
        operationId: 'languagesMulti',
        parameters: [
          {
            $ref: '#/components/parameters/types',
          },
          {
            $ref: '#/components/parameters/version',
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
    '/options': {
      get: {
        tags: ['clients', 'servers', 'documentation', 'config'],
        summary: 'Returns options for a given language and version (defaults to V3)',
        operationId: 'listOptions',
        parameters: [
          {
            name: 'language',
            in: 'query',
            description: 'language',
            schema: {
              type: 'string',
            },
          },
          {
            $ref: '#/components/parameters/version',
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: {
                    $ref: '#/components/schemas/CliOption',
                  },
                },
              },
            },
          },
        },
        'x-swagger-router-controller': 'io.swagger.v3.generator.online.GeneratorController',
      },
    },
  },
  components: {
    schemas: {
      GenerationRequest: {
        required: ['lang'],
        type: 'object',
        properties: {
          lang: {
            title: 'language',
            type: 'string',
            description: 'language to generate (required)',
            example: 'java',
          },
          spec: {
            type: 'object',
            description: 'spec in json format. . Alternative to `specURL`',
          },
          specURL: {
            type: 'string',
            description: 'URL of the spec in json format. Alternative to `spec`',
          },
          type: {
            type: 'string',
            description: 'type of the spec',
            enum: ['CLIENT', 'SERVER', 'DOCUMENTATION', 'CONFIG'],
          },
          codegenVersion: {
            type: 'string',
            description: 'codegen version to use',
            enum: ['V2', 'V3'],
          },
          options: {
            $ref: '#/components/schemas/Options',
          },
        },
        'x-swagger-router-model': 'io.swagger.codegen.v3.service.GenerationRequest',
      },
      AuthorizationValue: {
        title: 'authorization',
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: 'Authorization value',
          },
          keyName: {
            type: 'string',
            description: 'Authorization key',
          },
          type: {
            type: 'string',
            description: 'Authorization type',
          },
        },
        description:
          'adds authorization headers when fetching the open api definitions remotely. Pass in an authorizationValue object',
        'x-swagger-router-model': 'io.swagger.v3.parser.core.models.AuthorizationValue',
      },
      Options: {
        type: 'object',
        properties: {
          auth: {
            title: 'authorization',
            type: 'string',
            description:
              'adds authorization headers when fetching the open api definitions remotely. Pass in a URL-encoded string of name:header with a comma separating multiple values',
          },
          authorizationValue: {
            $ref: '#/components/schemas/AuthorizationValue',
          },
          apiPackage: {
            title: 'api package',
            type: 'string',
            description: 'package for generated api classes',
          },
          templateVersion: {
            title: 'Template Version',
            type: 'string',
            description: 'template version for generation',
          },
          modelPackage: {
            title: 'model package',
            type: 'string',
            description: 'package for generated models',
          },
          modelNamePrefix: {
            title: 'model name prefix',
            type: 'string',
            description: 'Prefix that will be prepended to all model names. Default is the empty string.',
          },
          modelNameSuffix: {
            title: 'model name suffix',
            type: 'string',
            description: 'PrefixSuffix that will be appended to all model names. Default is the empty string.',
          },
          systemProperties: {
            title: 'System Properties',
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description: 'sets specified system properties in key/value format',
          },
          instantiationTypes: {
            title: 'instantiation types',
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description:
              'sets instantiation type mappings in key/value format. For example (in Java): array=ArrayList,map=HashMap. In other words array types will get instantiated as ArrayList in generated code.',
          },
          typeMappings: {
            title: 'type mappings',
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description:
              'sets mappings between swagger spec types and generated code types in key/value format. For example: array=List,map=Map,string=String.',
          },
          additionalProperties: {
            title: 'additional properties',
            type: 'object',
            additionalProperties: {
              type: 'object',
            },
            description:
              'sets additional properties that can be referenced by the mustache templates in key/value format.',
          },
          languageSpecificPrimitives: {
            title: 'language specific primitives',
            type: 'array',
            description:
              'specifies additional language specific primitive types in the format of type1,type2,type3,type3. For example: String,boolean,Boolean,Double. You can also have multiple occurrences of this option.',
            items: {
              type: 'string',
            },
          },
          importMappings: {
            title: 'import mappings',
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description:
              'specifies mappings between a given class and the import that should be used for that class in key/value format.',
          },
          invokerPackage: {
            title: 'invoker package',
            type: 'string',
            description: 'root package for generated code',
          },
          groupId: {
            title: 'group id',
            type: 'string',
            description: 'groupId in generated pom.xml',
          },
          artifactId: {
            title: 'artifact id',
            type: 'string',
            description: 'artifactId in generated pom.xml',
          },
          artifactVersion: {
            title: 'artifact version',
            type: 'string',
            description: 'artifact version generated in pom.xml',
          },
          library: {
            title: 'library',
            type: 'string',
            description: 'library template (sub-template)',
          },
          gitUserId: {
            title: 'git user id',
            type: 'string',
            description: 'Git user ID, e.g. swagger-api.',
          },
          gitRepoId: {
            title: 'git repo id',
            type: 'string',
            description: 'Git repo ID, e.g. swagger-codegen.',
          },
          releaseNote: {
            title: 'release note',
            type: 'string',
            description: "Release note, default to 'Minor update'.",
          },
          httpUserAgent: {
            title: 'http user agent',
            type: 'string',
            description:
              "HTTP user agent, e.g. codegen_csharp_api_client, default to 'Swagger-Codegen/{packageVersion}}/{language}'",
          },
          reservedWordsMappings: {
            title: 'reserved words mappings',
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description:
              'pecifies how a reserved name should be escaped to. Otherwise, the default _<name> is used. For example id=identifier.',
          },
          ignoreFileOverride: {
            title: 'ignore file override location',
            type: 'string',
            description:
              'Specifies an override location for the .swagger-codegen-ignore file. Most useful on initial generation.',
          },
          removeOperationIdPrefix: {
            title: 'remove prefix of the operationId',
            type: 'boolean',
            description: 'Remove prefix of operationId, e.g. config_getId => getId',
          },
          skipOverride: {
            type: 'boolean',
          },
        },
        'x-swagger-router-model': 'io.swagger.codegen.v3.service.Options',
      },
      CliOption: {
        type: 'object',
        properties: {
          optionName: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          type: {
            type: 'string',
            description: 'Data type is based on the types supported by the JSON-Schema',
          },
          enum: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
          default: {
            type: 'string',
          },
        },
      },
    },
    parameters: {
      version: {
        name: 'version',
        in: 'query',
        description: 'generator version used by codegen engine',
        schema: {
          type: 'string',
          enum: ['V2', 'V3'],
        },
      },
      type: {
        name: 'type',
        in: 'path',
        description: 'generator type',
        required: true,
        schema: {
          type: 'string',
          enum: ['client', 'server', 'documentation', 'config'],
        },
      },
      types: {
        name: 'types',
        in: 'query',
        description: 'comma-separated list of generator types',
        required: true,
        style: 'form',
        explode: false,
        schema: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['client', 'server', 'documentation', 'config'],
          },
        },
      },
    },
  },
};
