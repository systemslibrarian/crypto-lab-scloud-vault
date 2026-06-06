/**
 * Staged progress UI for the (synchronous) crypto operations.
 *
 * The KEM runs on the main thread, so to show real step-by-step feedback we
 * mark a stage "active", yield once so the browser paints it, THEN run that
 * stage's (possibly blocking) work, then mark it done. Each stage therefore
 * reflects a genuine step of the algorithm — not a fake animation.
 */

export interface StageDef { id: string; label: string; }

export interface StageController {
  /** Mark a stage active and yield so it paints before heavy work runs. */
  active(id: string): Promise<void>;
  /** Mark the final active stage done. */
  finish(): void;
}

const paint = (): Promise<void> =>
  new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));

export function mountStages(host: HTMLElement, defs: StageDef[]): StageController {
  host.innerHTML = `<ul class="stage-list">${defs.map(d =>
    `<li class="stage-item" data-id="${d.id}"><span class="dot"></span>${d.label}</li>`).join('')}</ul>`;
  const items = new Map<string, HTMLElement>(
    defs.map(d => [d.id, host.querySelector(`[data-id="${d.id}"]`) as HTMLElement]));
  let prev: HTMLElement | null = null;

  const markDone = (el: HTMLElement | null): void => {
    if (!el) return;
    el.classList.remove('active');
    el.classList.add('done');
    el.querySelector('.dot')!.textContent = '✓';
  };

  return {
    async active(id: string): Promise<void> {
      markDone(prev);
      const el = items.get(id);
      if (el) { el.classList.add('active'); prev = el; }
      await paint();
    },
    finish(): void { markDone(prev); },
  };
}

/** Convenience: run synchronous steps with staged feedback, return their results. */
export async function runStages<T>(
  host: HTMLElement,
  steps: Array<{ id: string; label: string; run: () => void }>,
): Promise<void> {
  const ctrl = mountStages(host, steps.map(s => ({ id: s.id, label: s.label })));
  for (const s of steps) { await ctrl.active(s.id); s.run(); }
  ctrl.finish();
  await new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));
}
void runStages;
