"""PV module quality & reliability sample report. ALL DATA ARE SYNTHETIC.

Built with figure_guide (nfig) and writing_guide. Not real product data.

Run:  python samples/pv_report/build.py
Out:  samples/pv_report/figures/fig1..fig4.{pdf,svg,png}, samples/pv_report/report.html
"""
import html
import os
import re
import sys

import numpy as np
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "figure_guide"))
import matplotlib as mpl  # noqa: E402
import nfig  # noqa: E402

FIG_DIR = os.path.join(HERE, "figures")
rng = np.random.default_rng(2026)
OI = nfig.OKABE_ITO
GREY = "#8C96A0"
R = {}  # every number quoted in the report comes from here


# ============================================================ data (synthetic)
# 1) Cell efficiency by production line (n = 400 cells per line)
lines = {"Line 1": (24.62, 0.11), "Line 2": (24.66, 0.10),
         "Line 3": (24.58, 0.12), "Line 4": (24.31, 0.19)}
eff = {k: rng.normal(m, s, 400) for k, (m, s) in lines.items()}
others = np.concatenate([eff["Line 1"], eff["Line 2"], eff["Line 3"]])
d = eff["Line 4"].mean() - others.mean()
se = np.sqrt(eff["Line 4"].var(ddof=1) / 400 + others.var(ddof=1) / others.size)
welch = stats.ttest_ind(eff["Line 4"], others, equal_var=False)
R["eff_means"] = {k: v.mean() for k, v in eff.items()}
R["eff_diff"], R["eff_ci"] = d, (d - 1.96 * se, d + 1.96 * se)
R["eff_p"] = welch.pvalue
R["eff_sd4"], R["eff_sd_others"] = eff["Line 4"].std(ddof=1), others.std(ddof=1)

# 2) Module I-V curve under STC (one representative module)
Isc, Voc = 13.95, 49.6
V = np.linspace(0, Voc, 400)
I = Isc * (1 - np.exp((V - Voc) / (0.052 * Voc)))
P = V * I
k = P.argmax()
R["iv"] = dict(Isc=Isc, Voc=Voc, Vmp=V[k], Imp=I[k], Pmax=P[k], FF=P[k] / (Isc * Voc))

# 3) Damp heat 85 °C / 85% RH, two encapsulants, n = 6 modules each
hours = np.array([0, 1000, 2000, 3000])
def dh(rate, sd):
    r = rng.normal(rate, sd, 6)[:, None]
    return -(r * hours / 1000) + np.c_[np.zeros(6), rng.normal(0, 0.12, (6, 3))]
dh_a, dh_b = dh(0.98, 0.16), dh(0.55, 0.10)
t3 = stats.ttest_ind(dh_a[:, -1], dh_b[:, -1], equal_var=False)
R["dh_a"], R["dh_b"] = dh_a[:, -1].mean(), dh_b[:, -1].mean()
R["dh_a_worst"], R["dh_p"] = dh_a[:, -1].min(), t3.pvalue

# 4) EL images: intact vs cracked cells, n = 20 each (0.5 mm per px, 182 mm cell)
PX, MM_PER_PX = 364, 0.5
yy, xx = np.mgrid[0:PX, 0:PX]
def el_cell(crack, seed):
    g = np.random.default_rng(seed)
    img = 0.78 - 0.10 * (((xx - PX / 2) ** 2 + (yy - PX / 2) ** 2) / (PX / 2) ** 2)
    for bx in np.linspace(PX / 12, PX - PX / 12, 10):          # busbars
        img[:, int(bx) - 1:int(bx) + 1] *= 0.55
    if crack:
        a = g.uniform(0.3, 1.2)
        y0 = g.uniform(0.35, 0.85) * PX
        edge = y0 + a * (xx - PX / 2)
        img[yy > edge] *= g.uniform(0.25, 0.45)                 # inactive area
        img[np.abs(yy - edge) < 1.5] *= 0.3                     # crack line
    return np.clip(img + g.normal(0, 0.035, img.shape), 0, 1)
def dark_frac(img):
    return 100 * (img < 0.4).mean()
