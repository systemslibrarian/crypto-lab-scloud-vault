import { aesGcmEncrypt, aesGcmDecrypt, randomBytes } from '../crypto/utils';

export function renderLiveEncryptionView(container: HTMLElement): void {
  container.innerHTML = `
    <div class="live-encrypt-panel">
      <h3>Live Vault Encryption View</h3>
      <div class="live-encrypt-row">
        <label for="le-plaintext">Vault Plaintext</label>
        <input id="le-plaintext" type="text" maxlength="128" placeholder="Enter text to encrypt" autocomplete="off" />
      </div>
      <div class="live-encrypt-row">
        <label for="le-password">Password</label>
        <input id="le-password" type="password" maxlength="64" placeholder="Password (for key derivation)" autocomplete="new-password" />
      </div>
      <div class="live-encrypt-row">
        <button class="btn" id="le-encrypt-btn">Encrypt</button>
      </div>
      <div class="live-encrypt-row">
        <label for="le-ciphertext">Encrypted Payload (Ciphertext)</label>
        <textarea id="le-ciphertext" readonly rows="3" placeholder="Ciphertext will appear here"></textarea>
        <button class="btn btn-secondary" id="le-copy-btn">Copy Ciphertext</button>
      </div>
      <div class="live-encrypt-hint">This key never leaves your device. Encrypted payload is what would be stored remotely. Losing your password results in permanent data loss.</div>
    </div>
  `;

  const plaintextInput = container.querySelector('#le-plaintext') as HTMLInputElement;
  const passwordInput = container.querySelector('#le-password') as HTMLInputElement;
  const encryptBtn = container.querySelector('#le-encrypt-btn') as HTMLButtonElement;
  const ciphertextArea = container.querySelector('#le-ciphertext') as HTMLTextAreaElement;
  const copyBtn = container.querySelector('#le-copy-btn') as HTMLButtonElement;


  async function encrypt() {
    const pt = plaintextInput.value;
    const pw = passwordInput.value;
    if (!pt) {
      plaintextInput.classList.add('input-error');
      ciphertextArea.value = 'Enter plaintext.';
      return;
    } else {
      plaintextInput.classList.remove('input-error');
    }
    if (!pw) {
      passwordInput.classList.add('input-error');
      ciphertextArea.value = 'Enter password.';
      return;
    } else {
      passwordInput.classList.remove('input-error');
    }
    // Simple key derivation: SHA-256 hash (for demo only)
    const key = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    const iv = randomBytes(12);
    const ct = await aesGcmEncrypt(new TextEncoder().encode(pt), key, iv);
    const out = new Uint8Array([...iv, ...new Uint8Array(ct)]);
    ciphertextArea.value = btoa(String.fromCharCode(...out));
  }

  encryptBtn.addEventListener('click', encrypt);
  plaintextInput.addEventListener('input', () => { ciphertextArea.value = ''; });
  passwordInput.addEventListener('input', () => { ciphertextArea.value = ''; });
  copyBtn.addEventListener('click', () => {
    if (ciphertextArea.value) {
      navigator.clipboard.writeText(ciphertextArea.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Ciphertext'; }, 1200);
    }
  });
}
