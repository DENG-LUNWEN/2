import { secondHandApi } from "../assets/js/api.js";
import { updateAuthUI } from "../assets/js/auth.js";

// 全局数据
let allSecondHandData = [];

// 页面加载初始化
window.addEventListener("load", async () => {
  updateAuthUI();
  
  // 判断当前页面是否是发布页
  if (document.getElementById("secondHandForm")) {
    initPublishForm();
  } else {
    await loadSecondHandList();
    initFilter();
  }
});

// 加载二手商品列表
async function loadSecondHandList() {
  const data = await secondHandApi.getAll();
  if (data) {
    allSecondHandData = data;
    renderList(data);
  }
}

// 渲染列表
function renderList(data) {
  const listContainer = document.getElementById("secondHandList");
  listContainer.innerHTML = "";

  if (data.length === 0) {
    listContainer.innerHTML = "<div class='empty-tip'>暂无闲置商品</div>";
    return;
  }

  data.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "list-item";
    itemElement.innerHTML = `
      <span class="price-tag">¥${item.price.toFixed(2)}</span>
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
  // 价格筛选
  document.getElementById("priceFilter").addEventListener("change", filterList);
  // 搜索按钮
  document.getElementById("searchBtn").addEventListener("click", filterList);
  // 回车搜索
  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterList();
  });
}

// 筛选列表
function filterList() {
  const priceFilter = document.getElementById("priceFilter").value;
  const searchKeyword = document.getElementById("searchInput").value.trim().toLowerCase();

  let filteredData = allSecondHandData;

  // 价格筛选
  if (priceFilter !== "all") {
    switch (priceFilter) {
      case "0-50":
        filteredData = filteredData.filter(item => item.price >= 0 && item.price <= 50);
        break;
      case "50-200":
        filteredData = filteredData.filter(item => item.price > 50 && item.price <= 200);
        break;
      case "200-500":
        filteredData = filteredData.filter(item => item.price > 200 && item.price <= 500);
        break;
      case "500+":
        filteredData = filteredData.filter(item => item.price > 500);
        break;
    }
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
  const form = document.getElementById("secondHandForm");
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
      price: parseFloat(document.getElementById("price").value),
      description: document.getElementById("description").value,
      publishTime: new Date().toISOString().split("T")[0], // 格式：YYYY-MM-DD
      publisher: currentUser.username
    };

    // 发布数据
    const res = await secondHandApi.publish(data);
    if (res) {
      alert("发布成功！");
      form.reset();
      // 跳转到二手平台首页
      window.location.href = "./index.html";
    } else {
      alert("发布失败，请重试！");
    }
  });
}