intact = [el_cell(False, i) for i in range(20)]
cracked = [el_cell(True, 100 + i) for i in range(20)]
fr_i, fr_c = np.array([dark_frac(x) for x in intact]), np.array([dark_frac(x) for x in cracked])
mw = stats.mannwhitneyu(fr_c, fr_i)
R["el_i"], R["el_c"] = np.median(fr_i), np.median(fr_c)
R["el_c_iqr"] = np.percentile(fr_c, [25, 75])
R["el_p"] = mw.pvalue

# 5) Outdoor temperature coefficient (irradiance-corrected Pmax, n = 320)
T = rng.uniform(22, 66, 320)
gamma_true = -0.30
Pn = 100 + gamma_true * (T - 25) + rng.normal(0, 0.55, T.size)
lr = stats.linregress(T, Pn)
tcrit = stats.t.ppf(0.975, T.size - 2)
R["gamma"], R["gamma_ci"] = lr.slope, (lr.slope - tcrit * lr.stderr, lr.slope + tcrit * lr.stderr)
R["gamma_r2"], R["gamma_n"] = lr.rvalue ** 2, T.size

# 6) Monthly performance ratio, two sites, 24 months
m = np.arange(24)
season = np.cos(2 * np.pi * (m - 0.5) / 12)  # +1 in Jan, -1 in Jul
pr = {"Inland site": 0.835 + 0.022 * season + rng.normal(0, 0.006, 24),
      "Coastal site": 0.812 + 0.018 * season - 0.0012 * m + rng.normal(0, 0.006, 24)}
R["pr"] = {k: (v[:12].mean(), v[12:].mean()) for k, v in pr.items()}
R["pr_summer_drop"] = (pr["Inland site"][[0, 1, 11, 12, 13, 23]].mean()
                       - pr["Inland site"][[5, 6, 7, 17, 18, 19]].mean())


# ============================================================ figures
def svg_salt(n):
    mpl.rcParams["svg.hashsalt"] = f"pvfig{n}"

figs = {}

# --- Figure 1: line efficiency + I-V
svg_salt(1)
fig, ax = nfig.mosaic("aab", width="double", height_mm=62)
a = ax["a"]
names = list(eff)
for i, nme in enumerate(names):
    v = eff[nme]
    c = OI["vermillion"] if nme == "Line 4" else GREY
    vp = a.violinplot(v, positions=[i], widths=0.75, showextrema=False)
    for b in vp["bodies"]:
        b.set_facecolor(c); b.set_alpha(0.35); b.set_edgecolor("none")
    q1, med, q3 = np.percentile(v, [25, 50, 75])
    a.plot([i, i], [q1, q3], color=c, lw=2.2, solid_capstyle="butt")
    a.plot(i, med, "o", color="white", ms=2.6, mec=c, mew=0.8)
a.axhline(others.mean(), color="black", lw=0.5, ls=(0, (3, 2)))
a.text(3.45, others.mean() + 0.02, "Lines 1–3 mean", fontsize=6, ha="right", va="bottom")
a.set_xticks(range(4)); a.set_xticklabels([f"{n}\n(n = 400)" for n in names])
a.set_ylabel("Cell efficiency (%)")
a.set_ylim(23.6, 25.2)
a.annotate(f"−{abs(d):.2f} %abs\n{nfig.p_text(welch.pvalue)}", xy=(3, eff["Line 4"].mean()),
           xytext=(2.35, 23.75), fontsize=6, color=OI["vermillion"],
           arrowprops=dict(arrowstyle="-", lw=0.5, color=OI["vermillion"]))
b = ax["b"]
b.plot(V, I, color="black")
b.plot(R["iv"]["Vmp"], R["iv"]["Imp"], "o", color=OI["vermillion"], ms=3.5)
b.annotate(f"MPP {R['iv']['Pmax']:.0f} W\nFF {R['iv']['FF'] * 100:.1f}%",
           (R["iv"]["Vmp"], R["iv"]["Imp"]), xytext=(-4, -14), textcoords="offset points",
           ha="right", va="top", fontsize=6)
b.set(xlabel="Voltage (V)", ylabel="Current (A)", xlim=(0, 52), ylim=(0, 15.5))
nfig.panel_labels(ax)
figs[1] = fig

