# What makes a thing? — An operational field-identity experiment

**Live chapter:** [Open the question and let the world answer](https://anttiluode.github.io/ComplexClockfield/identity.html).

> What is a thing, if not a pattern that manages to remain itself while the world changes around it?

A phrase is not a measurement. This chapter turns that philosophical intuition into **three distinct, falsifiable properties**, with explicit negative controls:

1. **Survival**: a structure remains detectably topological after an external wave changes its surrounding field.
2. **Conditional response**: a future probe causes a different response depending on earlier AB versus BA inputs, **after sham subtraction**.
3. **Causal location**: swapping local field state between histories changes future responses; compare the same surgery in a nonlinear vacuum, and check whether it accidentally changes topology.

An invariant may survive without memory, and a nonlinear vacuum may have memory-like responses without a localized particle. We therefore refuse to equate these criteria.

## Test 1: survival is not visual similarity

The complex scalar field \(\Psi = u+iv\) has \(|\Psi|\approx 1\) as a vacuum and a phase \(\theta=\arg\Psi\). Its local topological winding is measured by summing wrapped phase differences around each elementary plaquette:

\[
q = \frac{1}{2\pi}\sum_{\text{four edges}}\operatorname{wrap}(\Delta\theta).
\]

The experiment starts with a +1 vortex (other initial conditions are selectable). We clone its state into a **sham** field. One clone receives a localized complex-momentum impulse; the other receives none. Both fields then evolve with the same parameters and boundary conditions.

We report four distinct observables: total winding before/after, nearest same-sign defect present after the event, displacement relative to the initial marker, and RMS distance between the perturbed and sham full fields.

**Default single-run observation** (56×56 lattice, 220 ticks, default structural clock, pulse strength 0.34):

- Total winding: **+1 → +1**
- Same-sign core: **still detectable**
- Approximate core displacement: **2 lattice cells**
- Full-field RMS difference from sham: **0.12268**

This demonstrates a **detectable topological feature persisting under this bounded challenge**, not independent existence of a free stable particle. The boundary phase is pinned and therefore constrains total charge. "Nearest same-sign" is a tracker, not a conserved personal identity.

## Test 2: history must influence a *counterfactual response*

A and B are distinct, equal-strength, orthogonal complex-momentum pulses at the same location. A→B and B→A are followed by an identical blank interval. Fork each history into a probed C future and a sham future.

\[
R_{AB}(t)=\Psi_{AB+C}(t)-\Psi_{AB+\varnothing}(t),\qquad
R_{BA}(t)=\Psi_{BA+C}(t)-\Psi_{BA+\varnothing}(t).
\]

We measure

\[
D(t)=\operatorname{RMS}(R_{AB}(t)-R_{BA}(t)),
\]

over near-core and far-field observation regions, **at many times**, not at one arbitrary ending frame. The normalized summary is the ratio of integrated squared response difference to integrated squared probe amplitude, square-rooted. It is not bounded to 1.

**Default single-run observation** (56×56; 55 warmup, 18 step A/B gap, 70 blank, 144 probe steps, sampled every 8; fixed Clockfield, \(\kappa=12\)):

| World | Near-core integrated relative history response | Far-field |
|---|---:|---:|
| Linear vacuum | ~0 | ~0 |
| Nonlinear vacuum | **1.3049** | 0.2026 |
| +1 vortex, uniform clock | 0.3879 | 0.2451 |
| +1 vortex, structure-graded clock | 0.2967 | 0.0716 |

### First answer: a negative result

The linear control's probe response does not depend on the AB/BA history (numerical error only), although its raw states differ. That verifies the causal calculation is genuinely nonlinear.

The **nonlinear vacuum produced the largest normalized near-core history response** under this chosen protocol. There is **no evidence here that the vortex improves this measure of memory**, and the graded Clockfield did not outperform the uniform-clock vortex.

This is not proof that vortices cannot store memory. The readout, wave timing, wait interval, clock coupling, pulse shape, damping, and region all matter. It is proof that we cannot take a nonzero AB/BA curve alone as particle-specific memory.

## Test 3: put the inner world on trial

For AB and BA we construct artificial hybrid fields:

\[
H_1 = \underbrace{BA_{\rm core}}_{\text{donor}} + \underbrace{AB_{\rm exterior}}_{\text{recipient}},\quad
H_2 = AB_{\rm core} + BA_{\rm exterior}.
\]

Here the "+" is **not a linear sum of fields**. It means smoothly blending two full states inside a tapered disk. Both \(\Psi\) and its canonical momenta \(p\) are transplanted. In the default structural-clock mode the static inertia pattern is the same in both histories.

Each hybrid is probed with C and compared with its own sham future, exactly as before. We measure the RMS response-distance from **both** original histories integrated over readout time in the central region.

A hybrid is "donor-like" if its future incremental response is closer to the donor's response than the recipient's. Both a vortex world and a **nonlinear vacuum with an identical central transplant** are measured.

**Default single-run observation** (56×56, 70-step blank, 120 probe steps, radius 17% of grid):

| World | AB exterior, BA core | BA exterior, AB core |
|---|---|---|
| Nonlinear vacuum | Donor-like | Donor-like |
| +1 vortex | Donor-like | Donor-like |

The surgery preserved observed topological counts in these default conditions and an identity self-transplant is an exact no-op. Nevertheless, the nonlinear vacuum produced the same donor-like classification. So even if center-state exchange changes future behavior, we **cannot attribute the effect uniquely to a vortex or hidden core identity**.

Moreover, center-state transplantation is **not a physical process** obeying the field evolution equation. The blend can excite transients and cannot establish where information was stored exclusively. It is a deliberately artificial causal intervention.

## What the field answers *today*

There is a hierarchy, not a yes/no answer:

- **Invariant:** detectable winding survives the tested wave.
- **Observer:** a sham-subtracted probe measures genuine nonlinear history dependence, but the *vacuum* already has it.
- **Location:** an imposed core-region swap can shift response fingerprints; the *vacuum* already shows this too.
- **Missing discovery:** a robust, defect-specific, clock-dependent information-processing or memory advantage has **not** been established.

> A thing might be an organized constraint on what can happen next. In this numerical world, we can detect an invariant; we have not proved that it is an independent remembering individual.

This is the intellectually honest reason for the current experiment.

## Reproduction

Open [the interactive chapter](https://anttiluode.github.io/ComplexClockfield/identity.html), or from the repo:

```bash
node scripts/identity.mjs
node scripts/identity.mjs --json --output=identity-receipt.json
node scripts/identity.mjs --fast
npm test
```

The browser controls allow pulse strength, winding arrangement, structural clock strength, blank interval, transplant radius, and time-resolved response plots.

The default conditions are deterministic and have no fitted parameters or independent repetitions. Every reported number must be understood as **one simulation run**. A future study should sweep initial positions, phases, observation times, boundary conditions, grid resolution and energy-matched pulse amplitudes; otherwise claims of stable particles or computational superiority would be premature.

## Relevant research (analogies and methods, not validation)

- J. C. Neu, *Vortices in complex scalar fields*, Physica D 43 (1990), 385–406. Available via [University of Maryland course PDF](https://www.physics.umd.edu/courses/Phys798C/AnlageSpring24/Nue_vortices_in_complex_fields.pdf). Winding is the central topological observable.
- *Theory of Neuromorphic Computing by Waves: Machine Learning by Rogue Waves, Dispersive Shocks, and Solitons*, Physical Review Letters 125, 093901 (2020), https://doi.org/10.1103/PhysRevLett.125.093901. Nonlinear-wave reservoirs are established research; our numerical experiment does not reproduce its hardware or results.
- *Detecting defect dynamics in relativistic field theories far from equilibrium using topological data analysis*, Physical Review D 109, 056011 (2024), https://doi.org/10.1103/PhysRevD.109.056011. Defect characterization is challenging and should be separated from merely observing wave patterns.
