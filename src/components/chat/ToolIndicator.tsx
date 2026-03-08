'use client';

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Tool {
  name: string;
  status: 'loading' | 'success' | 'error';
  message?: string;
}

interface ToolIndicatorProps {
  tools: Tool[];
}

export default function ToolIndicator({ tools }: ToolIndicatorProps) {
  if (tools.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 py-2">
      {tools.map((tool, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-xs text-zinc-500"
        >
          {tool.status === 'loading' && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {tool.status === 'success' && (
            <CheckCircle className="w-3 h-3 text-green-500" />
          )}
          {tool.status === 'error' && (
            <AlertCircle className="w-3 h-3 text-red-500" />
          )}
          <span>
            {tool.name}
            {tool.message && ` - ${tool.message}`}
          </span>
        </div>
      ))}
    </div>
  );
}
