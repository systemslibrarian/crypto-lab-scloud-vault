/**
 * Exhibit: Is the conservative bet crazy?
 * A balanced ANALYSIS (not just citations) of why choosing unstructured LWE —
 * as Scloud+ and FrodoKEM do — is a rational, mainstream position, while being
 * honest that it is a trade-off and that ML-KEM's structured bet is also sound.
 */

export function renderWhyUnstructured(container: HTMLElement): void {
  container.innerHTML = `
    <p>It's tempting to read "China built a bigger, slower scheme and skipped the math everyone else
       uses" as odd. It isn't. The choice between <strong>structured</strong> and
       <strong>unstructured</strong> lattices is a genuine, unresolved trade-off that serious
       cryptographers — and national agencies — actively disagree about. Here's the real reasoning.</p>

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

    <div class="callout why">
      <span class="callout-title">So who's right?</span>
      Both bets are defensible — they price <em>risk</em> and <em>time horizon</em> differently.
      If you need a fast, standardized scheme now and trust years of scrutiny, ML-KEM is the rational
      pick. If you're protecting secrets that must survive decades and unknown future math, paying for
      the most conservative assumption (Scloud+ / FrodoKEM) is equally rational. Many real deployments
      hedge by running <strong>both at once</strong> in a hybrid — which is exactly what the Scloud+
      IETF draft proposes (ECDHE + Scloud+ together).
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
