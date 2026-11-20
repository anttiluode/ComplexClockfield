# Mathematical contract: what ComplexClockfield actually simulates

This is an **engineered, discretized complex scalar field**, not a validated model of fundamental particles, the Higgs field, real photonic slowing, spacetime curvature, or quantum gravity. Its purpose is to ask whether localized winding defects and structure-dependent *effective inertia* can support testable dynamical memory.

## 1. Field and vacuum

The dynamical variable on a finite 2D square grid is \(\Psi=u+iv=\rho e^{i\theta}\). The Mexican-hat potential is

\[
V(\Psi)={\lambda\over4} (|\Psi|^2-1)^2,\qquad
F_V=-\lambda(|\Psi|^2-1)\Psi.
\]

The vacuum manifold is the circle \(|\Psi|=1\). A winding defect has integer charge

\[
n={1\over 2\pi}\oint d\theta.
\]

On the grid, winding is **measured**, not assigned: sum wrapped phase differences along plaquettes. A +1 and −1 pair carries zero net winding. The UI charge-2 preset deliberately places **two nearby +1 vortices** rather than one mathematically singular +2 core: a single-cell phase sampling cannot resolve a 4π winding and can create spurious detected charges. This is a resolved charge-2 *cluster*, not evidence that a single n=2 core has split.

