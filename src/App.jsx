import React,{useEffect,useState}from"react";
import{BookOpen,Brain,CalendarDays,Check,ChevronRight,CircleUserRound,Headphones,Home,LogIn,LogOut,Menu,Mic,Play,Settings,ShieldCheck,Star,Target,Volume2,X}from"lucide-react";
import{week1,dayToLesson}from"./data/week1.js";
import{watchAuth,loginWithEmail,registerWithEmail,logout,loadProgress,saveProgress,saveAttempt,loadLesson}from"./lib/firebase.js";
import{speak}from"./lib/speech.js";

const vocab=[
["こんにちは","konnichiwa","hello"],["ありがとう","arigatō","thank you"],["すみません","sumimasen","excuse me"],["わたし","watashi","I"],["ともだち","tomodachi","friend"],["せんせい","sensei","teacher"],["がくせい","gakusei","student"],["ほん","hon","book"],["みず","mizu","water"],["がっこう","gakkō","school"],["えき","eki","station"],["でんしゃ","densha","train"],["たべます","tabemasu","eat"],["のみます","nomimasu","drink"],["みます","mimasu","watch"],["よみます","yomimasu","read"],["いきます","ikimasu","go"],["すき","suki","like"],["おおきい","ōkii","big"],["ちいさい","chiisai","small"]];
const grammar=[
["N は N です","Topic + polite identity","Use は to establish the topic and です for a polite statement."],
["N の N","Possession / relationship","の links nouns: my book, school teacher, and similar relationships."],
["N も N です","Also / too","も replaces は when adding another item with the same predicate."],
["N を Vます","Direct object","を marks the direct object of a transitive verb."],
["Place に いきます","Destination","に marks a destination with movement verbs."],
["N が すきです","Like","が marks the object of preference with すきです."]];
const kanji=["日","月","火","水","木","金","土","人","一","二","三","四","五","六","七","八","九","十","学","校","生","先","本","語","食","飲","見","行","来","大","小"];

function fallbackLesson(day){
 const level=day<=90?"N5":"N4",local=day<=90?day:day-90,g=grammar[(local-1)%grammar.length],start=((local-1)*4)%vocab.length;
 const vs=Array.from({length:10},(_,i)=>vocab[(start+i)%vocab.length]);
 const examples=vs.slice(0,3).map(v=>({ja:v[0]+"です。",romaji:v[1]+" desu.",en:"Practice "+v[2]+" in context."}));
 return{day:day,level:level,title:level+" Day "+local+" · "+g[0],theme:"Core Japanese · "+g[1],characters:[],kanji:kanji.slice((local*2)%10,(local*2)%10+5).map(k=>({character:k,meaning:"Core kanji"})),vocab:vs.map(v=>({ja:v[0],romaji:v[1],en:v[2]})),grammar:[{pattern:g[0],meaning:g[1],explanation:g[2]}],examples:examples,speaking:examples.map(x=>x.ja),reading:{text:examples.map(x=>x.ja).join(""),translation:"Read aloud, then identify the vocabulary you know."},quiz:vs.slice(0,8).map((v,i)=>({question:"What does "+v[0]+" mean?",options:[v[2],vs[(i+1)%vs.length][2],vs[(i+2)%vs.length][2],vs[(i+3)%vs.length][2]],answer:0}))};
}
function localLesson(day){return day<=7?dayToLesson(week1[day-1]):fallbackLesson(day)}

function AuthModal({mode,setMode,onClose}){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e){e.preventDefault();setError("");setBusy(true);try{if(mode==="register")await registerWithEmail(email,password);else await loginWithEmail(email,password);onClose()}catch(err){setError((err&&err.message)||"Authentication failed.")}finally{setBusy(false)}}
 return <div className="auth-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="auth-card" onSubmit={submit}>
  <div className="auth-brand"><div className="brand-mark">道</div><div><div className="brand-name">Michi <span>みち</span></div><div style={{fontSize:10,color:"#69758d"}}>Your path to Japanese</div></div><button type="button" className="icon-btn" style={{marginLeft:"auto"}} onClick={onClose}><X size={16}/></button></div>
  <div className="eyebrow">{mode==="login"?"Welcome back":"Start your journey"}</div><h2>{mode==="login"?"Continue learning":"Create your Michi account"}</h2><p>{mode==="login"?"Keep your progress and mastery synced across devices.":"Save your Japanese learning progress and continue from any device."}</p>
  <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div>
  <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required/></div>
  {error&&<div className="auth-error">{error}</div>}<button className="primary-btn" style={{width:"100%",marginTop:17}} disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in to Michi":"Create account"}</button>
  <div className="auth-switch">{mode==="login"?"New to Michi?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Create an account":"Sign in"}</button></div>
 </form></div>
}

