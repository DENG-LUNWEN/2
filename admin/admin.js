import { adminApi, lostFoundApi, secondHandApi, activityWallApi } from "../assets/js/api.js";

let myChart;
let trendData = { days:["一","二","三","四","五","六","日"], lost:[], second:[], activity:[] };

let allLost = [], allSecond = [], allActivity = [];
let filterLost = "all", filterSecond = "all", filterActivity = "all";

window.addEventListener("load", async () => {
  checkAdminAuth();
  initSidebar();
  initLogout();
  initQuickActions();
  initStatusFilters();
  await loadAllData();
  await loadOverview();
  initChart();
  updateBadges();
});

// 权限
function checkAdminAuth() {
  const u = JSON.parse(localStorage.getItem("currentUser"));
  if (!u || u.role !== "admin") { alert("无权限"); location.href="../index.html"; }
  document.getElementById("adminName").textContent = u.username;
}

// 加载所有原始数据
async function loadAllData() {
  allLost = await lostFoundApi.getAll();
  allSecond = await secondHandApi.getAll();
  allActivity = await activityWallApi.getAll();
}

// 侧边栏
function initSidebar() {
  const items = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page-content");
  items.forEach(i => i.addEventListener("click", async () => {
    items.forEach(x=>x.classList.remove("active"));
    i.classList.add("active");
    pages.forEach(p=>p.style.display="none");
    const p = i.dataset.page;
    document.getElementById(p+"Page").style.display="block";
    await loadPage(p);
  }));
}

async function loadPage(p) {
  if(p==="overview") await loadOverview(), updateChart();
  if(p==="user") await loadUsers();
  if(p==="lost") await renderLost();
  if(p==="second") await renderSecond();
  if(p==="activity") await renderActivity();
  updateBadges();
}

// 筛选器
function initStatusFilters() {
  document.querySelectorAll('.status-filter').forEach(el => {
    el.addEventListener('change', () => {
      const t = el.dataset.target;
      const v = el.value;
      if(t==="lost") filterLost=v; renderLost();
      if(t==="second") filterSecond=v; renderSecond();
      if(t==="activity") filterActivity=v; renderActivity();
    });
  });
}

// 快速按钮：一键跳待审核
document.getElementById("auditBtn").onclick = async () => {
  document.querySelector('.status-filter[data-target="lost"]').value = 0;
  filterLost = 0;
  document.querySelector('.nav-item[data-page="lost"]').click();
};

// 角标更新
function updateBadges() {
  const wl = allLost.filter(x=>x.status===0).length;
  const ws = allSecond.filter(x=>x.status===0).length;
  const wa = allActivity.filter(x=>x.status===0).length;
  document.getElementById("lostBadge").textContent = wl || "";
  document.getElementById("secondBadge").textContent = ws || "";
  document.getElementById("activityBadge").textContent = wa || "";
}

// 概览
async function loadOverview() {
  await loadAllData();
  const s = await adminApi.getStats();
  document.getElementById("userCount").textContent = s.userCount;
  document.getElementById("lostCount").textContent = s.lostCount;
  document.getElementById("secondCount").textContent = s.secondCount;
  document.getElementById("activityCount").textContent = s.activityCount;
  await calcTrend();
  updateBadges();
}

// 图表
function initChart() {
  myChart = echarts.init(document.getElementById("trendChart"));
  window.addEventListener("resize", ()=>myChart.resize());
}
async function calcTrend() {
  const l=allLost,s=allSecond,a=allActivity;
  trendData.lost = Array(7).fill(0);
  trendData.second = Array(7).fill(0);
  trendData.activity = Array(7).fill(0);
  const now = new Date();
  for(let i=0;i<7;i++){
    const d = new Date(now); d.setDate(now.getDate()-(6-i));
    const ds = d.toISOString().split("T")[0];
    trendData.lost[i] = l.filter(x=>x.publishTime===ds).length;
    trendData.second[i] = s.filter(x=>x.publishTime===ds).length;
    trendData.activity[i] = a.filter(x=>x.publishTime===ds).length;
  }
  updateChart();
}
function updateChart() {
  myChart.setOption({
    tooltip:{trigger:"axis"},legend:{data:["失物","二手","活动"]},
    xAxis:{data:trendData.days},yAxis:{type:"value"},
    series:[
      {name:"失物",type:"line",data:trendData.lost,itemStyle:{color:"#2563eb"}},
      {name:"二手",type:"line",data:trendData.second,itemStyle:{color:"#f59e0b"}},
      {name:"活动",type:"line",data:trendData.activity,itemStyle:{color:"#16a34a"}}
    ]
  });
}