# --- Figure 2: damp heat trajectories + 3000 h loss
svg_salt(2)
fig, ax = nfig.mosaic("aab", width="double", height_mm=60)
a = ax["a"]
for arr, c, nm in [(dh_a, OI["vermillion"], "Encapsulant A"), (dh_b, OI["blue"], "Encapsulant B")]:
    for row in arr:
        a.plot(hours, row, color=c, lw=0.5, alpha=0.45)
    a.plot(hours, arr.mean(0), color=c, lw=1.4, marker="o", ms=3, label=nm)
a.axhline(-5, color="black", lw=0.6, ls=(0, (4, 2)))
a.text(60, -4.85, "IEC 61215 pass limit (−5%)", fontsize=6, va="bottom")
a.set(xlabel="Damp heat exposure, 85 °C / 85% RH (h)", ylabel="Pmax change (%)",
      xticks=hours, xlim=(-100, 3500), ylim=(-6, 0.5))
nfig.label_lines(a)
nfig.dot_plot(ax["b"], {"A": dh_a[:, -1], "B": dh_b[:, -1]}, ylabel="Pmax change at 3,000 h (%)",
              error="sd", colors=[OI["vermillion"], OI["blue"]])
ax["b"].set_ylim(-6, 0.5)
ax["b"].axhline(-5, color="black", lw=0.6, ls=(0, (4, 2)))
nfig.bracket(ax["b"], 0, 1, -0.4, nfig.p_text(t3.pvalue))
nfig.panel_labels(ax)
figs[2] = fig

# --- Figure 3: EL images (same display limits) + dark-area quantification
svg_salt(3)
fig, ax = nfig.mosaic("abc", width="double", height_mm=58, width_ratios=[1, 1, 0.8])
log = []
nfig.show_image(ax["a"], intact[0], MM_PER_PX, 20, vmin=0, vmax=0.85, log=log, unit="mm")
nfig.show_image(ax["b"], cracked[3], MM_PER_PX, 20, vmin=0, vmax=0.85, log=log, unit="mm")
ax["a"].set_title("Intact cell", fontsize=6)
ax["b"].set_title("Cracked cell", fontsize=6)
nfig.dot_plot(ax["c"], {"Intact": fr_i, "Cracked": fr_c}, ylabel="Dark area (% of cell)",
              error="ci95", colors=[GREY, OI["vermillion"]])
ax["c"].set_ylim(0, fr_c.max() * 1.25)
nfig.bracket(ax["c"], 0, 1, fr_c.max() * 1.07, nfig.p_text(mw.pvalue))
nfig.panel_labels(ax)
R["el_log"] = log
figs[3] = fig

# --- Figure 4: temperature coefficient + monthly PR
svg_salt(4)
fig, ax = nfig.mosaic("ab", width="double", height_mm=62)
a = ax["a"]
a.scatter(T, Pn, s=5, color=OI["blue"], alpha=0.45, linewidths=0)
xs = np.linspace(20, 68, 50)
yhat = lr.intercept + lr.slope * xs
resid_sd = np.sqrt(np.sum((Pn - (lr.intercept + lr.slope * T)) ** 2) / (T.size - 2))
band = tcrit * resid_sd * np.sqrt(1 / T.size + (xs - T.mean()) ** 2 / np.sum((T - T.mean()) ** 2))
a.fill_between(xs, yhat - band, yhat + band, color="black", alpha=0.15, lw=0)
a.plot(xs, yhat, color="black", lw=0.9)
a.text(0.97, 0.95, f"γ = {lr.slope:.3f} %/°C\n95% CI {R['gamma_ci'][0]:.3f} to {R['gamma_ci'][1]:.3f}\nn = {T.size}",
       transform=a.transAxes, ha="right", va="top", fontsize=6)
a.set(xlabel="Module temperature (°C)", ylabel="Pmax at 1,000 W m$^{-2}$ (% of STC)",
      xlim=(20, 68))
b = ax["b"]
for (nm, v), c in zip(pr.items(), [OI["green"], OI["purple"]]):
    b.plot(m + 1, v * 100, color=c, marker="o", ms=2.2, label=nm)
nfig.label_lines(b)
for s in (7, 19):
    b.axvspan(s - 1, s + 1, color="black", alpha=0.06, lw=0)
b.text(7, 76.2, "summer", fontsize=6, ha="center", color="#555555")
b.set(xlabel="Month of operation", ylabel="Performance ratio (%)", xticks=[1, 6, 12, 18, 24],
      xlim=(0.5, 29), ylim=(76, 88))
