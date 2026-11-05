"""Example 4-panel figure built with nfig. ALL DATA ARE SYNTHETIC (demo only).

Run:  python figure_guide/example.py   -> figure_guide/out/example.{pdf,svg,png}
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nfig  # noqa: E402

rng = np.random.default_rng(1)
fig, ax = nfig.mosaic("ab;cd", width="double", height_mm=110)

# a: groups with every point shown (no dynamite plot)
groups = {"Control": rng.normal(1.0, 0.25, 8),
          "Drug A": rng.normal(1.6, 0.3, 8),
          "Drug B": rng.normal(1.1, 0.3, 8)}
nfig.dot_plot(ax["a"], groups, ylabel="Expression (fold change)", error="sd")
ax["a"].set_ylim(0, 2.6)
nfig.bracket(ax["a"], 0, 1, 2.3, nfig.p_text(0.0021))

# b: time course, mean of replicates with 95% CI, lines labelled directly
t = np.linspace(0, 24, 13)
for name, k in [("Control", 0.02), ("Drug A", 0.12)]:
    reps = 1 - np.exp(-k * t) + rng.normal(0, 0.04, (5, t.size))
    nfig.line_ci(ax["b"], t, reps, label=name)
ax["b"].set(xlabel="Time (h)", ylabel="Response (normalized)", xticks=[0, 6, 12, 18, 24])
nfig.label_lines(ax["b"])

# c: relationship with r and n stated
x = rng.normal(0, 1, 40)
y = 0.7 * x + rng.normal(0, 0.6, 40)
ax["c"].scatter(x, y, s=8, color=nfig.OKABE_ITO["blue"], linewidths=0, alpha=0.8)
b1, b0 = np.polyfit(x, y, 1)
xs = np.array([x.min(), x.max()])
ax["c"].plot(xs, b0 + b1 * xs, color="black", lw=0.75)
r = np.corrcoef(x, y)[0, 1]
ax["c"].text(0.03, 0.97, f"r = {r:.2f}, n = {x.size}", transform=ax["c"].transAxes,
             va="top", fontsize=6)
ax["c"].set(xlabel="Gene X (z-score)", ylabel="Gene Y (z-score)")

# d: synthetic two-channel micrograph, magenta/green merge with a scale bar
yy, xx = np.mgrid[0:256, 0:256]
def blobs(n):
    img = np.zeros((256, 256))
    for cx, cy in rng.uniform(20, 236, (n, 2)):
        img += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / 60)
    return img + rng.normal(0, 0.03, img.shape)
merged = nfig.merge_magenta_green(blobs(25), blobs(25))
display_log = []
nfig.show_image(ax["d"], merged[..., 0], um_per_px=0.1, scalebar_um=5, log=display_log)
ax["d"].images[0].set_data(merged)  # show the RGB merge, same geometry
ax["d"].set_title("Synthetic merge", fontsize=6)

nfig.panel_labels(ax)
problems = nfig.check(fig)
out = nfig.save(fig, "example", outdir=os.path.join(os.path.dirname(__file__), "out"))
print("saved:", *out, sep="\n  ")
print("check:", problems or "no problems")
print("display settings for Methods:", display_log)
