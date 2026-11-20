# ComplexClockfield

**A field where structure changes the local clock. No pre-labeled particles.**

An interactive browser laboratory for the November 20, 2026 collision of PhiWorld, Clockfield, Mexican-hat symmetry breaking, vortices, rajapinta (interface), and the question: *can a localized field defect change how it responds to the next wave because of its previous encounters?*

The earlier PhiWorld visualized peaks in a **real** scalar field. Here the state is \(\Psi=u+iv\) with genuine phase winding, and the simulation detects + and − topological charges by phase integration around grid plaquettes.

## Start

**[Open the browser lab](https://anttiluode.github.io/ComplexClockfield/)** once GitHub Pages is enabled for this repository (Settings → Pages → Deploy from branch → main / root). No Python, GPU, webcam, or external JS dependencies.

To run locally:

\`\`\`bash
git clone https://github.com/anttiluode/ComplexClockfield.git
cd ComplexClockfield
python -m http.server 8000
\`\`\`

Open http://localhost:8000/ in a browser. ES modules generally require an HTTP server instead of \`file://\`.

To run Node 18+ invariant tests: \`node --test tests/engine.test.mjs\`.

## Explore a world

1. **Topology:** Start with a +1/−1 dipole, a single +1, a +2 candidate, four cores, or the uniform vacuum. These are initial conditions, not separate particle laws.
2. **Clockfield:** Compare uniform, structure-stamped, and structure-adaptive clocks. Stamped mode is the physically cleaner fixed-inertia control; live mode is explicitly phenomenological.
3. **See the field:** Switch between complex phase/amplitude, amplitude alone, local clock, and gradient energy. Small ring markers indicate *measured phase winding*, not bright spots.
4. **Disturb it:** A, B, C are equal-location momentum perturbations with different complex directions. Click the field for a pulse; Shift-click for B.
5. **Interrogate:** Press **Run matched controls** for the AB/BA + sham-subtracted probe comparison. Download the CSV.
6. **Falsify:** Press **Run invariant checks**; check vacuum force, winding, U(1) symmetry, clock change, energy drift, and the linear response null.

The most interesting results will be **negative controls and reproducible changes in scattering**—not the prettiest snapshots.

## Mathematical design

The engine uses the complex Mexican-hat potential

\[
V={\lambda\over4}(|\Psi|^2-1)^2.
\]

Field structure produces a local effective mass

\[
m(x)=1+\kappa_c|\nabla\Psi|^2,\quad
\Gamma(x)=1/\sqrt{m(x)}.
\]

A separate energy-derived nonlinear bond force controls propagation; the nine-point linear limit reduces square-grid artifacts. Optional bending and damping are exposed rather than hidden.

**Crucial caveat:** effective inertia is not literal gravitational time dilation, the vortices are not Q-balls, and a nonzero AB/BA difference does not on its own establish computation. **[Full mathematical contract and controls](THEORY.md).**

## Files

- \`index.html\`, \`style.css\`: self-contained lab UI
- \`app.mjs\`: rendering, diagnostics, interactive probes, AB/BA and controls
- \`engine.mjs\`: reusable complex-field finite-difference engine
- \`tests/engine.test.mjs\`: headless invariants and negative controls
- \`THEORY.md\`: equations, assumptions, and experimental kill conditions

## Research direction

The core question is whether **a persistent field structure with a distinguishable internal timescale** can mediate a history-dependent response to new information, and whether structure-derived clocks offer a measurable advantage over ordinary recurrent nonlinear dynamics.

The existing model is a numerical exploratory sandbox. It is **not** a new fundamental theory, a solved particle-stability result, or a photonic computer.

MIT License. Built with Antti's PhiWorld / Clockfield lineage.
