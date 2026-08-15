# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this project is

A browser-based **psychoacoustic stem upmixer**: load 4 audio stems (vocals,
bass, drums, other), and each is pushed through its own DSP chain — phase
alignment, transient shaping, adaptive EQ, harmonic enhancement, and
vector-based amplitude panning — before being summed to a master bus.

It is a **vanilla-JS single-page app**. There is no framework, no router, no
state library, no component system. `src/main.js` writes the entire UI as one
template literal into `#app` and wires DOM events straight to an `AudioEngine`
instance.

`package.json` names the project `psychoacoustic-upmixer`; the repo is named
`Upmix_Netlify`. Despite the name, **there is no `netlify.toml` or any other
deploy config in the repo** — deployment settings, if any, live in the Netlify
dashboard. Don't assume a build hook exists in-tree.

## Stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite 4 (`vite@^4.4.0`, resolves to 4.5.5) |
| Audio | Tone.js (`tone@^14.7.77`, resolves to 14.9.17) |
| Modules | Native ESM (`"type": "module"`) |
| Styling | Hand-written CSS, no preprocessor |
| Tests | **None** |
| Linter / formatter | **None** |
| CI | **None** (no `.github/`) |
| TypeScript | **Not used** — plain `.js` only |

There is also **no `.gitignore`**. After `npm install` or a build, `node_modules/`
and `dist/` show up as untracked. Always stage files explicitly (`git add
CLAUDE.md src/...`); never `git add -A` or `git add .` in this repo.

## Commands

```bash
npm install        # required — node_modules is not committed
npm run dev        # Vite dev server (default http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # serve the built dist/
```

`npm run build` currently succeeds (~250 kB JS, ~64 kB gzipped). Use it as the
only automated check available — there is no test or lint command to run, so
**a green build is the entire verification story**. Anything beyond that needs
manual verification in a browser with real audio.

## Directory layout

```
index.html                  Vite entry; loads /src/main.js as a module
src/
  main.js                   UI markup (template literal) + DOM event wiring
  style.css                 ORPHANED — not imported anywhere (see below)
  styles/
    index.css               @imports the other four, in cascade order
    base.css                body / global reset
    layout.css              .container .header .stems
    controls.css            .stem-control .control-group, range-input styling
    transport.css           .transport buttons, file-input wrapper
  audio/
    AudioEngine.js          Top-level orchestrator: stems, processors, master bus
    MidSideProcessor.js     MidSideEncoder + MidSideDecoder  (UNWIRED)
    Spatializer.js          M/S width & depth control        (UNWIRED)
    HaasEffect.js           Stereo delay widening            (UNWIRED)
    analysis/
      OnsetDetector.js      Spectral flux + HFC onset detection
      SpectralFlux.js       Half-wave-rectified spectral flux
    processors/
      PsychoacousticProcessor.js   Per-stem chain container
      PhaseAligner.js              Cross-correlation → Convolver
      TransientShaper.js           Onset-driven attack enhancement
      HarmonicEnhancer.js          Multiband sub-harmonic + exciter
      VBAP.js                      Vector-based amplitude panning
      spectral/
        AdaptiveEQ.js              5-band self-adapting EQ
        SpectralAnalyzer.js        Smoothed FFT wrapper
        EQBand.js                  Single peaking filter
        EQCurves.js                Per-band magnitude → gain functions
        constants.js               FREQUENCY_BANDS table
        utils.js                   smoothParameter, clamp
```

## Architecture

### Signal flow

```
File input → Tone.Player (per stem)
                │
                └─► PsychoacousticProcessor.input
                      PhaseAligner
                       → TransientShaper
                       → AdaptiveEQ
                       → HarmonicEnhancer
                       → VBAP
                    PsychoacousticProcessor.output
                          │
                          └─► AudioEngine.masterBus (Tone.Channel) → destination
```

`AudioEngine` keeps two parallel `Map`s keyed by stem name: `stems` (the
`Tone.Player`s) and `processors` (the `PsychoacousticProcessor`s). Adding a
stem means writing to both.

### The `input` / `output` convention — follow this

**Every** processor class in `src/audio/` exposes exactly two public audio
endpoints, both `Tone.Channel`:

