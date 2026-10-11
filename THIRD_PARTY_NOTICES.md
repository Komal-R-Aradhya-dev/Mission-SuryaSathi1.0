# Third-party notices

SuryaSathi scene geometry, copy, palette, and interface are original. Kage / ThreeUI source, artwork, fonts, and generated images were not copied. The Kage repository states that no licence is granted for reuse of its original code or artwork. The ThreeUI prompt was used only as a creative brief for chapter structure, camera movement, and atmosphere.

## Packages

| Package | Version recorded in apps/web/package.json | Licence |
| --- | --- | --- |
| next | 16.4.0 | MIT |
| react, react-dom | 19.3.0 | MIT |
| three | ^0.186.1 | MIT |
| @react-three/fiber | ^9.8.1 (resolved 9.8.1) | MIT |
| @react-three/drei | ^10.7.9 | MIT |
| tailwindcss | ^4 | MIT |

Confirm exact resolved versions with `npm ls` in `apps/web`. Keep each package’s own licence file in `node_modules`.

## Fonts

- Geist and Geist Mono, loaded with `next/font` from the Next.js scaffold. SIL Open Font License. Provider: Vercel.
- Fraunces, loaded with `next/font/google`. SIL Open Font License. Designer: Undercase Type / The League of Moveable Type.

No Kage font files are included. If Google Fonts cannot load, the stack falls back to Georgia and Segoe UI.

## Not included

- No downloaded textures, HDRIs, or generated photographs.
- No subsidy amounts. `data/policy/pm-surya-ghar-central-cfa.json` is an empty, not-retrieved snapshot.
- GSAP, Lenis, and Spline are not installed. Scroll is native so the page cannot lock the wheel.
