import type { ReactElement } from 'react';

import { LongText, LongTextPreview } from '#components/long-text';

const DESCRIPTION = `Northwind Foods is a condiment maker with about 900 employees and some 2,000 distributors. The current distributor management system is a patchwork the regional teams maintain by hand, and every month-end rebate settlement takes a week of spreadsheets.
The pilot started with two regions in March. The distributor portal, order approvals and the monthly rebate settlement moved first; inventory and promotions follow once the group IT review signs off.
The open question is the group's own low-code platform, which IT would rather standardize on before the rest of the rollout.`;

const INTRODUCTION = `Founded in 1998 as a family sauce workshop, Northwind grew into one of the region's larger condiment groups. Its brands cover soy sauce, oyster sauce and compound seasonings, sold through supermarkets, restaurant supply and an expanding online channel.`;

const ADDRESS = `Unit 1001, Harbor Point
18 Riverside Avenue
Eastport 40210`;

/** A record's page: the description and a comment where there is room, the particulars in a narrow column beside them. */
export function LongTextDemo(): ReactElement {
  return (
    <div className='flex flex-wrap gap-6 p-6 text-sm'>
      <div className='min-w-0 flex-1 basis-96 space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold'>Northwind Foods</h1>
          <LongText>{DESCRIPTION}</LongText>
        </div>
        <div className='space-y-1.5 rounded-xl border bg-card p-4'>
          <div className='font-medium'>Grace Hopper</div>
          <LongText lines={3}>
            The group IT team confirmed the review is scheduled for next week.
            They want the portal and approvals demonstrated on their own staging
            environment first, with single sign-on through the group directory,
            and asked for the data retention settings in writing before the
            meeting.
          </LongText>
        </div>
      </div>
      <dl className='w-64 shrink-0 space-y-3 rounded-xl border bg-card p-4'>
        <div className='space-y-1'>
          <dt className='text-xs text-muted-foreground'>Introduction</dt>
          <dd>
            <LongTextPreview label='Introduction'>
              {INTRODUCTION}
            </LongTextPreview>
          </dd>
        </div>
        <div className='space-y-1'>
          <dt className='text-xs text-muted-foreground'>Address</dt>
          <dd>
            <LongTextPreview label='Address'>{ADDRESS}</LongTextPreview>
          </dd>
        </div>
        <div className='space-y-1'>
          <dt className='text-xs text-muted-foreground'>Note</dt>
          <dd>
            <LongTextPreview label='Note'>
              Key account since 2021.
            </LongTextPreview>
          </dd>
        </div>
      </dl>
    </div>
  );
}
