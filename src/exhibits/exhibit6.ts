/**
 * Exhibit 6: S-Cloud+ vs FrodoKEM vs ML-KEM Comparison Table
 * Three-column comparison with decision tree.
 */

export function renderExhibit6(container: HTMLElement): void {
  container.innerHTML = `
    <p>Side-by-side comparison of three lattice-based KEMs: S-Cloud+ (China),
       FrodoKEM (USA/EU), and ML-KEM (NIST standard, EU/USA).
       Each makes different design trade-offs in structure, secret distribution,
       and error correction.</p>

    <div class="table-scroll" role="region" aria-label="KEM comparison table" tabindex="0">
    <table class="comparison-table">
      <caption class="sr-only">Comparison of S-Cloud+, FrodoKEM, and ML-KEM</caption>
      <thead>
        <tr>
          <th>Property</th>
          <th class="highlight">S-Cloud+</th>
          <th>FrodoKEM</th>
          <th>ML-KEM</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Matrix structure</strong></td>
          <td>Unstructured (plain LWE)</td>
          <td>Unstructured (plain LWE)</td>
          <td>Module (ring/module LWE)</td>
        </tr>
        <tr>
          <td><strong>Secret distribution</strong></td>
          <td class="highlight">Ternary {-1,0,+1}, weight n/2</td>
          <td>Gaussian (χ distribution)</td>
          <td>Centered binomial</td>
        </tr>
        <tr>
          <td><strong>Error correction</strong></td>
          <td class="highlight">BW₃₂ (Barnes-Wall lattice)</td>
          <td>None</td>
          <td>None</td>
        </tr>
        <tr>
          <td><strong>Failure probability</strong></td>
          <td>< 2<sup>−128</sup> (with BW₃₂)</td>
          <td>< 2<sup>−128</sup></td>
          <td>< 2<sup>−139</sup></td>
        </tr>

        <!-- 128-bit security -->
        <tr><td colspan="4" style="background:var(--bg-card-alt);font-weight:700;text-align:center">128-bit Post-Quantum Security</td></tr>
        <tr>
          <td><strong>Parameter set</strong></td>
          <td>Scloud+-128</td>
          <td>FrodoKEM-640</td>
          <td>ML-KEM-512</td>
        </tr>
        <tr>
          <td><strong>pk size</strong></td>
          <td>~1,232 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>9,616 bytes</td>
          <td>800 bytes</td>
        </tr>
        <tr>
          <td><strong>ct size</strong></td>
          <td>~2,400 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>9,720 bytes</td>
          <td>768 bytes</td>
        </tr>
        <tr>
          <td><strong>ss size</strong></td>
          <td>32 bytes</td>
          <td>32 bytes</td>
          <td>32 bytes</td>
        </tr>

        <!-- 192-bit security -->
        <tr><td colspan="4" style="background:var(--bg-card-alt);font-weight:700;text-align:center">192-bit Post-Quantum Security</td></tr>
        <tr>
          <td><strong>Parameter set</strong></td>
          <td>Scloud+-192</td>
          <td>FrodoKEM-976</td>
          <td>ML-KEM-768</td>
        </tr>
        <tr>
          <td><strong>pk size</strong></td>
          <td>~1,952 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>15,632 bytes</td>
          <td>1,184 bytes</td>
        </tr>
        <tr>
          <td><strong>ct size</strong></td>
          <td>~3,840 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>15,744 bytes</td>
          <td>1,088 bytes</td>
        </tr>

        <!-- 256-bit security -->
        <tr><td colspan="4" style="background:var(--bg-card-alt);font-weight:700;text-align:center">256-bit Post-Quantum Security</td></tr>
        <tr>
          <td><strong>Parameter set</strong></td>
          <td>Scloud+-256</td>
          <td>FrodoKEM-1344</td>
          <td>ML-KEM-1024</td>
        </tr>
        <tr>
          <td><strong>pk size</strong></td>
          <td>~2,592 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>21,520 bytes</td>
          <td>1,568 bytes</td>
        </tr>
        <tr>
          <td><strong>ct size</strong></td>
          <td>~5,120 bytes <!-- TODO: verify ePrint 2024/1306 --></td>
          <td>21,632 bytes</td>
          <td>1,568 bytes</td>
        </tr>

        <!-- Meta -->
        <tr><td colspan="4" style="background:var(--bg-card-alt);font-weight:700;text-align:center">Context</td></tr>
        <tr>
          <td><strong>Origin</strong></td>
          <td>China (Tsinghua University / Huawei / SDIBC / PBC)</td>
          <td>USA / EU (Microsoft / CWI / NRC Canada)</td>
          <td>EU / USA (CRYSTALS team — CWI, IBM, NXP, ARM, etc.)</td>
        </tr>
        <tr>
          <td><strong>Standardization</strong></td>
          <td>ePrint 2024/1306 (proposal)</td>
          <td>NIST Round 4 candidate (alternate)</td>
          <td>NIST FIPS 203 (standard)</td>
        </tr>
        <tr>
          <td><strong>Key advantage</strong></td>
          <td class="highlight">Smaller than FrodoKEM via BW₃₂ error correction + ternary secrets</td>
          <td>Conservative (no algebraic structure to exploit)</td>
          <td>Smallest keys/ciphertexts (uses ring structure)</td>
        </tr>
      </tbody>
    </table>
    </div>

    <div class="decision-tree" role="region" aria-label="Decision tree for choosing a KEM">
      <div class="question">Which KEM should I use?</div>
      <div class="node">
        <div class="question">Need a NIST standard right now?</div>
        <div class="node">
          <span class="answer">→ ML-KEM (FIPS 203)</span> — smallest sizes, fastest, standardized.
          Ring structure is an algebraic assumption some consider riskier.
        </div>
      </div>
      <div class="node">
        <div class="question">Want maximum conservatism (no algebraic structure)?</div>
        <div class="node">
          <span class="answer">→ FrodoKEM</span> — plain LWE, no ring/module structure.
          Very large keys (~10-21 KB) are the trade-off.
        </div>
      </div>
      <div class="node">
        <div class="question">Want plain LWE but smaller than FrodoKEM?</div>
        <div class="node">
          <span class="answer">→ S-Cloud+</span> — BW₃₂ error correction + ternary secrets
          give significantly smaller parameters than FrodoKEM while keeping
          the conservative unstructured LWE foundation. Not yet standardized.
        </div>
      </div>
    </div>
  `;
}
