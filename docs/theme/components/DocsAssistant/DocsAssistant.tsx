import { useI18n, usePageData } from '@rspress/core/runtime';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DocsAssistant.scss';

interface Citation {
  citationId: string;
  title: string;
  url: string;
  snippet: string;
  verificationStatus: string;
}

interface AnswerResponse {
  requestId: string;
  status:
    | 'answered'
    | 'insufficient_evidence'
    | 'clarification_required'
    | 'refused';
  answer: string;
  steps: string[];
  appliesWhen: string[];
  citations: Citation[];
  missingInformation: string[];
  followUpQuestion?: string;
  indexVersion: string;
  degraded: boolean;
}

interface DocsAssistantI18n {
  docsAiOpen: string;
  docsAiTitle: string;
  docsAiClose: string;
  docsAiExpand: string;
  docsAiCollapse: string;
  docsAiQuestionPlaceholder: string;
  docsAiSubmit: string;
  docsAiQuestionLabel: string;
  docsAiProgress: string;
  docsAiLoading: string;
  docsAiSources: string;
  docsAiAppliesWhen: string;
  docsAiSuggestions: string;
  docsAiSuggestionOne: string;
  docsAiSuggestionTwo: string;
  docsAiSuggestionThree: string;
  docsAiError: string;
  docsAiRequestId: string;
  docsAiEmptyQuestion: string;
}

