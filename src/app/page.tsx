export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center bg-white dark:bg-black">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl mb-6">
          Google Workspace CLI Dashboard
        </h2>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400 mb-10">
          Interact with any Google Workspace API via the <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 font-mono text-zinc-900 dark:text-zinc-50">gws</code> command. 
          Dynamic discovery, form building, and result visualization.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-2">Service Explorer</h3>
            <p className="text-sm text-zinc-500">Browse hierarchy from Services to Methods dynamically.</p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-2">Form Builder</h3>
            <p className="text-sm text-zinc-500">Auto-generated forms based on real API schemas.</p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-2">Local Execution</h3>
            <p className="text-sm text-zinc-500">Run commands locally using your authenticated session.</p>
          </div>
        </div>
        
        <div className="mt-12 text-zinc-500 dark:text-zinc-500 text-sm">
          Select a service from the sidebar to get started.
        </div>
      </div>
    </div>
  );
}
