/** Redacted Agents model-service metadata used by the demo connection editor. */
export interface DemoModelService {
  name: string;
  title: string;
  provider: string;
  baseUrl: string | null;
  apiKeySet: boolean;
  enabled: boolean;
  models: readonly {
    value: string;
    label: string;
    kind: 'chat' | 'embedding' | 'rerank';
    dimensions: number | null;
  }[];
}

/** Saves a connection in Agents; null creates an OpenAI-compatible service for the demo. */
export interface DemoModelConnectionInput {
  service: string | null;
  baseUrl: string | null;
  /** Absent keeps the saved key; null explicitly clears it. */
  apiKey?: string | null;
  model: string;
}
