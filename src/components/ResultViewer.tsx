"use client";

import { useState, useMemo } from "react";

interface ResultViewerProps {
  result: any;
}

export default function ResultViewer({ result }: ResultViewerProps) {
  if (!result) return null;

  // Handle errors
  if (result.error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
        <h4 className="font-bold mb-1">Error</h4>
        <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(result.error, null, 2)}</pre>
      </div>
    );
  }

  // Find the primary list if it exists
  const listData = findPrimaryList(result);

  if (listData && listData.length > 0) {
    return <TableView data={listData} fullResult={result} />;
  }

  return <JSONView data={result} />;
}

/**
 * Heuristic to find the main list in a Google API response.
 * It looks for the first property that is an array.
 * If the input itself is an array, it returns it.
 */
function findPrimaryList(result: any): any[] | null {
  if (Array.isArray(result)) return result;
  if (typeof result !== "object" || result === null) return null;

  // Common Google API list keys
  const commonKeys = ["files", "messages", "items", "events", "threads", "labels", "replies", "comments"];
  for (const key of commonKeys) {
    if (Array.isArray(result[key])) return result[key];
  }

  // Fallback: first array found
  for (const key in result) {
    if (Array.isArray(result[key])) return result[key];
  }

  return null;
}

function TableView({ data, fullResult }: { data: any[], fullResult: any }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  // Extract headers from the first few items to be representative
  const headers = useMemo(() => {
    const keys = new Set<string>();
    data.slice(0, 10).forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => {
          if (typeof item[key] !== 'object' || item[key] === null) {
            keys.add(key);
          }
        });
      }
    });
    // If no keys found (e.g. array of primitives), show a "Value" column
    if (keys.size === 0) {
      return ["value"];
    }
    return Array.from(keys);
  }, [data]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = (a && typeof a === 'object') ? a[sortConfig.key] : a;
      const bVal = (b && typeof b === 'object') ? b[sortConfig.key] : b;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // ... rest of the component

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs rounded-md border ${viewMode === 'table' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            Table View
          </button>
          <button 
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 text-xs rounded-md border ${viewMode === 'json' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            Raw JSON
          </button>
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          Showing {data.length} items
        </span>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                {headers.map(header => (
                  <th 
                    key={header}
                    onClick={() => requestSort(header)}
                    className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      {sortConfig?.key === header && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sortedData.map((item, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                  {headers.map(header => {
                    const value = (item && typeof item === 'object') ? item[header] : (header === 'value' ? item : undefined);
                    return (
                      <td key={header} className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300 font-mono text-[13px]">
                        {renderCellValue(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <JSONView data={fullResult} />
      )}
    </div>
  );
}

function JSONView({ data }: { data: any }) {
  return (
    <div className="bg-zinc-900 text-zinc-100 p-6 rounded-xl overflow-x-auto border border-zinc-800 shadow-lg">
      <pre className="text-sm font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function renderCellValue(value: any) {
  if (value === null || value === undefined) return <span className="text-zinc-400 italic text-[10px]">null</span>;
  if (typeof value === 'boolean') return value ? "✅" : "❌";
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value}</a>;
    }
    return value;
  }
  if (typeof value === 'object') {
    return (
      <span className="text-zinc-500 text-[11px] font-mono block max-w-[200px] truncate" title={JSON.stringify(value)}>
        {JSON.stringify(value)}
      </span>
    );
  }
  return String(value);
}
