"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Parameter {
  type: "string" | "integer" | "boolean";
  description: string;
  required?: boolean;
  enum?: string[];
  default?: string;
}

interface Schema {
  description: string;
  parameters?: Record<string, Parameter>;
  requestBody?: {
    schema: {
      properties: Record<string, any>;
    };
  };
}

export default function FormBuilder({ 
  parts, 
  onExecute,
  onFormChange
}: { 
  parts: string[], 
  onExecute: (params: any, json: any, file?: File | null) => void,
  onFormChange?: (params: any, json: any) => void
}) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [json, setJson] = useState<Record<string, any>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (onFormChange) {
      (onFormChange as any)(params, json, file);
    }
  }, [params, json, file, onFormChange]);

  const supportsUpload = useMemo(() => {
    if (!schema?.description) return false;
    const desc = schema.description.toLowerCase();
    return desc.includes("supports an /upload uri") || 
           desc.includes("upload media") ||
           desc.includes("upload file data");
  }, [schema]);

  useEffect(() => {
    async function fetchSchema() {
      if (parts.length === 0) return;
      
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cli", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parts: ["schema", parts.join(".")] }),
        });
        
        if (!res.ok) throw new Error("Failed to fetch schema");
        
        const data = await res.json();
        setSchema(data);
        // Reset state
        setParams({});
        setJson({});
        setFile(null);
      } catch (err: any) {
        console.error("Failed to fetch schema", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSchema();
  }, [parts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecute(params, json, file);
  };

  const handleParamChange = (name: string, value: any, type: string) => {
    let val = value;
    if (type === "integer") {
      val = value === "" ? undefined : parseInt(value);
    } else if (type === "boolean") {
      val = value;
    }
    
    setParams(prev => {
      const next = { ...prev, [name]: val };
      if (val === undefined || val === "") delete next[name];
      return next;
    });
  };

  const handleJsonChange = (name: string, value: any) => {
    setJson(prev => {
      const next = { ...prev, [name]: value };
      if (value === undefined || value === "") delete next[name];
      return next;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
      Error loading schema: {error}
    </div>
  );
  
  if (!schema) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">Description</h3>
        <p className="text-sm leading-relaxed">{schema.description}</p>
      </div>

      {supportsUpload && (
        <section className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Media Upload</h3>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Supports Upload</span>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Local File to Upload</label>
            <input 
              type="file" 
              className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-zinc-200"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-zinc-500 mt-1">This file will be uploaded to the server and passed as the <code className="font-mono text-blue-600 bg-blue-50 px-1 rounded">--upload</code> parameter.</p>
          </div>
        </section>
      )}

      {schema.parameters && Object.keys(schema.parameters).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Query Parameters</h3>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">URL Query</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(schema.parameters).map(([name, param]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  {name}
                  {param.required && <span className="text-red-500">*</span>}
                  {param.type && (
                    <span className="text-[10px] text-zinc-400 font-mono">({param.type})</span>
                  )}
                </label>
                
                {param.enum ? (
                  <select 
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleParamChange(name, e.target.value, param.type)}
                    value={params[name] || ""}
                  >
                    <option value="">Select...</option>
                    {param.enum.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : param.type === "boolean" ? (
                  <div className="flex items-center gap-2 py-2">
                    <input 
                      type="checkbox"
                      id={`param-${name}`}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => handleParamChange(name, e.target.checked, param.type)}
                      checked={params[name] || false}
                    />
                    <label htmlFor={`param-${name}`} className="text-sm text-zinc-600 dark:text-zinc-400">
                      Enable {name}
                    </label>
                  </div>
                ) : (
                  <input 
                    type={param.type === "integer" ? "number" : "text"}
                    placeholder={param.default ? `Default: ${param.default}` : ""}
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleParamChange(name, e.target.value, param.type)}
                    value={params[name] || ""}
                  />
                )}
                <p className="text-xs text-zinc-500 line-clamp-2 hover:line-clamp-none cursor-default transition-all">
                  {param.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {schema.requestBody?.schema?.properties && (
         <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Request Body</h3>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">JSON Body</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {Object.entries(schema.requestBody.schema.properties).map(([name, prop]) => {
               // Skip "Output only" fields if possible, or just mark them
               const isOutputOnly = prop.description?.toLowerCase().includes("output only");
               
               return (
                 <div key={name} className={`flex flex-col gap-1.5 ${isOutputOnly ? "opacity-50" : ""}`}>
                   <label className="text-sm font-medium">
                     {name}
                     {isOutputOnly && <span className="ml-2 text-[10px] uppercase text-zinc-400 font-bold">Read Only</span>}
                     {prop.type && (
                       <span className="ml-1 text-[10px] text-zinc-400 font-mono">({prop.type})</span>
                     )}
                   </label>

                   {prop.type === "boolean" ? (
                     <div className="flex items-center gap-2 py-2">
                       <input 
                         type="checkbox"
                         id={`body-${name}`}
                         disabled={isOutputOnly}
                         className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                         onChange={(e) => handleJsonChange(name, e.target.checked)}
                         checked={json[name] || false}
                       />
                       <label htmlFor={`body-${name}`} className="text-sm text-zinc-600 dark:text-zinc-400">
                         {name}
                       </label>
                     </div>
                   ) : (
                     <input 
                        type={prop.type === "integer" ? "number" : "text"}
                        disabled={isOutputOnly}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                        onChange={(e) => {
                          let val: any = e.target.value;
                          if (prop.type === "integer") val = val === "" ? undefined : parseInt(val);
                          handleJsonChange(name, val);
                        }}
                        value={json[name] || ""}
                     />
                   )}
                   <p className="text-xs text-zinc-500 line-clamp-2 hover:line-clamp-none">
                     {prop.description}
                   </p>
                 </div>
               );
             })}
          </div>
         </section>
      )}

      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Execute Command
        </button>
      </div>
    </form>
  );
}