nfig.panel_labels(ax)
figs[4] = fig

for n, f in figs.items():
    probs = nfig.check(f)
    assert not probs, (n, probs)
    nfig.save(f, f"fig{n}", outdir=FIG_DIR)


# ============================================================ HTML report
def svg_inline(n):
    s = open(os.path.join(FIG_DIR, f"fig{n}.svg"), encoding="utf-8").read()
    s = re.sub(r"<\?xml[^>]*\?>|<!DOCTYPE[^>]*>", "", s, flags=re.S).strip()
    return re.sub(r'<svg ([^>]*?)width="[^"]*" height="[^"]*"', r'<svg \1', s, count=1)

f2 = lambda x: f"{x:.2f}"
iv = R["iv"]
legends = {
1: f"""<b>Fig. 1 | 라인 4의 셀 효율이 나머지 라인보다 {abs(R['eff_diff']):.2f}%p 낮고 산포가 넓다.</b>
<b>a</b>, 생산 라인별 셀 효율 분포(라인당 n = 400 셀). 바이올린은 분포, 굵은 막대는 사분위 범위, 흰 점은 중앙값이다. 점선은 라인 1–3의 평균이다. 라인 4 대 라인 1–3 비교는 양측 Welch t-검정.
<b>b</b>, 대표 모듈의 STC I–V 곡선. 주황 점은 최대 출력점(MPP)이다.""",
2: f"""<b>Fig. 2 | 3,000시간 고온고습 시험에서 봉지재 A의 출력 저하가 B의 약 {R['dh_a'] / R['dh_b']:.1f}배다.</b>
<b>a</b>, 85 °C / 85% RH 노출 시간에 따른 Pmax 변화. 가는 선은 개별 모듈, 굵은 선은 평균(봉지재별 n = 6 모듈). 점선은 IEC 61215 합격 한계(−5%).
<b>b</b>, 3,000시간 시점의 Pmax 변화. 점은 개별 모듈, 검은 점과 막대는 평균 ± s.d. 양측 Welch t-검정.""",
3: f"""<b>Fig. 3 | 크랙 셀은 EL 이미지에서 비활성(어두운) 영역이 중앙값 {R['el_c']:.1f}%로 정상 셀({R['el_i']:.1f}%)보다 넓다.</b>
<b>a</b>, <b>b</b>, 정상 셀과 크랙 셀의 대표 EL 이미지. 두 이미지는 같은 표시 범위(0–0.85, 선형)로 나타냈다. 스케일 바, 20 mm.
<b>c</b>, 셀별 어두운 영역 비율(정규화 강도 &lt; 0.4). 그룹당 n = 20 셀. 검은 점과 막대는 평균 ± 95% CI. 양측 Mann–Whitney U 검정.""",
4: f"""<b>Fig. 4 | 실측 온도계수는 {R['gamma']:.3f} %/°C이고, 두 현장 모두 여름에 PR이 낮아진다.</b>
<b>a</b>, 옥외 측정 모듈 온도와 일사 보정 Pmax(STC 대비 %). 점은 측정값(n = {R['gamma_n']}), 선과 음영은 선형 회귀와 95% 신뢰대.
<b>b</b>, 두 현장의 월별 성능비(PR). 음영은 여름(6–8월)이다.""",
}

tbl_rows = "".join(
    f"<tr><td>{k}</td><td class='num'>{v:.2f}</td><td class='num'>{eff[k].std(ddof=1):.2f}</td></tr>"
    for k, v in R["eff_means"].items())

