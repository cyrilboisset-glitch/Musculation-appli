import sys,base64
sp=sys.argv[1];f='/home/user/Musculation-appli/Muscu_maison.html';s=open(f,encoding='utf-8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
rep("p.views.forEach(V=>{if(V.dirty)build(p,V);V.gS.innerHTML=","if(p.r3)p.views.forEach(V=>R3.draw(p,V,r));else p.views.forEach(V=>{if(V.dirty)build(p,V);V.gS.innerHTML=")
rep("function mount(el,name,o){o=o||{};stop(el);const X=A[name];if(!X){el.hidden=true;return null}prep(X);const F=fit(X);el.hidden=false;\n const big=!!o.big,specs=o.views||(big?[PRE.tq]:X.V.map(k=>PRE[k])),",
    "function mount(el,name,o){o=o||{};stop(el);const X=A[name];if(!X){el.hidden=true;return null}prep(X);const F=fit(X);el.hidden=false;\n const r3=!!(window.R3&&R3.ok()),big=!!o.big,specs=o.views||(big||r3?[PRE.tq]:X.V.map(k=>PRE[k])),")
rep("const sv=specs.map(()=>`<figure class=\"vf\"><svg class=\"anv${big?' big':''}\"",
    "const sv=r3?specs.map(()=>`<figure class=\"vf\"><canvas class=\"anv r3${big?' big':''}\" role=\"img\" aria-label=\"${name}\"></canvas><figcaption></figcaption></figure>`).join(''):specs.map(()=>`<figure class=\"vf\"><svg class=\"anv${big?' big':''}\"")
rep("<button class=\"anb on\" data-ag aria-label=\"Afficher les angles\">📐</button>","${r3?'<button class=\"anb on\" data-ag aria-label=\"Allumer les muscles\">✨</button>':'<button class=\"anb on\" data-ag aria-label=\"Afficher les angles\">📐</button>'}")
rep("const svgs=[].slice.call(el.querySelectorAll('svg.anv'))","const svgs=[].slice.call(el.querySelectorAll('.anv'))")
rep("const p={el:el,X:X,F:F,t:0,sp:1,ps:false,vis:!io,li:-1,lr:-1,auto:false,big:big,ang:!o.mini,tr:!o.mini&&!!X.tr,",
    "const p={el:el,X:X,F:F,t:0,sp:1,ps:false,vis:!io,li:-1,lr:-1,auto:false,big:big,ang:r3||!o.mini,tr:!r3&&!o.mini&&!!X.tr,r3:r3,name:name,mir:!!o.mirror,tr3:el.id=='ta',")
rep("if(!ids().length&&moved<8){if(down&&p.tap){p.tap(down);tapT=0}","if(!ids().length&&moved<8){if(p.tap3&&p.tap3(V,e)){tapT=0}else if(down&&p.tap){p.tap(down);tapT=0}")
rep("function picker(el,cfg){stop(el);const k=pkPose();",
 """function picker(el,cfg){stop(el);const k=pkPose();
 if(window.R3&&R3.ok()){el.innerHTML=[0,1].map(()=>'<figure class="vf"><canvas class="anv pk r3" role="img" aria-label="Mannequin : touche un muscle"></canvas><figcaption></figcaption></figure>').join('');
  const cs=[].slice.call(el.querySelectorAll('canvas')),caps=[].slice.call(el.querySelectorAll('figcaption'));
  const p={el:el,big:false,t:0,sp:1,ps:false,vis:!io,auto:false,pk3:true,k:k,
   views:[[90,4],[270,4]].map((s,i)=>({yaw:s[0],pitch:s[1],z:1,px:0,py:0,home:s,dirty:true,tw:null,svg:cs[i],cap:caps[i],bw:96,bh:150})),
   render:(p,V)=>R3.drawPk(p,V,k,cfg.has),
   tap3:(V,e)=>{const m=R3.pick(p,V,k,e.clientX,e.clientY);if(m){cfg.toggle(m);return true}return false}};
  el._an=p;PL.add(p);io&&io.observe(el);p.views.forEach(V=>{gest(p,V)});
  if(!run){run=1;last=0;requestAnimationFrame(loop)}return p}""")
rep("return{A:A,mount:mount,","return{A:A,at:at,boxes:boxes,K:K,vname:vname,repaint:()=>PL.forEach(p=>{if(p.pk3)p.views.forEach(V=>{V.dirty=true})}),mount:mount,")
rep("document.querySelectorAll('[data-pm]').forEach(b=>b.classList.toggle('on',(b.closest('#s4')?dsel:sel).has(b.dataset.pm)));",
    "document.querySelectorAll('[data-pm]').forEach(b=>b.classList.toggle('on',(b.closest('#s4')?dsel:sel).has(b.dataset.pm)));if(AN.repaint)AN.repaint();")
css="""canvas.anv{display:block;width:100%;height:clamp(230px,66vw,330px);max-height:none;border-radius:10px;touch-action:pan-y;background:#0F0E0D}
.bgv canvas.anv{height:100%;border-radius:0}#ta canvas.anv{height:min(36vh,320px);max-height:none;background:transparent}
canvas.anv.pk{height:clamp(280px,86vw,440px)}
"""
rep("</style></head>",css+"</style></head>")
v=sp+'/v3d/'
three=open(v+'three.bundle.js',encoding='utf-8').read().replace('</script','<\\/script')
blob=base64.b64encode(open(v+'body.bin','rb').read()).decode()
blob='\n'.join(blob[i:i+4096] for i in range(0,len(blob),4096))
pre=('<script>'+three+'</script>\n<script type="application/json" id="bodymeta">'+open(v+'body.json').read()+'</script>\n'
     '<script type="text/plain" id="bodybin">\n'+blob+'\n</script>\n')
i=s.index("<script>\nif(!Array.prototype.flatMap)");s=s[:i]+pre+s[i:]
j=s.index("</script>",s.index("var AN=(()=>{"))+len("</script>")
s=s[:j]+"\n<script>\n"+open(v+'real3.js',encoding='utf-8').read()+"\n</script>"+s[j:]
open(f,'w',encoding='utf-8').write(s);print(len(s))
