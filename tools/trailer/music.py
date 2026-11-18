#!/usr/bin/env python3
"""EmberCrown trailer score, synthesised from scratch (no samples): a D-minor drone, harp-like arpeggios,
low drum hits on the scene cuts and a swell into the end card. Writes a 44.1 kHz stereo WAV.
Usage: python3 tools/trailer/music.py out.wav <total_seconds> <cut1> <cut2> ..."""
import sys,wave,numpy as np
SR=44100
out=sys.argv[1];T=float(sys.argv[2]);cuts=[float(x) for x in sys.argv[3:]]
n=int(SR*T);t=np.arange(n)/SR;L=np.zeros(n);R=np.zeros(n)
def hz(m):return 440*2**((m-69)/12)
def env(a,d,length):
    e=np.ones(length);ai=min(length,int(a*SR));e[:ai]=np.linspace(0,1,ai) if ai else e[:ai]
    di=min(length,int(d*SR));e[-di:]*=np.linspace(1,0,di) if di else 1
    return e
def lowpass(x,k):
    y=np.copy(x);a=k
    for i in range(1,len(y)):y[i]=y[i-1]+a*(x[i]-y[i-1])
    return y
# 1. drone pad: D2 + A2 + D3, detuned saws through a slow lowpass swell
pad=np.zeros(n)
for m,amp in [(38,.5),(45,.35),(50,.25)]:
    for det in (-.12,.0,.11):
        f=hz(m+det);pad+=amp*(2*((t*f)%1)-1)
pad/=6
swell=.35+.65*np.clip(t/T,0,1)**1.6
pad=lowpass(pad*swell,.035)
pad*=env(2.5,3.0,n)
L+=pad*.55;R+=pad*.55
# 2. harp arpeggios, 84 bpm eighths, D minor progression
bpm=84;step=60/bpm/2;chords=[[62,65,69,74],[58,62,65,70],[60,64,67,72],[57,61,64,69]]
start=3.2;i=0;tt=start
while tt<T-4.2:
    ch=chords[(i//8)%4];m=ch[[0,1,2,3,2,1,3,2][i%8]]
    if (i//32)%2==1 and i%8 in(3,7):m+=12
    s=int(tt*SR);ln=int(1.6*SR)
    if s+ln>n:ln=n-s
    tl=np.arange(ln)/SR;f=hz(m)
    note=(np.sin(2*np.pi*f*tl)+.35*np.sin(4*np.pi*f*tl)+.12*np.sin(6*np.pi*f*tl))*np.exp(-tl*3.2)
    pan=.5+.35*np.sin(i*.9);g=.16*min(1,(tt-start)/4+.3)
    L[s:s+ln]+=note*g*(1-pan);R[s:s+ln]+=note*g*pan
    tt+=step;i+=1
# 3. drum hits on the cuts, a bigger one on the end card
def drum(at,big=1.0):
    s=int(at*SR);ln=min(int(1.4*SR),n-s)
    if ln<=0:return
    tl=np.arange(ln)/SR;f=55*np.exp(-tl*6)+38
    body=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tl*4.5)
    noise=np.random.default_rng(int(at*100)).standard_normal(ln)*np.exp(-tl*28)*.25
    x=(body+noise)*.55*big
    L[s:s+ln]+=x;R[s:s+ln]+=x
for c in cuts[:-1]:drum(c,.8)
if cuts:drum(cuts[-2] if len(cuts)>1 else cuts[0],1.4)
# 4. a high choir-like shimmer during the last third
sh=np.zeros(n)
for m in (74,77,81):sh+=np.sin(2*np.pi*hz(m)*t+.3*np.sin(2*np.pi*5*t))
sh*=np.clip((t-T*.62)/(T*.2),0,1)*np.clip((T-1.5-t)/2.5,0,1)*.035
L+=sh;R+=sh
# master: gentle compression, fade out
mx=np.maximum(np.abs(L),np.abs(R)).max()
L=np.tanh(L/mx*1.4)*.85;R=np.tanh(R/mx*1.4)*.85
fo=env(.05,3.0,n);L*=fo;R*=fo
d=(np.stack([L,R],1)*32767).astype(np.int16)
with wave.open(out,'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(d.tobytes())
print('wrote',out,round(T,1),'s')
