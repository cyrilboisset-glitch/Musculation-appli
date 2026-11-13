# Construit le corps 3D (MakeHuman CC0) : morphologie homme athlétique, squelette simplifié, poids de peau,
# masques musculaires et teintes (sourcils, lèvres). Sortie : body.json (méta) + body.bin (tableaux binaires).
import json, sys, numpy as np
MH = '/tmp/claude-0/mh'
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'

# ---------- maillage de base ----------
V = []; F = []; G = []; grp = 'body'
for ln in open(MH + '/3dobjs_base.obj'):
    if ln.startswith('v '):
        V.append([float(x) for x in ln.split()[1:4]])
    elif ln.startswith('g '):
        grp = ln.split()[1]
    elif ln.startswith('f '):
        F.append([int(t.split('/')[0]) - 1 for t in ln.split()[1:]]); G.append(grp)
V = np.array(V, dtype=np.float64)

# ---------- morphologie ----------
T = np.load(MH + '/targets.npz', allow_pickle=True)
def tg(name, w):
    if w == 0: return
    k = 'targets/' + name
    V[T[k + '.index']] += w * T[k + '.vector'].astype(np.float64) * 1e-3
mus = {'average': .35, 'max': .65}; wei = {'average': .85, 'min': .15}
for m, wm in mus.items():
    for g, wg in wei.items():
        w = wm * wg
        tg('macrodetails/universal-male-young-%smuscle-%sweight' % (m, g), w)
        tg('macrodetails/height/male-young-%smuscle-%sweight-maxheight' % (m, g), w * .25)
        tg('macrodetails/proportions/male-young-%smuscle-%sweight-idealproportions' % (m, g), w * .8)
tg('macrodetails/caucasian-male-young', 1)
for n, w in [('torso/torso-vshape-incr', .45), ('torso/torso-muscle-pectoral-incr', .35), ('torso/torso-muscle-dorsi-incr', .4),
             ('stomach/stomach-pregnant-decr', .45), ('stomach/stomach-tone-incr', .4) if 'targets/stomach/stomach-tone-incr.index' in T else ('stomach/stomach-pregnant-decr', 0),
             ('buttocks/buttocks-volume-incr', .15)]:
    tg(n, w)
for s in 'lr':
    for n, w in [('upperarm-muscle-incr', .45), ('upperarm-shoulder-muscle-incr', .45), ('lowerarm-muscle-incr', .35),
                 ('upperleg-muscle-incr', .35), ('lowerleg-muscle-incr', .35), ('upperarm-fat-decr', .4), ('upperleg-fat-decr', .3)]:
        tg('armslegs/%s-%s' % (s, n), w)

# ---------- squelette ----------
S = json.load(open(MH + '/rigs_default.mhskel'))
JP = {k: V[v].mean(0) for k, v in S['joints'].items()}
KEEP = ['root', 'spine05', 'spine04', 'spine03', 'spine02', 'spine01', 'neck01', 'neck02', 'neck03', 'head']
for s in 'LR':
    KEEP += [n + '.' + s for n in ['pelvis', 'upperleg01', 'upperleg02', 'lowerleg01', 'lowerleg02', 'foot', 'toe1-1',
             'clavicle', 'shoulder01', 'upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02', 'wrist',
             'metacarpal1', 'metacarpal2', 'metacarpal3', 'metacarpal4', 'finger1-1', 'finger1-2', 'finger1-3']
             + ['finger%d-%d' % (f, j) for f in range(2, 6) for j in range(1, 4)]]
B = S['bones']
def kept(n):
    while n not in KEEP: n = B[n]['parent']
    return n
# orteils : tous ramenés sur toe1-1 (un seul « avant-pied »)
def remap(n):
    if n.startswith('toe') and not n.startswith('toe1-1'):
        return 'toe1-1.' + n[-1]
    return kept(n)
head = {n: JP[B[n]['head']] for n in KEEP}; tail = {n: JP[B[n]['tail']] for n in KEEP}

# échelle : jambe (hanche -> cheville) = 87 cm comme le moteur 2D ; sol à y = 0
leg = np.linalg.norm(head['upperleg01.L'] - head['lowerleg01.L']) + np.linalg.norm(head['lowerleg01.L'] - head['foot.L'])
SC = 87.0 / leg
body_idx = sorted({i for f, g in zip(F, G) if g == 'body' for i in f})
y0 = V[body_idx, 1].min()
V = (V - [0, y0, 0]) * SC
for d in (head, tail):
    for n in d: d[n] = (d[n] - [0, y0, 0]) * SC
