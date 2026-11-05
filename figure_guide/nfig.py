"""Helpers for journal-grade (Nature-style) figures.

Usage:
    import nfig
    fig, axes = nfig.figure("double", height_mm=60, ncols=3)
    nfig.dot_plot(axes[0], {"Control": a, "Treated": b}, ylabel="Signal (a.u.)")
    nfig.panel_labels(axes)
    nfig.check(fig)                 # warns about rule violations
    nfig.save(fig, "fig1")          # fig1.pdf + fig1.svg + fig1.png

All sizes are final print sizes. Values follow Nature-family conventions from
memory; confirm against the target journal's current author guide.
"""
from __future__ import annotations

import os
import warnings

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
plt.style.use(os.path.join(_HERE, "nature.mplstyle"))

MM = 1 / 25.4  # inches per mm
WIDTHS_MM = {"single": 89, "onehalf": 120, "double": 183}
MAX_HEIGHT_MM = 247  # full page depth (approximate); keep room for the legend

# Okabe-Ito palette: distinguishable with common colour-vision deficiencies.
OKABE_ITO = {
    "blue": "#0072B2", "vermillion": "#D55E00", "green": "#009E73",
    "purple": "#CC79A7", "orange": "#E69F00", "sky": "#56B4E9",
    "yellow": "#F0E442", "black": "#000000", "grey": "#7F7F7F",
}
PALETTE = [OKABE_ITO[k] for k in ("blue", "vermillion", "green", "purple", "orange", "sky", "black")]
# Two-channel fluorescence: magenta/green instead of red/green.
MAGENTA, GREEN = "#FF00FF", "#00FF00"


# ---------------------------------------------------------------- layout
def figure(width="single", height_mm=None, nrows=1, ncols=1, **kw):
    """Create a figure at final print size. width: 'single'|'onehalf'|'double'|mm."""
    w = WIDTHS_MM.get(width, width)
    if height_mm is None:
        height_mm = w * 0.75 / max(ncols, 1) * nrows
    if height_mm > MAX_HEIGHT_MM:
        warnings.warn(f"height {height_mm} mm exceeds page depth {MAX_HEIGHT_MM} mm")
    kw.setdefault("layout", "constrained")
    fig, axes = plt.subplots(nrows, ncols, figsize=(w * MM, height_mm * MM), squeeze=False, **kw)
    flat = list(axes.ravel())
    return fig, (flat[0] if len(flat) == 1 else flat)


def mosaic(layout, width="double", height_mm=100, **kw):
    """Multi-panel figure from a mosaic string, e.g. 'AAB;CDE'. Returns (fig, dict)."""
    w = WIDTHS_MM.get(width, width)
    kw.setdefault("layout", "constrained")
    return plt.subplot_mosaic(layout, figsize=(w * MM, height_mm * MM), **kw)


def panel_labels(axes, labels="abcdefghijklmnopqrstuvwxyz", dx_mm=-4, dy_mm=1.5):
    """Bold lowercase 8 pt panel labels at each panel's top-left corner."""
    if isinstance(axes, dict):
        axes = [axes[k] for k in sorted(axes)]
    for ax, lab in zip(axes, labels):
        trans = mpl.transforms.offset_copy(ax.transAxes, fig=ax.figure,
                                           x=dx_mm * MM, y=dy_mm * MM, units="inches")
        ax.text(0, 1, lab, transform=trans, fontsize=8, fontweight="bold",
                va="bottom", ha="right")


# ---------------------------------------------------------------- plots
def dot_plot(ax, groups, ylabel=None, error="sd", colors=None, jitter=0.12,
             seed=0, show_n=True):
    """Every data point + mean and error bar. Replaces bar+error ('dynamite') plots.

    groups: {name: 1-D array}. error: 'sd' | 'sem' | 'ci95'.
    Returns {name: (mean, err, n)} so the legend can state exactly what was drawn.
    """
    rng = np.random.default_rng(seed)
    colors = colors or PALETTE
    out = {}
    for i, (name, vals) in enumerate(groups.items()):
        v = np.asarray(vals, float)
        v = v[~np.isnan(v)]
        n, m = len(v), v.mean()
        sd = v.std(ddof=1) if n > 1 else 0.0
        err = {"sd": sd, "sem": sd / np.sqrt(n), "ci95": 1.96 * sd / np.sqrt(n)}[error]
        c = colors[i % len(colors)]
        x = i + rng.uniform(-jitter, jitter, n)
        ax.scatter(x, v, s=8, color=c, alpha=0.7, linewidths=0, zorder=2)
        ax.errorbar(i + 0.3, m, yerr=err, fmt="o", color="black", ms=3,
                    elinewidth=0.75, zorder=3)
        out[name] = (m, err, n)
    ax.set_xticks(range(len(groups)))
    ax.set_xticklabels([f"{k}\n(n = {out[k][2]})" if show_n else k for k in groups])
    ax.set_xlim(-0.5, len(groups) - 0.3)
    if ylabel:
        ax.set_ylabel(ylabel)
    return out


