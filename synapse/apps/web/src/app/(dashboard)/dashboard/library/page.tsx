export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">Browse and manage your knowledge cards.</p>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
        No cards yet. Start by capturing some content.
      </div>
    </div>
  );
}
