export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl mb-4">
          GWS Workspace Hub
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Your personal productivity dashboard for Gmail, Drive, and Calendar.
        </p>
        <p className="text-sm text-zinc-500">
          Dashboard loading...
        </p>
      </div>
    </div>
  );
}