body = f"""
<header class="top">
  <p class="tag">합성 데이터 샘플 · 실제 제품 수치가 아님</p>
  <h1>모듈 품질·신뢰성 분석 리포트</h1>
  <p class="meta">그림 지침(figure_guide)과 문체 지침(writing_guide)을 적용한 예시 · 생성 스크립트 <code>samples/pv_report/build.py</code></p>
</header>

<section class="summary">
  <h2>요약</h2>
  <ul>
    <li><b>라인 4 셀 효율이 {abs(R['eff_diff']):.2f}%p 낮다</b> (95% CI {abs(R['eff_ci'][1]):.2f}–{abs(R['eff_ci'][0]):.2f}%p, {nfig.p_text(R['eff_p'])}). 산포도 s.d. {R['eff_sd4']:.2f}%로 다른 라인({R['eff_sd_others']:.2f}%)의 약 {R['eff_sd4'] / R['eff_sd_others']:.1f}배다. 공정 점검 1순위다.</li>
    <li><b>고온고습 3,000시간 후 봉지재 A는 평균 {R['dh_a']:.1f}%, B는 {R['dh_b']:.1f}% 저하</b>됐다({nfig.p_text(R['dh_p'])}). 모두 IEC 61215 한계(−5%) 안이지만, A의 최악 모듈은 {R['dh_a_worst']:.1f}%로 여유가 작다.</li>
    <li><b>크랙 셀의 비활성 영역은 중앙값 {R['el_c']:.1f}%</b>(IQR {R['el_c_iqr'][0]:.1f}–{R['el_c_iqr'][1]:.1f}%)로, EL 자동 판정 기준을 비활성 면적 기반으로 잡을 근거가 된다.</li>
    <li><b>옥외 온도계수 {R['gamma']:.3f} %/°C</b>(95% CI {R['gamma_ci'][0]:.3f} to {R['gamma_ci'][1]:.3f}), 내륙 현장의 겨울–여름 PR 차이는 {R['pr_summer_drop'] * 100:.1f}%p다.</li>
  </ul>
</section>

<section>
  <h2>데이터</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>데이터</th><th>단위·조건</th><th class="num">n</th></tr></thead>
    <tbody>
      <tr><td>셀 효율 (라인 1–4)</td><td>STC, 셀 단위</td><td class="num">1,600 셀</td></tr>
      <tr><td>I–V 곡선</td><td>STC, 대표 모듈 1장</td><td class="num">1 모듈</td></tr>
      <tr><td>고온고습 시험</td><td>85 °C / 85% RH, 0–3,000 h</td><td class="num">12 모듈</td></tr>
      <tr><td>EL 이미지</td><td>셀 182 mm, 0.5 mm/px</td><td class="num">40 셀</td></tr>
      <tr><td>옥외 온도계수</td><td>일사 1,000 W/m² 보정</td><td class="num">320 측정</td></tr>
      <tr><td>월별 PR</td><td>현장 2곳, 24개월</td><td class="num">48 월</td></tr>
    </tbody>
  </table></div>
  <p class="note">모든 값은 난수로 만든 합성 데이터다(seed 2026). 분석 흐름과 그림 형식을 보여주기 위한 예시이며, 실제 공정·제품·현장의 성능을 나타내지 않는다.</p>
</section>

<section>
  <h2>1. 생산 라인별 셀 효율</h2>
  <figure><div class="plate">{svg_inline(1)}</div><figcaption>{legends[1]}</figcaption></figure>
  <div class="tablewrap narrow"><table>
    <thead><tr><th>라인</th><th class="num">평균 효율 (%)</th><th class="num">s.d. (%)</th></tr></thead>
    <tbody>{tbl_rows}</tbody>
  </table></div>
  <p>라인 4는 평균이 낮을 뿐 아니라 분포의 아래 꼬리가 길다. 평균 이동만이 아닌 일부 셀의 불량이 섞인 형태라서, 전체 공정 조건보다 특정 설비(인쇄·소성 구간)의 국소 문제를 먼저 의심한다. 대표 모듈은 Pmax {iv['Pmax']:.0f} W, Vmp {iv['Vmp']:.1f} V, Imp {iv['Imp']:.2f} A, FF {iv['FF'] * 100:.1f}%다.</p>
</section>

<section>
  <h2>2. 고온고습(Damp Heat) 신뢰성</h2>
  <figure><div class="plate">{svg_inline(2)}</div><figcaption>{legends[2]}</figcaption></figure>
  <p>두 봉지재 모두 시간에 거의 비례해 저하된다. 이 기울기를 그대로 늘리면 봉지재 A는 약 {(-5 / (R['dh_a'] / 3000)) / 1000:.1f}천 시간에 −5%에 닿는다. 확장 시험(DH 4,000–5,000 h)으로 선형성이 유지되는지 확인해야 한다.</p>
</section>

<section>
  <h2>3. EL 이미지 크랙 정량화</h2>
  <figure><div class="plate">{svg_inline(3)}</div><figcaption>{legends[3]}</figcaption></figure>
  <p>두 이미지는 같은 선형 표시 범위로 처리했고, 부분 보정은 하지 않았다. 표시 설정은 아래 표와 같으며 Methods에 그대로 옮긴다.</p>
  <div class="tablewrap narrow"><table>
    <thead><tr><th>이미지</th><th class="num">표시 최소</th><th class="num">표시 최대</th><th class="num">픽셀 크기</th></tr></thead>
    <tbody>{"".join(f"<tr><td>{n}</td><td class='num'>{d['display_min']:g}</td><td class='num'>{d['display_max']:g}</td><td class='num'>{d['size_per_px']:g} {d['unit']}</td></tr>" for n, d in zip(["Fig. 3a", "Fig. 3b"], R["el_log"]))}</tbody>
  </table></div>
</section>

<section>
  <h2>4. 옥외 성능</h2>
  <figure><div class="plate">{svg_inline(4)}</div><figcaption>{legends[4]}</figcaption></figure>
  <p>연평균 PR은 내륙 현장이 {R['pr']['Inland site'][0] * 100:.1f}% → {R['pr']['Inland site'][1] * 100:.1f}%(1년차 → 2년차), 해안 현장이 {R['pr']['Coastal site'][0] * 100:.1f}% → {R['pr']['Coastal site'][1] * 100:.1f}%다. 해안 현장만 2년차에 떨어진 것은 오염(염분)이나 열화 신호일 수 있어 세척 기록과 함께 본다.</p>
</section>

<section>
  <h2>한계와 다음 단계</h2>
  <ul>
    <li>고온고습 결과는 봉지재당 모듈 6장이다. 저하율 차이를 확정하려면 로트를 나눠 재시험한다.</li>
    <li>EL 비활성 면적은 고정 임계값(0.4)으로 계산했다. 측정 장비별로 임계값을 보정해야 한다.</li>
    <li>온도계수는 단일 모듈 유형, 단일 현장 기준이다. 일사·스펙트럼 보정 방법에 따라 0.01–0.02 %/°C 차이가 날 수 있다.</li>
  </ul>
</section>

<section>
  <h2>이 리포트에 적용한 지침</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>구분</th><th>지침</th><th>이 리포트에서</th></tr></thead>
    <tbody>
      <tr><td><span class="pill must">반드시</span></td><td>이미지 조정은 전체·선형·동일값, 기록</td><td>EL 두 장에 같은 표시 범위, 표로 기록</td></tr>
      <tr><td><span class="pill must">반드시</span></td><td>오차막대·n·검정법·P값 명시</td><td>모든 범례에 기재</td></tr>
      <tr><td><span class="pill must">반드시</span></td><td>최종 크기에서 판독, 색각 이상 고려</td><td>183 mm 폭, 6–7 pt, Okabe-Ito, <code>nfig.check</code> 통과</td></tr>
      <tr><td><span class="pill def">기본값</span></td><td>소표본은 개별 점</td><td>모듈 6장·셀 20장은 모든 점 표시</td></tr>
      <tr><td><span class="pill def">기본값 변경</span></td><td>개별 점 표시</td><td>셀 400개는 점 대신 바이올린 + 사분위로 바꿈(점이 겹쳐 분포가 안 보임)</td></tr>
      <tr><td><span class="pill free">자유</span></td><td>강조 한 가지</td><td>그림마다 결론에 해당하는 그룹만 주황색, 나머지는 회색</td></tr>
      <tr><td><span class="pill free">자유</span></td><td>맞춤 표현</td><td>IEC 합격선, 여름 음영, 직접 라벨, 회귀 신뢰대</td></tr>
    </tbody>
  </table></div>
</section>

<footer>재현: <code>pip install -r figure_guide/requirements.txt scipy</code> 후 <code>python samples/pv_report/build.py</code>. 그림 원본(PDF·SVG·PNG)은 <code>samples/pv_report/figures/</code>에 있다.</footer>
"""

CSS = open(os.path.join(HERE, "report.css"), encoding="utf-8").read()
page = f"""<title>PV 모듈 품질 리포트</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>{CSS}</style>
<main class="wrap">{body}</main>
"""
with open(os.path.join(HERE, "report.html"), "w", encoding="utf-8") as fh:
    fh.write(page)
print("report.html written;", {k: v for k, v in R.items() if k != "el_log"})
