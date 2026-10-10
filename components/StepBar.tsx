export const STEPS = ["Address", "Ballot", "Interview", "Match", "Go vote"] as const;

export function StepBar({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav aria-label="Progress" className="flex items-center gap-3">
      <ol className="flex flex-1 items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-label={`Step ${i + 1}: ${label}`}
              aria-current={i === step ? "step" : undefined}
              className={`h-4 w-4 rounded-full border-2 border-foreground transition ${
                i <= step ? "bg-accent" : "bg-card"
              }`}
            />
            {i < STEPS.length - 1 && (
              <span
                className={`h-0.5 flex-1 ${
                  i < step ? "bg-foreground" : "bg-foreground/20"
                }`}
              />
            )}
          </li>
        ))}
      </ol>
      <span className="text-sm font-semibold tabular-nums">
        {step + 1} of {STEPS.length} · {STEPS[step]}
      </span>
    </nav>
  );
}
