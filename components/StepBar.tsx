export const STEPS = ["Address", "Ballot", "Priorities", "Compare", "Voting plan"] as const;

export function StepBar({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav aria-label="Progress" className="w-full max-w-md">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 flex-col gap-2 last:flex-none">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  aria-label={`Step ${i + 1}: ${label}`}
                  aria-current={current ? "step" : undefined}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-background ${
                    done ? "bg-accent" : current ? "bg-coral" : "border-2 border-foreground/70"
                  }`}
                >
                  {done ? "✓" : ""}
                </button>
                {i < STEPS.length - 1 && (
                  <span className={`h-0.5 flex-1 ${done ? "bg-accent" : "bg-foreground/25"}`} />
                )}
              </div>
              <span
                className={`whitespace-nowrap text-xs ${
                  current ? "font-bold" : "hidden text-foreground/70 sm:block"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
