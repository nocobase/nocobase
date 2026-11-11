import {
  FlaskConical,
  ShieldAlert,
  Monitor,
  ClipboardCheck,
  Leaf,
  Package,
  Warehouse,
  Bot,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
const icons: Record<string, { icon: LucideIcon; tone: number }> = {
  reagents: { icon: FlaskConical, tone: 1 },
  chemicals: { icon: ShieldAlert, tone: 2 },
  devices: { icon: Monitor, tone: 3 },
  inspections: { icon: ClipboardCheck, tone: 4 },
  environment: { icon: Leaf, tone: 2 },
  assets: { icon: Package, tone: 1 },
  storage: { icon: Warehouse, tone: 5 },
  robots: { icon: Bot, tone: 3 },
};
export function AppIcon({ template }: { template: string }) {
  const { icon: Icon, tone } = icons[template] ?? { icon: LayoutGrid, tone: 3 };
  return (
    <span
      className='inline-flex size-9 shrink-0 items-center justify-center rounded-xl'
      style={{
        color: `var(--chart-${tone})`,
        background: `color-mix(in srgb,var(--chart-${tone}) 12%,transparent)`,
      }}
    >
      <Icon className='size-5' aria-hidden='true' />
    </span>
  );
}
