'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  Brain,
  Network,
  MessageSquare,
  GraduationCap,
  Settings,
  Upload,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/library', label: 'Library', icon: Library },
  { href: '/dashboard/capture', label: 'Capture', icon: Upload },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/graph', label: 'Knowledge Graph', icon: Network },
  { href: '/dashboard/review', label: 'Review', icon: GraduationCap },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard/quiz', label: 'Quiz', icon: Brain },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {isOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-sidebar-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">Synapse</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <Brain className="h-6 w-6 text-sidebar-primary" />
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                !isOpen && 'justify-center px-2'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