def line_ci(ax, x, y_reps, label=None, color=None, ci=True):
    """Mean line across replicates (rows) with a 95% CI band."""
    y = np.asarray(y_reps, float)
    m = y.mean(0)
    h = 1.96 * y.std(0, ddof=1) / np.sqrt(y.shape[0])
    line, = ax.plot(x, m, color=color, label=label)
    if ci:
        ax.fill_between(x, m - h, m + h, color=line.get_color(), alpha=0.2, linewidth=0)
    return line


def label_lines(ax, dx=0.02):
    """Name each line at its right end instead of using a legend box."""
    for ln in ax.get_lines():
        lab = ln.get_label()
        if lab.startswith("_"):
            continue
        x, y = ln.get_xdata()[-1], ln.get_ydata()[-1]
        ax.annotate(lab, (x, y), xytext=(3, 0), textcoords="offset points",
                    va="center", fontsize=6, color=ln.get_color())


def p_text(p):
    """Exact p value text: 'P = 0.032', 'P < 0.001'."""
    return "P < 0.001" if p < 0.001 else f"P = {p:.2g}" if p < 0.01 else f"P = {p:.2f}"


def bracket(ax, x1, x2, y, text, h=0.02):
    """Significance bracket with exact text between two groups (y in data units)."""
    span = np.diff(ax.get_ylim())[0] * h
    ax.plot([x1, x1, x2, x2], [y, y + span, y + span, y], color="black", lw=0.5)
    ax.text((x1 + x2) / 2, y + span, text, ha="center", va="bottom", fontsize=6)


# ---------------------------------------------------------------- images
def show_image(ax, img, um_per_px, scalebar_um, vmin=None, vmax=None, cmap="gray",
               bar_color="white", label=True, log=None, unit="µm"):
    """Show a micrograph with a scale bar. Only linear display limits, applied
    to the whole image; the limits are recorded in `log` (a list) for the Methods."""
    a = np.asarray(img, float)
    vmin = np.nanmin(a) if vmin is None else vmin
    vmax = np.nanmax(a) if vmax is None else vmax
    ax.imshow(a, cmap=cmap, vmin=vmin, vmax=vmax, interpolation="none")
    ax.set_axis_off()
    h, w = a.shape[:2]
    L = scalebar_um / um_per_px
    x0, y0 = w * 0.95 - L, h * 0.93
    ax.plot([x0, x0 + L], [y0, y0], color=bar_color, lw=2, solid_capstyle="butt")
    if label:
        ax.text(x0 + L / 2, y0 - h * 0.03, f"{scalebar_um:g} {unit}", color=bar_color,
                ha="center", va="bottom", fontsize=6)
    if log is not None:
        log.append({"display_min": float(vmin), "display_max": float(vmax),
                    "size_per_px": um_per_px, "scalebar": scalebar_um, "unit": unit, "cmap": cmap})


def merge_magenta_green(ch1, ch2, lim1=None, lim2=None):
    """Two-channel merge in magenta (ch1) / green (ch2), colour-blind safe."""
    def norm(c, lim):
        c = np.asarray(c, float)
        lo, hi = lim or (np.nanmin(c), np.nanmax(c))
        return np.clip((c - lo) / (hi - lo), 0, 1)
    a, b = norm(ch1, lim1), norm(ch2, lim2)
    return np.dstack([a, b, a])


# ---------------------------------------------------------------- QA + save
def check(fig, min_pt=5, max_pt=7, label_pt=8):
    """Warn about text outside 5-7 pt, figure wider than 183 mm, rainbow colormaps."""
    problems = []
    w_mm = fig.get_figwidth() / MM
    if w_mm > WIDTHS_MM["double"] + 0.5:
        problems.append(f"figure width {w_mm:.0f} mm > 183 mm")
    for t in fig.findobj(mpl.text.Text):
        s, txt = t.get_fontsize(), t.get_text().strip()
        if not txt or not t.get_visible():
            continue
        if not (min_pt <= s <= max_pt or (s == label_pt and t.get_fontweight() == "bold")):
            problems.append(f"text '{txt[:20]}' is {s:g} pt")
    for im in fig.findobj(mpl.image.AxesImage):
        if im.get_cmap().name in {"jet", "rainbow", "hsv", "gist_rainbow", "nipy_spectral"}:
            problems.append(f"rainbow colormap '{im.get_cmap().name}' used")
    for p in problems:
        warnings.warn(p)
    return problems


def save(fig, name, outdir=".", formats=("pdf", "svg", "png"), dpi=600):
    """Vector PDF/SVG for submission (editable text) + PNG preview."""
    os.makedirs(outdir, exist_ok=True)
    paths = []
    for f in formats:
        p = os.path.join(outdir, f"{name}.{f}")
        fig.savefig(p, dpi=dpi if f in {"png", "tif", "tiff"} else None)
        paths.append(p)
    return paths
