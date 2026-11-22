import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,deleteDoc,query,orderBy,limit,where,serverTimestamp,getCountFromServer} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $v=document.getElementById("view"),$nav=document.getElementById("nav"),$out=document.getElementById("out");
const TYPES=["Full-time","Part-time","Contract","Gig","Apprenticeship","Internship"];
const TOWNS=["Harare","Bulawayo","Chitungwiza","Mutare","Gweru","Kwekwe","Kadoma","Masvingo","Chinhoyi","Marondera","Bindura","Zvishavane","Victoria Falls","Hwange","Beitbridge","Remote"];
const P={home:"M3 11l9-8 9 8M5 10v10h14V10",jobs:"M3 7h18v13H3zM9 7V4h6v3M3 13h18",people:"M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7M21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8",me:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8"};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=t=>t?.toDate?t.toDate().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"";
let me=null,uid=null,tt;
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),3500)}
const avatar=u=>u.photoURL?`<img class="av" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span class="av" aria-hidden="true">${esc((u.name||"?").trim().charAt(0).toUpperCase())}</span>`;
const empty=(msg,cta)=>`<div class="empty"><p>${msg}</p>${cta||""}</div>`;
const snap=s=>s.docs.map(d=>({id:d.id,...d.data()}));

/* ---------- auth ---------- */
$out.onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{
  try{
    if(!u){uid=me=null;document.body.classList.remove("in");$nav.hidden=$out.hidden=true;return landing()}
    uid=u.uid;const ref=doc(db,"users",uid),s=await getDoc(ref);
    if(s.exists())me=s.data();
    else{me={name:u.displayName||"",photoURL:u.photoURL||"",headline:"",location:"",bio:"",skills:[],available:true,createdAt:serverTimestamp()};await setDoc(ref,me)}
    document.body.classList.add("in");$nav.hidden=$out.hidden=false;route();
  }catch(e){fail(e)}
});
function landing(){
  $v.innerHTML=`<section class="land"><h1>Find skilled people and work across Zimbabwe.</h1>
  <p class="muted">Build a profile of what you can do, browse jobs, gigs and apprenticeships posted by real people, and get hired or hire.</p>
  <p><button class="btn" id="go">Continue with Google</button></p><p class="err" id="e" role="alert"></p>
  <p class="muted">A Kinton Technologies product.</p></section>`;
  document.getElementById("go").onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){document.getElementById("e").textContent=e.code==="auth/popup-closed-by-user"?"Sign-in was cancelled. Try again.":"Could not sign in: "+e.message}}
}
function fail(e){console.error(e);$v.innerHTML=empty("Something went wrong: "+esc(e.code||e.message)+". Check your connection and try again.",`<button class="btn" onclick="location.reload()">Reload</button>`)}

/* ---------- router ---------- */
addEventListener("hashchange",()=>uid&&route());
async function route(){
  const [,a,b]=(location.hash||"#/").slice(1).split("/");const k=a||"home";
  $nav.innerHTML=[["home","Home","#/"],["jobs","Jobs","#/jobs"],["people","People","#/people"],["me","Profile","#/me"]]
    .map(([i,l,h])=>`<a href="${h}" ${(k===i||(k==="job"&&i==="jobs")||(k==="u"&&i==="people"))?'aria-current="page"':""}>${icon(i)}${l}</a>`).join("");
  $v.innerHTML=`<p class="muted pad">Loading…</p>`;scrollTo(0,0);
  try{
    if(k==="home")await home();else if(k==="jobs"&&b==="new")newJob();else if(k==="jobs")await jobs();
    else if(k==="job")await job(b);else if(k==="people")await people();else if(k==="me")profileEdit();else if(k==="u")await profileView(b);
    else await home();
    $v.focus({preventScroll:true});
  }catch(e){fail(e)}
}

/* ---------- views ---------- */
const jobRow=j=>`<a class="row" href="#/job/${j.id}"><span><b>${esc(j.title)}</b><small>${esc(j.company)}, ${esc(j.location)} · ${date(j.createdAt)}</small></span><span class="tag">${esc(j.type)}</span></a>`;
const getJobs=async n=>snap(await getDocs(query(collection(db,"jobs"),orderBy("createdAt","desc"),limit(n))));

async function home(){
  const [jc,pc,list]=await Promise.all([getCountFromServer(collection(db,"jobs")),getCountFromServer(collection(db,"users")),getJobs(5)]);
  const todo=[!me.headline&&"a headline",!me.location&&"your town or city",!me.skills?.length&&"your skills"].filter(Boolean);
  $v.innerHTML=`<h1>Hello, ${esc((me.name||"there").split(" ")[0])}</h1>
  <div class="stats"><div><b>${jc.data().count}</b><span>jobs posted</span></div><div><b>${pc.data().count}</b><span>people on ZimSkills</span></div></div>
  ${todo.length?`<div class="notice">Employers find you through your profile. Add ${todo.join(", ")}. <a href="#/me">Update profile</a></div>`:""}
  <h2>Latest jobs</h2><div class="list">${list.length?list.map(jobRow).join(""):empty("No jobs have been posted yet.",`<a class="btn" href="#/jobs/new">Post a job</a>`)}</div>`;
}

