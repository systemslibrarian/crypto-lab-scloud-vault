import './style.css';
import { initTheme } from './theme';
import { renderExhibit1 } from './exhibits/exhibit1';
import { renderExhibit2 } from './exhibits/exhibit2';
import { renderExhibit3 } from './exhibits/exhibit3';
import { renderExhibit4 } from './exhibits/exhibit4';
import { renderExhibit5 } from './exhibits/exhibit5';
import { renderExhibit6 } from './exhibits/exhibit6';

// Initialize theme (reads from localStorage, already set by anti-flash script)
initTheme();

// Render all six exhibits
const exhibits: [string, string, (el: HTMLElement) => void][] = [
  ['1', 'The LWE Core', renderExhibit1],
  ['2', 'Ternary Secret Visualizer', renderExhibit2],
  ['3', 'BW₃₂ Lattice Coding Explainer', renderExhibit3],
  ['4', 'Key Generation', renderExhibit4],
  ['5', 'Encapsulation + Decapsulation + Tamper Detection', renderExhibit5],
  ['6', 'S-Cloud+ vs FrodoKEM vs ML-KEM', renderExhibit6],
];

const container = document.getElementById('exhibits')!;

for (const [num, title, render] of exhibits) {
  const exhibit = document.createElement('section');
  exhibit.className = 'exhibit';
  exhibit.id = `exhibit-${num}`;

  const header = document.createElement('div');
  header.className = 'exhibit-header';
  header.innerHTML = `
    <h3><span class="exhibit-number">${num}</span> ${title}</h3>
    <span class="toggle-icon">▼</span>
  `;

  const body = document.createElement('div');
  body.className = 'exhibit-body';

  exhibit.appendChild(header);
  exhibit.appendChild(body);
  container.appendChild(exhibit);

  // Collapse/expand toggle
  header.addEventListener('click', () => {
    const isCollapsed = body.style.display === 'none';
    body.style.display = isCollapsed ? '' : 'none';
    const icon = header.querySelector('.toggle-icon')!;
    icon.textContent = isCollapsed ? '▼' : '▶';
  });

  // Render exhibit content
  render(body);
}
