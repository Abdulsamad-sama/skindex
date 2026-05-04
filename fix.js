const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');
css = css.replace(/--color-sk-/g, '--color-');
css = css.replace(/--sk-/g, '--');
css = css.replace(/bg-sk-/g, 'bg-');
css = css.replace(/text-sk-/g, 'text-');
const fontsReplacement = `--font-manrope: "Manrope", sans-serif;
  --font-inter: "Inter", sans-serif;

  --font-h3: var(--font-manrope);
  --font-label-caps: var(--font-inter);
  --font-h1: var(--font-manrope);
  --font-body-md: var(--font-manrope);
  --font-body-lg: var(--font-manrope);
  --font-h2: var(--font-manrope);
  --font-display: var(--font-manrope);`;
css = css.replace(/--font-manrope: "Manrope", sans-serif;[\s\n]*--font-inter: "Inter", sans-serif;/, fontsReplacement);
fs.writeFileSync('app/globals.css', css);
