(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = prefersReduced.matches;
  try { const saved = localStorage.getItem('hello-motion'); if (saved !== null) paused = saved === 'off'; } catch {}
  const body = document.body;
  const motionButton = document.querySelector('.motion-toggle');
  const reel = document.querySelector('.motion-reel');
  const reelTrack = document.querySelector('.reel-track');
  const reelWindow = document.querySelector('.reel-window');
  const reelProgress = document.querySelector('.reel-progress span');
  const manifesto = document.querySelector('.scroll-words');
  const rawWords = manifesto.textContent.trim().split(/\s+/);
  manifesto.setAttribute('aria-label', manifesto.textContent);
  manifesto.innerHTML = rawWords.map(w => `<span class="word" aria-hidden="true">${w}</span>`).join(' ');
  const words = [...manifesto.querySelectorAll('.word')];
  const studioPhoto = document.querySelector('.studio-visual img');
  const desktop = matchMedia('(min-width: 761px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cursor = document.querySelector('.view-cursor');
  let frameRequested = false;
  const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
  function renderScroll() {
    frameRequested = false;
    if (paused || prefersReduced.matches) return;
    const rect = reel.getBoundingClientRect();
    if (desktop.matches) {
      const travel = Math.max(1, reel.offsetHeight - innerHeight);
      const ratio = clamp(-rect.top / travel);
      const distance = Math.max(0, reelTrack.scrollWidth - reelWindow.clientWidth + innerWidth * .12);
      reelTrack.style.transform = `translate3d(${-ratio * distance}px,0,0)`;
      reelProgress.style.transform = `translateX(${ratio*200}%)`;
    } else reelTrack.style.transform = '';
    const m = manifesto.getBoundingClientRect();
    const reading = clamp((innerHeight * .85 - m.top) / (innerHeight * .45 + m.height));
    words.forEach((w,i) => w.classList.toggle('lit', i / words.length < reading));
    const photoRect = studioPhoto.parentElement.getBoundingClientRect();
    if (photoRect.top < innerHeight && photoRect.bottom > 0) {
      const amount = clamp((innerHeight-photoRect.top)/(innerHeight+photoRect.height));
      studioPhoto.style.transform = `translate3d(0,${(amount-.5)*65}px,0)`;
    }
  }
  function requestScroll() { if (!frameRequested) { frameRequested = true; requestAnimationFrame(renderScroll); } }
  addEventListener('scroll', requestScroll, {passive:true});
  addEventListener('resize', requestScroll, {passive:true});
  function setPaused(next) {
    paused = next;
    body.classList.toggle('motion-paused', paused);
    body.classList.toggle('motion-on', !paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Activer les animations' : 'Réduire les animations');
    motionButton.firstChild.textContent = paused ? 'Mouvement réduit ' : 'Mouvement ';
    if (paused) {
      document.querySelectorAll('.reveal-ready').forEach(e => e.classList.add('revealed-item'));
      cursor.classList.remove('active');
      studioPhoto.style.transform = '';
      document.querySelectorAll('.magnetic').forEach(b=>b.style.transform='');
    }
    requestScroll();
  }
  motionButton.addEventListener('click', () => { setPaused(!paused); try {localStorage.setItem('hello-motion', paused?'off':'on');} catch {} });
  prefersReduced.addEventListener('change', e => setPaused(e.matches));
  setPaused(paused);
  // Buttons retain their real click targets while the visual follows the pointer.
  document.querySelectorAll('.button,.nav-cta,.scene-controls button').forEach(el => {
    el.classList.add('magnetic');
    el.addEventListener('pointermove', e => {
      if (paused || !finePointer.matches) return;
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.18}px)`;
    });
    el.addEventListener('pointerleave',()=>{el.style.transition='transform .5s cubic-bezier(.22,1,.36,1)';el.style.transform='';});
  });
  const canvas = document.querySelector('.design-canvas');
  const cards = [...canvas.querySelectorAll('[data-depth]')];
  canvas.addEventListener('pointermove',e=>{
    if(paused||!finePointer.matches)return;
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    cards.forEach(card=>{const depth=Number(card.dataset.depth);card.style.setProperty('--px',x*depth+'px');card.style.setProperty('--py',y*depth+'px');});
  });
  canvas.addEventListener('pointerleave',()=>cards.forEach(card=>{card.style.setProperty('--px','0px');card.style.setProperty('--py','0px');}));
  // Custom viewing cue is only shown over imagery, with the native cursor preserved.
  document.querySelectorAll('.project-image,.reel-card>button').forEach(el=>{
    el.addEventListener('pointerenter',()=>{if(!paused&&finePointer.matches)cursor.classList.add('active');});
    el.addEventListener('pointermove',e=>{if(!paused&&finePointer.matches)cursor.style.transform=`translate3d(${e.clientX-39}px,${e.clientY-39}px,0)`;});
    el.addEventListener('pointerleave',()=>cursor.classList.remove('active'));
    el.addEventListener('click',()=>cursor.classList.remove('active'));
  });
  // Brief photo transitions; navigation remains immediate and accessible.
  const previousShowScene=showScene;
  showScene=function(step){previousShowScene(step);if(!paused){document.querySelector('.collage-main').animate([{opacity:.35,transform:'translateY(18px) rotate(-3deg)'},{opacity:1,transform:'translateY(0) rotate(-8deg)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});}};
  const previousProject=openProject;
  openProject=function(i){previousProject(i);if(!paused)modal.querySelector('img').animate([{opacity:.25,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'});};
  document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(Number(b.dataset.project))));
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    if(paused)return;
    document.querySelectorAll('.project:not([hidden])').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay:i*45,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
  }));
  const serviceImages=[['abok','Façades & habillage'],['amani','Enseignes & lettres en relief'],['crest','Totems & signalétique'],['branding','Branding & impression'],['branding','Stands & événementiel']];
  let serviceIndex=0;
  const previewImage=document.querySelector('.service-preview>img');
  function previewService(i){
    if(serviceIndex===i)return;serviceIndex=i;
    previewImage.src=`assets/${serviceImages[i][0]}.jpg`;
    document.querySelector('#service-preview-name').textContent=serviceImages[i][1];
    if(!paused)previewImage.animate([{opacity:.15,transform:'scale(1.09)'},{opacity:1,transform:'scale(1)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  document.querySelectorAll('.services details').forEach((d,i)=>{
    d.querySelector('summary').addEventListener('pointerenter',()=>{if(finePointer.matches)previewService(i);});
    d.querySelector('summary').addEventListener('focus',()=>previewService(i));
    d.addEventListener('toggle',()=>{if(d.open)previewService(i);});
  });
  document.querySelectorAll('[data-need]').forEach(b=>b.addEventListener('click',()=>{
    if(!paused)document.querySelector('.finder-answer').animate([{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)'});
  }));
  document.querySelectorAll('.services details').forEach(d=>d.addEventListener('toggle',()=>{
    if(d.open&&!paused)d.querySelector('.service-body').animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'ease-out'});
  }));
  // Desktop keyboard users can explore the pinned reel without scrolling through hidden cards.
  reel.querySelectorAll('button').forEach((b,i)=>b.addEventListener('focus',()=>{
    if(!desktop.matches||paused||prefersReduced.matches)return;
    const top=reel.getBoundingClientRect().top+scrollY;
    window.scrollTo({top:top+(reel.offsetHeight-innerHeight)*i/2,behavior:'instant'});
  }));
  requestScroll();
})();
