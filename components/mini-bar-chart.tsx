export function MiniBarChart({
  data,
}: {
  data: { label: string; value: number }[]
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex h-28 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-20 w-full items-end">
            <div
              className="w-full rounded-md bg-primary/80"
              style={{ height: `${Math.max((d.value / max) * 100, 6)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
