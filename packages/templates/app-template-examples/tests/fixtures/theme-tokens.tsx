import { Refine } from '@refinedev/core';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { Button } from '../../client/components/ui/button';
import { Input } from '../../client/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '../../client/components/ui/popover';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from '../../client/layouts/components/app-sidebar';
import { AppThemeProvider, ThemeSettings } from '../../client/theme';
import '../../client/styles.css';

// A server-free browser fixture using the real shell, primitives and theme provider.
// Run Vite and open /main/tests/fixtures/theme-tokens.html.
export default function Fixture() {
  return (
    <MemoryRouter>
      <AppThemeProvider>
        <Refine options={{ disableTelemetry: true }}>
          <AppSidebarProvider>
            <AppSidebar label='Fixture sidebar'>
              <div className='p-2'>
                <Input aria-label='Sidebar content' />
              </div>
            </AppSidebar>
            <main className='min-w-0 flex-1 space-y-6 overflow-y-auto p-6'>
              <div className='flex flex-wrap gap-2'>
                <ThemeSettings />
                <AppSidebarToggle />
              </div>
              <h1 className='text-3xl'>Theme tokens · 主题样式</h1>
              <p data-testid='body'>Body text · 中文内容与 English text</p>
              <p className='font-serif'>Serif text</p>
              <code>const theme = 'compact';</code>
              <div className='flex flex-wrap gap-2'>
                <Button>Default action</Button>
                <Button size='sm'>Small action</Button>
                <Button size='xs'>Extra small</Button>
                <Button variant='destructive'>Delete</Button>
              </div>
              <Input
                aria-label='Example input'
                placeholder='输入内容 / Enter text'
              />
              <Popover>
                <PopoverTrigger render={<Button variant='outline' />}>
                  Open popover
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverTitle>Portal heading</PopoverTitle>
                  <p>Portal body · 浮层内容</p>
                </PopoverContent>
              </Popover>
              <section className='rounded-xl border bg-card p-4 text-card-foreground shadow-md ring-1 ring-ring'>
                <h2 className='text-xl'>Card heading</h2>
                <p className='text-sm'>
                  A long description that wraps without clipping when fonts and
                  spacing change. 长文本应该正常换行，不应被控件裁切。
                </p>
              </section>
              <svg
                aria-label='Chart palette'
                viewBox='0 0 120 30'
                className='h-8'
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <rect
                    key={i}
                    x={(i - 1) * 24}
                    width='20'
                    height='30'
                    fill={`var(--chart-${i})`}
                  />
                ))}
              </svg>
              <div className='flex flex-wrap gap-2'>
                <div className='rounded-sm border p-2'>sm</div>
                <div className='rounded-md border p-2'>md</div>
                <div className='rounded-lg border p-2'>lg</div>
                <div className='rounded-xl border p-2'>xl</div>
                <div className='rounded-2xl border p-2'>2xl</div>
                <div className='rounded-3xl border p-2'>3xl</div>
                <div className='rounded-4xl border p-2'>4xl</div>
              </div>
              <div className='flex flex-wrap gap-4'>
                <div className='shadow-2xs p-2'>2xs</div>
                <div className='shadow-xs p-2'>xs</div>
                <div className='shadow-sm p-2'>sm</div>
                <div className='shadow-md p-2'>md</div>
                <div className='shadow-lg p-2'>lg</div>
                <div className='shadow-xl p-2'>xl</div>
                <div className='shadow-2xl p-2'>2xl</div>
              </div>
            </main>
          </AppSidebarProvider>
        </Refine>
      </AppThemeProvider>
    </MemoryRouter>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
import.meta.hot?.dispose(() => root.unmount());
