/**
 * Exhibit: The Big Picture (Plain English)
 * A beginner-friendly, no-math introduction. Explains what a KEM is, why
 * post-quantum matters, the "safe" analogy for structured vs unstructured
 * lattices, a plain-English comparison, and an honest Q&A.
 */

export function renderBigPicture(container: HTMLElement): void {
  container.innerHTML = `
    <p><strong>New to this? Start here.</strong> This page lets you play with
       <em>Scloud+</em>, a new post-quantum encryption scheme from China. Before the
       math, here is the whole idea in plain language.</p>

    <div class="callout">
      <span class="callout-title">What is a KEM?</span>
      A <strong>Key Encapsulation Mechanism</strong> is a way for two people to agree on a
      shared secret key over an open channel, so they can then encrypt messages to each other.
      Think of it as a secure "handshake" that produces a shared password only the two of them know.
    </div>

    <div class="callout warn">
      <span class="callout-title">Why "post-quantum"?</span>
      Today's handshakes (like RSA and elliptic curves) will be <strong>broken by a large quantum
      computer</strong> running Shor's algorithm. Post-quantum schemes are built on math problems
      that quantum computers are <em>not</em> known to break. Scloud+ and NIST's ML-KEM are both
      in this category — they are based on the hardness of <strong>lattice</strong> problems.
    </div>

    <h4>The "safe" analogy</h4>
    <p>Think of a post-quantum scheme as building a safe that even a future quantum computer can't crack.
       There are two design philosophies:</p>
    <div class="analogy">
      <div class="analogy-card">
        <span class="tag">NIST — ML-KEM / Kyber</span>
        <h4>🔒 Compact &amp; fast safe</h4>
        <p>Built with clever mathematical shortcuts (<strong>structured</strong> lattices). Small,
           quick, practical — and studied by thousands of researchers for years.</p>
      </div>
      <div class="analogy-card">
        <span class="tag">China — Scloud+</span>
        <h4>🏦 Bigger, more conservative safe</h4>
        <p>Avoids the shortcuts because some cryptographers worry they <em>might</em> hide
           undiscovered weaknesses. Uses plainer math (<strong>unstructured</strong> lattices)
           plus clever error-correcting codes to stay reasonably efficient.</p>
      </div>
    </div>
    <div class="callout">
      In one line: <strong>Scloud+ is China's attempt to make the "safe but slow" approach (like
      FrodoKEM) actually usable</strong>, while deliberately avoiding the structured-lattice
      shortcut that NIST chose.
    </div>

    <h4>The differences in plain English</h4>
    <div class="table-scroll" role="region" aria-label="Plain-English comparison" tabindex="0">
    <table class="comparison-table">
      <thead>
        <tr><th>Aspect</th><th>NIST (ML-KEM / Kyber)</th><th class="highlight">Scloud+ (China)</th><th>What it means</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Math foundation</strong></td>
          <td>Structured lattices (Module-LWE)</td>
          <td>Unstructured LWE (no rings/modules)</td>
          <td>Scloud+ avoids algebraic structure that some attacks might exploit</td>
        </tr>
        <tr>
          <td><strong>Secret values</strong></td>
          <td>Binomial distribution</td>
          <td>Ternary (−1, 0, +1), fixed weight</td>
          <td>Scloud+ uses simpler values that are easier to control</td>
        </tr>
        <tr>
          <td><strong>Error correction</strong></td>
          <td>None (plain rounding)</td>
          <td>BW₃₂ Barnes-Wall lattice codes</td>
          <td>Scloud+ uses advanced codes to shrink its sizes</td>
        </tr>
        <tr>
          <td><strong>Efficiency</strong></td>
          <td>Excellent (small, fast)</td>
          <td>Better than FrodoKEM, worse than ML-KEM</td>
          <td>More practical than old conservative designs, still bigger than NIST's</td>
        </tr>
        <tr>
          <td><strong>Security philosophy</strong></td>
          <td>"Good enough after massive review"</td>
          <td>"More conservative = safer long-term"</td>
          <td>Different bets about where future risk lies</td>
        </tr>
        <tr>
          <td><strong>Public scrutiny</strong></td>
          <td class="best">Extremely high (multi-year open competition)</td>
          <td>Low-to-moderate so far</td>
          <td>ML-KEM has been attacked &amp; studied by thousands of researchers</td>
        </tr>
      </tbody>
    </table>
    </div>

    <h4>What Scloud+ actually does (three ideas)</h4>
    <ol class="big-ideas">
      <li><strong>Unstructured LWE.</strong> It uses the most basic form of the Learning-With-Errors
          problem — no ring or module structure — so there are fewer algebraic angles for an
          attacker to exploit. This is the conservative choice.</li>
      <li><strong>Ternary secrets.</strong> Secrets are only −1, 0, or +1 (with exactly half the
          entries non-zero). Small values keep the noise under control and let the parameters shrink.</li>
      <li><strong>BW₃₂ lattice coding.</strong> The clever part: a 32-dimensional Barnes-Wall code
          for error correction. Better correction than FrodoKEM's plain rounding means the public
          key and ciphertext can be made smaller than earlier unstructured schemes.</li>
    </ol>
    <p style="color:var(--text-muted)">Each of these has its own interactive exhibit below — open
       them to see the real computation.</p>

    <h4>An honest comparison</h4>
    <div class="qa">
      <div class="qa-item">
        <div class="qa-q">Is Scloud+ more secure than ML-KEM?</div>
        <div class="qa-a">Not necessarily. Its design is more conservative, but it has received
          <em>far</em> less public analysis. ML-KEM survived years of intense, open scrutiny.</div>
      </div>
      <div class="qa-item">
        <div class="qa-q">Is Scloud+ more efficient than previous conservative designs?</div>
        <div class="qa-a">Yes — noticeably better than FrodoKEM (smaller keys, faster).</div>
      </div>
      <div class="qa-item">
        <div class="qa-q">Is it as efficient as ML-KEM?</div>
        <div class="qa-a">No. ML-KEM is still significantly smaller and faster thanks to its
          structure.</div>
      </div>
      <div class="qa-item">
        <div class="qa-q">Should we trust it for real production use right now?</div>
        <div class="qa-a">Most cryptographers would say "not yet" — simply because it hasn't been
          studied enough by the global community. That is normal for a new algorithm, not a red flag.
          See the <strong>Transparency &amp; Review</strong> section below.</div>
      </div>
      <div class="qa-item">
        <div class="qa-q">Is it interesting for learning?</div>
        <div class="qa-a">Very — it's a clean illustration of the trade-off between
          <em>conservative security assumptions</em> and <em>practical efficiency</em>.</div>
      </div>
    </div>

    <div class="takeaway">
      <span class="callout-title">Bottom line</span>
      <p>NIST went for <strong>practical + heavily reviewed</strong>. Scloud+ goes for
         <strong>more conservative math + better efficiency than previous conservative designs</strong>.
         Neither is simply "better" — they are different bets, and that is exactly what makes the
         comparison worth understanding.</p>
    </div>
  `;
}