JP = {k: (v - [0, y0, 0]) * SC for k, v in JP.items()}

yk = head['lowerleg01.L'][1]; yh = head['upperleg01.L'][1]
short_cut = yk + (yh - yk) * .45           # bas du short : un peu au-dessus de mi-cuisse
# ---------- poids ----------
Wt = json.load(open(MH + '/rigs_default_weights.mhw'))['weights']
NV = len(V); BI = {n: i for i, n in enumerate(KEEP)}
acc = [dict() for _ in range(NV)]; raw = [dict() for _ in range(NV)]
for bn, lst in Wt.items():
    k = remap(bn)
    for vi, w in lst:
        acc[vi][k] = acc[vi].get(k, 0) + w; raw[vi][bn] = w

# ---------- faces retenues ----------
parts = {'skin': [], 'short': [], 'hair': [], 'eye': []}
for f, g in zip(F, G):
    if g == 'body': parts['skin'].append(f)
    elif g == 'helper-tights':
        ys = V[f, 1]
        if ys.min() > short_cut and ys.max() < head['spine04'][1] + 1.5: parts['short'].append(f)
    elif g == 'helper-hair':
        parts['hair'].append(f)
    elif g in ('helper-l-eye', 'helper-r-eye'): parts['eye'].append(f)

# ---------- normales (sur la peau) ----------
def normals(faces):
    N = np.zeros((NV, 3))
    for f in faces:
        p = V[f];
        if len(f) == 4:
            n = np.cross(p[2] - p[0], p[3] - p[1])
        else:
            n = np.cross(p[1] - p[0], p[2] - p[0])
        N[f] += n
    l = np.linalg.norm(N, axis=1, keepdims=True); l[l == 0] = 1
    return N / l
N = normals(parts['skin'] + parts['short'] + parts['hair'] + parts['eye'])

# ---------- masques musculaires (peau seulement), lissés ----------
def W(vi, *pre):
    return sum(w for b, w in raw[vi].items() if any(b.startswith(p) for p in pre))
