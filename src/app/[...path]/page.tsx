"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import FormBuilder from "@/components/FormBuilder";
import CLIPreview from "@/components/CLIPreview";
import ResultViewer from "@/components/ResultViewer";
import { useState } from "react";

export default function MethodPage() {
  const params = useParams();
  const parts = (params.path as string[]) || [];
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [formData, setFormData] = useState({ params: {}, json: {}, file: null as File | null });
  const [pageAll, setPageAll] = useState(false);
  const [pageLimit, setPageLimit] = useState<number | "">("");

  const getFlags = () => {
    const flags: string[] = [];
    if (pageAll) flags.push("--page-all");
    if (pageLimit !== "" && pageLimit !== undefined) {
      flags.push("--page-limit", pageLimit.toString());
    }
    return flags;
  };

  const handleExecute = async (formParams: any, formJson: any) => {
    setExecuting(true);
    setResult(null);
    try {
      let body: any;
      let headers: Record<string, string> = {};

      if (formData.file) {
        body = new FormData();
        body.append("parts", JSON.stringify(parts));
        body.append("params", JSON.stringify(formParams));
        body.append("json", JSON.stringify(formJson));
        body.append("flags", JSON.stringify(getFlags()));
        body.append("file", formData.file);
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ 
          parts, 
          params: formParams, 
          json: formJson,
          flags: getFlags()
        });
      }

      const res = await fetch("/api/cli", {
        method: "POST",
        headers,
        body,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Execution failed");
      }

      const contentType = res.headers.get("Content-Type");
      if (contentType?.includes("application/x-ndjson")) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Failed to get reader from response body");
        
        const decoder = new TextDecoder();
        let buffer = "";
        const results: any[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                results.push(JSON.parse(line));
              } catch (e) {
                console.error("Failed to parse NDJSON line:", line, e);
              }
            }
          }
          // Update result as we get more data for "live" feel
          setResult([...results]);
        }
        
        if (buffer.trim()) {
          try {
            results.push(JSON.parse(buffer));
            setResult([...results]);
          } catch (e) {
            console.error("Failed to parse final NDJSON buffer:", buffer, e);
          }
        }
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch (error: any) {
      console.error("Execution failed", error);
      setResult({ error: error.message || "Execution failed" });
    } finally {
      setExecuting(false);
    }
  };

  const handleFormChange = (params: any, json: any, file?: File | null) => {
    setFormData({ params, json, file: file || null });
  };

  if (!parts || parts.length === 0) return <div>Invalid method path</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>&gt;</span>
          {parts.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              <Link 
                href={`/${parts.slice(0, i + 1).join("/")}`}
                className="hover:text-blue-600 transition-colors"
              >
                {part}
              </Link>
              {i < parts.length - 1 && <span>&gt;</span>}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{parts[parts.length - 1]}</h1>
      </header>

      <div className="grid grid-cols-1 gap-12">
        <CLIPreview 
          parts={parts} 
          params={formData.params} 
          json={formData.json} 
          flags={getFlags()}
          upload={formData.file?.name}
          className="shadow-md"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <section className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {parts.length >= 2 ? (
              <FormBuilder parts={parts} onExecute={handleExecute} onFormChange={handleFormChange} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">Service: {parts[0]}</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Select a resource or method from the sidebar to continue.</p>
              </div>
            )}
          </section>

          <section className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 sticky top-8">
            <h3 className="text-lg font-semibold mb-4">Global Options</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="page-all" 
                  checked={pageAll}
                  onChange={(e) => setPageAll(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="page-all" className="text-sm font-medium">Page All</label>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="page-limit" className="text-sm font-medium">Page Limit</label>
                <input 
                  type="number" 
                  id="page-limit" 
                  value={pageLimit}
                  onChange={(e) => setPageLimit(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Unlimited"
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-zinc-500">Maximum number of results to fetch when paging.</p>
              </div>
            </div>
          </section>
        </div>

        {executing && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-zinc-600">Executing command...</span>
          </div>
        )}

        {result && (
          <section className="animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold mb-4">Response</h3>
            <ResultViewer result={result} />
          </section>
        )}
      </div>
    </div>
  );
}
