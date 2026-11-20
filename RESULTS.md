# First controlled result — 2026-11-20

This report records a **single deterministic 64×64 numerical sweep**, with no multiple seeds, no statistical uncertainty, and no empirical webcam data. The exact controls and timings are in `scripts/abba.mjs`; run `node scripts/abba.mjs --json` to reproduce.

All worlds receive A and B at the **same location** but with different complex-momentum directions, in reversed temporal order. After a blank period, each history is cloned. One copy receives C and the other receives nothing. The future difference caused by C, `R = probed - sham`, is measured in the right-hand region. Compare `R_AB` and `R_BA`; also report the state difference just before C.

Parameters: N=64, dt=0.11, lambda=0.23, damping=0.028, bending=0, nonlinear-gradient softness=0.15, graded clock strength=12, static effective mass; 72 warmup steps, 19 between A and B, 82 blank steps, 115 steps after probe C. For the linear vacuum, the nonlinear potential is replaced by the vacuum linearization and gradient softness is disabled. All probes match across history conditions.

| World | Clock | D_state | D_probe (absolute) | D_probe / probe RMS |
|---|---|---:|---:|---:|
| Linear vacuum | uniform | 0.030562 | 5.94e−16 | ~0 |
| Nonlinear vacuum | uniform | 0.057884 | 0.008224 | 0.3108 |
| +1/−1 vortex pair | uniform | 0.082412 | 0.013890 | 0.7042 |
| +1/−1 vortex pair | graded | 0.024237 | 0.002076 | 0.1847 |
| Four defects (+1,+1,−1,−1) | graded | 0.041464 | 0.008216 | 0.1610 |

## Interpretation

1. **Linear sham-subtracted null passes.** Raw AB and BA states differ, yet their response to the identical probe is equal to numerical precision. This is expected for a linear time-invariant system and prevents the trivial claim that any AB/BA state difference proves nonlinear memory.
2. **The nonlinear vacuum responds differently to C after AB versus BA.** This means a history-dependent probe response does **not** require topological defects.
3. **The vortex pair's normalized probe-response difference is larger without Clockfield than with the default graded clock.** No advantage of slower local clocks is established. A timing shift or different propagation time may explain part of the loss.
4. **The four-defect graded case is not a win over the uniform pair.** Comparisons with different initial topologies are not controlled tests of clock benefit.

## What would actually be interesting?

Sweep waiting intervals, compare the **same topology** with and without stamped clocks, and plot D_probe at **multiple readout times** instead of the single fixed readout here. A clock may delay a signal rather than erase it. Add repeated perturbation amplitudes and multiple defect positions; report mean, dispersion, and held-out probes before claiming a robust computational advantage.

Topological survival itself needs a separate assessment: winding counts over time, mesh convergence, damping sensitivity, and moving/pinned-boundary controls.

**Bottom line:** the engine can distinguish history-dependent nonlinear probe responses from linear superposition, but **the initial Clockfield benchmark is negative**. This is useful feedback about the actual mechanism.
