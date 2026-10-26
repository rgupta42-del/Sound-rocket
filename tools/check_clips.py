import subprocess,numpy as np,glob,os,sys
SR=16000;W=320
for p in sorted(glob.glob(sys.argv[1])):
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',p,'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    a=np.frombuffer(raw,dtype=np.int16)/32767
    out=[]
    for i in range(0,len(a)-W,W):
        x=a[i:i+W];e=np.sqrt(np.mean(x**2))
        if e<0.01: out.append('..');continue
        X=np.abs(np.fft.rfft(x*np.hanning(W)))**2;f=np.fft.rfftfreq(W,1/SR);c=(X*f).sum()/X.sum()
        ac=np.correlate(x,x,'full')[W-1:];per=ac[40:230].max()/ac[0]
        out.append(('V' if per>0.5 else 'u')+str(min(9,int(c/600))))
    print(f"{os.path.basename(p)[:-4]:8} {len(a)/SR:.2f}s {''.join(o[0] for o in out)}  c:{''.join(o[1] for o in out)}")