async function jobs(){
  const all=await getJobs(100);
  $v.innerHTML=`<h1>Jobs and gigs</h1><p><a class="btn" href="#/jobs/new">Post a job</a></p>
  <div class="filters"><input id="q" type="search" placeholder="Search title, company or town" aria-label="Search jobs"><select id="t" aria-label="Job type"><option value="">All types</option>${TYPES.map(t=>`<option>${t}</option>`).join("")}</select></div>
  <div class="list" id="l" aria-live="polite"></div>`;
  const q=document.getElementById("q"),t=document.getElementById("t"),l=document.getElementById("l");
  const draw=()=>{const s=q.value.toLowerCase(),r=all.filter(j=>(!t.value||j.type===t.value)&&(`${j.title} ${j.company} ${j.location}`.toLowerCase().includes(s)));
    l.innerHTML=r.length?r.map(jobRow).join(""):empty(all.length?"No jobs match your search.":"No jobs have been posted yet.")};
  q.oninput=t.onchange=draw;draw();
}

function newJob(){
  $v.innerHTML=`<h1>Post a job</h1><form id="f" class="panel pad" novalidate>
  <label>Job title<input name="title" maxlength="120" required></label>
  <label>Company or person hiring<input name="company" maxlength="80" required></label>
  <label>Town or city<input name="location" list="towns" maxlength="60" required></label><datalist id="towns">${TOWNS.map(t=>`<option>${t}`).join("")}</datalist>
  <label>Type<select name="type">${TYPES.map(t=>`<option>${t}</option>`).join("")}</select></label>
  <label>Pay <span class="hint">Optional, e.g. USD 300 a month</span><input name="salary" maxlength="60"></label>
  <label>Description <span class="hint">What the work involves and what you need</span><textarea name="description" maxlength="2000" required></textarea></label>
  <p class="err" id="e" role="alert"></p><button class="btn" id="b">Publish job</button></form>`;
  document.getElementById("f").onsubmit=async ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target)),e=document.getElementById("e"),b=document.getElementById("b");
    for(const k of["title","company","location","description"])f[k]=f[k].trim();f.salary=f.salary.trim();
    if(f.title.length<3||!f.company||!f.location||f.description.length<20){e.textContent="Fill in the title, company, town and a description of at least 20 characters.";return}
    b.disabled=true;try{const r=await addDoc(collection(db,"jobs"),{...f,ownerId:uid,ownerName:me.name,createdAt:serverTimestamp()});toast("Published");location.hash="#/job/"+r.id}
    catch(x){e.textContent="Could not publish: "+x.message;b.disabled=false}};
}

async function job(id){
  const s=await getDoc(doc(db,"jobs",id));
  if(!s.exists()){$v.innerHTML=empty("This job no longer exists.",`<a class="btn" href="#/jobs">Back to jobs</a>`);return}
  const j={id,...s.data()},mine=j.ownerId===uid;let applied=null,apps=[];
  if(mine)apps=snap(await getDocs(query(collection(db,"applications"),where("jobId","==",id),where("ownerId","==",uid))));
  else{const a=await getDoc(doc(db,"applications",`${id}_${uid}`));applied=a.exists()?a.data():null}
  $v.innerHTML=`<p><a href="#/jobs">Jobs</a></p><h1>${esc(j.title)}</h1>
  <p class="muted">${esc(j.company)}, ${esc(j.location)} · ${esc(j.type)}${j.salary?" · "+esc(j.salary):""} · Posted ${date(j.createdAt)}</p>
  <div class="panel pad"><p style="white-space:pre-wrap;margin:0">${esc(j.description)}</p></div>
  <p class="muted">Posted by <a href="#/u/${j.ownerId}">${esc(j.ownerName||"a member")}</a></p>
  ${mine?`<h2>Applicants (${apps.length})</h2><div class="list">${apps.length?apps.map(a=>`<a class="row" href="#/u/${a.applicantId}"><span><b>${esc(a.applicantName)}</b><small>${esc(a.note)||"No note"}</small></span><small>${date(a.createdAt)}</small></a>`).join(""):empty("No applications yet.")}</div>
    <p><button class="btn bad" id="del">Delete this job</button></p>`
   :applied?`<p class="ok">You applied on ${date(applied.createdAt)}.</p>`
   :`<form id="f"><label>Note to the employer <span class="hint">Optional. Say why you fit, and how to reach you.</span><textarea name="note" maxlength="500"></textarea></label><p class="err" id="e" role="alert"></p><button class="btn" id="b">Apply for this job</button></form>`}`;
  const f=document.getElementById("f");
  if(f)f.onsubmit=async ev=>{ev.preventDefault();const b=document.getElementById("b");b.disabled=true;
    try{await setDoc(doc(db,"applications",`${id}_${uid}`),{jobId:id,ownerId:j.ownerId,applicantId:uid,applicantName:me.name,note:new FormData(f).get("note").trim(),createdAt:serverTimestamp()});toast("Application sent");job(id)}
    catch(x){document.getElementById("e").textContent="Could not send: "+x.message;b.disabled=false}};
  const d=document.getElementById("del");
  if(d)d.onclick=async()=>{if(!confirm("Delete this job? This cannot be undone."))return;try{await deleteDoc(doc(db,"jobs",id));toast("Deleted");location.hash="#/jobs"}catch(x){toast("Could not delete: "+x.message)}};
}