def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
M = ['pec', 'abs', 'obl', 'dos', 'trap', 'lomb', 'glu', 'delt', 'bic', 'tri', 'fa', 'quad', 'isch', 'psoas', 'calf']
mk = np.zeros((NV, 16))
ysh = head['upperarm01.L'][1]; ycl = head['clavicle.L'][1]; ynip = (ysh + head['spine02'][1]) / 2 - 3
ysp3 = head['spine03'][1]; ysp4 = head['spine04'][1]; ysp5 = head['spine05'][1]; ypel = head['upperleg01.L'][1]
xsh = abs(head['upperarm01.L'][0]); ywaist = head['spine04'][1] + .5
for vi in body_idx:
    x, y, z = V[vi]; nx, ny, nz = N[vi]; ax = abs(x)
    arm = W(vi, 'upperarm', 'shoulder01'); fa = W(vi, 'lowerarm', 'wrist')
    trunk = W(vi, 'spine', 'breast', 'clavicle', 'pelvis', 'root')
    up_leg = W(vi, 'upperleg'); lo_leg = W(vi, 'lowerleg')
    fr = ss(.15, .55, nz); bk = ss(.15, .55, -nz)
    # pectoraux : avant du thorax, entre clavicule et bas du pec
    mk[vi, 0] = trunk * fr * ss(ynip - 9, ynip - 4, y) * (1 - ss(ycl - 3, ycl + 1, y)) * ss(1.2, 3.5, ax) * (1 - ss(xsh - 2, xsh + 2, ax))
    # abdominaux : bande centrale
    mk[vi, 1] = trunk * fr * ss(ysp5 - 2, ysp5 + 3, y) * (1 - ss(ynip - 6, ynip - 3, y)) * (1 - ss(6, 9.5, ax))
    # obliques : flancs
    so = ss(.35, .8, abs(nx))
    mk[vi, 2] = trunk * so * ss(ysp5 - 1, ysp5 + 4, y) * (1 - ss(ynip - 8, ynip - 3, y))
    # grand dorsal / dos
    mk[vi, 3] = trunk * bk * ss(ysp3 - 1, ysp3 + 3, y) * (1 - ss(ysh - 4, ysh, y)) * ss(1.5, 4, ax)
    # trapèzes : haut du dos, base du cou
    mk[vi, 4] = (W(vi, 'neck01', 'clavicle', 'spine01') * ss(-.2, .3, -nz + ny * .6)) * ss(ysh - 7, ysh - 2, y) * (1 - ss(ycl + 9, ycl + 13, y))
    # lombaires
    mk[vi, 5] = trunk * bk * ss(ypel + 2, ypel + 5, y) * (1 - ss(ysp3 - 3, ysp3 + 1, y)) * (1 - ss(7, 10, ax))
    # fessiers
    mk[vi, 6] = (W(vi, 'pelvis', 'upperleg01', 'root', 'spine05') * bk) * ss(ypel - 14, ypel - 8, y) * (1 - ss(ypel + 5, ypel + 9, y))
    # deltoïdes : moignon de l'épaule
    dsh = np.linalg.norm(V[vi] - head['upperarm01.L' if x > 0 else 'upperarm01.R'])
    mk[vi, 7] = (1 - ss(7, 12, dsh)) * ss(-.3, .2, ny + abs(nx) * .5) * (W(vi, 'shoulder', 'upperarm01', 'clavicle') > .2)
    # biceps / triceps : avant / arrière du bras (pose A : la flexion du coude se fait vers l'avant)
    mid = (1 - ss(.0, .25, W(vi, 'shoulder01'))) * (1 - ss(.2, .5, fa)) * ss(6, 10, dsh)
    mk[vi, 8] = arm * mid * ss(.05, .5, nz)
    mk[vi, 9] = arm * mid * ss(.05, .5, -nz)
    mk[vi, 10] = fa * (1 - ss(.3, .7, W(vi, 'wrist', 'metacarpal', 'finger')))
    # cuisses : quadriceps devant, ischios derrière, psoas en haut devant
    mk[vi, 11] = up_leg * ss(.0, .45, nz) * (1 - ss(ypel - 4, ypel, y))
    mk[vi, 12] = up_leg * ss(.0, .45, -nz) * (1 - ss(ypel - 10, ypel - 7, y))
    mk[vi, 13] = up_leg * fr * ss(ypel - 12, ypel - 7, y) * (1 - ss(ypel - 1, ypel + 1, y))
    mk[vi, 14] = lo_leg * ss(-.1, .4, -nz) * (1 - ss(.3, .6, W(vi, 'foot', 'toe')))
    # short (tissu) : de mi-cuisse à la taille
    mk[vi, 15] = ss(short_cut - .3, short_cut + .3, y + (2.2 if nz < 0 else 0) * 0) * (1 - ss(ywaist - .25, ywaist + .25, y - nz * 1.2)) * (1 - min(1, arm + fa + W(vi, 'wrist', 'metacarpal', 'finger')))
# lissage laplacien sur le maillage de peau
adj = [set() for _ in range(NV)]
for f in parts['skin']:
    for i in range(len(f)):
        a, b = f[i], f[(i + 1) % len(f)]; adj[a].add(b); adj[b].add(a)
nb = [np.array(sorted(a)) if a else np.array([i]) for i, a in enumerate(adj)]
for it in range(6):
    sm = np.array([.5 * mk[i] + .5 * mk[nb[i]].mean(0) for i in range(NV)])
    mk[:, :15] = sm[:, :15]
sh_ = mk[:, 15].copy(); mk = np.clip(mk / np.maximum(mk.max(0), 1e-6) * 1.15, 0, 1); mk[:, 15] = np.clip(sh_, 0, 1)

# ---------- teintes : sourcils, lèvres, aréoles ----------
col = np.zeros((NV, 4))  # r: sourcils, g: lèvres, b: aréoles, a: cheveux courts
ye = JP['eye.L____head'][1]; ze = JP['eye.L____head'][2]
for vi in body_idx:
    ax_ = abs(V[vi][0]); dy = V[vi][1] - (ye + 2.15 + .4 * ss(1.2, 3.2, ax_) - .7 * ss(3.6, 5.6, ax_))
    col[vi, 0] = (1 - ss(.45, 1.0, abs(dy))) * ss(1.0, 1.7, ax_) * (1 - ss(5.0, 5.9, ax_)) * ss(.15, .5, N[vi][2]) * (V[vi][2] > ze - 2.5)
    col[vi, 1] = min(1, W(vi, 'oris') * 1.6) * ss(.3, .7, N[vi][2])
    x, y, z = V[vi]
    hb = W(vi, 'head', 'temporalis', 'oculi', 'levator', 'eye')
    thr = ye - 3.5 + 8.2 * ss(ze - 10, ze - 3.5, z)
    ear = ss(6.0, 7.2, abs(x)) * (1 - ss(ye + 1.5, ye + 3.5, y)) * (1 - ss(ze - 9, ze - 6, z) * 0)
    col[vi, 3] = (W(vi, 'head', 'neck03', 'temporalis') > .45) * ss(thr - .4, thr + .4, y) * (1 - ear) * (1 - col[vi, 0])
