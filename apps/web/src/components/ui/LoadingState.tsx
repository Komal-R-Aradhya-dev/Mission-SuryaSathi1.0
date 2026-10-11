export function LoadingState({ label }: { label: string }) {
  return (
    <p role="status" className="mx-auto max-w-3xl py-16 text-sm text-ivory-dim">
      {label}…
    </p>
  );
}

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ivory">
      <p className="font-medium text-danger">{title}</p>
      <p className="mt-1 text-ivory-dim">{message}</p>
    </div>
  );
}
