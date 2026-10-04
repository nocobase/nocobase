import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { useApiClient } from '@nocobase/app-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type FormEvent,
} from 'react';
import {
  FileText,
  Plus,
  Search,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
interface ArticlesResponse {
  data: Article[];
  meta: { page: number; pageSize: number; total: number };
}
const PAGE_SIZE = 12;
const emptyForm = {
  title: '',
  summary: '',
  content: '',
  status: 'draft' as Article['status'],
};

export default function ArticlesPage(): ReactElement {
  const api = useApiClient();
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [preview, setPreview] = useState<Article | null>(null);
  const [editor, setEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [original, setOriginal] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const {
    data: result = {
      data: [],
      meta: { page: 1, pageSize: PAGE_SIZE, total: 0 },
    },
    isFetching: loading,
    isError: error,
  } = useQuery({
    queryKey: ['articles', query, status, page, revision],
    queryFn: ({ signal }) =>
      api.request<ArticlesResponse>({
        path: 'articles',
        query: {
          q: query,
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        },
        signal,
      }),
    retry: false,
  });
  const openEditor = useCallback((article?: Article) => {
    setEditingId(article?.id ?? null);
    const values = article
      ? {
          title: article.title,
          summary: article.summary ?? '',
          content: article.content,
          status: article.status,
        }
      : emptyForm;
    setForm(values);
    setOriginal(values);
    setSaveError(false);
    setPreview(null);
    setEditor(true);
  }, []);
  const save = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setSaveError(false);
    try {
      await api.request({
        path: editingId ? `articles/${editingId}` : 'articles',
        method: editingId ? 'PATCH' : 'POST',
        // An edit sends only the fields the user changed.
        json: editingId
          ? Object.fromEntries(
              Object.entries(form).filter(
                ([key, value]) => original[key as keyof typeof form] !== value,
              ),
            )
          : form,
      });
      setEditor(false);
      setPage(1);
      setRevision((value) => value + 1);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };
  const date = (value: string): string =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
      new Date(value),
    );
  const statusLabel = (value: Article['status']): string =>
    t(`articles.${value}`);
  const pages = Math.max(1, Math.ceil(result.meta.total / PAGE_SIZE));
  return (
    <PageContainer>
      <PageHeader
        actions={
          <Button onClick={() => openEditor()}>
            <Plus className='size-4' />
            {t('articles.new')}
          </Button>
        }
        description={t('articles.description')}
        title={t('articles.title')}
      />
      <div className='flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center'>
        <div
          className='flex flex-wrap gap-2'
          role='group'
          aria-label={t('articles.filter')}
        >
          {(['all', 'published', 'draft', 'archived'] as const).map((value) => (
            <Button
              key={value}
              variant={status === value ? 'secondary' : 'ghost'}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {t(`articles.${value}`)}
            </Button>
          ))}
        </div>
        <div className='relative sm:w-72'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='pl-9'
            value={search}
            maxLength={255}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('articles.search')}
            aria-label={t('articles.search')}
          />
        </div>
      </div>
      {loading ? (
        <p role='status' className='py-12 text-center text-muted-foreground'>
          {t('articles.loading')}
        </p>
      ) : error ? (
        <div
          role='alert'
          className='space-y-3 rounded-xl border p-8 text-center'
        >
          <p>{t('articles.loadError')}</p>
          <Button
            variant='outline'
            onClick={() => setRevision((value) => value + 1)}
          >
            {t('articles.retry')}
          </Button>
        </div>
      ) : result.data.length === 0 ? (
        <div className='space-y-3 rounded-xl border border-dashed py-16 text-center'>
          <FileText className='mx-auto size-8 text-muted-foreground' />
          <h2 className='font-semibold'>{t('articles.empty')}</h2>
          <p className='text-sm text-muted-foreground'>
            {t('articles.emptyHint')}
          </p>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {result.data.map((article) => (
            <article
              key={article.id}
              className='flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md'
            >
              <div className='mb-4 flex items-center justify-between gap-2'>
                <Badge
                  variant={
                    article.status === 'published' ? 'default' : 'secondary'
                  }
                >
                  {statusLabel(article.status)}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {date(article.updatedAt)}
                </span>
              </div>
              <button
                className='text-left font-heading text-lg font-semibold hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring'
                onClick={() => setPreview(article)}
              >
                {article.title}
              </button>
              <p className='mt-3 mb-6 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted-foreground'>
                {article.summary ||
                  article.content.slice(0, 140) ||
                  t('articles.noSummary')}
              </p>
              <div className='flex items-center justify-between border-t pt-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setPreview(article)}
                >
                  {t('articles.read')}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => openEditor(article)}
                  aria-label={`${t('articles.edit')} ${article.title}`}
                >
                  <Pencil className='size-4' />
                  {t('articles.edit')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && (
        <footer className='flex items-center justify-between gap-4 text-sm text-muted-foreground'>
          <span>{t('articles.total', { count: result.meta.total })}</span>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              disabled={page <= 1}
              aria-label={t('articles.previous')}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft className='size-4' />
            </Button>
            <span>
              {page} / {pages}
            </span>
            <Button
              variant='outline'
              size='icon'
              disabled={page >= pages}
              aria-label={t('articles.next')}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </footer>
      )}
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className='max-h-[85svh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              {preview?.summary || t('articles.preview')}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                <Badge variant='secondary'>{statusLabel(preview.status)}</Badge>
                {date(preview.updatedAt)}
              </div>
              <div className='whitespace-pre-wrap text-sm leading-relaxed'>
                {preview.content || t('articles.noContent')}
              </div>
              <Button
                className='justify-self-end'
                variant='outline'
                onClick={() => openEditor(preview)}
              >
                <Pencil className='size-4' />
                {t('articles.edit')}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={editor}
        onOpenChange={(open) => {
          if (!saving) setEditor(open);
        }}
      >
        <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('articles.edit') : t('articles.new')}
            </DialogTitle>
            <DialogDescription>{t('articles.editorHint')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void save(event)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='article-title'>{t('articles.fieldTitle')}</Label>
              <Input
                id='article-title'
                required
                maxLength={255}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='article-summary'>{t('articles.summary')}</Label>
              <Textarea
                id='article-summary'
                maxLength={2000}
                value={form.summary}
                onChange={(event) =>
                  setForm({ ...form, summary: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='article-content'>{t('articles.content')}</Label>
              <Textarea
                id='article-content'
                className='min-h-64'
                maxLength={100000}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label id='article-status-label'>{t('articles.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value) setForm({ ...form, status: value });
                }}
              >
                <SelectTrigger aria-labelledby='article-status-label'>
                  <SelectValue>{statusLabel(form.status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(['draft', 'published', 'archived'] as const).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {statusLabel(value)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            {saveError && (
              <p role='alert' className='text-sm text-destructive'>
                {t('articles.saveError')}
              </p>
            )}
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={saving}
                onClick={() => setEditor(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button type='submit' disabled={saving || !form.title.trim()}>
                {saving ? t('articles.saving') : t('actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
