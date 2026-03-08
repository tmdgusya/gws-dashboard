'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Mail, FolderOpen, Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/theme';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gmail', label: 'Gmail', icon: Mail },
  { href: '/drive', label: 'Drive', icon: FolderOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-3 py-2 text-lg font-bold text-blue-600"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              G
            </div>
            <span className="hidden sm:inline">GWS Hub</span>
          </Link>
          
          <div className="flex items-center ml-4">
            {navItems.slice(1).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${active 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' 
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
