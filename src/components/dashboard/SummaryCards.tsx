'use client';

import { Mail, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

interface SummaryCardsProps {
  unreadCount?: number;
  eventCount?: number;
  fileCount?: number;
}

export default function SummaryCards({ unreadCount = 0, eventCount = 0, fileCount = 0 }: SummaryCardsProps) {
  const cards = [
    {
      href: '/gmail',
      icon: Mail,
      label: 'Unread Emails',
      count: unreadCount,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400',
      countColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      href: '/calendar',
      icon: Calendar,
      label: "Today's Events",
      count: eventCount,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-950',
      iconColor: 'text-green-600 dark:text-green-400',
      countColor: 'text-green-700 dark:text-green-300'
    },
    {
      href: '/drive',
      icon: FileText,
      label: 'Recent Files',
      count: fileCount,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400',
      countColor: 'text-purple-700 dark:text-purple-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className={`${card.bgColor} rounded-2xl p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl bg-white dark:bg-zinc-900 ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {card.label}
              </span>
            </div>
            <div className={`text-3xl font-bold ${card.countColor}`}>
              {card.count}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
