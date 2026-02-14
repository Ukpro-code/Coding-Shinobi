export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Synapse. Your knowledge hub.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Cards</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Due for Review</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Current Streak</h3>
          <p className="mt-2 text-3xl font-bold">0 days</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Level</h3>
          <p className="mt-2 text-3xl font-bold">1</p>
        </div>
      </div>
    </div>
  );
}