for s in 'LR':
    c = JP['breast.%s____tail' % s] if 'breast.%s____tail' % s in JP else None
    if c is not None:
        d = np.linalg.norm(V[body_idx] - c, axis=1)
        col[body_idx, 2] = np.maximum(col[body_idx, 2], 1 - ss(.9, 1.7, d))
for it in range(1):
    col = np.array([.5 * col[i] + .5 * col[nb[i]].mean(0) for i in range(NV)])
# ceinture du short (canal b, distingué des aréoles par le masque short dans le shader)
for vi in body_idx:
    y, nz = V[vi][1], N[vi][2]
    if mk[vi, 15] > .3: col[vi, 2] = ss(ywaist - 2.4, ywaist - 1.8, y - nz * 1.2)

# ---------- sortie : sommets réindexés, triangles par partie ----------
used = sorted({i for k, p in parts.items() if k in ('skin', 'eye') for f in p for i in f})
re = {v: i for i, v in enumerate(used)}
P = V[used]; NN = N[used]
J4 = np.zeros((len(used), 4), np.uint8); W4 = np.zeros((len(used), 4), np.uint8)
for k, vi in enumerate(used):
    it = sorted(acc[vi].items(), key=lambda t: -t[1])[:4]
    if not it: it = [('head', 1.0)]
    s = sum(w for _, w in it)
    ws = [int(round(w / s * 255)) for _, w in it]; ws[0] += 255 - sum(ws)
    for j, (b, w) in enumerate(it): J4[k, j] = BI[b]; W4[k, j] = ws[j]
tris = {};
for nm, fs in parts.items():
    if nm in ('short', 'hair'): continue
    t = []
    for f in fs:
        f = [re[i] for i in f]
        t += [f[0], f[1], f[2]] + ([f[0], f[2], f[3]] if len(f) == 4 else [])
    tris[nm] = np.array(t, np.uint16)
blob = b''; off = {}
def put(name, arr):
    global blob
    while len(blob) % 4: blob += b'\0'
    off[name] = [len(blob), arr.size, str(arr.dtype)]; blob += arr.tobytes()
put('pos', np.round(P * 50).astype(np.int16).ravel())         # 1/50 cm
put('nrm', np.round(NN * 127).astype(np.int8).ravel())
put('j', J4.ravel()); put('w', W4.ravel())
put('m', np.round(mk[used] * 255).astype(np.uint8).ravel())
put('c', np.round(np.clip(col[used], 0, 1) * 255).astype(np.uint8).ravel())
for nm, t in tris.items(): put('t_' + nm, t)
eyes = {s: ((JP['eye.%s____head' % s] + JP['eye.%s____tail' % s]) / 2).round(3).tolist() for s in 'LR'}
eyer = {}
for s, g in (('L', 'helper-l-eye'), ('R', 'helper-r-eye')):
    idx = sorted({i for f, gg in zip(F, G) if gg == g for i in f}); c = V[idx].mean(0)
    eyes[s] = c.round(3).tolist(); eyer[s] = float(np.linalg.norm(V[idx] - c, axis=1).mean())
meta = {'bones': [{'n': n, 'p': (BI[B[n]['parent']] if B[n]['parent'] else -1), 'h': head[n].round(3).tolist(), 't': tail[n].round(3).tolist()} for n in KEEP],
        'nv': len(used), 'off': off, 'masks': M, 'eyes': eyes, 'eyer': eyer, 'scale': SC,
        'jp': {k: JP[k].round(3).tolist() for k in ['head____tail', 'jaw____tail']}}
open(OUT + '/body.bin', 'wb').write(blob)
json.dump(meta, open(OUT + '/body.json', 'w'))
print('verts', len(used), 'tris', {k: len(v) // 3 for k, v in tris.items()}, 'bytes', len(blob), 'scale', round(SC, 3),
      'height', round(P[:, 1].max(), 1), 'eyer', eyer)