function Tutor(){
 return <div className="tutor-card"><div className="tutor-orb"/><div className="tutor-copy"><span className="tag">Michi Tutor</span><b style={{display:"block",marginTop:10}}>いっしょに勉強しましょう。</b><p>Listen, repeat, understand, then prove what you learned.</p></div><div className="tutor-person"><div className="tutor-head"/><div className="tutor-body"/></div></div>
}
function Stat({icon,label,value}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>}
function Audio({text}){return <button className="audio" onClick={()=>speak(text)} title="Listen"><Volume2 size={15}/></button>}

function Quiz({lesson,onComplete}){
 const[q,setQ]=useState(0),[score,setScore]=useState(0),[selected,setSelected]=useState(null),item=lesson.quiz&&lesson.quiz[q];
 if(!item)return null;
 function answer(i){if(selected!==null)return;setSelected(i);const next=score+(i===item.answer?1:0);setScore(next);setTimeout(()=>{if(q===lesson.quiz.length-1)onComplete(Math.round(next/lesson.quiz.length*100));else{setQ(q+1);setSelected(null)}},500)}
 return <section className="lesson-block"><div className="block-title"><Target size={17}/>Mastery check</div><div className="quiz-progress">Question {q+1} of {lesson.quiz.length} · {score} correct</div><div style={{fontSize:18,fontWeight:800,lineHeight:1.4}}>{item.question}</div><div>{item.options.map((o,i)=><button key={o} className={"quiz-option "+(selected!==null&&i===item.answer?"correct":selected===i?"wrong":"")} onClick={()=>answer(i)}>{o}</button>)}</div></section>
}

function Lesson({lesson,day,onBack,onComplete}){
 const stages=[["vocab","Vocabulary"],["grammar","Grammar"],["listen","Listening"],["speak","Speaking"],["read","Reading"],["quiz","Mastery"]];
 return <div><button className="back-link" onClick={onBack}>← Back to dashboard</button>
  <div className="lesson-header"><div className="lesson-header-row"><div><span className="tag">{lesson.level} · Day {day}</span><h1>{lesson.title}</h1><div className="subtitle" style={{marginTop:0}}>{lesson.theme}</div></div><div style={{textAlign:"right",fontSize:11,color:"#69758d"}}><Star size={18} color="#fbbf24"/><div style={{marginTop:5}}>Mastery lesson</div></div></div></div>
  <div className="lesson-layout"><main className="lesson-main">
   <section className="lesson-block" id="vocab"><div className="block-title"><BookOpen size={17}/>Vocabulary</div><div className="vocab-grid">{lesson.vocab&&lesson.vocab.map(v=><div className="vocab-item" key={v.ja}><div><div className="jp">{v.ja}</div><div className="romaji">{v.romaji}</div><div className="meaning">{v.en}</div></div><Audio text={v.ja}/></div>)}</div></section>
   <section className="lesson-block" id="grammar"><div className="block-title"><Brain size={17}/>Grammar</div>{lesson.grammar&&lesson.grammar.map(g=><div className="grammar-row" key={g.pattern}><div className="grammar-pattern">{g.pattern}</div><div className="grammar-meaning">{g.meaning}</div><div className="grammar-exp">{g.explanation}</div></div>)}{lesson.examples&&lesson.examples.map(e=><div className="example" key={e.ja}><div><div className="jp">{e.ja}</div><div className="romaji">{e.romaji}</div><div className="meaning">{e.en}</div></div><Audio text={e.ja}/></div>)}</section>
   <section className="lesson-block" id="listen"><div className="block-title"><Headphones size={17}/>Listening</div><p className="subtitle" style={{marginTop:0}}>Listen carefully, then repeat without looking at the English.</p>{lesson.examples&&lesson.examples.map(e=><div className="speak-row" key={e.ja}><span className="jp">{e.ja}</span><Audio text={e.ja}/></div>)}</section>
   <section className="lesson-block" id="speak"><div className="block-title"><Mic size={17}/>Speaking drill</div><p className="subtitle" style={{marginTop:0}}>Shadow each sentence three times. Focus on rhythm rather than speed.</p>{lesson.speaking&&lesson.speaking.map(s=><div className="speak-row" key={s}><span className="jp">{s}</span><Audio text={s}/></div>)}</section>
   <section className="lesson-block" id="read"><div className="block-title"><BookOpen size={17}/>Reading</div><div className="reading-box"><div className="reading-jp">{lesson.reading&&lesson.reading.text}</div><div className="reading-en">{lesson.reading&&lesson.reading.translation}</div></div></section>
   <section className="lesson-block"><div className="block-title"><Star size={17}/>Kanji</div><div className="kanji-grid">{lesson.kanji&&lesson.kanji.map(k=><div className="kanji-item" key={k.character}><div className="kanji-char">{k.character}</div><div className="meaning">{k.meaning}</div></div>)}</div></section>
   <Quiz lesson={lesson} onComplete={onComplete}/>
  </main><aside className="lesson-side"><div className="side-card"><div className="side-title">Lesson path</div><div className="outline-list">{stages.map((s,i)=><button key={s[0]} onClick={()=>document.getElementById(s[0])?.scrollIntoView({behavior:"smooth",block:"start"})}><span style={{display:"inline-block",width:18,color:"#818cf8"}}>{i+1}</span>{s[1]}</button>)}</div></div><Tutor/><div className="side-card"><div className="side-title">Goal</div><div style={{fontSize:12,fontWeight:750}}>Score 100% to master Day {day}</div><div className="bar" style={{marginTop:10}}><span style={{width:"100%"}}/></div></div></aside></div>
 </div>
}

