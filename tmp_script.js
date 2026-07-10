
const MESES = ['Novembro','Dezembro','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_S = ['Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const RECEITAS_BASE = [
  {cat:'Salário',      vals:[1000,1000,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600]},
  {cat:'VT',           vals:[200,200,200,200,200,200,200,200,200,200,200,200,200,200]},
  {cat:'Renda Extra',  vals:[100,290,100,0,100,150,0,0,0,0,0,0,0,0]}
];
const DESPESAS_BASE = [
  {cat:'Celular',        vals:[250,250,250,250,0,0,0,0,0,0,0,0,0,0]},
  {cat:'Tênis',          vals:[0,104,104,204,204,100,0,0,0,0,0,0,0,0]},
  {cat:'Lolla (10x)',    vals:[0,130,130,130,430,130,130,130,130,130,130,0,0,0]},
  {cat:'Passagem SP',    vals:[0,0,0,0,97,177,0,0,0,0,0,0,0,0]},
  {cat:'Perfume',        vals:[120,210,242,90,190,90,0,0,0,0,0,0,0,0]},
  {cat:'Internet',       vals:[55,55,55,55,55,55,55,55,55,55,55,55,55,55]},
  {cat:'Viagem',         vals:[100,100,100,100,100,0,0,0,0,0,0,0,0,0]},
  {cat:'Investimento',   vals:[0,0,0,200,200,200,200,200,200,200,200,200,200,200]},
  {cat:'Barbearia',      vals:[55,55,55,55,55,55,55,55,55,55,55,55,55,55]},
  {cat:'Macbook (10x)',  vals:[0,0,0,0,0,0,243,243,243,243,243,243,243,243]},
  {cat:'Parcela cartão', vals:[0,0,0,0,0,0,300,300,300,0,0,0,0,0]},
  {cat:'Prime Video',    vals:[19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9]},
  {cat:'Micro Gastos',   vals:[0,100,0,100,163,150,124,0,0,0,0,0,0,0]},
  {cat:'Mami e Papi',    vals:[0,131,0,0,0,0,0,0,0,0,0,0,0,0]},
  {cat:'Higiene',        vals:[0,28,0,0,100,0,32,0,0,0,0,0,0,0]},
  {cat:'Cinema',         vals:[250,0,0,35,0,50,0,0,0,0,0,0,0,0]},
  {cat:'Roupas',         vals:[170,0,170,0,240,180,100,100,0,0,0,0,0,0]},
  {cat:'Uber',           vals:[200,106,76,118,200,80,164,0,0,0,0,0,0,0]},
  {cat:'Jogos',          vals:[0,0,50,25,0,0,0,0,0,0,0,0,0,0]},
  {cat:'Presentes',      vals:[0,0,0,0,0,0,230,350,0,0,0,0,0,0]},
  {cat:'Alimentação',    vals:[200,101,765,373,628,464,278,0,0,0,0,0,0,0]}
];

let curIdx = 6;
let curTipo = 'despesa';
let activeTab = 'mensal';
let extras = {};
let lineChart = null;

function loadExtras(){
  try { const s = localStorage.getItem('cf_extras'); if(s) extras = JSON.parse(s); } catch(e){}
}
function saveExtras(){
  try { localStorage.setItem('cf_extras', JSON.stringify(extras)); } catch(e){}
}

function ekey(tipo, idx){ return tipo + '_' + idx; }
function getExtras(tipo, idx){ return (extras[ekey(tipo,idx)] || []); }
function addExtra(tipo, idx, cat, val){
  const k = ekey(tipo,idx);
  if(!extras[k]) extras[k] = [];
  extras[k].push({cat, val: +val});
  saveExtras();
}
function delExtra(tipo, idx, i){
  const k = ekey(tipo,idx);
  if(extras[k]) extras[k].splice(i,1);
  saveExtras();
  render();
}

function totalR(idx){
  return RECEITAS_BASE.reduce((s,r)=>s+(r.vals[idx]||0),0)
    + getExtras('receita',idx).reduce((s,e)=>s+e.val,0);
}
function totalD(idx){
  return DESPESAS_BASE.reduce((s,d)=>s+(d.vals[idx]||0),0)
    + getExtras('despesa',idx).reduce((s,e)=>s+e.val,0);
}
function totalInv(idx){
  const inv = DESPESAS_BASE.find(d=>d.cat==='Investimento');
  return (inv ? inv.vals[idx]||0 : 0)
    + getExtras('despesa',idx).filter(e=>e.cat.toLowerCase().includes('invest')).reduce((s,e)=>s+e.val,0);
}

function fmt(v){ return 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtS(v){ return (v>=0?'+':'-')+' '+fmt(v); }

function escapeCsv(value){ return `"${String(value).replace(/"/g,'""')}"`; }
function downloadCsv(filename, content){ const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.style.display = 'none'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); }
function exportCsv(){
  const rows = ['Mês,Tipo,Categoria,Valor'];
  for(let idx=0; idx<14; idx++){
    const month = MESES[idx];
    RECEITAS_BASE.forEach(item=>{ const val = item.vals[idx]||0; if(val>0) rows.push([month,'Receita',item.cat,val.toFixed(2)].map(escapeCsv).join(',')); });
    getExtras('receita',idx).forEach(item=> rows.push([month,'Receita',item.cat,item.val.toFixed(2)].map(escapeCsv).join(',')));
    DESPESAS_BASE.forEach(item=>{ const val = item.vals[idx]||0; if(val>0) rows.push([month,'Despesa',item.cat,val.toFixed(2)].map(escapeCsv).join(',')); });
    getExtras('despesa',idx).forEach(item=> rows.push([month,'Despesa',item.cat,item.val.toFixed(2)].map(escapeCsv).join(',')));
  }
  downloadCsv('financas.csv', rows.join('\n'));
}

function exportXlsx(){
  if(typeof XLSX === 'undefined'){ alert('Biblioteca XLSX não está disponível. Verifique sua conexão com a internet.'); return; }
  const rows = [['Mês','Tipo','Categoria','Valor']];
  for(let idx=0; idx<14; idx++){
    const month = MESES[idx];
    RECEITAS_BASE.forEach(item=>{ const val = item.vals[idx]||0; if(val>0) rows.push([month,'Receita',item.cat,Number(val.toFixed(2))]); });
    getExtras('receita',idx).forEach(item=> rows.push([month,'Receita',item.cat,Number(item.val.toFixed(2))]));
    DESPESAS_BASE.forEach(item=>{ const val = item.vals[idx]||0; if(val>0) rows.push([month,'Despesa',item.cat,Number(val.toFixed(2))]); });
    getExtras('despesa',idx).forEach(item=> rows.push([month,'Despesa',item.cat,Number(item.val.toFixed(2))]));
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Financas');
  const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout],{type:'application/octet-stream'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'financas.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function render(){
  document.getElementById('cur-month').textContent = MESES[curIdx];
  if(activeTab==='mensal') renderMensal();
  else if(activeTab==='anual') renderAnual();
  else renderAdd();
}

function renderMensal(){
  const idx = curIdx;
  const totR = totalR(idx), totD = totalD(idx), saldo = totR-totD, inv = totalInv(idx);
  const prevR = idx>0?totalR(idx-1):null, prevD = idx>0?totalD(idx-1):null;

  document.getElementById('c-rec').textContent = fmt(totR);
  document.getElementById('c-desp').textContent = fmt(totD);
  const se = document.getElementById('c-saldo');
  se.textContent = (saldo>=0?'+':'-')+' '+fmt(saldo);
  se.className = 'val '+(saldo>=0?'green':'red');
  document.getElementById('c-inv').textContent = fmt(inv);

  function delta(cur, prev, el, invert=false){
    if(prev===null){ el.textContent=''; return; }
    const d = cur-prev;
    const sign = d>=0?'▲':'▼';
    const cls = (d>=0) !== invert ? 'green' : 'red';
    el.innerHTML = `<span style="color:var(--${cls})">${sign} ${fmt(Math.abs(d))} vs mês anterior</span>`;
  }
  delta(totR, prevR, document.getElementById('d-rec'));
  delta(totD, prevD, document.getElementById('d-desp'), true);
  const ps = idx>0?totalR(idx-1)-totalD(idx-1):null;
  delta(saldo, ps, document.getElementById('d-saldo'));
  document.getElementById('d-inv').textContent = '';

  document.getElementById('ttl-rec').textContent = fmt(totR);
  document.getElementById('ttl-desp').textContent = fmt(totD);

  // Receitas list
  const lr = document.getElementById('list-rec');
  lr.innerHTML='';
  RECEITAS_BASE.forEach(r=>{ const v=r.vals[idx]||0; if(v>0) lr.innerHTML+=rowHTML(r.cat,v,'green'); });
  getExtras('receita',idx).forEach((e,i)=>{ lr.innerHTML+=rowHTML(e.cat,e.val,'green',`delExtra('receita',${idx},${i})`); });
  if(!lr.innerHTML) lr.innerHTML='<div class="empty">Nenhuma receita registrada</div>';

  // Despesas list
  const ld = document.getElementById('list-desp');
  ld.innerHTML='';
  DESPESAS_BASE.forEach(r=>{ const v=r.vals[idx]||0; if(v>0) ld.innerHTML+=rowHTML(r.cat,v,'red'); });
  getExtras('despesa',idx).forEach((e,i)=>{ ld.innerHTML+=rowHTML(e.cat,e.val,'red',`delExtra('despesa',${idx},${i})`); });
  if(!ld.innerHTML) ld.innerHTML='<div class="empty">Nenhuma despesa registrada</div>';

  // Bars
  const allD = [
    ...DESPESAS_BASE.map(d=>({cat:d.cat, val:d.vals[idx]||0})),
    ...getExtras('despesa',idx)
  ].filter(d=>d.val>0).sort((a,b)=>b.val-a.val).slice(0,7);
  const maxV = allD.length ? allD[0].val : 1;
  const bars = document.getElementById('bars');
  bars.innerHTML = allD.length ? allD.map(d=>`
    <div class="bar-item">
      <div class="bar-name" title="${d.cat}">${d.cat}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(d.val/maxV*100)}%;background:#D85A30"></div></div>
      <div class="bar-val">${fmt(d.val)}</div>
    </div>`).join('') : '<div style="padding:12px 0;text-align:center;color:var(--text3);font-size:13px">Nenhuma despesa</div>';
}

function rowHTML(cat, val, cls, delFn=''){
  return `<div class="row">
    <span class="cat">${cat}</span>
    <span class="amt ${cls}">${fmt(val)}</span>
    ${delFn?`<button class="del-btn" onclick="${delFn}" aria-label="Remover">×</button>`:''}
  </div>`;
}

function renderAnual(){
  const labels = MESES_S.slice(0,14);
  const saldos = [], acumulados = [];
  let acum = 0;
  for(let i=0;i<14;i++){
    const s = totalR(i)-totalD(i);
    saldos.push(+(s.toFixed(2)));
    acum += s;
    acumulados.push(+(acum.toFixed(2)));
  }

  const chartError = document.getElementById('chart-error');
  const chartCanvas = document.getElementById('lineChart');
  if(typeof Chart === 'undefined'){
    if(lineChart) lineChart.destroy();
    lineChart = null;
    chartError.style.display = 'block';
    chartCanvas.style.display = 'none';
  } else {
    chartError.style.display = 'none';
    chartCanvas.style.display = 'block';
    if(lineChart) lineChart.destroy();
    lineChart = new Chart(chartCanvas,{
      type:'line',
      data:{
        labels,
        datasets:[
        { label:'Saldo mensal', data:saldos, borderColor:'#1D9E75', backgroundColor:'rgba(29,158,117,.08)',
          borderWidth:2, pointRadius:4, tension:.35, fill:true,
          pointBackgroundColor: saldos.map(v=>v>=0?'#1D9E75':'#D85A30') },
        { label:'Acumulado', data:acumulados, borderColor:'#185FA5', backgroundColor:'transparent',
          borderWidth:1.5, pointRadius:3, tension:.35, borderDash:[4,4] }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:true,labels:{font:{size:11},boxWidth:12,color:'#888'}}},
      scales:{
        x:{ticks:{font:{size:10},maxRotation:45,autoSkip:false},grid:{display:false}},
        y:{ticks:{font:{size:10},callback:v=>'R$'+(v/1000).toFixed(1)+'k'},grid:{color:'rgba(128,128,128,.08)'}}
      }
    }
  });

    const grid = document.getElementById('year-grid');
    grid.innerHTML='';
    for(let i=0;i<14;i++){
      const r=totalR(i), d=totalD(i), s=r-d;
      grid.innerHTML+=`<div class="year-cell">
        <div class="ym">${MESES_S[i]}</div>
        <div class="ys ${s>=0?'green':'red'}">${s>=0?'+':'-'}${fmt(Math.abs(s))}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:3px">↑${fmt(r)} ↓${fmt(d)}</div>
      </div>`;
    }
  }
}

function renderAdd(){
  const idx = curIdx;
  const le = document.getElementById('list-extras');
  le.innerHTML='';
  const dr = getExtras('receita',idx), dd = getExtras('despesa',idx);
  if(!dr.length && !dd.length){ le.innerHTML='<div class="empty">Nenhum lançamento extra neste mês</div>'; return; }
  dr.forEach((e,i)=>{ le.innerHTML+=rowHTML('+ '+e.cat,e.val,'green',`delExtra('receita',${idx},${i})`); });
  dd.forEach((e,i)=>{ le.innerHTML+=rowHTML('- '+e.cat,e.val,'red',`delExtra('despesa',${idx},${i})`); });
}

function changeMonth(d){
  curIdx = Math.max(0, Math.min(13, curIdx+d));
  render();
}

function setTipo(t){
  curTipo = t;
  document.getElementById('btn-tipo-desp').classList.toggle('active', t==='despesa');
  document.getElementById('btn-tipo-rec').classList.toggle('active', t==='receita');
}

function addItem(){
  const cat = document.getElementById('in-cat').value.trim();
  const val = parseFloat(document.getElementById('in-val').value);
  if(!cat || isNaN(val) || val<=0){ alert('Preencha categoria e valor válido.'); return; }
  addExtra(curTipo, curIdx, cat, val);
  document.getElementById('in-cat').value='';
  document.getElementById('in-val').value='';
  renderAdd();
  document.getElementById('in-cat').focus();
}

function setTab(tab, btn){
  activeTab = tab;
  ['mensal','anual','add'].forEach(t=>{
    document.getElementById('tab-'+t).style.display = t===tab?'block':'none';
  });
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  render();
}

// Init
loadExtras();
render();

// Allow Enter to submit in add form
document.getElementById('in-val').addEventListener('keydown', e=>{ if(e.key==='Enter') addItem(); });
