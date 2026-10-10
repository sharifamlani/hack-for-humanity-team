import { Flower } from "@/components/Shapes";

// The three promises at the bottom of the home page: privacy, sources, and the voter's choice.
export function TrustCards() {
  return (
    <section className="border-t border-foreground/20 pt-6 lg:col-span-2">
      <h2 className="display text-3xl lg:text-4xl">Clarity. Choice. Control.</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="card flex items-center justify-between gap-3 p-5">
          <div>
            <h3 className="display text-xl">Your privacy matters.</h3>
            <p className="mt-2 text-sm text-foreground/75">
              Your address is used once, to find your districts and polling place. We never store it.
            </p>
          </div>
          <svg viewBox="0 0 64 80" aria-hidden="true" className="h-20 w-16 shrink-0">
            <path d="M32 4 C46 26 58 38 58 52 A26 26 0 0 1 6 52 C6 38 18 26 32 4 Z" fill="var(--sun)" />
          </svg>
        </article>

        <article className="card flex items-center justify-between gap-3 p-5">
          <div>
            <h3 className="display text-xl">See the source.</h3>
            <p className="mt-2 text-sm text-foreground/75">
              Every position links to the candidate&apos;s own page or their recorded vote.
            </p>
          </div>
          <svg viewBox="0 0 80 72" aria-hidden="true" className="h-[4.5rem] w-20 shrink-0">
            <path d="M40 68 C12 48 4 34 4 22 A18 18 0 0 1 40 16 A18 18 0 0 1 76 22 C76 34 68 48 40 68 Z" fill="var(--accent)" />
          </svg>
        </article>

        <article className="card flex items-center justify-between gap-3 p-5">
          <div>
            <h3 className="display text-xl">Your choice stays yours.</h3>
            <p className="mt-2 text-sm text-foreground/75">
              We show a match and its evidence. It is a starting point, never an endorsement.
            </p>
          </div>
          <Flower className="h-20 w-20 shrink-0 text-sky" />
        </article>
      </div>
    </section>
  );
}