The original phiworld2.py instead had a *real* scalar field with \(V'(\phi)=-a\phi+b\phi^3\). Its red markers were local maxima of \(|\phi|\), not verified vortices.

## 2. Structural clock versus nonlinear propagation

We deliberately separate two mechanisms that early Clockfield sketches often blended:

**Local effective mass (Clockfield):**
\[
g_i^2=\left|\frac{\Psi_{i+\hat x}-\Psi_{i-\hat x}}2\right|^2+
       \left|\frac{\Psi_{i+\hat y}-\Psi_{i-\hat y}}2\right|^2,\quad
m_i=\min(100,1+\kappa_c g_i^2),\quad
\Gamma_i=m_i^{-1/2}.
\]

Canonical momentum \(p=m\dot\Psi\) evolves according to
\[
\dot\Psi_i=p_i/m_i,\qquad \dot p_i=F_i-\eta p_i.
\]
For a locally harmonic uncoupled mode, frequency falls as \(1/\sqrt m\). This is **effective inertia and oscillator timescale**, not time dilation of the physical clock or a change to the speed of light. "Stamped" fixes \(m\) from the initial field. "Live" recalculates it every third step and **is not Hamiltonian**; energy may change because the inertia itself changes without compensating terms.

**Nonlinear pairwise propagation:** each lattice edge \(i-j\), length squared \(d_{ij}^2\), has strain \(s_{ij}=|\Psi_j-\Psi_i|^2/d_{ij}^2\) and coefficient
\[
c_e(s)=c_{\rm floor}+
{1-c_{\rm floor}\over\sqrt{1+\kappa_g s}}.
\]
Each end feels equal and opposite forces \(F_i\mathrel{+}=w_{ij}c_e(s)(\Psi_j-\Psi_i)\). Axial edges use weight \(2/3\); diagonal edges \(1/6\). The linear limit is the standard more isotropic nine-point Laplacian.

Unlike a coefficient \(1/(1+\kappa_gs)\), the chosen square-root form keeps the magnitude of the bond force monotonic in bond extension, avoiding a negative tangent stiffness at high gradient. The chosen bond force derives from
\[
E_{ij}=w_{ij}\left[{c_{\rm floor}\over2}|\delta\Psi|^2+
{(1-c_{\rm floor})d_{ij}^2\over\kappa_g}
\left(\sqrt{1+\kappa_gs_{ij}}-1\right)\right].
\]
For \(\kappa_g=0\) use the smooth limit \(E_{ij}=w_{ij}|\delta\Psi|^2/2\).
Thus the **static mass, zero damping, zero biharmonic** case has a well-defined discrete Hamiltonian energy (apart from expected integration error). This is stricter than multiplying a pointwise Laplacian by an arbitrary spatial coefficient.

The optional bending term \(-\gamma\Delta_9^2\Psi\) discourages short-wavelength variations. The finite-boundary discrete treatment is approximate; **do not infer exact energy conservation with gamma nonzero**. A biharmonic term alone does not prove Skyrme stabilization, a stationary particle, or a bound vortex molecule.

Time stepping uses velocity Verlet in canonical momentum, with pinned Dirichlet boundary fields. Fixed boundaries are not a free or periodic infinite universe. Solitons, stability, and phase offsets must be tested across boundary conditions, mesh resolutions and box sizes.

## 3. What is not being claimed

- Ordinary Mexican-hat vortices are **not** Coleman Q-balls. Standard Q-balls require different self-interactions and appropriate unbroken-vacuum conditions. The ansatz \(\Psi=f(r)e^{i(n\theta-\omega t)}\) does not make every solution a Q-ball.
- +1 and −1 have opposite **topological winding**, but in the parity-symmetric model they are mirror partners; we do not insert a chiral term that promises opposite scattering deflections.
- Local gradient wells do not guarantee bound rays or a gravitational analogue. A slower oscillator is not automatically a waveguide.
- The phase color wheel is an illustration of an actual *complex field variable*, not an optical phase measured by a webcam.
- A localized defect is only an emergent **candidate** object. For a stable particle-like entity, require lifetime, localization, reproducible response, grid convergence, and controlled energy exchange.

## 4. AB–BA: counterfactual readout

Two histories are delivered on the same initial field with the same two kicks and the same interval:
\[
AB=A \to B,\qquad BA=B\to A.
\]
After a blank period, fork each world. One fork receives probe C; the other receives no probe (sham). Let
\[
R_{AB}=\Psi_{AB+C}-\Psi_{AB+\varnothing},\quad
R_{BA}=\Psi_{BA+C}-\Psi_{BA+\varnothing},
\]
where both differences are measured at an identical future time. Report \(D_{\rm probe}=\|R_{AB}-R_{BA}\|\) in the right-side region of interest, and compare it to the RMS probe response. Separately report \(D_{\rm state}=\|\Psi_{AB}-\Psi_{BA}\|\) before C.

The **linear uniform vacuum control** should produce nearly zero \(D_{\rm probe}\), even though \(D_{\rm state}\) can be nonzero. Nonlinear systems may produce history-dependent probe responses without being useful computers. To establish an advantage, demand many seeds, held-out probe patterns, equal computational resources, and comparisons with uniform-clock nonlinear controls.

The browser's first-pass benchmark is intentionally deterministic, small (64×64), and preliminary. It does **not** provide statistical significance or a ready-made claim of memory.

## 5. Suggested follow-up falsification

1. Test individual +1, −1, +2 seeds at 64, 128, 256 grids with rescaled physical extent and initial width; record lifetimes and total winding.
2. Measure pulse scattering versus the *mirror-transformed* ±1 controls, not just a colorful left/right deflection.
3. Test energy drift and U(1) charge in zero-damping, static-clock, gamma=0 worlds.
4. Run AB/BA across at least 20 deterministic phase offsets, random position jitters, wait durations, and probe frequencies; hold out some seeds.
5. Ablate the Clockfield, the gradient-dependent propagation law, and the defects separately.
6. Do **not** call an unstable ring a particle or a measurable time-dilation effect until the simpler explanations are ruled out.

## References and lineage

- Source: Antti's `phiworld2.py` / early Clockfield project (real scalar, expanding fronts, local maxima).
- S. Coleman, *Q-balls*, Nuclear Physics B **262** (1985), 263–283.
- M. S. Volkov and E. Wöhnert, *Spinning Q-balls*, Physical Review D **66**, 085003 (2002), https://doi.org/10.1103/PhysRevD.66.085003 — a different, nonrenormalizable interaction.
- Classic global-vortex / topological-defect mathematics; no assertion that this model matches fundamental Standard Model gauge dynamics.