interface AnswerProgress {
  type: 'progress';
  stage: string;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

type AnswerStreamMessage =
  | AnswerProgress
  | { type: 'answer'; data: AnswerResponse }
  | { type: 'error'; message: string; requestId: string };

const CONFIGURED_API_BASE_URL = import.meta.env.DOCS_AI_API_URL.replace(
  /\/$/,
  '',
);

export function DocsAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [answer, setAnswer] = useState<AnswerResponse>();
  const [progress, setProgress] = useState<AnswerProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorRequestId, setErrorRequestId] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController>();
  const t = useI18n<DocsAssistantI18n>();
  const {
    page: { lang, version },
  } = usePageData();

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
    }
    document.documentElement.classList.toggle('docs-ai-workspace-open', open);
    return () => {
      document.documentElement.classList.remove('docs-ai-workspace-open');
    };
  }, [open]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'docs-ai-workspace-expanded',
      open && expanded,
    );
    return () => {
      document.documentElement.classList.remove('docs-ai-workspace-expanded');
    };
  }, [expanded, open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        abortRef.current?.abort();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (suggestedQuestion?: string) => {
    const nextQuestion = (suggestedQuestion ?? question).trim();
    if (!nextQuestion) {
      setError(t('docsAiEmptyQuestion'));
      return;
    }
    setQuestion('');
    setSubmittedQuestion(nextQuestion);
    setProgress([]);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    setErrorRequestId('');
    setAnswer(undefined);

    try {
      const response = await fetch(`${apiBaseUrl()}/v1/answers/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Docs-AI-Session': docsAiSessionId(),
        },
        body: JSON.stringify({
          question: nextQuestion,
          language: normalizeLanguage(lang),
          productVersion: version || 'current',
          currentPage: window.location.href,
        }),
        signal: controller.signal,
      });
      const responseRequestId = response.headers.get('x-request-id') ?? '';
      if (!response.ok) {
        throw new DocsAssistantRequestError(responseRequestId);
      }
      const nextAnswer = await readAnswerStream(response, (event) => {
        setProgress((current) => [...current.slice(-5), event]);
      });
      setAnswer(nextAnswer);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === 'AbortError'
      ) {
        return;
      }
      if (requestError instanceof DocsAssistantRequestError) {
        setErrorRequestId(requestError.requestId);
      }
      setError(t('docsAiError'));
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="docs-ai-launcher"
          aria-haspopup="dialog"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          <SparklesIcon />
          {t('docsAiOpen')}
        </button>
      ) : null}

      {open ? (
        <aside
          className={`docs-ai-panel${expanded ? ' docs-ai-panel--expanded' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby="docs-ai-title"
        >
          <header className="docs-ai-header">
            <div className="docs-ai-heading">
              <SparklesIcon />
              <h2 id="docs-ai-title">{t('docsAiTitle')}</h2>
            </div>
            <div className="docs-ai-header-actions">
              <button
                type="button"
                className="docs-ai-icon-button"
                aria-label={expanded ? t('docsAiCollapse') : t('docsAiExpand')}
                aria-pressed={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <ExpandIcon expanded={expanded} />
              </button>
              <button
                type="button"
                className="docs-ai-icon-button"
                aria-label={t('docsAiClose')}
                onClick={() => {
                  abortRef.current?.abort();
                  setOpen(false);
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          <div className="docs-ai-body" aria-live="polite">
            {submittedQuestion ? (
              <section className="docs-ai-submitted-question">
                <strong>{t('docsAiQuestionLabel')}</strong>
                <p>{submittedQuestion}</p>
              </section>
            ) : null}
            {loading ? (
              <section className="docs-ai-progress">
                <h3>{t('docsAiProgress')}</h3>
                <ol>
                  {progress.length > 0 ? (
                    progress.map((item, index) => (
                      <li key={`${item.stage}-${item.attempt ?? 0}-${index}`}>
                        <span aria-hidden="true" />
                        {item.message}
                      </li>
                    ))
                  ) : (
                    <li>
                      <span aria-hidden="true" />
                      {t('docsAiLoading')}
                    </li>
                  )}
                </ol>
              </section>
            ) : null}
            {error ? (
              <p className="docs-ai-error">
                {error}
                {errorRequestId ? (
                  <small>
                    {t('docsAiRequestId')}: {errorRequestId}
                  </small>
                ) : null}
              </p>
            ) : null}
            {answer ? <AnswerView answer={answer} t={t} /> : null}
          </div>

          <footer className="docs-ai-footer">
            {!answer && !loading ? (
              <section
                className="docs-ai-suggestions"
                aria-labelledby="docs-ai-suggestions-title"
              >
                <h3 id="docs-ai-suggestions-title">{t('docsAiSuggestions')}</h3>
                {[
                  t('docsAiSuggestionOne'),
                  t('docsAiSuggestionTwo'),
                  t('docsAiSuggestionThree'),
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </section>
            ) : null}

            <form
              className="docs-ai-form"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <textarea
                ref={textareaRef}
                value={question}
                maxLength={2_000}
                rows={2}
                placeholder={t('docsAiQuestionPlaceholder')}
                aria-label={t('docsAiQuestionPlaceholder')}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <button
                type="submit"
                aria-label={t('docsAiSubmit')}
                disabled={loading || !question.trim()}
              >
                <ArrowUpIcon />
              </button>
            </form>
          </footer>
        </aside>
      ) : null}
    </>
  );
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 2.8c.8 4.5 3.1 6.8 7.6 7.6-4.5.8-6.8 3.1-7.6 7.6-.8-4.5-3.1-6.8-7.6-7.6C8.9 9.6 11.2 7.3 12 2.8Z" />
      <path d="M5 2.5c.25 1.45 1.05 2.25 2.5 2.5C6.05 5.25 5.25 6.05 5 7.5 4.75 6.05 3.95 5.25 2.5 5 3.95 4.75 4.75 3.95 5 2.5Z" />
    </svg>
  );
}

function ExpandIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m9 3 .1 5.9L3 9m12 12-.1-5.9L21 15M3 9l6-6m6 18 6-6" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}

function AnswerView({
  answer,
  t,
}: {
  answer: AnswerResponse;
  t: ReturnType<typeof useI18n<DocsAssistantI18n>>;
}) {
  const safeCitations = answer.citations.filter((citation) =>
    isOfficialDocsUrl(citation.url),
  );
  const answerContainsAllSources =
    safeCitations.length > 0 &&
    safeCitations.every((citation) => answer.answer.includes(citation.url));

  return (
    <article className="docs-ai-answer">
      <div className="docs-ai-answer-text">
        <ReactMarkdown
          components={MARKDOWN_COMPONENTS}
          remarkPlugins={[remarkGfm]}
          skipHtml
        >
          {answer.answer}
        </ReactMarkdown>
      </div>
      {answer.steps.length > 0 ? (
        <ol>
          {answer.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {answer.appliesWhen.length > 0 ? (
        <div className="docs-ai-applies">
          <strong>{t('docsAiAppliesWhen')}</strong>
          <ul>
            {answer.appliesWhen.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {safeCitations.length > 0 && !answerContainsAllSources ? (
        <section className="docs-ai-sources">
          <h3>{t('docsAiSources')}</h3>
          <ul>
            {safeCitations.map((citation) => (
              <li key={citation.citationId}>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {citationTitle(citation)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function citationTitle(citation: Citation): string {
  if (citation.title && citation.title !== citation.url) {
    return citation.title;
  }
  try {
    const url = new URL(citation.url);
    const segment = decodeURIComponent(
      url.pathname.split('/').filter(Boolean).at(-1) ?? '',
    );
    return segment ? segment.replaceAll('-', ' ') : 'NocoBase 官方文档';
  } catch {
    return 'NocoBase 官方文档';
  }
}

const MARKDOWN_COMPONENTS: Components = {
  a({ href, children }) {
    if (!isOfficialDocsUrl(href)) {
      return <span>{children}</span>;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img() {
    return null;
  },
};

function isOfficialDocsUrl(value?: string): boolean {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'docs.nocobase.com';
  } catch {
    return false;
  }
}

function apiBaseUrl(): string {
  if (CONFIGURED_API_BASE_URL) {
    return CONFIGURED_API_BASE_URL;
  }
  return window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3100'
    : '/api/ai';
}

async function readAnswerStream(
  response: Response,
  onProgress: (event: AnswerProgress) => void,
): Promise<AnswerResponse> {
  if (!response.body) {
    throw new Error('Streaming response body is unavailable');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer: AnswerResponse | undefined;

  const consumeLine = (line: string) => {
    if (!line.trim()) {
      return;
    }
    const event = JSON.parse(line) as AnswerStreamMessage;
    if (event.type === 'progress') {
      onProgress(event);
    } else if (event.type === 'answer') {
      answer = event.data;
    } else {
      throw new DocsAssistantRequestError(event.requestId);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(consumeLine);
    if (done) {
      break;
    }
  }
  consumeLine(buffer);
  if (!answer) {
    throw new Error('Streaming response ended without an answer');
  }
  return answer;
}

function normalizeLanguage(lang: string): string {
  return lang === 'cn' || lang.toLowerCase().startsWith('zh')
    ? 'zh-CN'
    : 'en-US';
}

const DOCS_AI_SESSION_KEY = 'nocobase-docs-ai-session';

function docsAiSessionId(): string {
  const existing = window.sessionStorage.getItem(DOCS_AI_SESSION_KEY);
  if (existing) {
    return existing;
  }
  const sessionId = window.crypto.randomUUID();
  window.sessionStorage.setItem(DOCS_AI_SESSION_KEY, sessionId);
  return sessionId;
}

class DocsAssistantRequestError extends Error {
  constructor(readonly requestId: string) {
    super('Documentation assistant request failed');
    this.name = 'DocsAssistantRequestError';
  }
}
