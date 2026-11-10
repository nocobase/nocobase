import { useContext, type ReactElement } from 'react';
import { Link } from 'react-router';
import { ModuleLayoutHost, type ModuleLayoutProps } from './layout-context.js';
export function ModuleLayout(props: ModuleLayoutProps): ReactElement {
  const render = useContext(ModuleLayoutHost);
  if (render) return render(props);
  return (
    <section className='flex min-w-0 flex-col gap-4'>
      <nav className='flex flex-wrap gap-3'>
        {props.navigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className='inline-flex items-center gap-2 text-sm text-foreground'
          >
            <item.icon className='size-4' />
            {item.title}
          </Link>
        ))}
      </nav>
      {props.children}
    </section>
  );
}
