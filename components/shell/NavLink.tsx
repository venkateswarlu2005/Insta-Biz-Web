'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawIcon } from '@/components/icons';

export function NavLink({ href, label, className, onNavigate }: { href: string; label: string; className?: string; onNavigate?: () => void }) {
  const path = usePathname();
  const active = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} data-active={active} className={className} onNavigate={onNavigate}>
      <span>{label}</span>
      <PawIcon className="tp-nav-link__paw" />
    </Link>
  );
}