async function people(){
  const all=snap(await getDocs(query(collection(db,"users"),limit(100)))).filter(u=>u.name);
  $v.innerHTML=`<h1>People</h1><div class="filters"><input id="q" type="search" placeholder="Search skill, trade or town" aria-label="Search people"><span></span></div><div class="list" id="l" aria-live="polite"></div>`;
  const q=document.getElementById("q"),l=document.getElementById("l");
  const draw=()=>{const s=q.value.toLowerCase(),r=all.filter(u=>`${u.name} ${u.headline} ${u.location} ${(u.skills||[]).join(" ")}`.toLowerCase().includes(s));
    l.innerHTML=r.length?r.map(u=>`<a class="row" href="#/u/${u.id}"><span class="who">${avatar(u)}<span><b>${esc(u.name)}</b><small>${esc(u.headline||"No headline yet")}${u.location?", "+esc(u.location):""}</small></span></span>${u.available?'<span class="tag">Available</span>':""}</a>`).join(""):empty("No one matches your search.")};
  q.oninput=draw;draw();
}

async function profileView(id){
  if(id===uid){location.hash="#/me";return}
  const s=await getDoc(doc(db,"users",id));
  if(!s.exists()){$v.innerHTML=empty("This profile does not exist.",`<a class="btn" href="#/people">Back to people</a>`);return}
  const u=s.data();
  $v.innerHTML=`<div class="who">${avatar(u)}<div><h1>${esc(u.name)}</h1><span class="muted">${esc(u.headline)}${u.location?", "+esc(u.location):""}</span></div></div>
  ${u.available?'<p class="ok">Available for work</p>':""}<h2>About</h2><p style="white-space:pre-wrap">${esc(u.bio)||'<span class="muted">Nothing added yet.</span>'}</p>
  <h2>Skills</h2>${u.skills?.length?`<div class="skills">${u.skills.map(k=>`<span>${esc(k)}</span>`).join("")}</div>`:'<p class="muted">No skills listed.</p>'}`;
}

function profileEdit(){
  $v.innerHTML=`<div class="who">${avatar(me)}<h1>Your profile</h1></div><form id="f" class="panel pad" novalidate>
  <label>Full name<input name="name" maxlength="80" value="${esc(me.name)}" required></label>
  <label>Headline <span class="hint">Your trade or role, e.g. Solar installer</span><input name="headline" maxlength="80" value="${esc(me.headline)}"></label>
  <label>Town or city<input name="location" list="towns" maxlength="60" value="${esc(me.location)}"></label><datalist id="towns">${TOWNS.map(t=>`<option>${t}`).join("")}</datalist>
  <label>Skills <span class="hint">Separate with commas. Up to 30.</span><input name="skills" value="${esc((me.skills||[]).join(", "))}"></label>
  <label>About you<textarea name="bio" maxlength="600">${esc(me.bio)}</textarea></label>
  <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="available" style="width:auto;min-height:0" ${me.available?"checked":""}>Show that I am available for work</label>
  <p class="err" id="e" role="alert"></p><button class="btn" id="b">Save profile</button></form>`;
  document.getElementById("f").onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(ev.target),e=document.getElementById("e"),b=document.getElementById("b");
    const name=fd.get("name").trim();if(!name){e.textContent="Enter your name.";return}
    const skills=[...new Set(fd.get("skills").split(",").map(s=>s.trim()).filter(Boolean))].slice(0,30);
    const next={...me,name,headline:fd.get("headline").trim(),location:fd.get("location").trim(),bio:fd.get("bio").trim(),skills,available:fd.get("available")==="on"};
    b.disabled=true;try{await setDoc(doc(db,"users",uid),next);me=next;toast("Saved");e.textContent="";b.disabled=false}
    catch(x){e.textContent="Could not save: "+x.message;b.disabled=false}};
}
