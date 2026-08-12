import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, useNavigate, useLocation, Routes, Route, useParams} from 'react-router-dom';
import {Activity, AlertCircle, Ambulance, ArrowRight, BarChart3, Bell, BrainCircuit, CheckCircle2, ChevronDown, ClipboardList, Clock3, FileText, HeartPulse, LayoutDashboard, Menu, MessageSquare, Pill, Search, ShieldCheck, Sparkles, Stethoscope, Users, X, Zap} from 'lucide-react';
import './styles.css';
import './patient.css';

const API = 'http://localhost:5080/api';

// Global toast emitter (use window.__showToast to emit from anywhere)
;(window as any).__showToast = (msg:string, type='info', duration=4000) => {
  try{ window.dispatchEvent(new CustomEvent('cc-toast', { detail: { id: Date.now() + Math.random().toString(36).slice(2,6), msg, type, duration } })); }catch(e){ console.error('toast emit failed', e); }
};

// Global undo timeout (can be overridden by setting window.__UNDO_TIMEOUT = millis)
const GLOBAL_UNDO_TIMEOUT = (window as any).__UNDO_TIMEOUT || 8000;

function ToastHost(){
  const [toasts,setToasts] = useState<any[]>([]);
  useEffect(()=>{
    const h = (e:any)=>{
      const d = e.detail;
      setToasts(t=>[...t, d]);
      if(d.duration && d.duration>0){ setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==d.id)), d.duration); }
    };
    window.addEventListener('cc-toast', h as EventListener);
    return ()=> window.removeEventListener('cc-toast', h as EventListener);
  },[]);
  return <div className="toast-host">{toasts.map(t=> <div key={t.id} className={"toast "+(t.type||'')}>{t.msg}</div>)}</div>;
}


type Role = 'Admin'|'Doctor'|'Nurse'|'Management'|'Executive'|'Emergency';

type Patient = {id:string;name:string;mrn:string;status:string;room:string;doctor:string;nurse:string;condition:string;priority:number;lastEvent:string};
type Alert = {id:string;time:string;patient:string;severity:string;description:string;status:string;owner:string};
type Ai = {title:string;summary:string;insights:string[];recommendedActions:string[];sources:string[];humanReviewRequired:boolean};

const roleMeta:Record<Role,{color:string;subtitle:string}> = {
 Admin:{color:'#245fd1',subtitle:'Care Operations'}, Doctor:{color:'#6d4dd8',subtitle:'Doctor Portal'}, Nurse:{color:'#159b8f',subtitle:'AI Care Assistant'}, Management:{color:'#159b8f',subtitle:'AI Operations Copilot'}, Executive:{color:'#245fd1',subtitle:'Executive Intelligence'}, Emergency:{color:'#d92f2f',subtitle:'Emergency Command Center'}
};

// Small tag-input component for member lists
function TagInput({values,onChange,placeholder}:{values:string[];onChange:(v:string[])=>void;placeholder?:string}){
  const [input,setInput]=useState('');
  const addTag=(v:string)=>{ const t=v.trim(); if(!t) return; if(values.includes(t)){ setInput(''); return;} onChange([...values,t]); setInput(''); };
  const removeTag=(idx:number)=>{ onChange(values.filter((_,i)=>i!==idx)); };
  return <div className="tagInput"><div className="tags">{values.map((t,i)=><span key={i} className="tag">{t}<button className="tagRemove" onClick={(e)=>{e.stopPropagation(); removeTag(i);}}>×</button></span>)}</div><input placeholder={placeholder||''} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(input); } else if(e.key==='Backspace' && !input && values.length){ removeTag(values.length-1); } }} /></div>;
}

function formatPhone(raw?:string){ if(!raw) return ''; const d = raw.replace(/\D/g,''); if(d.length===10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; return raw; }

// Admin pages (keys) and menu mapping
const adminMenu = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'patient-edit', label: 'Patient Profile' },
  { key: 'careteams', label: 'Care Teams' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'nurses', label: 'Nurses' },
  { key: 'locations', label: 'Locations' },
  { key: 'alerts', label: 'Alerts & Incidents' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'tasks', label: 'Task Management' },
  { key: 'meds', label: 'Medication Management' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'audit', label: 'Audit Logs' },
  { key: 'settings', label: 'Settings' }
];

function Sidebar({user, role, adminPage, setAdminPage}:{user:any|null; role:Role; adminPage?:string; setAdminPage?: (p:string)=>void}){
  const navigate = useNavigate();
  const location = useLocation();
  const doctorMenu = ['Dashboard','Patients','Schedule','Consultations','Tasks','Alerts','Messages','Reports','Settings'];
  const nurseMenu = ['Dashboard','My Patients','Medication','Shift Handover','Tasks','Alerts','Messages','Settings'];
  let items: any[] = [];
  if(role === 'Admin') items = adminMenu;
  else if(role === 'Doctor') items = doctorMenu.map((s:any)=>({key:s.toLowerCase().replace(/\s+/g,'-'), label:s}));
  else if(role === 'Nurse') items = nurseMenu.map((s:any)=>({key:s.toLowerCase().replace(/\s+/g,'-'), label:s}));
  else items = [{key:'overview',label:'Overview'}];

  const getActive = (itKey:string)=>{
    const parts = location.pathname.split('/').filter(Boolean);
    if(role === 'Admin') return parts[0] === 'admin' && parts[1] === itKey;
    if(role === 'Doctor') return parts[0] === 'doctor' && parts[1] === itKey;
    if(role === 'Nurse') return parts[0] === 'nurse' && parts[1] === itKey;
    return false;
  };

  const onClickItem = (it:any)=>{
    if(role === 'Admin'){
      if(setAdminPage) setAdminPage(it.key);
      navigate(`/admin/${it.key}`);
    } else if(role === 'Doctor'){
      navigate(`/doctor/${it.key}`);
    } else if(role === 'Nurse'){
      navigate(`/nurse/${it.key}`);
    } else {
      navigate(`/${it.key}`);
    }
  };

  return <aside className="sidebar" style={{'--accent': roleMeta[role].color} as React.CSSProperties}>
    <div className="roleSelect"><span>Current experience</span><b>{roleMeta[role].subtitle}</b><ChevronDown size={14}/></div>
    <nav>{items.map((it:any)=>{
      const active = getActive(it.key);
      return <button key={it.key} className={active?'active':''} onClick={()=>onClickItem(it)}>{iconFor(it.label.split(' ')[0] as any)}<span>{it.label}</span>{it.key==='emergency'&&<em>8</em>}</button>
    })}</nav>
    <div className="sideBottom"><span className="avatar">{user?user.name.split(' ').map((n:any)=>n[0]).slice(0,2).join(''):'JA'}</span><div><b>{user?user.name:'John Admin'}</b><small>{role}</small></div></div>
  </aside>;
}


async function get<T>(path:string):Promise<T>{const r=await fetch(API+path); if(!r.ok) throw new Error(await r.text()); return r.json();}
async function post<T>(path:string,body?:unknown):Promise<T>{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}); if(!r.ok) throw new Error(await r.text()); return r.json();}

