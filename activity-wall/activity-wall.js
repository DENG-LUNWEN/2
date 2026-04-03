import { activityWallApi } from "../assets/js/api.js";
import { updateAuthUI } from "../assets/js/auth.js";

// 全局数据
let allActivityWallData = [];

// 页面加载初始化
window.addEventListener("load", async () => {
  updateAuthUI();
  
  // 判断当前页面是否是发布页
  if (document.getElementById("activityWallForm")) {
    initPublishForm();
  } else {
    await loadActivityWallList();
    initFilter();
  }
});

// 加载活动列表
async function loadActivityWallList() {
  const data = await activityWallApi.getAll();
  if (data) {
    allActivityWallData = data;
    renderList(data);
  }
}

// 渲染列表
function renderList(data) {
  const listContainer = document.getElementById("activityWallList");
  listContainer.innerHTML = "";

  if (data.length === 0) {
    listContainer.innerHTML = "<div class='empty-tip'>暂无校园活动</div>";
    return;
  }

  data.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "list-item";
    itemElement.innerHTML = `
      <span class="time-tag">活动时间：${item.time}</span>
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
  // 日期筛选
  document.getElementById("dateFilter").addEventListener("change", filterList);
  // 搜索按钮
  document.getElementById("searchBtn").addEventListener("click", filterList);
  // 回车搜索
  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterList();
  });
}

// 筛选列表
function filterList() {
  const dateFilter = document.getElementById("dateFilter").value;
  const searchKeyword = document.getElementById("searchInput").value.trim().toLowerCase();

  let filteredData = allActivityWallData;

  // 日期筛选
  if (dateFilter) {
    filteredData = filteredData.filter(item => item.time === dateFilter);
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

// 初始化发布表单
function initPublishForm() {
  const form = document.getElementById("activityWallForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // 检查是否登录
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("请先登录！");
      document.getElementById("loginBtn").click();
      return;
    }

    // 收集表单数据
    const data = {
      title: document.getElementById("title").value,
      time: document.getElementById("time").value,
      description: document.getElementById("description").value,
      publishTime: new Date().toISOString().split("T")[0], // 格式：YYYY-MM-DD
      publisher: currentUser.username
    };

    // 发布数据
    const res = await activityWallApi.publish(data);
    if (res) {
      alert("发布成功！");
      form.reset();
      // 跳转到活动墙首页
      window.location.href = "./index.html";
    } else {
      alert("发布失败，请重试！");
    }
  });
}