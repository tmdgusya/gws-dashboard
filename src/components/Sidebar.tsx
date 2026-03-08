'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  FileText, 
  Mail, 
  Calendar, 
  Settings, 
  FileBox, 
  Database, 
  Users, 
  MessageSquare, 
  ClipboardList, 
  Presentation,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Boxes,
  Terminal
} from 'lucide-react';

const SERVICE_ICONS: Record<string, any> = {
  drive: FileBox,
  gmail: Mail,
  calendar: Calendar,
  sheets: Database,
  docs: FileText,
  slides: Presentation,
  tasks: ClipboardList,
  people: Users,
  chat: MessageSquare,
  'admin-reports': Settings,
  reports: Settings,
  classroom: CheckCircle2,
};

export default function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const [services, setServices] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [children, setChildren] = useState<Record<string, { resources: any[]; methods: any[] }>>({});

  useEffect(() => {
    fetch('/api/discovery')
      .then(res => res.json())
      .then(data => setServices(data.services || []));
  }, []);

  // Auto-expand based on pathname
  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const newExpanded = { ...expanded };
      let path = '';
      parts.forEach((part, i) => {
        path = path ? `${path}.${part}` : part;
        if (!newExpanded[path]) {
          newExpanded[path] = true;
          // Trigger fetch for children if not already there
          if (!children[path]) {
            fetch(`/api/discovery?path=${path}`)
              .then(res => res.json())
              .then(data => setChildren(prev => ({ ...prev, [path]: data })));
          }
        }
      });
      setExpanded(newExpanded);
    }
  }, [pathname, services]);

  const toggleExpand = async (id: string, path: string[]) => {
    const key = path.join('.');
    if (!expanded[key]) {
      // Fetch children if not already fetched
      if (!children[key]) {
        const res = await fetch(`/api/discovery?path=${key}`);
        const data = await res.json();
        setChildren(prev => ({ ...prev, [key]: data }));
      }
    }
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pathParts = pathname.split('/').filter(Boolean);

  const renderChildren = (parts: string[], level: number) => {
    const key = parts.join('.');
    const data = children[key];
    if (!data) return null;

    return (
      <div className="ml-4 border-l border-zinc-100 dark:border-zinc-900 mt-1 pl-2 space-y-1">
        {data.resources.map(res => {
          const resParts = [...parts, res.id];
          const isExpanded = expanded[resParts.join('.')];
          const isActive = pathname.startsWith('/' + resParts.join('/'));
          
          return (
            <div key={res.id}>
              <div className="flex items-center group">
                <button 
                  onClick={() => toggleExpand(res.id, resParts)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <Link
                  href={`/${resParts.join('/')}`}
                  className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${isActive ? 'bg-zinc-100 text-black font-semibold' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
                >
                  {res.id}
                </Link>
              </div>
              {isExpanded && renderChildren(resParts, level + 1)}
            </div>
          );
        })}
        {data.methods.map(method => {
          const methodParts = [...parts, method.id];
          const isActive = pathname === '/' + methodParts.join('/');
          
          return (
            <Link
              key={method.id}
              href={`/${methodParts.join('/')}`}
              className={`flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors ml-5 ${isActive ? 'bg-zinc-100 text-black font-semibold' : 'text-zinc-500 hover:bg-zinc-50 hover:text-black'}`}
            >
              <Terminal className="h-3 w-3" />
              {method.id}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black h-screen overflow-y-auto shrink-0">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
        <Link href="/" className="text-xl font-bold tracking-tight">GWS-UI</Link>
      </div>
      
      <nav className="space-y-1">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
          <Boxes className="h-3 w-3" />
          Services
        </p>
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.id] || HelpCircle;
          const isExpanded = expanded[service.id];
          const isActive = pathname.startsWith('/' + service.id);

          return (
            <div key={service.id}>
              <div className="flex items-center group">
                <button 
                  onClick={() => toggleExpand(service.id, [service.id])}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <Link
                  href={`/${service.id}`}
                  className={`flex-1 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-zinc-100 text-black' : 'text-zinc-700 hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                  {service.name}
                </Link>
              </div>
              {isExpanded && renderChildren([service.id], 1)}
            </div>
          );
        })}
      </nav>
      
      <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-900">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Status
        </p>
        <div className="px-2 py-1.5 flex items-center gap-2 text-xs text-green-600 dark:text-green-500">
          <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500 animate-pulse"></div>
          CLI Authenticated
        </div>
      </div>
    </aside>
  );
}
