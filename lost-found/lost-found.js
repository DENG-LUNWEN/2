import { lostFoundApi } from "../assets/js/api.js";
import { updateAuthUI } from "../assets/js/auth.js";

// 全局数据
let allLostFoundData = [];

// 页面加载初始化
window.addEventListener("load", async () => {
  updateAuthUI();
  await loadLostFoundList();
  initFilter();
});

// 加载失物招领列表
async function loadLostFoundList() {
  const data = await lostFoundApi.getAll();
  if (data) {
    allLostFoundData = data;
    renderList(data);
  }
}

// 渲染列表
function renderList(data) {
  const listContainer = document.getElementById("lostFoundList");
  listContainer.innerHTML = "";

  if (data.length === 0) {
    listContainer.innerHTML = "<div class='empty-tip'>暂无相关信息</div>";
    return;
  }

  data.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "list-item";
    itemElement.innerHTML = `
      <span class="type-tag ${item.type}">${item.type === 'lost' ? '丢失' : '捡到'}</span>
      <div class="title">${item.title}</div>
      <div class="desc">${item.description.substring(0, 80)}${item.description.length > 80 ? '...' : ''}</div>
      <div class="meta">
        <span>发布人：${item.publisher}</span>
        <span>发布时间：${item.publishTime}</span>
      </div>
    `;
    listContainer.appendChild(itemElement);
  });
}

// 初始化筛选功能
function initFilter() {
  // 类型筛选
  document.getElementById("typeFilter").addEventListener("change", filterList);
  // 搜索按钮
  document.getElementById("searchBtn").addEventListener("click", filterList);
  // 回车搜索
  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterList();
  });
}

// 筛选列表
function filterList() {
  const typeFilter = document.getElementById("typeFilter").value;
  const searchKeyword = document.getElementById("searchInput").value.trim().toLowerCase();

  let filteredData = allLostFoundData;

  // 类型筛选
  if (typeFilter !== "all") {
    filteredData = filteredData.filter(item => item.type === typeFilter);
  }

  // 关键词搜索
  if (searchKeyword) {
    filteredData = filteredData.filter(item => 
      item.title.toLowerCase().includes(searchKeyword) || 
      item.description.toLowerCase().includes(searchKeyword)
    );
  }

  // 重新渲染
  renderList(filteredData);
}