function Curriculum({completed,currentDay,onSelect}){
 const[level,setLevel]=useState("N5"),start=level==="N5"?1:91;
 const weeks=Array.from({length:13},(_,i)=>{const first=start+i*7,last=Math.min(first+6,start+89);return{week:i+1,first,last,days:Array.from({length:last-first+1},(_,j)=>first+j)}});
 const n5=["Self & introductions","Daily life","People & places","Time & routines","Food & shopping","Movement","Review & checkpoint","Home & study","Adjectives","Past tense","Requests & permission","Experience","N5 final review"];
 const n4=["Daily routines","Plans & intentions","Comparisons","Health & body","Travel","School & work","Review & checkpoint","Opinions","Ability","Rules & advice","Conditions","Connected speech","N4 final review"];
 return <section><div className="level-tabs"><button className={"level-tab "+(level==="N5"?"active":"")} onClick={()=>setLevel("N5")}>N5 · Foundation</button><button className={"level-tab "+(level==="N4"?"active":"")} onClick={()=>setLevel("N4")}>N4 · Elementary</button></div><div className="week-grid">{weeks.map(w=>{const unlocked=w.first===1||completed.includes(w.first-1),done=w.days.every(d=>completed.includes(d));return <button className={"week-card "+(unlocked?"":"locked")} key={w.week} disabled={!unlocked} onClick={()=>onSelect(w.days.find(d=>!completed.includes(d))||w.first)}><div className="week-top"><span className="week-number">Week {w.week}</span><span className="week-status">{done?"Mastered":unlocked?"Open":"Locked"}</span></div><h3>{(level==="N5"?n5:n4)[w.week-1]}</h3><p>Days {w.first}–{w.last} · vocabulary, grammar, listening and reading.</p><div className="week-days">{w.days.map(d=><span key={d} className={"day-dot "+(completed.includes(d)?"done":d===currentDay?"current":(d===1||completed.includes(d-1))?"open":"")}>{d}</span>)}</div></button>})}</div></section>
}

function Dashboard({completed,setDay,setView,user,onAuth}){
 const next=completed.length?Math.min(180,Math.max(...completed)+1):1,progress=Math.round(completed.length/180*100),level=next<=90?"N5":"N4";
 return <div><div className="hero"><div className="hero-grid"><div><div className="eyebrow">Your Japanese journey</div><h1>Read. Listen. Speak. Master Japanese.</h1><p>Michi takes you from N5 foundation to N4 confidence through a structured 180-day path. Every lesson connects vocabulary, grammar, listening, speaking and reading.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>{setDay(next);setView("lesson")}}><Play size={14}/>Continue Day {next}</button>{!user&&<button className="outline-btn" onClick={()=>onAuth("register")}><LogIn size={14}/>Create free account</button>}</div></div><Tutor/></div></div>
  <div className="stats"><Stat icon={<CalendarDays size={16}/>} label="Days mastered" value={completed.length}/><Stat icon={<Brain size={16}/>} label="Current level" value={level}/><Stat icon={<Mic size={16}/>} label="Speaking target" value="Daily"/><Stat icon={<ShieldCheck size={16}/>} label="Journey progress" value={progress+"%"}/></div>
  <div className="section-head"><div><h2>Continue learning</h2><p>Your next recommended lesson</p></div></div>
  <div className="continue"><div><div className="lesson-kicker">{level} · Day {next}</div><div className="lesson-title">{next===1?"Start with Japanese foundations":"Continue your next lesson"}</div><div className="lesson-meta"><span>10–15 min</span><span>Vocabulary + grammar + quiz</span></div><div className="progress-line"><span style={{width:progress+"%"}}/></div></div><button className="primary-btn" onClick={()=>{setDay(next);setView("lesson")}}>Open lesson <ChevronRight size={14}/></button></div>
  <div className="section-head" id="curriculum"><div><h2>180-day curriculum</h2><p>One week at a time. Mastery unlocks the next stage.</p></div></div><Curriculum completed={completed} currentDay={next} onSelect={d=>{setDay(d);setView("lesson")}}/>
 </div>
}

