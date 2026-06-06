/**
 * Exhibit: Is the conservative bet crazy?
 * A balanced ANALYSIS (not just citations) of why choosing unstructured LWE —
 * as Scloud+ and FrodoKEM do — is a rational, mainstream position, while being
 * honest that it is a trade-off and that ML-KEM's structured bet is also sound.
 */

export function renderWhyUnstructured(container: HTMLElement): void {
  container.innerHTML = `
    <p>The choice between <strong>structured</strong> and <strong>unstructured</strong> lattices is a
       genuine, unresolved trade-off that serious cryptographers — and national agencies — disagree
       about in good faith. This section lays out <em>both</em> sides as evenly as possible, including
       the real criticisms of each, so you can weigh them yourself. There is no consensus "winner."</p>

    <div class="callout">
      <span class="callout-title">The two bets in one sentence</span>
      <strong>ML-KEM</strong> bets that the extra algebraic structure it uses for speed and small size
      is safe. <strong>Scloud+ / FrodoKEM</strong> bet that, for secrets that must stay safe for
      decades, it's wiser to avoid that structure entirely — even at a cost in size and speed.
    </div>

    <h4>What the structure buys — and what it might cost</h4>
    <p>ML-KEM's matrix isn't fully random; it lives in a <em>ring / module</em> over a cyclotomic
       field. That regularity is why its keys are ~1 KB instead of ~10 KB. But "extra mathematical
       regularity" is exactly the kind of thing attackers look to exploit. The open question is
       whether that regularity also makes the underlying problem <em>easier to break</em>.</p>

    <div class="scrutiny-grid">
      <div class="scrutiny-card scloud">
        <h4>The case FOR caution (why China isn't crazy)</h4>
        <ul>
          <li><strong>There is a proven gap for ideal lattices.</strong> Quantum algorithms can find
              short vectors in <em>ideal</em> lattices of cyclotomic fields faster than in general
              lattices (Biasse–Song 2016; Cramer–Ducas–Peikert–Regev 2016;
              Cramer–Ducas–Wesolowski 2017, 2021; Ducas–Plançon–Wesolowski 2019). The gap is real and
              published.</li>
          <li><strong>Even Kyber's own team flagged this.</strong> "Is module-lattice reduction better
              than unstructured reduction?" is literally open question <em>Q8</em> in the Kyber NIST
              submission — and it was still being quantified in 2025 (Ducas–Engelberts–de Perthuis,
              "Predicting Module-Lattice Reduction"), which finds the field's discriminant measurably
              shifts the effective attack cost.</li>
          <li><strong>It's the mainstream conservative view, not a Chinese outlier.</strong> France's
              <strong>ANSSI</strong> and Germany's <strong>BSI</strong> both recommend conservative /
              unstructured assumptions for long-term confidentiality, and <strong>FrodoKEM</strong>
              (US/EU) makes the exact same bet. Scloud+ is in well-established company.</li>
          <li><strong>"Harvest now, decrypt later."</strong> Adversaries can record encrypted traffic
              today and decrypt it once quantum computers (or new math) arrive. For 30-year secrets,
              betting on the most durable assumption is simply prudent.</li>
        </ul>
      </div>
      <div class="scrutiny-card mlkem">
        <h4>The case it's NOT alarming (why ML-KEM is also fine)</h4>
        <ul>
          <li><strong>Nothing here breaks ML-KEM.</strong> The ideal-lattice results attack a
              <em>related but different</em> problem (Ideal-SVP at large approximation factors). They
              do <em>not</em> transfer to Ring-/Module-LWE, and ML-KEM remains unbroken after years of
              attack.</li>
          <li><strong>Recent results are reassuring, too.</strong> Scrutiny closes doors as well as
              opens them: a 2025 "cryptanalytic <em>no-go</em>" (Ducas–Loyer) shows one promising
              structural attack avenue (densest-sublattice reduction) actually underperforms standard
              BKZ — and the measured module-reduction advantage so far is modest, not a break.</li>
          <li><strong>Structure pays for itself.</strong> 10× smaller keys and far faster operations
              are what make post-quantum crypto deployable in TLS, phones, and smart cards today.</li>
          <li><strong>It survived the most scrutiny of any candidate.</strong> NIST judged the
              residual structural risk acceptable <em>after</em> the largest open cryptanalytic effort
              in the field's history.</li>
        </ul>
      </div>
    </div>

    <div class="callout">
      <span class="callout-title">A concrete historical example (it cuts both ways)</span>
      <strong>Overstretched NTRU.</strong> NTRU is a structured scheme. For a range of large moduli —
      the "overstretched" regime — researchers found its security drops sharply (Albrecht–Bai–Ducas
      2016; Kirchner–Fouque 2017), and Ducas–van Woerden (2021) pinned down the exact "fatigue point."
      <em>For caution:</em> structure really can hide regime-specific weaknesses. <em>For calm:</em>
      open analysis precisely characterized the boundary, and standard NTRU / ML-KEM don't sit in that
      dangerous regime. Same facts, two honest readings.
    </div>

    <div class="callout why">
      <span class="callout-title">So who's right?</span>
      Both bets are defensible — they price <em>risk</em> and <em>time horizon</em> differently.
      If you need a fast, standardized scheme now and trust years of scrutiny, ML-KEM is the rational
      pick. If you're protecting secrets that must survive decades and unknown future math, paying for
      the most conservative assumption (Scloud+ / FrodoKEM) is equally rational. Many real deployments
      hedge by running <strong>both at once</strong> in a hybrid — which is exactly what the Scloud+
      IETF draft proposes (ECDHE + Scloud+ together).
    </div>

    <h4>Being objective: what Scloud+ actually gives up</h4>
    <p>A fair picture has to state Scloud+'s downsides plainly — the conservative bet is not free:</p>
    <div class="callout warn">
      <span class="callout-title">Honest criticisms of Scloud+</span>
      <ul style="margin:0.25rem 0 0 1.2rem">
        <li><strong>Not standardized.</strong> It's a research paper plus an <em>individual</em> IETF
            draft with no formal standing — versus ML-KEM, a finalized federal standard.</li>
        <li><strong>Bigger and slower than ML-KEM.</strong> Keys/ciphertexts are several KB and many
            times larger; it's faster than FrodoKEM but nowhere near ML-KEM.</li>
        <li><strong>Mostly self-analyzed.</strong> The security analysis is strong but largely by the
            authors; independent third-party cryptanalysis is still thin.</li>
        <li><strong>Ternary secrets aren't a free lunch.</strong> Sparse/small secrets enable
            dedicated <em>hybrid</em> and meet-in-the-middle attacks (May 2021; Bi et al. 2022). In the
            paper's own Table 4 the hybrid attack yields the <em>lowest</em> security figure — which is
            exactly why Scloud+ fixes the Hamming weight at n/2 rather than going sparser.</li>
        <li><strong>Novel components need review.</strong> The BW₃₂ labeling/delabeling is new
            engineering; new code paths are where bugs and side channels hide.</li>
      </ul>
    </div>

    <div class="callout">
      <span class="callout-title">How confident can we even be in the numbers?</span>
      Concrete "bits of security" are <em>estimates</em>, not facts — and the estimates move. Claimed
      improvements to the dual attack against NIST candidates (Guo–Johansson 2021; MATZOV 2022) were
      later shown by Ducas–Pulles (CRYPTO 2023) to rest on an "Independence Heuristic" that gives
      <em>wrong</em> predictions, lattice attacks have been refined continuously for ~40 years
      (Albrecht–Ducas survey, 2021), and reduction tooling keeps getting faster (flatter 2023, BLASter
      2025). The honest takeaway applies to <strong>every</strong> lattice scheme,
      ML-KEM included: published security levels carry genuine uncertainty, which is why margins and
      ongoing scrutiny matter for all of them.
    </div>

    <div class="takeaway">
      <span class="callout-title">Bottom line for students</span>
      <p>"Conservative" is not the same as "paranoid," and "efficient" is not the same as "reckless."
        Scloud+'s design reflects a legitimate, published concern shared by Western agencies and the
        Kyber team's own open questions — it's just a different point on the security-vs-efficiency
        curve. The interesting lesson isn't "who won," it's <em>learning to reason about which
        assumption you're willing to bet your secrets on, and for how long.</em></p>
    </div>
  `;
}
