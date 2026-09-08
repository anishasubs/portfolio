# Vendored libraries

Third-party code committed here on purpose: the app loads these from disk so
statement parsing never requires a network request. They are fetched lazily,
only when a file is actually imported.

| Path | Library | Version | License |
|---|---|---|---|
| `pdfjs/pdf.min.js`, `pdfjs/pdf.worker.min.js` | [pdf.js](https://mozilla.github.io/pdf.js/) | 3.11.174 (legacy UMD build) | Apache-2.0 — `pdfjs/LICENSE` |
| `tesseract/tesseract.min.js`, `tesseract/worker.min.js` | [tesseract.js](https://tesseract.projectnaptha.com/) | 5.1.1 | Apache-2.0 — `tesseract/LICENSE-tesseract.js.md` |
| `tesseract/tesseract-core-simd-lstm.wasm.js` | tesseract.js-core | 5.1.1 | Apache-2.0 — `tesseract/LICENSE-core` |
| `tesseract/eng.traineddata.gz` | tessdata English model (`4.0.0_best_int`) | 4.0.0 | Apache-2.0 (model), packaged via `@tesseract.js-data/eng`, MIT |

Two deliberate build choices:

- **pdf.js is the legacy UMD build, not the ES-module one.** Module scripts are
  blocked on `file://` origins, and classic scripts are not — this is what lets
  PDF import work when the page is opened straight off disk. Loading
  `pdf.worker.min.js` in the main thread registers a fake worker, avoiding a
  cross-origin `Worker` fetch that `file://` would also block.
- **The tesseract core is the `.wasm.js` build, which embeds the WebAssembly
  binary.** The variant with a separate `.wasm` file resolves it relative to a
  blob worker URL and fails. Embedding costs about 1MB and removes that failure.

The integerized "best" English model is used (~3MB) rather than the standard one
(~11MB); accuracy on screenshots is comparable at a quarter of the size.