export default function App(){
 const[day,setDay]=useState(1),[completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem("jlptProgress")||"[]")}catch{return[]}}),[user,setUser]=useState(null),[view,setView]=useState("dashboard"),[lesson,setLesson]=useState(null),[lessonLoading,setLessonLoading]=useState(false),[auth,setAuth]=useState(null),[sidebar,setSidebar]=useState(false);
 useEffect(()=>watchAuth(async u=>{setUser(u);if(u){try{const p=await loadProgress(u.uid);if(p.length){setCompleted(p);localStorage.setItem("jlptProgress",JSON.stringify(p))}}catch{}}}),[]);
 useEffect(()=>{if(view!=="lesson")return;let alive=true;const local=localLesson(day);setLesson(local);setLessonLoading(false);if(day>7){loadLesson(day).then(x=>{if(alive&&x)setLesson(x)}).catch(()=>{});}return()=>{alive=false}},[day,view]);
 const progress=Math.round(completed.length/180*100);
 async function complete(score){if(score===100&&!completed.includes(day)){const n=[...completed,day].sort((a,b)=>a-b);setCompleted(n);localStorage.setItem("jlptProgress",JSON.stringify(n));if(user){await saveProgress(user.uid,n);await saveAttempt(user.uid,day,score)}}else if(user)await saveAttempt(user.uid,day,score);setView("dashboard")}
 function nav(v){setView(v);setSidebar(false)}
 return <div className="michi-app">{sidebar&&<div className="mobile-overlay" onClick={()=>setSidebar(false)}/>}
  <aside className={"sidebar "+(sidebar?"open":"")}><div className="brand"><div className="brand-mark">道</div><div><div className="brand-name">Michi <span>みち</span></div><div style={{fontSize:9,color:"#68758d"}}>Your path to Japanese</div></div></div>
   <div className="nav-label">Learn</div><nav className="nav"><button className={view==="dashboard"?"active":""} onClick={()=>nav("dashboard")}><Home size={16}/>Dashboard</button><button className={view==="lesson"?"active":""} onClick={()=>{setDay(Math.min(180,Math.max(1,completed.length+1)));nav("lesson")}}><BookOpen size={16}/>Learn today</button><button onClick={()=>document.getElementById("curriculum")?.scrollIntoView({behavior:"smooth"})}><CalendarDays size={16}/>Curriculum</button><button><Brain size={16}/>Review & SRS <span style={{marginLeft:"auto",fontSize:9,color:"#59657c"}}>Soon</span></button></nav>
   <div className="nav-label">Account</div><nav className="nav"><button onClick={()=>user?logout():setAuth("login")}>{user?<LogOut size={16}/>:<CircleUserRound size={16}/>} {user?"Sign out":"Sign in"}</button><button><Settings size={16}/>Settings</button></nav>
   <div className="sidebar-bottom"><div className="mini-progress"><div className="mini-progress-head"><span>Journey progress</span><b>{progress}%</b></div><div className="bar"><span style={{width:progress+"%"}}/></div><div style={{fontSize:9,color:"#59657c",marginTop:8}}>{completed.length}/180 days mastered</div></div></div>
  </aside>
  <div className="main-shell"><header className="topbar"><button className="mobile-menu" onClick={()=>setSidebar(true)}><Menu size={18}/></button><div style={{fontSize:12,color:"#66738b",marginLeft:10}}>{view==="lesson"?"Lesson workspace":"Dashboard"}</div><div className="top-actions">{user?<div className="user-chip"><div className="avatar">{(user.email||"M").slice(0,1).toUpperCase()}</div>{user.email}</div>:<><button className="outline-btn" onClick={()=>setAuth("login")}>Sign in</button><button className="primary-btn" onClick={()=>setAuth("register")}>Create account</button></>}</div></header>
   <main className="page">{view==="lesson"?(lessonLoading||!lesson?<div className="hero" style={{minHeight:300,display:"grid",placeItems:"center"}}><div style={{textAlign:"center"}}><div className="eyebrow">Michi lesson</div><div className="title">Loading Day {day}…</div><div className="subtitle">Preparing your learning workspace.</div></div></div>:<Lesson lesson={lesson} day={day} onBack={()=>setView("dashboard")} onComplete={complete}/>):<Dashboard completed={completed} setDay={setDay} setView={setView} user={user} onAuth={setAuth}/>}</main>
  </div>{auth&&<AuthModal mode={auth} setMode={setAuth} onClose={()=>setAuth(null)}/>}</div>
}