```js
export class SomeProcessor {
  constructor() {
    this.input  = new Tone.Channel();
    this.output = new Tone.Channel();
    // ...internal nodes, wired input → ... → output
  }
}
```

Callers only ever touch `.input` and `.output`. This is what lets
`PsychoacousticProcessor` chain five heterogeneous modules with uniform
`a.output.connect(b.input)` calls. **A new processor must follow this shape**,
or it cannot be dropped into the chain.

`EQBand` is the deliberate exception: it wraps a single `Tone.Filter`, exposes
`.filter`, and implements `connect(dest)` returning `this` so bands can be
`reduce`-chained.

### Parameter plumbing

Parameters flow down through explicit `setParameters(params)` methods that
destructure with defaults — never through shared/global state:

```
main.js  slider 'input' event
  → AudioEngine.setStemParameters(name, {width, depth, haasDelay, level})
    → PsychoacousticProcessor.setParameters({harmonicAmount, subHarmonicAmount, azimuth, ...})
      → HarmonicEnhancer.setHarmonicAmount() / VBAP.setPosition() /
        TransientShaper.setParameters() / AdaptiveEQ.setParameters()
```

Match this pattern when adding a control: destructure with a default, and pass
a plain object down one level. Don't reach across layers.

### Analysis loops

Two modules run continuous `requestAnimationFrame` loops started from their
constructors:

- `AdaptiveEQ.startAdaptationLoop()` — re-reads the FFT and re-targets band gains
- `TransientShaper.processLoop()` — polls `OnsetDetector.detect()`

Neither loop is ever cancelled and neither class has a `dispose()`. Because
`AudioEngine.loadStem()` builds a fresh `PsychoacousticProcessor` per stem,
loading stems repeatedly accumulates orphaned rAF loops and Tone nodes. **If you
touch lifecycle code, add disposal rather than another leak.**

## Stem-name coupling (easy to break)

Three places hard-code the same four names and must stay in sync:

1. `src/main.js:12` — `['Vocals', 'Bass', 'Drums', 'Other']` builds the markup;
   element IDs come from `stem.toLowerCase()` (e.g. `#vocals-width`).
2. `src/main.js:70` — `['vocals', 'bass', 'drums', 'other']` attaches listeners.
3. `src/main.js:56` — the loaded stem's key is derived from the **filename**:
   `file.name.split('.')[0].toLowerCase()`.

So a user's file must literally be named `drums.wav` (etc.) for its sliders to
reach a processor. There is no mapping UI and no validation — a mismatch fails
silently. `AudioEngine.js:25` also special-cases the literal string `'drums'`
as the phase-alignment reference.

## Known-broken code — read before "fixing" or extending

This repo has substantial dead and non-functional code. Much of it is
plausible-looking but verified against the installed Tone.js 14.9.17 type
definitions to be wrong. Do **not** treat these as working examples to copy.

**Runtime errors (throw when the code path is hit):**

- `src/audio/Spatializer.js:9-10` — instantiates `MidSideEncoder` /
  `MidSideDecoder` with **no import statement**. `ReferenceError` on
  construction. Nothing imports `Spatializer`, so it never runs today.
