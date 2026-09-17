const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {spawn}=require('child_process'),fs=require('fs');
GlobalFonts.registerFromPath('fonts/NimbusSans-Regular.otf','Sans');GlobalFonts.registerFromPath('fonts/NimbusSans-Bold.otf','Bold');GlobalFonts.registerFromPath('fonts/DejaVuSansMono.ttf','Mono');
const W=1536,H=1920,FPS=60,D=31.9,cv=createCanvas(W,H),c=cv.getContext('2d');
const C={ink:'#232524',muted:'#888a85',line:'#deded7',paper:'#fbfbf8',copper:'#b17d49',red:'#893a43',green:'#376d52',mint:'#aac1ac'};
const names=['ARTHUR','JOHN','FINN','CHARLIE','ABERAMA','CURLY','BONNIE','ISAIAH','ALFIE'];
const roles=['SCOUT','HOLDERS','ANALYSIS','FILTER','LIQUIDITY','RISK','TIMING','EXECUTION','AUDIT'];
const colors=['#849747','#b58c59','#467d75','#7b486b','#ac934c','#923e45','#568479','#bb703d','#79776c'];
const base=[[220,327],[540,949],[860,327],[140,540],[140,760],[940,540],[940,760],[303,950],[777,950]];
const events=[[0,0,'PONS candidate detected'],[1,0,'Signal packet assembled'],[2,1,'Holder snapshot checked'],[3,1,'Concentration mapped'],[4,2,'Momentum confirmed'],[5,2,'Evidence sent to CHARLIE'],[6,3,'Paid noise removed'],[7,3,'Organic signal isolated'],[8,4,'Exit depth modelled'],[9,4,'Slippage reviewed'],[10,6,'Entry window tagged'],[11,6,'Timing sent to CURLY'],[12,5,'Risk limit applied'],[13,5,'Position size reduced'],[14,5,'Entry held for retest'],[15,5,'Exit first / wait'],[16,4,'Available exit rechecked'],[17,4,'Liquidity constraints met'],[18,5,'Risk objection closed'],[19,9,'Consensus assembled'],[20,9,'Execution plan approved'],[21,7,'Order submitted'],[22,7,'Position filled'],[23,8,'Fill recorded'],[24,4,'Open exit rechecked'],[25,7,'Position closed'],[26,8,'Profit recorded'],[27,8,'Audit trail sealed'],[28,9,'All positions settled'],[29,9,'Session complete'],[30,9,'Colony synchronized'],[31,9,'Ready for next session']];
const equity=[500,536,618,589,814,1068,924,1426,1913,1652,2494,3189,2816,3930,4671,4182,4210,4320,4580,6117,7658,6981,8436,9972,9062,11541,12888,11742,15136,13978,16541,17712];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const slopes=equity.map((v,i)=>{let a=i?v-equity[i-1]:equity[1]-v,b=i<31?equity[i+1]-v:a;return a*b<=0?0:2*a*b/(a+b)});
function value(p){let z=clamp(p)*31,i=Math.min(30,Math.floor(z)),u=z-i;return(2*u**3-3*u*u+1)*equity[i]+(u**3-2*u*u+u)*slopes[i]+(-2*u**3+3*u*u)*equity[i+1]+(u**3-u*u)*slopes[i+1]}
function money(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function txt(s,x,y,size=18,col=C.ink,font='Sans',align='left'){c.font=`${size}px ${font}`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=col;c.fillText(s,x,y)}
function mono(s,x,y,size=11,col=C.muted,align='left'){txt(s,x,y,size,col,'Mono',align)}
function rr(x,y,w,h,r=8,fill='white',stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.stroke()}}
function path(pts,col=C.line,w=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()}
function line(x,y,xx,yy,col=C.line,w=1){path([[x,y],[xx,yy]],col,w)}
function dot(x,y,r,col,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(col){c.fillStyle=col;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
function ellipse(x,y,rx,ry,a,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,a,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.stroke()}}
function glow(x,y,r,col,a=.25){c.save();c.globalAlpha=a;let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
function cubic(a,b,d,e,u){let v=1-u;return[v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*d[0]+u*u*u*e[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*d[1]+u*u*u*e[1]]}
let bossImg,agentSheet,agents=[],bossCloud=[];
let seed=319;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
const particles=Array.from({length:1900},()=>({a:rand()*Math.PI*2,b:rand()*Math.PI*2,r:rand(),s:rand(),ph:rand()*10}));
const ringEdges=[[0,1],[1,2],[2,5],[5,6],[6,8],[8,7],[7,4],[4,3],[3,0],[0,5],[2,4],[1,8]];
function pos(i,t){return[base[i][0]+Math.sin(t*.43+i*1.7)*3,base[i][1]+Math.sin(t*.73+i*.81)*4]}
function bossPose(t){return{x:540+Math.sin(t*.32)*6,y:616+Math.sin(t*.71)*4,angle:Math.sin(t*.43)*.025,s:1+.10*(1-smooth(t/2))}}
function activity(i,t){let a=0;for(let e of events){if(e[1]===i){let d=t-e[0];if(d>-.2&&d<1.5)a=Math.max(a,smooth((d+.2)/.3)*(1-smooth((d-.6)/.9)))}}return a}
function wing(t,side,big,col){let beat=.20+.80*(.5+.5*Math.sin(t*(big?37:49)+side*.8));c.save();c.translate(side*(big?66:28),big?145:36);c.rotate(side*(.25+beat*.35));c.scale(side,1);let g=c.createLinearGradient(0,0,150,-90);g.addColorStop(0,col+'46');g.addColorStop(1,'#f6f1e988');c.beginPath();c.moveTo(0,0);c.bezierCurveTo(42,-65*beat,155,-99*beat,171,-58*beat);c.bezierCurveTo(155,-14*beat,50,16,0,0);c.fillStyle=g;c.fill();c.strokeStyle=col+'70';c.lineWidth=.7;c.stroke();for(let j=1;j<6;j++){let u=j/6;path([[0,0],[63*u,-26*beat],[160*u,-66*beat+15]],col+'49',.5)}c.restore()}
function legs(t,big,col){let s=big?1:.38;for(let side of [-1,1])for(let j=0;j<3;j++){let x=side*(46+j*6)*s,y=(big?167:52)+j*4*s,a=t*1.5+j+side,bend=side*(92+j*22)*s,yy=y+(26+j*15)*s,tip=side*(100+j*24+Math.sin(a)*8)*s,ty=yy+(20+j*12)*s;path([[x,y],[bend,yy],[tip,ty]],col,big?2.1:1);path([[x,y],[bend,yy]],'#c4b9a3',big?.65:.4);dot(bend,yy,big?3:1.5,'#524c45','#c4b9a3')}}
function portrait(i,t,x,y,a){c.save();c.translate(x,y);let tilt=Math.sin(t*.7+i)*.028;c.rotate(tilt);glow(0,9,78,colors[i],.08+a*.27);ellipse(0,74,54,7,0,'#5043340b');c.save();c.scale(.40,.40);wing(t+i*.2,-1,false,colors[i]);wing(t+i*.2,1,false,colors[i]);c.restore();legs(t+i,false,'#544c42');c.drawImage(agents[i],-65,-67,130,130);c.restore();
 let pulse=(t-i*.14)%1.45;if(a>.2){c.save();c.globalAlpha=a*(1-pulse/1.45)*.35;ellipse(x,y+8,69+pulse*16,75+pulse*16,0,null,colors[i]);c.restore()}
 rr(x-67,y+84,134,23,4,a>.15?colors[i]+'12':'#ffffffeb',a>.15?colors[i]+'88':'#dedad1');txt(names[i],x,y+100,14,colors[i],'Bold','center');mono(roles[i],x,y+120,9,C.muted,'center');dot(x-58,y-68,8,'white','#d8d1c5');mono(String(i+1).padStart(2,'0'),x-58,y-65,7,C.muted,'center');}
function paths(t){const h=bossPose(t);let active=events[Math.min(31,Math.floor(t))][1];
 for(let i=0;i<9;i++){let n=pos(i,t),dx=h.x-n[0],dy=h.y-n[1],len=Math.hypot(dx,dy),end=[h.x-dx/len*175,h.y-dy/len*197],bend=[n[0]+dx*.34+(i%2?23:-23),n[1]+dy*.2],b2=[end[0]-dx*.12,end[1]-dy*.22],pts=[];for(let j=0;j<=65;j++)pts.push(cubic(n,bend,b2,end,j/65));let a=activity(i,t);path(pts,a>.1?colors[i]+'8c':'#b8a58b80',a>.1?1.7:.9);
 for(let j=0;j<3;j++){let u=(t*(.34+i*.015)+j/3+i*.09)%1,p=cubic(n,bend,b2,end,u);glow(...p,7,colors[i],.12);dot(...p,a>.1?3.2:2,colors[i]);}
 }
 for(let [k,[i,j]] of ringEdges.entries()){let a=pos(i,t),b=pos(j,t),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],cx=mid[0]+(540-mid[0])*.23,cy=mid[1]+(615-mid[1])*.12,pa=[a,[cx,cy],[cx,cy],b],pts=[];for(let k=0;k<=70;k++)pts.push(cubic(...pa,k/70));path(pts,'#b49b786a',.7);for(let n=0;n<2;n++){let u=(t*(.23+k*.007)+n*.5+k*.13)%1;let p=cubic(...pa,u);dot(...p,1.8,colors[i])}}
}
function neuralField(t){let hold=t>=14&&t<19;for(let j=0;j<particles.length;j++){let n=particles[j],a=n.a+t*.16,b=n.b+t*.07,rad=173+50*n.r,xx=Math.cos(a)*Math.sin(b)*rad,zz=Math.sin(a)*Math.sin(b)*rad,yy=Math.cos(b)*rad*1.19,d=760/(760-zz);let x=540+xx*d,y=615+yy*d;c.globalAlpha=(.12+.20*n.s)*(zz>0?.7:1);c.fillStyle=hold&&j%5===0?C.red:j%3===0?C.copper:'#8f9a8d';c.fillRect(x,y,.65+n.s, .65+n.s)}c.globalAlpha=1;
 for(let k=0;k<5;k++){let pts=[];for(let j=0;j<=160;j++){let a=j/160*Math.PI*2,xx=Math.cos(a)*(187+k*10),zz=Math.sin(a)*(120+k*8),yy=Math.sin(a)*59*Math.sin(t*.18+k*.53)+Math.cos(a)*90*Math.cos(t*.14+k);let d=900/(900-zz);pts.push([540+xx*d,615+yy*d])}path(pts,hold?'#94454f26':'#b795642d',.7)}
}
function smoke(t){const x=122,y=67;glow(x,y,5,'#d77333',.4+.08*Math.sin(t*2.3));for(let j=0;j<19;j++){let age=(t*.38+j/19)%1;let pts=[];for(let k=0;k<=16;k++){let u=k/16,v=age+u*.21;let xx=x+Math.sin(v*8+t*.43+j*.23)*14*v+v*20,yy=y-v*139;pts.push([xx,yy])}c.save();c.globalAlpha=(1-age)*.135;path(pts,'#655d54',.7+age*2.4);c.restore()}}
function boss(t){let h=bossPose(t);c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.scale(h.s,h.s);glow(0,-10,210,C.copper,.075);wing(t,-1,true,'#80684f');wing(t,1,true,'#80684f');legs(t,true,'#423d38');
 let gather=1-smooth(t/1.5);c.save();c.globalAlpha=1-gather*.65;c.drawImage(bossImg,-180,-216,360,432);c.restore();
 if(gather>.001){for(let n of bossCloud){let u=gather*(24+55*n.r),x=n.x+Math.cos(n.ph+t)*u,y=n.y+Math.sin(n.ph+t)*u;c.globalAlpha=gather*.7;c.fillStyle=n.col;c.fillRect(x,y,1.2+n.r,1.2+n.r)}c.globalAlpha=1}
 smoke(t);c.restore();
 let hold=t>=14&&t<19;rr(405,865,270,54,7,'#ffffffee',hold?'#b9858b':'#cbbda9');txt('TOMMY',540,887,18,C.ink,'Bold','center');mono(hold?'THE BOSS / AWAITING EXIT':t>=29?'THE BOSS / SESSION CLOSED':'THE BOSS / COLONY BRAIN',540,906,9,hold?C.red:C.copper,'center');
 if(hold){c.save();c.globalAlpha=.4;let r=209+(t%1)*16;ellipse(h.x,h.y,r,r*1.12,0,null,C.red);c.restore()}
}
function background(t){c.fillStyle='#fff';c.fillRect(0,0,1080,1350);for(let y=249;y<1054;y+=23){let off=(t*13+y*.17)%71;for(let x=32;x<1048;x+=71){c.fillStyle='#cec8bb24';c.fillRect(x+off,y,1,1)}}
 let phrases=['SCOPE > TRACE / CANDIDATE','PRISM > CHARLIE / MOMENTUM','GAUGE > CURLY / EXIT DEPTH','VECTOR > EXEC / ENTRY','ARCHIVE > TOMMY / AUDIT'];
 c.save();c.beginPath();c.rect(28,236,1024,813);c.clip();for(let j=0;j<12;j++){let y=260+j*65,x=27-((t*15+j*89)%310);c.globalAlpha=.10;mono(phrases[j%5]+'    /    '+String(Math.floor(t*4+j)).padStart(3,'0'),x,y,8,C.copper);mono(phrases[(j+2)%5],x+650,y+8,8,C.copper)}c.restore();
}
function brand(t,p){
 c.save();c.translate(52,48);c.rotate(-.16);ellipse(-9,-8,12,19,-.7,'#d7c7ae');ellipse(9,-8,12,19,.7,'#ccb391');dot(0,6,10,C.ink);line(0,10,0,23,C.ink,3);c.restore();
 txt('BUZZCORE',88,62,43,C.ink,'Bold');mono('THE SYNDICATE',352,60,12,C.red);mono('tim777',1048,43,16,C.ink,'right');mono('@0xTimQ',1048,64,12,C.copper,'right');mono('TEN MINDS. ONE INSTINCT.',32,91,11,C.muted);mono('COLONY / 001',1048,91,11,C.muted,'right');line(32,105,1048,105,C.ink,1.2);
 mono('PONS / ROBINHOOD',32,130,12,C.red);txt('+'+money(value(p)-500),29,182,49,C.green,'Bold');mono('SESSION PROFIT / USD',32,204,10,C.muted);
 line(440,123,440,206);mono('CAPITAL',466,133,11,C.muted);txt(money(value(p)),466,174,33,C.ink,'Bold');mono('OPEN  $500.00',466,202,11,C.muted);
 line(737,123,737,206);mono('COLONY CONSENSUS',762,133,11,C.muted);let i=Math.min(31,Math.floor(t)),ev=events[i],name=ev[1]===9?'TOMMY':names[ev[1]];txt(name,762,170,27,C.ink,'Bold');mono(t>=29?'13H / CLOSED':t>=14&&t<19?'EXIT CHECK / HOLD':'10 CONNECTED MINDS',762,199,11,t>=14&&t<19?C.red:C.copper);
 line(32,222,1048,222);mono('THE COLONY',32,242,11,C.ink);mono(t>=29?'ALL POSITIONS SETTLED':t>=14&&t<19?'CURLY REQUESTED A SECOND EXIT CHECK':'EVIDENCE IN → DECISIONS OUT',1048,242,10,C.muted,'right');
}
function consensus(t){let y=1020;mono('TOMMY / CONSENSUS BUS',540,y-15,8,C.copper,'center');for(let i=0;i<9;i++){let a=activity(i,t);dot(484+i*14,y,3.2,a>.1?colors[i]:'#fff',a>.1?colors[i]:'#cfc3b3');if(a>.1)glow(484+i*14,y,8,colors[i],a*.2)}}
function bottom(t,p){let y=1095;line(32,1073,1048,1073,C.ink,1);mono('CAPITAL TRACE',32,y,12,C.ink);mono('13H / USD',604,y,10,C.muted,'right');mono('OPERATIONS LEDGER',649,y,12,C.ink);mono('AUDITED ROUTE',1048,y,9,C.muted,'right');
 let l=39,r=554,top=1120,bot=1258,high=20000;for(let j=0;j<5;j++){let yy=top+(bot-top)*j/4;line(l,yy,r,yy,'#eae6df');mono(j===4?'$0':'$'+(20-j*5)+'k',605,yy+4,8,C.muted,'right')}
 let pts=[];for(let j=0;j<=350;j++){let q=p*j/350;pts.push([l+(r-l)*q,bot-(bot-top)*value(q)/high])}c.beginPath();c.moveTo(l,bot);pts.forEach(q=>c.lineTo(...q));c.lineTo(pts.at(-1)[0],bot);c.closePath();let g=c.createLinearGradient(0,top,0,bot);g.addColorStop(0,'#ccac7650');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fill();path(pts,'#806341',2);let z=pts.at(-1);glow(...z,13,'#c2674d',.25);dot(...z,4,'#b54c40');rr(clamp(z[0]-48,40,496),z[1]-26,100,20,3,C.ink);mono(money(value(p)),clamp(z[0]-48,40,496)+50,z[1]-12,10,'white','center');for(let j=0;j<5;j++)mono(['00:00','03:15','06:30','09:45','13:00'][j],l+(r-l)*j/4,1276,8,C.muted,j?'center':'left');
 let idx=Math.min(31,Math.floor(t)),start=Math.max(0,idx-4);for(let j=start;j<=idx;j++){let yy=1127+(j-start)*34,e=events[j],nm=e[1]===9?'TOMMY':names[e[1]],col=e[1]===9?C.copper:colors[e[1]];if(j===idx)rr(639,yy-17,409,30,3,'#f7f2ea');mono(String(j).padStart(2,'0')+' /',649,yy,9,C.muted);txt(nm,688,yy,11,col,'Bold');txt(e[2],764,yy,10,C.ink);line(649,yy+13,1048,yy+13,'#eeeae3',.5)}
 line(32,1300,1048,1300,C.ink,.9);mono('BUZZCORE / THE SYNDICATE',32,1326,11,C.ink);mono('tim777 / @0xTimQ',1048,1326,11,C.copper,'right');
}
function render(t){c.setTransform(1,0,0,1,0,0);c.scale(W/1080,H/1350);let p=clamp(t/29);background(t);paths(t);neuralField(t);boss(t);for(let i=0;i<9;i++){let q=pos(i,t);portrait(i,t,...q,activity(i,t))}consensus(t);brand(t,p);bottom(t,p)}

function bossPose(t){return{x:540+Math.sin(t*.53)*5,y:548+Math.sin(t*.97)*8,angle:Math.sin(t*.65)*.033,s:1+.035*Math.exp(-t*1.5)}}
function pos(i,t){let a=activity(i,t),q=t*.85+i*1.8;return[base[i][0]+Math.sin(q)*6+a*Math.sin(t*3+i)*2,base[i][1]+Math.cos(q*.87)*6-a*5]}
function arc(x,y,r,a,b,col,w=1,sy=1){c.save();c.translate(x,y);c.scale(1,sy);c.beginPath();c.arc(0,0,r,a,b);c.lineWidth=w;c.strokeStyle=col;c.stroke();c.restore()}
function wings(t,x,y,size,col,phase=0){
 c.save();c.translate(x,y);
 for(let side of [-1,1]){let flap=.34+.66*(.5+.5*Math.sin(t*35+phase+side*.35));
  for(let ghost=2;ghost>=0;ghost--){c.save();c.scale(side*size,size);c.rotate(-.32+(flap+ghost*.08)*.55);c.globalAlpha=ghost? .09:.60;
   let g=c.createLinearGradient(0,0,200,-75);g.addColorStop(0,col+'88');g.addColorStop(.6,'#cbdcdd83');g.addColorStop(1,'#fff9e6aa');
   c.beginPath();c.moveTo(0,0);c.bezierCurveTo(25,-55*flap,160,-122*flap,204,-91*flap);c.bezierCurveTo(237,-59*flap,96,29,0,0);c.fillStyle=g;c.fill();c.strokeStyle=col+'99';c.lineWidth=1.3;c.stroke();
   for(let j=1;j<8;j++){let v=j/8;path([[0,0],[60,-25*flap],[205*v,-92*flap*(.3+.7*v)]],col+'75',.7)}
   path([[12,-2],[82,-49*flap],[177,-89*flap]],'#ffffffbd',2);c.restore();
  }
 }
 c.restore();
}
function pulseTrails(t){
 for(let i=0;i<9;i++){
  let a=pos(i,t),h=bossPose(t),dx=h.x-a[0],dy=h.y-a[1],l=Math.hypot(dx,dy),end=[h.x-dx/l*162,h.y-dy/l*190],bb=[a[0]+dx*.36+Math.sin(i)*45,a[1]+dy*.12],dd=[end[0]-dx*.18,end[1]-dy*.2];
  let on=activity(i,t),pts=[];for(let j=0;j<=40;j++)pts.push(cubic(a,bb,dd,end,j/40));path(pts,colors[i]+'50',1.4);
  for(let k=0;k<3;k++){let u=(t*(.48+i*.018)+i*.079+k/3)%1;let trail=[];for(let z=0;z<12;z++)trail.push(cubic(a,bb,dd,end,clamp(u-z*.006)));path(trail,colors[i]+(on>.1?'bc':'76'),on>.1?3.5:2);let p=cubic(a,bb,dd,end,u);dot(...p,on>.1?4:2.5,colors[i]);dot(p[0]-.7,p[1]-.7,1.2,'white');}
 }
 for(let k=0;k<9;k++){let j=(k+3)%9,a=pos(k,t),b=pos(j,t),bb=[(a[0]+b[0])/2,585+(k%2?60:-60)];let pa=[a,bb,bb,b],pts=[];for(let n=0;n<=35;n++)pts.push(cubic(...pa,n/35));path(pts,'#bfa57c38',.8);let u=(t*.32+k*.23)%1,p=cubic(...pa,u);dot(...p,2.4,C.copper);}
}

function periodScene(t){
 c.save();c.beginPath();c.rect(24,249,1032,809);c.clip();
 // Pale, engraved Birmingham skyline: depth comes from three parallax planes.
 let drift=Math.sin(t*.16)*5;
 for(let side of [-1,1]){
  c.save();c.translate(side<0?25+drift:1055-drift,0);c.scale(side<0?1:-1,1);
  for(let j=0;j<5;j++){let x=j*37,y=343+(j%3)*42,w=56,h=464-y;
   rr(x,y,w,h+303,0,'#a5978211');path([[x-3,y],[x+28,y-27],[x+w+3,y]],'#96856a24',1.2);
   for(let yy=y+20;yy<760;yy+=38)for(let xx=x+8;xx<x+w-6;xx+=19){rr(xx,yy,11,21,4,'#9d887519','#96857020');line(xx+5,yy,xx+5,yy+20,'#9f89681c',.6);}
   for(let yy=y+14;yy<766;yy+=12){line(x,yy,x+w,yy,'#a58d6d10',.6)}
  }
  // Tall factory stacks and softened continuously curling smoke.
  for(let j=0;j<3;j++){let x=62+j*66,yy=308+j*24;rr(x,yy,12,190,0,'#937b5d18');rr(x-3,yy-3,18,6,1,'#8d725c24');
   for(let n=0;n<8;n++){let u=(t*.075+n/8+j*.12)%1,xx=x+7+u*57+Math.sin(u*6+t*.3)*8,yyy=yy-u*142;let g=c.createRadialGradient(xx,yyy,0,xx,yyy,13+u*37);g.addColorStop(0,'#8b807513');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(xx-52,yyy-52,104,104);}
  }
  c.restore();
 }
 // Perspective cobbled street.
 let van=[540,732];for(let j=-12;j<=12;j++){line(van[0]+j*7,van[1],540+j*76,1060,'#a9927213',.7)}
 for(let j=0;j<13;j++){let u=j/12,y=740+u*u*330;line(27,y,1053,y,'#af94721a',.7)}
 // Gas lamps at the edges, with a restrained amber flicker.
 for(let x of [57,1023]){let y=493;line(x,y+27,x,883,'#74604b48',3);path([[x-10,y+27],[x-15,y-9],[x,y-21],[x+15,y-9],[x+10,y+27],[x-10,y+27]],'#66554065',1.3);rr(x-8,y-7,16,26,2,'#e8ba6157');line(x-18,y-12,x+18,y-12,'#66554065',1.7);glow(x,y+5,65,'#e7b64e',.24+.025*Math.sin(t*3.7+x));dot(x,y+4,4,'#e0b471');}
 // Art-deco theatre frame, a light etched brass arch framing the boss.
 c.beginPath();c.moveTo(294,857);c.lineTo(294,485);c.bezierCurveTo(294,271,786,271,786,485);c.lineTo(786,857);c.strokeStyle='#b6915027';c.lineWidth=2;c.stroke();
 // Wisps of street mist pass slowly across the scene.
 for(let j=0;j<4;j++){let x=160+j*255+Math.sin(t*.20+j)*70,y=794+j%2*125;let g=c.createRadialGradient(x,y,10,x,y,170);g.addColorStop(0,'#fffdf399');g.addColorStop(1,'#ffffff00');c.save();c.translate(x,y);c.scale(1,.29);c.fillStyle=g;c.setTransform(W/1080,0,0,H/1350,0,0);c.restore();c.save();c.translate(x,y);c.scale(1,.23);let h=c.createRadialGradient(0,0,0,0,0,170);h.addColorStop(0,'#fffdf38c');h.addColorStop(1,'#ffffff00');c.fillStyle=h;c.fillRect(-170,-170,340,340);c.restore();}
 c.restore();
}

function background(t){
 c.fillStyle='#fff';c.fillRect(0,0,1080,1350);
 let g=c.createRadialGradient(540,565,60,540,565,480);g.addColorStop(0,'#f0e6d4');g.addColorStop(.45,'#fbf8f0');g.addColorStop(1,'#ffffff');c.fillStyle=g;c.fillRect(20,244,1040,818);periodScene(t);
 c.save();c.beginPath();c.rect(24,254,1032,803);c.clip();
 for(let j=0;j<38;j++){let yy=260+j*21,x=24-((t*24+j*77)%230);c.globalAlpha=.11+(j%5===0?.08:0);let words=['EXIT.DEPTH','SIGNAL.ROUTE','COLONY.STATE','LIQUIDITY','VERIFY.HOLDERS','RISK.BUDGET'];for(let k=0;k<8;k++)mono(words[(j+k)%6]+' '+((j*137+k*73+Math.floor(t*9))%997).toString(16).toUpperCase(),x+k*166,yy,7.5,j%4===0?C.copper:C.ink);}
 c.globalAlpha=1;
 // Perspective evidence flow: stable particles advect along a curling corridor.
 for(let i=0;i<particles.length;i++){let n=particles[i],u=(n.r+t*.11)%1,a=n.a+t*.24;let side=i%2?-1:1;let spread=45+110*Math.sin(u*Math.PI),x=540+side*(115+u*240)+Math.cos(a)*spread*.55,y=920-u*600+Math.sin(a)*spread*.47;let fade=Math.sin(u*Math.PI);c.globalAlpha=fade*(.18+n.s*.24);c.fillStyle=i%3?C.copper:C.red;c.fillRect(x,y,1+n.s*1.3,1+n.s*1.3);}
 c.restore();
}
function commandHalo(t,front=false){
 let hold=t>=14&&t<19,col=hold?C.red:C.copper;
 c.save();c.beginPath();c.rect(25,247,1030,808);c.clip();
 if(!front){
  glow(540,536,286,col,.16);glow(540,645,350,'#e1be7b',.1);
  // Concentric control ring with independently moving segments and graduations.
  for(let k=0;k<4;k++){let r=213+k*22,rotation=t*(k%2?-.16:.23)+k;for(let j=0;j<6;j++)arc(540,553,r,rotation+j*Math.PI/3,rotation+j*Math.PI/3+.64,col+(k%2?'66':'40'),k===2?2:1,1.1);}
  for(let j=0;j<96;j++){let a=j*Math.PI/48+t*.075,r=295,len=j%8===0?12:5;line(540+Math.cos(a)*r,553+Math.sin(a)*r*1.07,540+Math.cos(a)*(r+len),553+Math.sin(a)*(r+len)*1.07,col+'55',j%8===0?1.4:.7)}
  for(let k=0;k<3;k++){let pts=[];for(let j=0;j<=140;j++){let a=j/140*Math.PI*2,rot=t*(.23+k*.04)+k,xx=Math.cos(a)*(245+k*18),yy=Math.sin(a)*91,zz=Math.sin(a)*180;let x=xx*Math.cos(rot)-yy*Math.sin(rot),y=xx*Math.sin(rot)+yy*Math.cos(rot),d=850/(850-zz);pts.push([540+x*d,550+y*d])}path(pts,col+'57',1.1);let p=pts[Math.floor((t*.27+k*.31)%1*140)];glow(...p,11,col,.45);dot(...p,3.8,col);}
  // Tiny luminous sparks have deterministic lifetimes, never random frame jitter.
  for(let i=0;i<110;i++){let n=particles[i],u=(t*.18+n.r)%1,a=n.a+t*.05,r=190+u*155,x=540+Math.cos(a)*r,y=550+Math.sin(a)*r;let alpha=Math.sin(u*Math.PI)*.5;c.globalAlpha=alpha;line(x,y,x-Math.cos(a)*(3+n.s*6),y-Math.sin(a)*(3+n.s*6),i%4?C.copper:C.red,.9);}
  c.globalAlpha=1;
 } else {
  // Holographic landing plinth plus gently rotating orbit in front of the feet.
  let py=822;ellipse(540,py+12,148,19,0,'#5b432b15');ellipse(540,py,126,24,0,'#fff9edb8',col+'74');ellipse(540,py-3,104,17,0,null,col+'62');
  for(let j=0;j<4;j++){let a=t*.7+j*Math.PI/2;arc(540,py,126,a,a+.48,col+'af',2,.19);dot(540+Math.cos(a)*126,py+Math.sin(a)*24,2.6,col);}
 }
 c.restore();
}
function portrait(i,t,x,y,a){
 const sz=i===1?126:144,sy=sz*1.06;let bob=Math.sin(t*1.8+i)*.014;
 ellipse(x,y+sy*.50+5,55,7,0,'#38291913');
 glow(x,y-7,78,colors[i],.08+a*.34);
 // Lamp behind each active friend, with three animated status bars.
 if(a>.03){let g=c.createLinearGradient(0,y-100,0,y+75);g.addColorStop(0,colors[i]+'00');g.addColorStop(1,colors[i]+'40');c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x-85,y-98);c.lineTo(x+85,y-98);c.lineTo(x+31,y+77);c.lineTo(x-31,y+77);c.closePath();c.fillStyle=g;c.fill();c.restore();}
 wings(t+i*.08,x,y+25,.25,colors[i],i);
 c.save();c.translate(x,y);c.rotate(Math.sin(t*.91+i)*.052);c.scale(1+bob,1-bob*.6);c.drawImage(agents[i],-sz/2,-sy/2,sz,sy);c.restore();
 let ly=y+sy/2+7;rr(x-69,ly,138,25,5,a>.1?'#fff6e7':'#ffffffed',a>.1?colors[i]:'#d9d1c4');txt(names[i],x,ly+17,13,colors[i],'Bold','center');mono(roles[i],x,ly+38,8.3,C.muted,'center');
 for(let j=0;j<3;j++){let bh=3+7*(.5+.5*Math.sin(t*5+j+i));c.fillStyle=a>.1?colors[i]:'#c9c3b8';c.fillRect(x+57+j*3.5,ly+17-bh,1.7,bh);}
 dot(x-54,y-sy/2+6,9,'#fffefa',colors[i]+'70');mono(String(i+1).padStart(2,'0'),x-54,y-sy/2+9,7.5,colors[i],'center');
 if(a>.1){let u=(t+i*.11)%1.3;c.save();c.globalAlpha=a*(1-u/1.3)*.5;ellipse(x,y,70+u*14,83+u*14,0,null,colors[i]);c.restore();}
}
function cartoonSmoke(t){
 // Asset cigarette at x=.677, y=.41 of the 1024x1536 sprite.
 const x=68,y=-51;
 glow(x,y,6,'#d86d2f',.45+.12*Math.sin(t*3));
 for(let j=0;j<12;j++){let u=(t*.30+j/12)%1,pts=[];for(let k=0;k<14;k++){let v=u+k/14*.2;pts.push([x+Math.sin(v*9+t*.5)*17*v+v*24,y-v*155]);}c.save();c.globalAlpha=(1-u)*.19;path(pts,'#777363',1+u*3);c.restore();}
}
function boss(t){let h=bossPose(t),hold=t>=14&&t<19;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.scale(h.s,h.s);
 wings(t,0,57,.83,C.copper);
 // A soft active backlight makes the boss appear to float above the command desk.
 glow(0,-44,185,'#e1ba70',.13+activity(9,t)*.12);
 c.drawImage(bossImg,-190,-285,380,570);cartoonSmoke(t);
 // Occasional lens glints travel across the two cartoon eyes.
 let gl=(t%5.2)/5.2;if(gl<.17){c.save();c.globalAlpha=Math.sin(gl/.17*Math.PI)*.30;for(let p of [[-51,-110],[63,-92]]){line(p[0]-5,p[1],p[0]+5,p[1],'#fff',1.1);line(p[0],p[1]-5,p[0],p[1]+5,'#fff',1.1)}c.restore();}
 c.restore();
 rr(402,848,276,39,6,'#fffdf7',hold?'#a96872':'#c6ac79');txt('TOMMY',540,866,17,C.ink,'Bold','center');mono(hold?'THE BRAIN / EXIT FIRST':'THE BRAIN / BY ORDER OF BUZZCORE',540,881,8,hold?C.red:C.copper,'center');
}
function verdict(t){
 let hold=t>=14&&t<19,close=t>=29,label=close?'SESSION SEALED':hold?'HOLD · RECHECK THE EXIT':t>=20?'CLEARED BY THE BRAIN':'THE FAMILY IS WORKING';
 let col=hold?C.red:close?C.green:C.copper;
 rr(386,258,308,31,4,'#fffdf8f0',col+'78');dot(400,274,3,col);mono(label,541,278,9,col,'center');
 // A wave of approval propagates across the command ring once objections close.
 for(let st of [4,10,19,21,26,29]){let age=t-st;if(age>=0&&age<1.3){c.save();c.globalAlpha=(1-age/1.3)*.36;let r=100+age*190;ellipse(540,554,r,r*1.09,0,null,st===19?C.green:C.copper);c.restore();}}
}
function microTelemetry(t){
 // Compact telemetry on the two shoulders of the command field.
 for(let side of [-1,1]){let x=side<0?282:689,y=430,w=109;rr(x,y,w,62,5,'#fffdf6df','#ccb99766');mono(side<0?'EXIT DEPTH':'SIGNAL MASS',x+8,y+12,7.5,C.copper);
  if(side<0){for(let j=0;j<12;j++){let v=.3+.7*(.5+.5*Math.sin(t*1.6-j*.27));c.fillStyle=j<4?C.red+'aa':C.copper+'aa';c.fillRect(x+9+j*7.8,y+50-v*25,4.5,v*25)}}
  else {let pts=[];for(let j=0;j<55;j++){let u=j/54;pts.push([x+8+u*93,y+41-Math.sin(u*11-t*2.6)*7-Math.cos(u*24+t)*3])}path(pts,C.copper,1.4)}
 }
}
function consensus(t){}
function render(t){
 c.setTransform(1,0,0,1,0,0);c.scale(W/1080,H/1350);let p=clamp(t/29);
 background(t);commandHalo(t,false);pulseTrails(t);microTelemetry(t);boss(t);commandHalo(t,true);
 for(let i=0;i<9;i++){let q=pos(i,t);portrait(i,t,...q,activity(i,t));}
 verdict(t);brand(t,p);bottom(t,p);
}

(async()=>{
 fs.mkdirSync('work',{recursive:true});fs.mkdirSync('output',{recursive:true});
 bossImg=await loadImage('assets/cortex.png');agentSheet=await loadImage('assets/syndicate.png');
 const cuts=[0,434,850,1297];for(let i=0;i<9;i++){let im=createCanvas(260,260),ctx=im.getContext('2d'),row=Math.floor(i/3);ctx.drawImage(agentSheet,(i%3)*404,cuts[row],404,cuts[row+1]-cuts[row],0,0,260,260);agents.push(im)}
 let temp=createCanvas(180,216),cc=temp.getContext('2d');cc.drawImage(bossImg,0,0,180,216);let data=cc.getImageData(0,0,180,216).data;for(let y=0;y<216;y+=3)for(let x=0;x<180;x+=3){let k=(y*180+x)*4;if(data[k+3]>150)bossCloud.push({x:x*2-180,y:y*2-216,r:rand(),ph:rand()*6.28,col:`rgb(${data[k]},${data[k+1]},${data[k+2]})`})}
 if(process.argv.includes('--stills')){for(let [i,t] of [0,4,10,16,22,30.5].entries()){render(t);fs.writeFileSync(`work/buzzcore-${i}.png`,cv.toBuffer('image/png'))}console.log('STILLS COMPLETE');return;}
 const ff=spawn('ffmpeg',['-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(FPS),'-i','pipe:0','-i','assets/soundtrack.m4a','-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','3','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-t',String(D),'-movflags','+faststart','output/tim777_BUZZCORE_CARTOON.mp4'],{stdio:['pipe','inherit','inherit']});
 const done=new Promise((r,j)=>ff.on('close',code=>code===0?r():j(new Error(String(code)))));for(let f=0;f<1914;f++){render(f/FPS);if(!ff.stdin.write(Buffer.from(c.getImageData(0,0,W,H).data)))await new Promise(r=>ff.stdin.once('drain',r));if(f%180===0)console.log('Rendered '+f+'/1914')}ff.stdin.end();await done;console.log('COMPLETE');
})();
