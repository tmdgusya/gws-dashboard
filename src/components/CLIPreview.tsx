'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface CLIPreviewProps {
  parts: string[];
  params?: any;
  json?: any;
  flags?: string[];
  upload?: string;
  className?: string;
}

/**
 * CLIPreview Component: Displays the exact gws command constructed by the user's form inputs.
 * Follows the execution logic in api/cli/route.ts
 */
export default function CLIPreview({ parts, params, json, flags = [], upload, className = '' }: CLIPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Replicate the logic from api/cli/route.ts to construct the command string
  const constructCommand = () => {
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return '';
    }

    const commandParts = ['gws', ...parts];

    if (params && Object.keys(params).length > 0) {
      commandParts.push('--params', `'${JSON.stringify(params)}'`);
    }

    if (json && Object.keys(json).length > 0) {
      commandParts.push('--json', `'${JSON.stringify(json)}'`);
    }

    if (upload) {
      commandParts.push('--upload', upload);
    }

    if (flags && Array.isArray(flags) && flags.length > 0) {
      commandParts.push(...flags);
    }

    // Default to JSON format if not specified and not a schema call (following route.ts)
    if (!commandParts.includes('--format') && parts[0] !== 'schema') {
      commandParts.push('--format', 'json');
    }

    return commandParts.join(' ');
  };

  const commandString = constructCommand();

  const handleCopy = async () => {
    if (!commandString) return;
    try {
      await navigator.clipboard.writeText(commandString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  if (!commandString) return null;

  return (
    <div className={`rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
          <Terminal className="h-3.5 w-3.5" />
          <span>CLI Preview</span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-900"
          title="Copy command to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto whitespace-pre pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <code className="text-blue-400">
          <span className="text-zinc-100">gws</span>
          {' '}
          {parts.join(' ')}
          {params && Object.keys(params).length > 0 && (
            <>
              {' '}
              <span className="text-zinc-500">--params</span>
              {' '}
              <span className="text-green-400">'{JSON.stringify(params)}'</span>
            </>
          )}
          {json && Object.keys(json).length > 0 && (
            <>
              {' '}
              <span className="text-zinc-500">--json</span>
              {' '}
              <span className="text-green-400">'{JSON.stringify(json)}'</span>
            </>
          )}
          {upload && (
            <>
              {' '}
              <span className="text-zinc-500">--upload</span>
              {' '}
              <span className="text-blue-200">{upload}</span>
            </>
          )}
          {flags && flags.length > 0 && (
            <>
              {' '}
              <span className="text-zinc-500">{flags.join(' ')}</span>
            </>
          )}
          {!commandString.includes('--format') && parts[0] !== 'schema' && (
            <>
              {' '}
              <span className="text-zinc-500">--format</span>
              {' '}
              <span className="text-zinc-100">json</span>
            </>
          )}
        </code>
      </div>
    </div>
  );
}