// 用户
async function loadUsers() {
  const list = await adminApi.getAllUsers();
  const b = document.getElementById("userTableBody");
  b.innerHTML = list.map(u=>`
    <tr>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.role==="admin"?"管理员":"用户"}</td>
      <td><button class="operate-btn delete" onclick="delUser(${u.id})">删除</button></td>
    </tr>
  `).join("");
}
window.delUser = async(id)=>{ if(!confirm("确认？"))return;
  await adminApi.del("users",id); await loadUsers(); await loadOverview();
};

// 失物
async function renderLost() {
  let data = allLost;
  if(filterLost!=="all") data = data.filter(x=>x.status==Number(filterLost));
  const b = document.getElementById("lostTableBody");
  b.innerHTML = data.map(x=>`
    <tr>
      <td>${x.id}</td><td>${x.title}</td><td>${x.type==="lost"?"丢失":"捡到"}</td>
      <td>${x.publisher}</td>
      <td><span class="status ${x.status===0?'wait':x.status===1?'pass':'reject'}">
        ${x.status===0?'待审核':x.status===1?'通过':'驳回'}
      </span></td>
      <td>
        <button class="operate-btn pass" onclick="passLost(${x.id})">通过</button>
        <button class="operate-btn reject" onclick="rejLost(${x.id})">驳回</button>
        <button class="operate-btn delete" onclick="delLost(${x.id})">删除</button>
      </td>
    </tr>
  `).join("");
}
window.passLost = async(id)=>{
  await adminApi.setStatus("lost-found",id,1);
  await loadAllData(); await renderLost(); await loadOverview();
};
window.rejLost = async(id)=>{
  await adminApi.setStatus("lost-found",id,2);
  await loadAllData(); await renderLost(); await loadOverview();
};
window.delLost = async(id)=>{ if(!confirm("确认？"))return;
  await adminApi.del("lost-found",id); await loadAllData(); await renderLost(); await loadOverview();
};

// 二手
async function renderSecond() {
  let data = allSecond;
  if(filterSecond!=="all") data = data.filter(x=>x.status==Number(filterSecond));
  const b = document.getElementById("secondTableBody");
  b.innerHTML = data.map(x=>`
    <tr>
      <td>${x.id}</td><td>${x.title}</td><td>¥${x.price}</td>
      <td>${x.publisher}</td>
      <td><span class="status ${x.status===0?'wait':x.status===1?'pass':'reject'}">
        ${x.status===0?'待审核':x.status===1?'通过':'驳回'}
      </span></td>
      <td>
        <button class="operate-btn pass" onclick="passSecond(${x.id})">通过</button>
        <button class="operate-btn reject" onclick="rejSecond(${x.id})">驳回</button>
        <button class="operate-btn delete" onclick="delSecond(${x.id})">删除</button>
      </td>
    </tr>
  `).join("");
}
window.passSecond = async(id)=>{
  await adminApi.setStatus("second-hand",id,1);
  await loadAllData(); await renderSecond(); await loadOverview();
};
window.rejSecond = async(id)=>{
  await adminApi.setStatus("second-hand",id,2);
  await loadAllData(); await renderSecond(); await loadOverview();
};
window.delSecond = async(id)=>{ if(!confirm("确认？"))return;
  await adminApi.del("second-hand",id); await loadAllData(); await renderSecond(); await loadOverview();
};

// 活动
async function renderActivity() {
  let data = allActivity;
  if(filterActivity!=="all") data = data.filter(x=>x.status==Number(filterActivity));
  const b = document.getElementById("activityTableBody");
  b.innerHTML = data.map(x=>`
    <tr>
      <td>${x.id}</td><td>${x.title}</td><td>${x.time}</td>
      <td>${x.publisher}</td>
      <td><span class="status ${x.status===0?'wait':x.status===1?'pass':'reject'}">
        ${x.status===0?'待审核':x.status===1?'通过':'驳回'}
      </span></td>
      <td>
        <button class="operate-btn pass" onclick="passAct(${x.id})">通过</button>
        <button class="operate-btn reject" onclick="rejAct(${x.id})">驳回</button>
        <button class="operate-btn delete" onclick="delAct(${x.id})">删除</button>
      </td>
    </tr>
  `).join("");
}
window.passAct = async(id)=>{
  await adminApi.setStatus("activity-wall",id,1);
  await loadAllData(); await renderActivity(); await loadOverview();
};
window.rejAct = async(id)=>{
  await adminApi.setStatus("activity-wall",id,2);
  await loadAllData(); await renderActivity(); await loadOverview();
};
window.delAct = async(id)=>{ if(!confirm("确认？"))return;
  await adminApi.del("activity-wall",id); await loadAllData(); await renderActivity(); await loadOverview();
};

// 退出
function initLogout() {
  document.getElementById("logoutBtn").onclick = ()=>{
    localStorage.removeItem("currentUser");
    location.href="../index.html";
  };
}

// 报告
function generateReport() { alert("报告已生成"); }
document.getElementById("reportBtn").onclick = generateReport;