function App(){
  // auth state
  const [user,setUser]=useState<{name:string;role:Role;token?:string}|null>(()=>{
    try{const s=localStorage.getItem('cc_user'); return s?JSON.parse(s):null}catch{return null}
  });
  const [mobile,setMobile]=useState(false);
  const [ai,setAi]=useState<Ai|null>(null);
  const [loading,setLoading]=useState(false);
  const [patients,setPatients]=useState<Patient[]>([]);
  const [alerts,setAlerts]=useState<Alert[]>([]);
  const [dashboard,setDashboard]=useState<any>(null);
  const [ask,setAsk]=useState('');
  const [adminPage,setAdminPageState]=useState<string>('overview');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(()=>{Promise.all([get<Patient[]>('/patients'),get<Alert[]>('/alerts'),get<any>('/dashboard')]).then(([p,a,d])=>{setPatients(p);setAlerts(a);setDashboard(d)}).catch(console.error)},[]);

  // sync adminPage from URL on navigation / initial load
  useEffect(()=>{
    const parts = location.pathname.split('/').filter(Boolean);
    if(parts[0] === 'admin'){
      const page = parts[1] || 'overview';
      setAdminPageState(page);
    }
  },[location.pathname]);

  const setAdminPage = (p:string)=>{ setAdminPageState(p); navigate(`/admin/${p}`); };

  const runAi=async(path:string,body?:unknown)=>{setLoading(true);try{setAi(await post<Ai>(path,body))}finally{setLoading(false)}};
  const askAi=async()=>{if(!ask.trim())return; await runAi('/ai/ask',{role:user?.role||'Admin',question:ask});setAsk('')};

  const login = async (username:string,password:string)=>{
    try{
      const res = await post<{name:string;role:Role;token:string}>('/auth/login',{Username:username,Password:password});
      const u = { name: res.name, role: res.role, token: res.token };
      setUser(u); localStorage.setItem('cc_user', JSON.stringify(u));
      // after login, navigate to role landing
      if(u.role === 'Admin') navigate('/admin/overview');
      else if(u.role === 'Doctor') navigate('/doctor/dashboard');
      else if(u.role === 'Nurse') navigate('/nurse/dashboard');
      return true;
    }catch(e){ console.error(e); return false }
  };
  const logout = ()=>{ setUser(null); localStorage.removeItem('cc_user'); navigate('/'); };

  if(!user) return <Login onLogin={login}/>;

  const meta = roleMeta[user.role];

  return <div className="app">
    <header className="topbar"><div className="brand"><ShieldCheck size={24}/><div><b>Connected Care</b><span>Platform</span></div></div><div className="topSearch"><Search size={16}/><input placeholder="Search patients, staff, ID..."/></div><div className="topActions"><Bell size={18}/><MessageSquare size={18}/><span className="avatar">{user.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><div style={{marginLeft:8,textAlign:'right'}}><div style={{fontWeight:700}}>{user.name}</div><small>{user.role}</small></div><button className="ghost" style={{marginLeft:12}} onClick={logout}>Logout</button></div></header>
    <div className="shell">
      <Sidebar user={user} role={user.role} adminPage={adminPage} setAdminPage={setAdminPage} />

      <main className="main">
        <div className="pageHead"><div><div className="eyebrow" style={{color:meta.color}}>{meta.subtitle.toUpperCase()}</div><h1>{pageTitle(user.role)}</h1><p>{pageSubtitle(user.role)}</p></div></div>
        {dashboard && <Routes>
          <Route path="/admin/patient/:id" element={<PatientDetail runAi={runAi} setAdminPage={setAdminPage} />} />
          <Route path="*" element={<RoleView role={user.role} dashboard={dashboard} patients={patients} alerts={alerts} runAi={runAi} ai={ai} loading={loading} ask={ask} setAsk={setAsk} askAi={askAi} adminPage={adminPage} setAdminPage={setAdminPage}/>} />
        </Routes>} 
      </main>
    </div>
    {ai && <AiDrawer ai={ai} close={()=>setAi(null)} loading={loading}/>} 
    <ToastHost />
  </div>
}

function Login({onLogin}:{onLogin:(u:string,p:string)=>Promise<boolean>}){
  const [user,setUser]=useState(''); const [pass,setPass]=useState(''); const [err,setErr]=useState('');
  const submit=async()=>{ setErr(''); const ok = await onLogin(user,pass); if(!ok) setErr('Invalid credentials'); };
  return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f6f8fb'}}>
    <div style={{width:420,background:'#fff',padding:24,borderRadius:10,border:'1px solid #e6e9ef'}}>
      <h2>Sign in</h2>
      <p>Use demo credentials: admin/password, doctor/password, nurse/password</p>
      <div style={{display:'grid',gap:8}}>
        <input placeholder='Username' value={user} onChange={e=>setUser(e.target.value)} />
        <input placeholder='Password' type='password' value={pass} onChange={e=>setPass(e.target.value)} />
        {err && <div style={{color:'red'}}>{err}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className='ghost' onClick={()=>{setUser('');setPass('');setErr('')}}>Clear</button>
          <button className='primary' onClick={submit}>Sign in</button>
        </div>
      </div>
    </div>
  </div>
}


function iconFor(r:Role){const p={size:17}; switch(r){case'Admin':return <LayoutDashboard {...p}/>;case'Doctor':return <Stethoscope {...p}/>;case'Nurse':return <HeartPulse {...p}/>;case'Management':return <BarChart3 {...p}/>;case'Executive':return <Sparkles {...p}/>;default:return <Ambulance {...p}/>}}
function pageTitle(r:Role){return ({Admin:'Care Operations Dashboard',Doctor:'Doctor Care Workspace',Nurse:'Nurse AI Care Assistant',Management:'Management AI Operations Copilot',Executive:'Executive AI Brief',Emergency:'Emergency Command Center'})[r]}
function pageSubtitle(r:Role){return ({Admin:'System-wide visibility into patients, alerts, tasks and workflows.',Doctor:'Surface patients, critical cases and decisions that need attention.',Nurse:'A mobile-first task cockpit for safe, coordinated care delivery.',Management:'Understand what is happening, why it matters and where to focus.',Executive:'A concise view of organization-wide operational performance.',Emergency:'Coordinate alerts, escalation, dispatch and response in real time.'})[r]}

function RoleView({role,dashboard,patients,alerts,runAi,ai,loading,ask,setAsk,askAi,adminPage,setAdminPage}:{role:Role;dashboard:any;patients:Patient[];alerts:Alert[];runAi:(p:string,b?:unknown)=>Promise<void>;ai:Ai|null;loading:boolean;ask:string;setAsk:(s:string)=>void;askAi:()=>Promise<void>;adminPage?:string;setAdminPage?: (p:string)=>void}){
  if(role==='Admin') return <AdminView runAi={runAi} page={adminPage||'overview'} setPage={(p:string)=>setAdminPage && setAdminPage(p)} />;
  if(role==='Nurse') return <NurseView patients={patients} alerts={alerts} runAi={runAi} loading={loading}/>;
  if(role==='Management') return <ManagementView dashboard={dashboard} runAi={runAi} ask={ask} setAsk={setAsk} askAi={askAi}/>;
  if(role==='Executive') return <ExecutiveView dashboard={dashboard} runAi={runAi}/>;
  if(role==='Emergency') return <EmergencyView alerts={alerts} runAi={runAi}/>;
  return <StandardView role={role} dashboard={dashboard} patients={patients} alerts={alerts} runAi={runAi} loading={loading}/>;
}

function AdminView({runAi,page,setPage}:{runAi:(p:string,b?:unknown)=>Promise<void>; page:string; setPage:(p:string)=>void}){

  const [patients,setPatients]=useState<Patient[]>([]);
  const [careTeams,setCareTeams]=useState<any[]>([]);
  const [doctors,setDoctors]=useState<any[]>([]);
  const [nurses,setNurses]=useState<any[]>([]);
  const [locations,setLocations]=useState<any[]>([]);
  const [alerts,setAlerts]=useState<any[]>([]);
  const [incidents,setIncidents]=useState<any[]>([]);
  const [reports,setReports]=useState<any[]>([]);
  const [meds,setMeds]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [editingPatient,setEditingPatient]=useState<Patient|null>(null);

  const loadAll = async ()=>{
    setLoading(true);
    try{
      const [p,ct,d,n,l,a,i,r,m]=await Promise.all([
        get<Patient[]>('/patients'),
        get<any[]>('/careteams'),
        get<any[]>('/doctors'),
        get<any[]>('/nurses'),
        get<any[]>('/locations'),
        get<any[]>('/alerts'),
        get<any[]>('/incidents'),
        get<any[]>('/reports'),
        get<any[]>('/mar')
      ]);
      setPatients(p); setCareTeams(ct); setDoctors(d); setNurses(n); setLocations(l); setAlerts(a); setIncidents(i); setReports(r); setMeds(m);
    }catch(e){ console.error(e) }
    setLoading(false);
  };
  useEffect(()=>{ loadAll() },[]);

  const refresh = ()=>loadAll();

  // patient CRUD
  const createPatient = async (payload:any)=>{
    await post('/patients',payload);
    await loadAll();
  };
  const updatePatient = async (id:string,payload:any)=>{
    await fetch(API+`/patients/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    await loadAll();
  };
  const deletePatient = async (id:string)=>{ if(!confirm('Delete patient?')) return; await fetch(API+`/patients/${id}`,{method:'DELETE'}); await loadAll(); };

  // generic create/delete helpers for other entities (simple)
  const createEntity = async (path:string, data:any)=>{ await post(path,data); await loadAll(); };
  const deleteEntity = async (path:string,id:string)=>{ if(!confirm('Delete item?')) return; await fetch(API+`${path}/${id}`,{method:'DELETE'}); await loadAll(); };

  // pages
  const OverviewPage = ()=>{
    return <div>
      <div className="grid4"><KPI label="Total Patients" value={2340} icon={Users}/><KPI label="Active Alerts" value={12} icon={AlertCircle} color="#d92f2f"/><KPI label="Open Tasks" value={156} icon={ClipboardList}/><KPI label="Med Compliance" value="92%" icon={Pill}/></div>
      <div className="grid3"><section className="panel"><h3>Alert Summary</h3><ul>{alerts.slice(0,6).map((a:any)=><li key={a.id}><b>{a.patient}</b> — <small>{a.severity}</small> — {a.time}</li>)}</ul></section><section className="panel"><h3>Top units needing attention</h3><MiniRows rows={[["Med-Surg Unit 2","18 overdue"],["Cardiology","9 alerts"],["ICU","110% load"]]}/></section><AiCard title="AI Operations Brief" onClick={()=>runAi('/ai/management-brief')} /></div>
      <section className="panel"><h3>Recent incidents</h3><table style={{width:'100%'}}><thead><tr><th>ID</th><th>Patient</th><th>Severity</th><th>Status</th></tr></thead><tbody>{incidents.map((it:any)=><tr key={it.id}><td>{it.id}</td><td>{it.patient}</td><td>{it.severity}</td><td>{it.status}</td></tr>)}</tbody></table></section>
    </div>
  };

  // Patient modal state and component
  const [patientModal, setPatientModal] = useState<{open:boolean, patient?:Partial<Patient>|null}>({open:false,patient:null});
  const PatientModal = ()=>{
    const item = patientModal.patient || {id:'',name:'',mrn:'',status:'Stable',room:'',doctor:'',nurse:'',condition:'',priority:1,lastEvent:''};
    const [form,setForm]=useState<Partial<Patient>>(item);
    const [errors,setErrors]=useState<Record<string,string>>({});
    useEffect(()=>{ setForm(patientModal.patient || {id:'',name:'',mrn:'',status:'Stable',room:'',doctor:'',nurse:'',condition:'',priority:1,lastEvent:''}); setErrors({}); },[patientModal.patient]);
    const validate = ()=>{
      const e:Record<string,string> = {};
      if(!form.name || !form.name.trim()) e.name = 'Patient name is required';
      if(!form.mrn || !form.mrn.trim()) e.mrn = 'MRN is required';
      if(form.priority !== undefined && (Number(form.priority) < 1 || Number(form.priority) > 5)) e.priority = 'Priority must be between 1 and 5';
      setErrors(e);
      return Object.keys(e).length === 0;
    };
    const save = async ()=>{
      if(!validate()) return;
      if(form.id && typeof form.id === 'string' && form.id.startsWith('P')){
        await updatePatient(form.id,{ Name: form.name, Mrn: form.mrn, Status: form.status, Room: form.room, Doctor: form.doctor, Nurse: form.nurse, Condition: form.condition, Priority: form.priority, LastEvent: form.lastEvent });
      } else {
        await createPatient({ Name: form.name, Mrn: form.mrn, Status: form.status, Room: form.room, Doctor: form.doctor, Nurse: form.nurse, Condition: form.condition, Priority: form.priority, LastEvent: form.lastEvent });
      }
      setPatientModal({open:false,patient:null});
    };
    if(!patientModal.open) return null;
    return <div className="drawerBackdrop" onClick={()=>setPatientModal({open:false,patient:null})}><aside className="drawer" onClick={e=>e.stopPropagation()} style={{width:560}}>
      <div className="drawerHead"><div><h3>{form.id? 'Edit Patient' : 'New Patient'}</h3></div><button className="iconBtn" onClick={()=>setPatientModal({open:false,patient:null})}><X/></button></div>
      <div className="drawerSection"><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} /></label>
        {errors.name && <div className="formError">{errors.name}</div>}
        <label>MRN<input value={form.mrn||''} onChange={e=>setForm({...form,mrn:e.target.value})} /></label>
        {errors.mrn && <div className="formError">{errors.mrn}</div>}
        <label>Room<input value={form.room||''} onChange={e=>setForm({...form,room:e.target.value})} /></label>
        <label>Doctor<input value={form.doctor||''} onChange={e=>setForm({...form,doctor:e.target.value})} /></label>
        <label>Nurse<input value={form.nurse||''} onChange={e=>setForm({...form,nurse:e.target.value})} /></label>
        <label>Status<select value={form.status||'Stable'} onChange={e=>setForm({...form,status:e.target.value})}><option>Critical</option><option>High</option><option>Medium</option><option>Stable</option></select></label>
        <label>Priority<input type="number" min={1} max={5} value={form.priority||1} onChange={e=>setForm({...form,priority:parseInt(e.target.value||'1')})} /></label>
        {errors.priority && <div className="formError">{errors.priority}</div>}
        <label>Condition<textarea value={form.condition||''} onChange={e=>setForm({...form,condition:e.target.value})} /></label>
      </div></div>
      <div className="drawerFooter"><button className="ghost" onClick={()=>setPatientModal({open:false,patient:null})}>Cancel</button><button className="primary" onClick={save} disabled={Object.keys(errors).length>0}>Save patient</button></div>
    </aside></div>;
  };

  const PatientsPage = ()=>{
    const navigate = useNavigate();
    const [q,setQ]=useState('');
    const filtered = patients.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.mrn.toLowerCase().includes(q.toLowerCase()));
    return <div>
      <div className="panel" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>Patients</h3><div><input placeholder="Search patients" value={q} onChange={e=>setQ(e.target.value)}/><button className="primary" onClick={()=>{ setPatientModal({open:true,patient:{id:'',name:'',mrn:'',status:'',room:'',doctor:'',nurse:'',condition:'',priority:1,lastEvent:''}}) }}>Add Patient</button></div></div>
      <section className="panel"><table style={{width:'100%'}}><thead><tr><th>Patient</th><th>MRN</th><th>Room</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><b style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>navigate(`/admin/patient/${p.id}`)}>{p.name}</b></td><td>{p.mrn}</td><td>{p.room}</td><td>{p.doctor}</td><td><Status value={p.status}/></td><td><button className="ghost" onClick={()=>navigate(`/admin/patient/${p.id}`)}>View</button> <button className="ghost" onClick={()=>{ setPatientModal({open:true,patient:p}); }}>Edit</button> <button className="ghost" onClick={()=>deletePatient(p.id)}>Delete</button></td></tr>)}</tbody></table></section>
      {patientModal.open && <PatientModal />}
    </div>
  };

  const PatientEditPage = ()=>{
    const [form,setForm]=useState<Partial<Patient>>(()=>editingPatient||{});
    useEffect(()=>{ setForm(editingPatient||{}); },[editingPatient]);
    const save = async ()=>{
      if(!form.name){ (window as any).__showToast('Name required','error'); return; }
      if(form.id && form.id.startsWith('P')){
        await updatePatient(form.id!,{ Name: form.name, Mrn: form.mrn, Status: form.status, Room: form.room, Doctor: form.doctor, Nurse: form.nurse, Condition: form.condition, Priority: form.priority, LastEvent: form.lastEvent });
      } else {
        await createPatient({ Name: form.name, Mrn: form.mrn, Status: form.status, Room: form.room, Doctor: form.doctor, Nurse: form.nurse, Condition: form.condition, Priority: form.priority, LastEvent: form.lastEvent });
      }
      setPage('patients');
    };
    return <div className="panel"><h3>{form.id?'Edit Patient':'New Patient'}</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>MRN<input value={form.mrn||''} onChange={e=>setForm({...form,mrn:e.target.value})}/></label><label>Room<input value={form.room||''} onChange={e=>setForm({...form,room:e.target.value})}/></label><label>Doctor<input value={form.doctor||''} onChange={e=>setForm({...form,doctor:e.target.value})}/></label><label>Status<input value={form.status||''} onChange={e=>setForm({...form,status:e.target.value})}/></label><label>Priority<input type="number" value={form.priority||1} onChange={e=>setForm({...form,priority:parseInt(e.target.value||'1')})}/></label></div><div style={{marginTop:12}}><button className="primary" onClick={save}>Save</button> <button className="ghost" onClick={()=>setPage('patients')}>Cancel</button></div></div>;
  };

  const GenericList = ({title,data,createLabel,createAction,deletePath,editAction}:{title:string;data:any[];createLabel?:string;createAction?:()=>void;deletePath?:string;editAction?: (it:any)=>void})=>{
    return <div className="panel"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>{title}</h3>{createAction&&<button className="primary" onClick={createAction}>{createLabel||'Add'}</button>}</div><ul style={{listStyle:'none',padding:0,margin:0}}>{data.map((d:any)=><li key={d.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #eef1f6'}}><div><b>{d.name||d.id}</b><div style={{fontSize:11,color:'#78849a'}}>{d.department||d.specialty||d.role||''}</div></div><div style={{display:'flex',gap:8}}>{editAction&&<button className="ghost" onClick={()=>editAction(d)}>Edit</button>}{deletePath&&<button className="ghost" onClick={()=>deleteEntity(deletePath,d.id)}>Delete</button>}</div></li>)}</ul></div>
  };

  // modal for create entity
  const [createModal, setCreateModal] = useState<{type:string|null, open:boolean}>(()=>({type:null,open:false}));
  const [editModal, setEditModal] = useState<{type:string|null, open:boolean, item?:any}>(()=>({type:null,open:false,item:undefined}));

  const CreateModal = ({type}:{type:string})=>{
    const [form,setForm]=useState<any>({});
    const [errors,setErrors]=useState<Record<string,string>>({});
    useEffect(()=>{ setForm({}); setErrors({}); },[createModal.open, createModal.type]);
    const path = type === 'careteam'? '/careteams' : type === 'doctor'? '/doctors' : type === 'nurse'? '/nurses' : '/locations';
    const label = type === 'careteam'? 'Care Team' : type === 'doctor'? 'Doctor' : type === 'nurse'? 'Nurse' : 'Location';
    const validate = ()=>{
      const e:Record<string,string>={};
      if(!form.name || !form.name.trim()) e.name='Name is required';
      if(type==='location'){
        const cap = Number(form.capacity);
        if(form.capacity===undefined || isNaN(cap)) e.capacity='Capacity is required and must be a number';
        else if(cap < 0 || cap > 500) e.capacity='Capacity must be between 0 and 500';
      }
      setErrors(e); return Object.keys(e).length===0;
    };
    const submit = async ()=>{
      if(!validate()) return;
      let body:any = {};
      switch(type){
        case 'careteam': body = { Name: form.name, Department: form.department||'', Members: (form.members||'').split(',').map((s:string)=>s.trim()).filter(Boolean), Status: form.status||'Active'}; break;
        case 'doctor': body = { Name: form.name, Specialty: form.specialty||'', Department: form.department||'', Phone: formatPhone(form.phone||'') }; break;
        case 'nurse': body = { Name: form.name, Role: form.role||'', Department: form.department||'', Shift: form.shift||'' }; break;
        case 'location': body = { Name: form.name, Floor: form.floor||'', Capacity: parseInt(form.capacity||0), Status: form.status||'Active' }; break;
      }
      await createEntity(path, body);
      setCreateModal({type:null,open:false});
    };
    if(!(createModal.open && createModal.type === type)) return null;
    return <div className="drawerBackdrop" onClick={()=>setCreateModal({type:null,open:false})}><aside className="drawer" onClick={e=>e.stopPropagation()} style={{width:520}}>
      <div className="drawerHead"><div><h3>Add {label}</h3></div><button className="iconBtn" onClick={()=>setCreateModal({type:null,open:false})}><X/></button></div>
      <div className="drawerSection">
        {type==='careteam' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Members<TagInput values={(form.members||'').split? (form.members||[]).map((m:any)=>typeof m==='string'?m:m.name) : []} onChange={(v)=>setForm({...form,members:v})} placeholder="Add a member and press Enter" /></label>
          <label>Status<select value={form.status||'Active'} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></label>
        </div>}
        {type==='doctor' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Specialty<input value={form.specialty||''} onChange={e=>setForm({...form,specialty:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        </div>}
        {type==='nurse' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Role<input value={form.role||''} onChange={e=>setForm({...form,role:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Shift<select value={form.shift||'Day'} onChange={e=>setForm({...form,shift:e.target.value})}><option>Day</option><option>Night</option></select></label>
        </div>}
        {type==='location' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Floor<input value={form.floor||''} onChange={e=>setForm({...form,floor:e.target.value})}/></label>
          <label>Capacity<div className="stepper" style={{display:"flex",alignItems:"center",gap:8}}><button type="button" className="iconBtn" onClick={()=>setForm({...form,capacity: Math.max(0, (Number(form.capacity)||0)-1) })}>-</button><input type="number" value={form.capacity===undefined?0:form.capacity} onChange={e=>setForm({...form,capacity: parseInt(e.target.value||'0')})} style={{width:80,textAlign:"center"}} /><button type="button" className="iconBtn" onClick={()=>setForm({...form,capacity: (Number(form.capacity)||0)+1 })}>+</button></div>{errors.capacity && <div style={{color:'#d92f2f',fontSize:12,marginTop:6}}>{errors.capacity}</div>}</label>
          <label>Status<select value={form.status||'Active'} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></label>
        </div>}
        {Object.keys(errors).length>0 && <div className="formError">{Object.values(errors).join(' • ')}</div>}
      </div>
      <div className="drawerFooter"><button className="ghost" onClick={()=>setCreateModal({type:null,open:false})}>Cancel</button><button className="primary" onClick={submit}>Create</button></div>
    </aside></div>;
  };

  const updateEntity = async (path:string, id:string, data:any) => {
    await fetch(API+`${path}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    await loadAll();
  };

  const EditModal = ({type}:{type:string})=>{
    const item = editModal.item || {id:'',name:''};
    const [form,setForm]=useState<any>(item||{});
    const [errors,setErrors]=useState<Record<string,string>>({});
    const path = type === 'careteam'? '/careteams' : type === 'doctor'? '/doctors' : type === 'nurse'? '/nurses' : '/locations';
    const label = type === 'careteam'? 'Care Team' : type === 'doctor'? 'Doctor' : type === 'nurse'? 'Nurse' : 'Location';
    useEffect(()=>{ setForm(editModal.item || {}); setErrors({}); },[editModal.item]);
    const validate = ()=>{
      const e:Record<string,string>={};
      if(!form.name || !form.name.trim()) e.name='Name is required';
      if(type==='location'){
        const cap = Number(form.capacity);
        if(form.capacity===undefined || isNaN(cap)) e.capacity='Capacity is required and must be a number';
        else if(cap < 0 || cap > 500) e.capacity='Capacity must be between 0 and 500';
      }
      setErrors(e); return Object.keys(e).length===0;
    };
    const submit = async ()=>{
      if(!validate()) return;
      let body:any={};
      switch(type){
        case 'careteam': body = { Name: form.name, Department: form.department||'', Members: (form.members||[]).map((m:any)=>typeof m==='string'?m:m.name)||[], Status: form.status||'Active'}; break;
        case 'doctor': body = { Name: form.name, Specialty: form.specialty||'', Department: form.department||'', Phone: formatPhone(form.phone||'') }; break;
        case 'nurse': body = { Name: form.name, Role: form.role||'', Department: form.department||'', Shift: form.shift||'' }; break;
        case 'location': body = { Name: form.name, Floor: form.floor||'', Capacity: parseInt(form.capacity||0), Status: form.status||'Active' }; break;
      }
      await updateEntity(path, item.id, body);
      setEditModal({type:null,open:false,item:undefined});
    };
    if(!(editModal.open && editModal.type === type)) return null;
    return <div className="drawerBackdrop" onClick={()=>setEditModal({type:null,open:false,item:undefined})}><aside className="drawer" onClick={e=>e.stopPropagation()} style={{width:520}}>
      <div className="drawerHead"><div><h3>Edit {label}</h3></div><button className="iconBtn" onClick={()=>setEditModal({type:null,open:false,item:undefined})}><X/></button></div>
      <div className="drawerSection">
        {type==='careteam' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Members<TagInput values={(form.members||[]).map((m:any)=>typeof m==='string'?m:m.name)} onChange={(v)=>setForm({...form,members:v})} placeholder="Add a member and press Enter" /></label>
          <label>Status<select value={form.status||'Active'} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></label>
        </div>}
        {type==='doctor' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Specialty<input value={form.specialty||''} onChange={e=>setForm({...form,specialty:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        </div>}
        {type==='nurse' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Role<input value={form.role||''} onChange={e=>setForm({...form,role:e.target.value})}/></label>
          <label>Department<input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/></label>
          <label>Shift<select value={form.shift||'Day'} onChange={e=>setForm({...form,shift:e.target.value})}><option>Day</option><option>Night</option></select></label>
        </div>}
        {type==='location' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Floor<input value={form.floor||''} onChange={e=>setForm({...form,floor:e.target.value})}/></label>
          <label>Capacity<div className="stepper" style={{display:"flex",alignItems:"center",gap:8}}><button type="button" className="iconBtn" onClick={()=>setForm({...form,capacity: Math.max(0, (Number(form.capacity)||0)-1) })}>-</button><input type="number" value={form.capacity===undefined?0:form.capacity} onChange={e=>setForm({...form,capacity: parseInt(e.target.value||'0')})} style={{width:80,textAlign:"center"}} /><button type="button" className="iconBtn" onClick={()=>setForm({...form,capacity: (Number(form.capacity)||0)+1 })}>+</button></div>{errors.capacity && <div style={{color:'#d92f2f',fontSize:12,marginTop:6}}>{errors.capacity}</div>}</label>
          <label>Status<select value={form.status||'Active'} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></label>
        </div>}
        {Object.keys(errors).length>0 && <div className="formError">{Object.values(errors).join(' • ')}</div>}
      </div>
      <div className="drawerFooter"><button className="ghost" onClick={()=>setEditModal({type:null,open:false,item:undefined})}>Cancel</button><button className="primary" onClick={submit}>Save</button></div>
    </aside></div>;
  };

  const CareTeamsPage = ()=> <div><GenericList title="Care Teams" data={careTeams} createAction={()=>setCreateModal({type:'careteam',open:true})} createLabel="Add Care Team" deletePath="/careteams" editAction={(it:any)=>setEditModal({type:'careteam',open:true,item:it})} /></div>;
  const DoctorsPage = ()=> <div><GenericList title="Doctors" data={doctors} createAction={()=>setCreateModal({type:'doctor',open:true})} createLabel="Add Doctor" deletePath="/doctors" editAction={(it:any)=>setEditModal({type:'doctor',open:true,item:it})} /></div>;
  const NursesPage = ()=> <div><GenericList title="Nurses" data={nurses} createAction={()=>setCreateModal({type:'nurse',open:true})} createLabel="Add Nurse" deletePath="/nurses" editAction={(it:any)=>setEditModal({type:'nurse',open:true,item:it})} /></div>;
  const LocationsPage = ()=> <div><GenericList title="Locations" data={locations} createAction={()=>setCreateModal({type:'location',open:true})} createLabel="Add Location" deletePath="/locations" editAction={(it:any)=>setEditModal({type:'location',open:true,item:it})} /></div>;

  const AlertsPage = ()=> <div className="panel"><h3>Alerts</h3><table style={{width:'100%'}}><thead><tr><th>Time</th><th>Patient</th><th>Severity</th><th>Description</th><th>Status</th></tr></thead><tbody>{alerts.map(a=><tr key={a.id}><td>{a.time}</td><td>{a.patient}</td><td>{a.severity}</td><td>{a.description}</td><td>{a.status}</td></tr>)}</tbody></table></div>;
  const IncidentsPage = ()=> <div className="panel"><h3>Incidents</h3><table style={{width:'100%'}}><thead><tr><th>ID</th><th>Patient</th><th>Category</th><th>Status</th></tr></thead><tbody>{incidents.map(i=><tr key={i.id}><td>{i.id}</td><td>{i.patient}</td><td>{i.category}</td><td>{i.status}</td></tr>)}</tbody></table></div>;
  const TasksPage = ()=> <div className="panel"><h3>Task Management</h3><p>Task management UI will be implemented here.</p></div>;
  const MedsPage = ()=>{
    const [updatingMedIds,setUpdatingMedIds] = useState<string[]>([]);
    const [optimistic,setOptimistic] = useState<Record<string,{prevStatus:string, timer:number}>>({});

    const markGiven = async (m:any)=>{
      const id = m.id || m.Id;
      const pid = m.patientId || m.PatientId;
      const medName = m.medication || m.Medication;
      const patientName = (patients.find(p=>p.id===pid)||{name:pid}).name;
      if(!confirm(`Mark ${medName} for ${patientName} as Given?`)) return;

      const prevStatus = m.status || m.Status || 'Pending';
      // optimistic UI update
      setMeds(prev => prev.map(x=>{ const xid = x.id || x.Id; if(xid===id) return {...x, status:'Given', administeredBy:'You', administeredAt: new Date().toLocaleString()}; return x;}));

      // show undo option for a short window
      const UNDO_TIMEOUT = (window as any).__UNDO_TIMEOUT || GLOBAL_UNDO_TIMEOUT || 8000;
      const timer = window.setTimeout(()=>{
        setOptimistic(curr=>{ const copy = {...curr}; delete copy[id]; return copy; });
      }, UNDO_TIMEOUT);
      setOptimistic(curr=>({ ...curr, [id]: { prevStatus, timer } }));

      // send request to server
      setUpdatingMedIds(s=>[...s,id]);
      try{
        const body = { Status: 'Given', AdministeredBy: 'Nurse Demo', AdministeredAt: new Date().toLocaleString() };
        const res = await fetch(API+`/mar/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!res.ok){ throw new Error(await res.text()); }
        // leave optimistic UI; it will clear after timer
      }catch(e){
        console.error(e);
        // rollback UI immediately
        setMeds(prev => prev.map(x=>{ const xid = x.id || x.Id; if(xid===id) return {...x, status: prevStatus, administeredBy:'', administeredAt:''}; return x;}));
        setOptimistic(curr=>{ const copy = {...curr}; if(copy[id]){ clearTimeout(copy[id].timer); delete copy[id]; } return copy; });
        (window as any).__showToast('Failed to update medication status','error');
      }finally{
        setUpdatingMedIds(s=>s.filter(x=>x!==id));
      }
    };

    const undoMark = async (m:any)=>{
      const id = m.id || m.Id;
      const entry = optimistic[id];
      if(!entry) return;
      // cancel optimistic timer
      clearTimeout(entry.timer);
      // revert UI immediately
      setMeds(prev => prev.map(x=>{ const xid = x.id || x.Id; if(xid===id) return {...x, status: entry.prevStatus, administeredBy:'', administeredAt:''}; return x;}));
      setOptimistic(curr=>{ const copy = {...curr}; delete copy[id]; return copy; });

      // send revert to server to restore previous status
      setUpdatingMedIds(s=>[...s,id]);
      try{
        const body = { Status: entry.prevStatus, AdministeredBy: '', AdministeredAt: '' };
        const res = await fetch(API+`/mar/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!res.ok) throw new Error(await res.text());
        await loadAll();
      }catch(e){
        console.error(e);
        (window as any).__showToast('Failed to revert medication status on server','error');
      }finally{
        setUpdatingMedIds(s=>s.filter(x=>x!==id));
      }
    };

    return <div className="panel"><h3>Medication Administration (MAR)</h3>
      <table style={{width:'100%'}}><thead><tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Scheduled</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{meds.map(m=>{ const id = m.id || m.Id; const pid = m.patientId || m.PatientId; const med = m.medication || m.Medication; const dose = m.dose || m.Dose; const sched = m.scheduledTime || m.ScheduledTime; const status = m.status || m.Status; const updating = updatingMedIds.includes(id); const isOptimistic = Boolean(optimistic[id]); return <tr key={id}><td><b>{(patients.find(p=>p.id===pid)||{name:pid}).name}</b></td><td>{med}</td><td>{dose}</td><td>{sched}</td><td><Status value={status}/></td><td>{isOptimistic ? <button className="ghost" onClick={()=>undoMark(m)} disabled={updating}>{updating? 'Reverting...' : 'Undo'}</button> : (status!=='Given' && <button className="primary" onClick={()=>markGiven(m)} disabled={updating}>{updating? 'Updating...' : 'Mark Given'}</button>)}</td></tr> })}</tbody></table>
    </div>;
  };
  const ReportsPage = ()=> <div className="panel"><h3>Reports & Analytics</h3><p>Reports UI and charts will be implemented here.</p></div>;
  const IntegrationsPage = ()=> <div className="panel"><h3>Integrations</h3><p>Integration status (demo) shown here.</p></div>;
  const AuditPage = ()=> <div className="panel"><h3>Audit Logs</h3><p>Audit logs list will be shown here.</p></div>;
  const SettingsPage = ()=> <div className="panel"><h3>Settings</h3><p>General settings are editable here.</p></div>;

  const pageComponent = ()=>{
    switch(page){
      case 'overview': return <OverviewPage/>;
      case 'patients': return <PatientsPage/>;
      case 'patient-edit': return <PatientEditPage/>;
      case 'careteams': return <CareTeamsPage/>;
      case 'doctors': return <DoctorsPage/>;
      case 'nurses': return <NursesPage/>;
      case 'locations': return <LocationsPage/>;
      case 'alerts': return <AlertsPage/>;
      case 'incidents': return <IncidentsPage/>;
      case 'tasks': return <TasksPage/>;
      case 'meds': return <MedsPage/>;
      case 'reports': return <ReportsPage/>;
      case 'integrations': return <IntegrationsPage/>;
      case 'audit': return <AuditPage/>;
      case 'settings': return <SettingsPage/>;
      default: return <OverviewPage/>;
    }
  };

  return <div style={{padding:8}}>{pageComponent()}{createModal.open && createModal.type && <CreateModal type={createModal.type} />}{editModal.open && editModal.type && <EditModal type={editModal.type} />}</div>;
}

function PatientDetail({runAi,setAdminPage}:{runAi:(p:string,b?:unknown)=>Promise<void>; setAdminPage:(p:string)=>void}){
  const {id} = useParams();
  const [patient,setPatient]=useState<Patient|null>(null);
  const [tab,setTab]=useState<string>('overview');
  const [alerts,setAlerts]=useState<Alert[]>([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{ if(!id) return; setLoading(true); get<Patient>(`/patients/${id}`).then(p=>{ setPatient(p); }).catch(console.error).finally(()=>setLoading(false)); get<Alert[]>('/alerts').then(a=>setAlerts(a)).catch(()=>{}); },[id]);
  if(!id) return <div className="panel"><h3>Patient</h3><p>No patient specified.</p></div>;
  if(loading || !patient) return <div className="panel"><h3>Patient</h3><p>Loading...</p></div>;
  const patientAlerts = alerts.filter(a=>a.patient===patient.name);
  return <div className="patientDetailWrap">
    <aside className="patientSide">
      <div className="patientCard"><div><h2>{patient.name}</h2><small>MRN {patient.mrn} • {patient.room}</small></div><div><Status value={patient.status}/></div></div>
      <div className="panel"><h4>Primary</h4><p><b>Doctor:</b> {patient.doctor}</p><p><b>Nurse:</b> {patient.nurse}</p><p><b>Condition:</b> {patient.condition}</p><p><b>Last event:</b> {patient.lastEvent}</p></div>
      <div className="panel"><h4>Quick actions</h4><button className="primary" onClick={()=>runAi('/ai/patient-summary',{patientId:patient.id})}>AI Summary</button><button className="ghost" onClick={()=>{ setAdminPage('patient-edit'); }}>Edit in Admin</button></div>
      <div className="panel"><h4>Active alerts</h4><ul>{patientAlerts.map(a=><li key={a.id}><b>{a.severity}</b> — {a.time}</li>)}</ul></div>
    </aside>
    <main className="patientContent">
      <div className="tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button><button className={tab==='clinical'?'active':''} onClick={()=>setTab('clinical')}>Clinical</button><button className={tab==='vitals'?'active':''} onClick={()=>setTab('vitals')}>Vitals</button><button className={tab==='meds'?'active':''} onClick={()=>setTab('meds')}>Medications</button><button className={tab==='docs'?'active':''} onClick={()=>setTab('docs')}>Documents</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>History</button></div>
      <div className="panel">
        {tab==='overview' && <div><h3>Overview</h3><p><b>Problem list:</b> {patient.condition}</p><div className="grid2"><div className="miniCard"><b>BP</b><p>120/80</p></div><div className="miniCard"><b>HR</b><p>74</p></div></div></div>}
        {tab==='clinical' && <div><h3>Clinical</h3><p>Clinical notes and active orders would appear here.</p></div>}
        {tab==='vitals' && <div><h3>Vitals</h3><Chart/></div>}
        {tab==='meds' && <div><h3>Medications</h3><p>Medication list (demo)</p></div>}
        {tab==='docs' && <div><h3>Documents</h3><p>Scanned documents and attachments.</p></div>}
        {tab==='history' && <div><h3>History</h3><p>Timeline and events.</p></div>}
      </div>
    </main>
  </div>;
}

function KPI({label,value,delta,icon:Icon,color='#245fd1'}:{label:string;value:string|number;delta?:string;icon?:any;color?:string}){return <div className="kpi"><div className="kpiTop"><span>{label}</span>{Icon&&<Icon size={17} color={color}/>}</div><strong>{value}</strong>{delta&&<small className="up">{delta}</small>}</div>}
function AiCard({title,children,onClick,button='View AI Insights',color='#245fd1'}:{title:string;children:React.ReactNode;onClick?:()=>void;button?:string;color?:string}){return <section className="aiCard"><div className="aiTitle"><span className="aiIcon" style={{background:color}}><Sparkles size={14}/></span><b>{title}</b><span className="beta">BETA</span></div><div>{children}</div>{onClick&&<button className="primary" onClick={onClick}>{button}<ArrowRight size={15}/></button>}</section>}
function StandardView({role,dashboard,patients,alerts,runAi,loading}:{role:Role;dashboard:any;patients:Patient[];alerts:Alert[];runAi:(p:string,b?:unknown)=>Promise<void>;loading:boolean}){
 return <>
  <div className="grid4"><KPI label="Total Patients" value={dashboard.totalPatients.toLocaleString()} delta="↑ 12.5% vs last month" icon={Users}/><KPI label="Active Alerts" value={dashboard.activeAlerts} delta="↑ 20% vs yesterday" icon={AlertCircle} color="#d92f2f"/><KPI label="Critical Alerts" value={dashboard.criticalAlerts} icon={Zap} color="#d92f2f"/><KPI label="Care Teams" value={dashboard.careTeams} delta="Active" icon={HeartPulse} color="#159b8f"/></div>
  <div className="grid3"><AiCard title={role==='Doctor'?'AI Patient Attention':'AI Operations Brief'} onClick={()=>role==='Doctor'?runAi('/ai/patient-summary',{patientId:patients[0]?.id}):runAi('/ai/management-brief')} color={role==='Doctor'?'#6d4dd8':'#245fd1'}><ul className="insightList"><li><span className="dot red"/>3 patients/events need attention</li><li><span className="dot orange"/>18 tasks overdue across units</li><li><span className="dot green"/>Medication compliance 92%</li></ul></AiCard><Panel title="Alert trend"><Chart/></Panel><Panel title="Patient status"><Donut value="2,350" label="Total Patients"/></Panel></div>
  <div className="grid3"><Panel title="Task overview"><MiniRows rows={[['Overdue','18'],['Due Today','45'],['Due This Week','63'],['Completed Today','32']]}/></Panel><Panel title="Medication compliance"><Donut value="92%" label="Overall"/></Panel><Panel title="Top units needing attention"><MiniRows rows={dashboard.units.map((x:any)=>[x.unit,x.value])}/></Panel></div>
  <section className="panel"><div className="panelHead"><h3>Patients</h3><span>View all</span></div><table><thead><tr><th>Patient</th><th>MRN</th><th>Room</th><th>Doctor</th><th>Status</th><th>Latest event</th></tr></thead><tbody>{patients.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.mrn}</td><td>{p.room}</td><td>{p.doctor}</td><td><Status value={p.status}/></td><td>{p.lastEvent}</td></tr>)}</tbody></table></section>
 </>;
}
function NurseView({patients,alerts,runAi,loading}:{patients:Patient[];alerts:Alert[];runAi:(p:string,b?:unknown)=>Promise<void>;loading:boolean}){return <>
 <div className="grid3"><AiCard title="AI Care Assistant" onClick={()=>runAi('/ai/nurse-brief',{nurseName:'Emma'})}><h2 className="bigNumber">3</h2><p>patients/items need your attention now</p><ul className="insightList"><li>1 critical alert</li><li>1 overdue medication</li><li>1 follow-up task</li></ul></AiCard><Panel title="Today's overview"><MiniRows rows={[['Patients','25'],['Medications','12'],['Rounds','8'],['Open tasks','18']]}/></Panel><Panel title="Priority alerts"><MiniRows rows={alerts.slice(0,4).map(a=>[a.patient,a.severity])}/></Panel></div>
 <div className="grid3"><AiCard title="AI Priority Tasks" button="Open Priority Tasks" onClick={()=>runAi('/ai/nurse-brief',{nurseName:'Emma'})} color="#6d4dd8"><TaskRow name="Patricia Smith" type="Critical alert" color="red"/><TaskRow name="Michael Davis" type="Medication follow-up" color="orange"/><TaskRow name="Linda Martinez" type="Vitals due" color="orange"/></AiCard><AiCard title="AI Shift Handover" button="Generate Handover" onClick={()=>runAi('/ai/shift-handover',{nurseName:'Emma'})} color="#159b8f"><p>Four patients have information that should be reviewed before handoff.</p><ul className="compact"><li>Critical alert follow-up</li><li>Medication task</li><li>Routine observation</li><li>Discharge planning</li></ul></AiCard><AiCard title="AI Documentation Draft" button="Create Draft" onClick={()=>runAi('/ai/documentation-draft',{observation:'Patient comfortable; no new concerns reported.',vitals:'BP 120/80; HR 72; SpO2 98%',medication:'Medication administered as scheduled',followUp:'Continue current care plan'})} color="#245fd1"><p>Turn nurse-entered observation, vitals and medication details into a reviewable structured draft.</p></AiCard></div>
 <section className="panel"><div className="panelHead"><h3>Assigned patients</h3><span>{patients.length} visible</span></div><div className="patientCards">{patients.map(p=><div className="patientCard" key={p.id}><div><b>{p.name}</b><small>{p.room} • {p.condition}</small></div><Status value={p.status}/><button className="ghost" onClick={()=>runAi('/ai/patient-summary',{patientId:p.id})}>AI Summary</button></div>)}</div></section>
 </>}
function ManagementView({dashboard,runAi,ask,setAsk,askAi}:{dashboard:any;runAi:(p:string,b?:unknown)=>Promise<void>;ask:string;setAsk:(s:string)=>void;askAi:()=>Promise<void>}){return <>
 <div className="grid4"><KPI label="Avg. Response Time" value="4.2 min" delta="↓ 14% last week" icon={Clock3}/><KPI label="Alert Volume" value="1,245" delta="↑ 16% last week" icon={AlertCircle}/><KPI label="Task Compliance" value="92%" delta="↑ 3% last week" icon={ClipboardList}/><KPI label="Med Compliance" value="88%" delta="↑ 5% last week" icon={Pill}/></div>
 <div className="grid2"><AiCard title="AI Operations Brief" onClick={()=>runAi('/ai/management-brief')}><ul className="insightList"><li>Emergency response time increased 14%</li><li>18 care tasks are overdue</li><li>Medication compliance below target in one unit</li></ul></AiCard><section className="aiCard"><div className="aiTitle"><span className="aiIcon" style={{background:'#159b8f'}}><BrainCircuit size={14}/></span><b>Ask Operations Copilot</b><span className="beta">AI</span></div><p>Ask why performance changed or where management attention is needed.</p><div className="ask"><input value={ask} onChange={e=>setAsk(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAi()} placeholder="Why did response time increase this week?"/><button onClick={askAi}><ArrowRight size={16}/></button></div></section></div>
 <div className="grid2"><Panel title="Top units needing attention"><MiniRows rows={dashboard.units.map((x:any)=>[x.unit,`${x.value} • ${x.issue}`])}/></Panel><Panel title="Workload trend"><Chart green/></Panel></div>
 <div className="grid3"><AiCard title="AI Incident Summary" button="View Incident Summary" onClick={()=>runAi('/ai/management-brief')} color="#d92f2f"><h2>14</h2><p>incidents in the last 7 days</p></AiCard><AiCard title="AI Staffing & Workload" button="Analyze Workload" onClick={()=>runAi('/ai/management-brief')} color="#6d4dd8"><p>Identify units where workload, alerts and open tasks are diverging from expected capacity.</p></AiCard><AiCard title="AI Report Generator" button="Generate Report" onClick={()=>runAi('/ai/report',{type:'Weekly Operations Report'})} color="#245fd1"><p>Generate a reviewable management report from authorized operational metrics.</p></AiCard></div>
 </>}
function ExecutiveView({dashboard,runAi}:{dashboard:any;runAi:(p:string,b?:unknown)=>Promise<void>}){return <><div className="grid4"><KPI label="Patients" value="2,350" delta="↑ 12.5%"/><KPI label="Facilities" value="6"/><KPI label="Care Teams" value="45"/><KPI label="Staff" value="320"/></div><div className="grid2"><AiCard title="AI Executive Brief" button="View Full Executive Report" onClick={()=>runAi('/ai/management-brief')} color="#245fd1"><h3>Operations are stable</h3><ul className="insightList"><li>Few areas need management attention</li><li>Emergency response trends require review</li><li>Medication compliance below target in one facility</li></ul></AiCard><Panel title="Organization trend"><Chart/></Panel></div><section className="panel"><div className="panelHead"><h3>Executive priorities</h3></div><div className="priorityGrid"><div><b>Patient Safety</b><p>Review critical incident trends.</p></div><div><b>Operational Efficiency</b><p>Investigate response-time variation.</p></div><div><b>Workforce</b><p>Review workload concentration.</p></div><div><b>Digital Adoption</b><p>Track task and workflow completion.</p></div></div></section></>}
function EmergencyView({alerts,runAi}:{alerts:Alert[];runAi:(p:string,b?:unknown)=>Promise<void>}){return <><div className="grid4"><KPI label="Active Alerts" value="8" icon={AlertCircle} color="#d92f2f"/><KPI label="High Priority" value="5" icon={Zap} color="#e58a27"/><KPI label="Ambulances On Route" value="3" icon={Ambulance} color="#159b8f"/><KPI label="Avg. Response" value="4.2 min" icon={Clock3}/></div><div className="grid2"><AiCard title="AI Emergency Copilot" button="Review Recommendations" onClick={()=>runAi('/ai/emergency-copilot')} color="#d92f2f"><ul className="insightList"><li>2 alerts need immediate attention</li><li>3 alerts awaiting response</li><li>1 event approaching escalation threshold</li></ul></AiCard><section className="panel map"><div className="panelHead"><h3>Alert map</h3><span>Live</span></div><div className="mapGrid"><span style={{left:'22%',top:'35%'}}></span><span style={{left:'62%',top:'22%'}}></span><span style={{left:'75%',top:'65%'}}></span><span style={{left:'42%',top:'70%'}}></span></div></section></div><section className="panel"><div className="panelHead"><h3>Live alerts</h3><span>View all</span></div><table><thead><tr><th>Time</th><th>Patient</th><th>Severity</th><th>Description</th><th>Status</th><th>Owner</th></tr></thead><tbody>{alerts.map(a=><tr key={a.id}><td>{a.time}</td><td><b>{a.patient}</b></td><td><Status value={a.severity}/></td><td>{a.description}</td><td>{a.status}</td><td>{a.owner}</td></tr>)}</tbody></table></section></>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="panel"><div className="panelHead"><h3>{title}</h3><span>View all</span></div>{children}</section>}
function Status({value}:{value:string}){const v = (value||'').toLowerCase(); const c = v.includes('given') ? 'green' : v.includes('pending') ? 'orange' : v.includes('refus') ? 'red' : v.includes('critical') ? 'red' : v.includes('high') ? 'orange' : v.includes('medium') ? 'yellow' : 'green'; return <span className={'status '+c}>{value}</span>}
function MiniRows({rows}:{rows:string[][]}){return <div className="miniRows">{rows.map((r,i)=><div key={i}><span>{r[0]}</span><b>{r[1]}</b></div>)}</div>}
function TaskRow({name,type,color}:{name:string;type:string;color:string}){return <div className="taskRow"><span className={'dot '+color}/><div><b>{name}</b><small>{type}</small></div><ArrowRight size={14}/></div>}
function Donut({value,label}:{value:string;label:string}){return <div className="donutWrap"><div className="donut"><b>{value}</b></div><div><b>{label}</b><p>On target <strong>92%</strong></p><p>Missed <strong>5%</strong></p><p>Late <strong>3%</strong></p></div></div>}
function Chart({green=false}:{green?:boolean}){return <div className="chart"><div className={'spark '+(green?'green':'')}><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="axis"><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span></div></div>}
function AiDrawer({ai,close,loading}:{ai:Ai;close:()=>void;loading:boolean}){return <div className="drawerBackdrop" onClick={close}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawerHead"><div><span className="eyebrow">AI ASSISTANCE</span><h2>{ai.title}</h2></div><button className="iconBtn" onClick={close}><X/></button></div><div className="reviewBanner"><ShieldCheck size={16}/><b>Human review required</b><span>AI output is assistance, not an autonomous clinical decision.</span></div><div className="drawerSection"><h4>Summary</h4><p>{ai.summary}</p></div><div className="drawerSection"><h4>Key insights</h4><ul>{ai.insights.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div className="drawerSection"><h4>Recommended actions</h4><ol>{ai.recommendedActions.map((x,i)=><li key={i}>{x}</li>)}</ol></div><div className="drawerSection"><h4>Supporting data</h4><div className="sourceList">{ai.sources.map(x=><span key={x}>{x}</span>)}</div></div><div className="drawerFooter"><button className="ghost" onClick={close}>Close</button><button className="primary" onClick={close}>Review & Continue</button></div></aside></div>}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>);



