"""Face atlas: every expression a character can show, drawn as hand-placed pixels (24x16 tiles centred on the head).
The game overlays these at run time, so a guard can blink, squint, gape or faint without redrawing his body."""
from pix import *

FW, FH = 24, 16
EXPR = ['calm', 'blink', 'wary', 'alarm', 'hurt', 'ko', 'focus', 'joy', 'rage', 'shout']

def face(view, expr, st):
    """view: 'down' or 'left'. st: dict(eye, brow, blush, mouth, lash, stache, scar)"""
    cv = Cv(FW, FH); P = lambda x, y, c: cv.put(x, y, c)
    E = hexc(st.get('eye', '#2a1830')); W = hexc('#fff8ec'); B = hexc(st.get('brow', '#3a1f2a'))
    M = hexc(st.get('mouth', '#6a2038')); BL = st.get('blush'); thick = st.get('thick', False)
    mood = expr
    if view == 'down':
        eyes = ((8, 7), (14, 7)); sides = (-1, 1)
    else:  # facing left: near eye in front, far eye tucked toward the back of the head
        eyes = ((6, 7), (11, 7)); sides = (-1, 1)
    def eye(ex, ey, side, k):
        w = 2 if (view == 'down' or k == 0) else 2
        if mood == 'blink' or (mood in ('calm', 'wary', 'focus') and False):
            for i in range(3): P(ex - (1 if view == 'down' and side < 0 else 0) + i - (0), ey + 2, E)
            return
        if mood == 'ko':
            for (dx, dy) in ((0, 0), (1, 1), (2, 2), (2, 0), (0, 2)): P(ex - 1 + dx, ey + dy, E)
            return
        if mood == 'hurt':  # > <
            if side < 0:
                for (dx, dy) in ((0, 0), (1, 1), (0, 2)): P(ex + dx, ey + dy, E)
            else:
                for (dx, dy) in ((2, 0), (1, 1), (2, 2)): P(ex - 1 + dx, ey + dy, E)
            return
        if mood == 'joy':
            for (dx, dy) in ((0, 1), (1, 0), (2, 1)): P(ex - 1 + dx, ey + 1 + dy - 1, E)
            return
        if mood == 'alarm' or mood == 'shout':
            for dx in range(3):
                for dy in range(4): P(ex - 1 + dx, ey - 1 + dy, W)
            for dx in range(2):
                for dy in range(2): P(ex - (0 if side < 0 else 0) + dx - (0), ey + dy, E)
            return
        h = 3
        if mood in ('wary', 'focus'): h = 2
        if mood == 'rage': h = 2
        for dx in range(2):
            for dy in range(h): P(ex + dx, ey + (3 - h) + dy, E)
        P(ex, ey + (3 - h), W)  # glint
        if st.get('lash') and mood != 'rage': P(ex - (1 if side < 0 else -2), ey + (3 - h) - 0, E)
    for k, ((ex, ey), sd) in enumerate(zip(eyes, sides)):
        if view == 'left' and k == 1:
            # far eye: a single column, partly hidden by the cheek
            if mood in ('blink',): P(ex + 1, ey + 2, E)
            elif mood in ('ko', 'hurt'): P(ex + 1, ey + 1, E); P(ex + 1, ey + 2, E)
            else:
                for dy in range(2 if mood in ('wary', 'focus', 'rage') else 3): P(ex + 1, ey + (1 if mood in ('wary', 'focus', 'rage') else 0) + dy, E)
            continue
        eye(ex, ey, sd, k)
    # brows
    def brow(x0, y0, pts):
        for (dx, dy) in pts: 
            P(x0 + dx, y0 + dy, B)
            if thick: P(x0 + dx, y0 + dy + 1 if mood not in ('alarm',) else y0 + dy, B) if False else None
    if view == 'down':
        L, R = (6, 5), (14, 5)
        if mood in ('calm', 'blink'):
            brow(*L, [(1, 0), (2, 0), (3, 0)]); brow(*R, [(0, 0), (1, 0), (2, 0)])
        elif mood == 'wary':
            brow(*L, [(1, 1), (2, 0), (3, 0)]); brow(*R, [(0, 0), (1, 0), (2, 1)]);
            P(8, 5, B); P(15, 5, B)
        elif mood == 'focus':
            brow(*L, [(1, 0), (2, 0), (3, 1)]); brow(*R, [(0, 1), (1, 0), (2, 0)])
        elif mood == 'alarm' or mood == 'shout':
            brow(*L, [(1, 1), (2, 0), (3, -1)]); brow(*R, [(0, -1), (1, 0), (2, 1)]); 
            for (x, y) in ((7, 3), (8, 2), (9, 2), (14, 2), (15, 2), (16, 3)): P(x, y, B)
        elif mood == 'rage':
            brow(*L, [(0, 0), (1, 0), (2, 1), (3, 2)]); brow(*R, [(0, 2), (1, 1), (2, 0), (3, 0)])
            P(9, 7, B); P(14, 7, B)
        elif mood == 'hurt':
            brow(*L, [(1, 1), (2, 0), (3, -1)]); brow(*R, [(0, -1), (1, 0), (2, 1)])
        elif mood == 'joy':
            brow(*L, [(1, 0), (2, -1), (3, 0)]); brow(*R, [(0, 0), (1, -1), (2, 0)])
        elif mood == 'ko':
            pass
    else:
        if mood in ('calm', 'blink', 'joy'): brow(5, 5, [(0, 0), (1, 0), (2, 0)]); brow(10, 5, [(0, 0), (1, 0)])
        elif mood in ('wary', 'focus'): brow(5, 5, [(0, 0), (1, 0), (2, 1)]); brow(10, 5, [(0, 0), (1, 1)])
        elif mood in ('alarm', 'shout', 'hurt'): brow(5, 4, [(0, 1), (1, 0), (2, -1)]); brow(10, 3, [(0, 0), (1, 0)])
        elif mood == 'rage': brow(5, 5, [(0, 0), (1, 1), (2, 2)]); brow(10, 6, [(0, 1), (1, 0)])
    # cheeks
    if BL and mood not in ('rage',):
        for (x, y) in (((5, 11), (6, 11), (17, 11), (18, 11)) if view == 'down' else ((3, 11), (4, 11), (10, 11))): P(x, y, hexc(BL))
    # mouth
    if view == 'down':
        mx, my = 11, 12
        if mood in ('calm', 'blink'): P(mx, my, M); P(mx + 1, my, M)
        elif mood == 'wary': P(mx, my, M); P(mx + 1, my, M); P(mx + 2, my - 1, M) if False else None
        elif mood == 'focus': P(mx, my, M); P(mx + 1, my, M); P(mx + 2, my - 1, M)
        elif mood == 'alarm': P(mx, my - 1, M); P(mx + 1, my - 1, M); P(mx, my, M); P(mx + 1, my, M); P(mx, my + 1, M); P(mx + 1, my + 1, M)
        elif mood == 'shout':
            for dx in range(4):
                for dy in range(3): P(mx - 1 + dx, my - 1 + dy, hexc('#3a1020'))
            for dx in range(2): P(mx + dx, my + 1, hexc('#d8566a'))
        elif mood == 'hurt': P(mx - 1, my, M); P(mx, my + 1, M); P(mx + 1, my, M); P(mx + 2, my + 1, M)
        elif mood == 'ko': P(mx, my, M); P(mx + 1, my, M); P(mx, my + 1, M); P(mx + 1, my + 1, M)
        elif mood == 'joy': P(mx - 1, my, M); P(mx + 2, my, M); P(mx, my + 1, M); P(mx + 1, my + 1, M); P(mx, my, hexc('#fff8ec')) if False else None
        elif mood == 'rage':
            for dx in range(4): P(mx - 1 + dx, my, hexc('#fff8ec')); 
            for dx in range(4): P(mx - 1 + dx, my - 1, M); P(mx - 1 + dx, my + 1, M)
    else:
        mx, my = 3, 12
        if mood in ('calm', 'blink', 'wary', 'focus', 'joy'): P(mx, my, M); P(mx + 1, my, M)
        elif mood in ('alarm', 'shout'): P(mx, my - 1, M); P(mx, my, M); P(mx + 1, my, M); P(mx, my + 1, M)
        elif mood in ('hurt', 'ko'): P(mx, my, M); P(mx + 1, my + 1, M)
        elif mood == 'rage': P(mx, my, hexc('#fff8ec')); P(mx + 1, my, M); P(mx, my - 1, M)
    if st.get('stache') and view == 'down':
        S = hexc(st['stache'])
        for x in range(8, 16): P(x, 11, S)
        for x in (8, 15): P(x, 12, S)
        for x in range(9, 15): P(x, 10, S) if x in (9, 14) else None
    elif st.get('stache') and view == 'left':
        S = hexc(st['stache'])
        for x in range(1, 7): P(x, 11, S)
        P(1, 12, S)
    return cv

def atlas(st):
    rows = []
    for view in ('down', 'left'):
        for e in EXPR: rows.append(face(view, e, st))
    return sheet(rows, len(EXPR), FW, FH), len(EXPR)
