# Project instructions

## Figures in data analysis

Whenever you make a graph, chart, plot, micrograph panel or any figure for data analysis in this repository:

1. Follow `figure_guide/FIGURE_GUIDELINES.md` (Nature-level figure rules, in Korean).
2. Build figures with `figure_guide/nfig.py` (it loads `figure_guide/nature.mplstyle`):
   final print size in mm (89 / 120 / 183 mm wide), 5-7 pt text, bold lowercase 8 pt panel labels,
   Okabe-Ito colours, every data point shown for small n, scale bars on every image.
3. Run `nfig.check(fig)` before saving and fix every warning.
4. Save with `nfig.save(...)` (vector PDF/SVG + PNG preview) and write a figure legend that states
   what the error bars are, what n counts, the statistical test and exact P values.
5. Image adjustments: linear, whole-image, identical across compared images, recorded for Methods.
   Never alter part of an image. Keep raw files unchanged.
6. Never put synthetic or example data into a figure that presents real results.

Dependencies: `pip install -r figure_guide/requirements.txt`
