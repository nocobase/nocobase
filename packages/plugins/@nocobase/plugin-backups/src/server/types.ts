export interface StorageModel {
    id?: number;
    title: string;
    type: string;
    name: string;
    baseUrl: string;
    options: Record<string, any>;
    rules?: Record<string, any>;
    path?: string;
    default?: boolean;
    paranoid?: boolean;
  }
  