- `src/audio/processors/HarmonicEnhancer.js:34` — `this.harmonicExciter.wet`.
  `Tone.WaveShaper` has no `wet` property (it isn't an effect). Throws.
- `src/audio/processors/spectral/SpectralAnalyzer.js:28` —
  `this.analyzer.getFrequencyBins()`. `Tone.Analyser` has no such method.
  Throws inside `AdaptiveEQ`'s rAF loop.
- `src/audio/processors/TransientShaper.js:70-71` — `this.fastEnv.getValue()`.
  `Tone.Follower` has no `getValue()`. Throws.

**Silent no-ops:**

- `src/audio/processors/HarmonicEnhancer.js:38` — `this.subHarmonic.value = amount`
  sets a plain JS property. `Tone.Multiply` exposes `.factor` (a `Param`), so
  the audio is unaffected.
- `src/audio/processors/TransientShaper.js` — `attackGain` and `sustainGain`
  are created and modulated but **never connected** to the audio path
  (`input → compressor → output` bypasses both). Transient shaping is inaudible.
- `src/audio/MidSideProcessor.js:18-21` — `connect(node, 0, 1)` addresses input
  channel 1 on `Tone.Add`/`Tone.Subtract`, which have a single mono `Gain`
  input plus a separate `addend`/`subtrahend` `Param`. The M/S matrix does not
  compute what the comments claim.

**Logic / integration gaps:**

- `src/audio/AudioEngine.js:12-28` — `loadStem` is `async` but awaits nothing.
  `new Tone.Player(url)` loads asynchronously, so `.buffer` passed to
  `alignPhase` at line 26 is still empty. Phase alignment operates on nothing.
- `src/main.js:65` sends `haasDelay`, but `AudioEngine.setStemParameters`
  (`AudioEngine.js:34-39`) never destructures it. **The Haas slider does nothing**
  — `HaasEffect` is not in any chain.
- UI labels don't match behavior: `width` is converted to a VBAP *azimuth*
  (pan position), and `depth` is routed to *sub-harmonic amount*, not to
  `Spatializer`'s width/depth. `Spatializer` is entirely unused.
- `src/audio/processors/PhaseAligner.js:27-35` — O(n²) cross-correlation
  (2048 × buffer length) on the main thread. It will block hard on any real
  buffer.
- `src/style.css` is imported by nothing (`src/styles/index.css` is the live
  entry point, imported by `main.js`). It duplicates, with different values,
  rules that `layout.css`/`controls.css`/`transport.css` now own. **Edit
  `src/styles/*.css`; `src/style.css` is dead.**

## Do not trust the commit history

Two commits on `main` claim a C++/WebAssembly rewrite in extensive detail:

- `f1eedcb` "feat: Integrate C++/WebAssembly for performance-critical audio
  processing" — **contains zero file changes** (empty commit).
- `905a84d` "feat: Optimize Onset Detection with C++/WebAssembly" — changes
  **only 2 lines in `PhaseAligner.js`**, unrelated to its message.

Both were authored by `google-labs-jules[bot]`. There is **no C++, no
Emscripten toolchain, no `.wasm`, no `ScriptProcessorNode`, and no build step
for any of it** anywhere in the tree, and `SpectralFlux.js` — which `905a84d`
says was deleted — is still present and still imported by `OnsetDetector.js`.
All DSP is plain JavaScript on the main thread.

Verify claims against the working tree before acting on any commit message here.

## Conventions

- **ES modules with named exports.** No default exports anywhere; keep it that way.
- **Classes for audio nodes, arrow-function consts for pure helpers**
  (`src/audio/processors/spectral/utils.js`).
- `import * as Tone from 'tone'` — always the namespace import, never named
  imports from `tone`.
- **2-space indent, semicolons, single quotes.** No trailing-comma discipline is
  enforced (no formatter) — match the surrounding file.
- Comments are sparse and explain *DSP intent* ("Cubic distortion for
  harmonics", "Convert -90..90 to 0..1"), not mechanics. Match that density —
  don't add narration.
- JSDoc blocks appear only on the pure helpers in `spectral/utils.js` and the
  data tables in `constants.js` / `EQCurves.js`. Audio classes are undocumented.
- Magic numbers live in `spectral/constants.js` (`FREQUENCY_BANDS`) when shared;
  otherwise they sit inline next to an explanatory comment.
- New CSS goes in a file under `src/styles/` matching its concern, added to the
  `@import` list in `src/styles/index.css`.

## Working in this repo

- **Run `npm run build` before committing.** It's the only automated signal.
- Audio behavior cannot be verified from the terminal. If a change affects
  sound, say plainly that it is unverified rather than implying it was tested.
- Web Audio requires a user gesture: `AudioEngine.start()` calls `await
  Tone.start()` from the Play button click. Don't move audio-context startup
  out of an event handler.
- Prefer fixing the `input`/`output` wiring over adding new abstraction layers —
  the existing gaps above are mostly missing connections, not missing design.
- When adding a processor: expose `input`/`output` `Tone.Channel`s, add a
  `setParameters({...})` with destructured defaults, insert it into
  `PsychoacousticProcessor`'s constructor chain, and thread its params through
  `PsychoacousticProcessor.setParameters` → `AudioEngine.setStemParameters` →
  a slider in `main.js`. All four steps are required or the control is inert
  (see the Haas slider).
