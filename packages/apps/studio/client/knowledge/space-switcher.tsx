/**
 * The heading of Studio's knowledge page, at the top of the view's left pane and its full width, which switches between
 * the spaces: the system's knowledge here, and each project the viewer sees, whose knowledge is that project's
 * Knowledge tab. Its name is cut short only where the pane is too narrow for it, and then shown whole on hover.
 */
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
} from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function KnowledgeSpaceSwitcher(): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const navigate = useNavigate();
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  const nameRef = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);
  const title = t('knowledge.systemTitle');
  return (
    <h1 className='min-w-0 font-heading text-lg font-semibold'>
      <DropdownMenu>
        <Tooltip disabled={!clipped}>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    className='w-full justify-between text-lg font-semibold'
                    onPointerEnter={() => {
                      const span = nameRef.current;
                      setClipped(!!span && span.scrollWidth > span.clientWidth);
                    }}
                  />
                }
              />
            }
          >
            <span ref={nameRef} className='min-w-0 truncate'>
              {title}
            </span>
            <ChevronDownIcon
              data-icon='inline-end'
              className='text-muted-foreground'
            />
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align='start' className='w-64'>
          <DropdownMenuItem onClick={() => void navigate('/knowledge')}>
            <BookOpenIcon />
            <span className='flex-1 truncate'>
              {t('knowledge.systemTitle')}
            </span>
            <CheckIcon />
          </DropdownMenuItem>
          {(projects.data ?? []).length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('knowledge.switcher.projects')}
                </DropdownMenuLabel>
                {(projects.data ?? []).map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() =>
                      void navigate(
                        `/projects/${encodeURIComponent(project.id)}/knowledge`,
                      )
                    }
                  >
                    <FolderIcon />
                    <span className='truncate'>{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </h1>
  );
}
