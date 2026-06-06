
const slides=[1,2,3,4,5,6].map(i=>`assets/slide${i}.png`);
// Add the final promotional image as the last slide
slides.push('assets/get-the-luma-luxe-remote-app.jpeg');
let idx=0,playing=true,timer;
const slide=document.getElementById('slide');
const play=document.getElementById('play');
const thumbs=document.getElementById('thumbs');

function render(){
 slide.src=slides[idx];
 document.querySelectorAll('.thumbs img').forEach((x,i)=>x.classList.toggle('active',i===idx));
}
function next(){idx=(idx+1)%slides.length;render();}
function prev(){idx=(idx-1+slides.length)%slides.length;render();}
function start(){timer=setInterval(next,4500);}
function stop(){clearInterval(timer);}

slides.forEach((s,i)=>{
 const im=document.createElement('img');
 im.src=s;
 im.onclick=()=>{
   idx=i; render();
   playing=false; stop(); play.textContent='Play';
 };
 thumbs.appendChild(im);
});

slide.onclick=()=>{
 playing=false; stop(); play.textContent='Play';
};

document.getElementById('next').onclick=()=>{next();playing=false;stop();play.textContent='Play';};
document.getElementById('prev').onclick=()=>{prev();playing=false;stop();play.textContent='Play';};

play.onclick=()=>{
 if(playing){playing=false;stop();play.textContent='Play';}
 else{playing=true;start();play.textContent='Pause';}
};

render(); start();
