'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const budgetForm = document.getElementById('budgetForm');
  const budgetInput = document.getElementById('budget');
  const recipeList = document.getElementById('recipeList');
  const statusEl = document.getElementById('status');
  const selectionEl = document.getElementById('selection');
  const saveBtn = document.getElementById('saveBtn');

  let recipes = [];
  let filtered = [];
  let selected = null;

  function renderStatus(msg) {
    statusEl.textContent = msg;
  }

  function renderList(list) {
    if (!list.length) {
      recipeList.innerHTML = '<p>找不到符合預算的食譜，試試提高預算或查看全部。</p>';
      return;
    }

    recipeList.innerHTML = list.map(it => `
      <article class="card" data-id="${it.id}">
        <div class="meta">預估花費：約 ${it.estimatedCost} 元 · ${it.duration} 分鐘 · ${it.servings} 人份</div>
        <h3>${it.name}</h3>
        <p>${it.summary}</p>
        <div class="meta">
          ${it.tags.map(t => `<span class="badge">${t}</span>`).join(' ')}
        </div>
        <button type="button" data-action="pick" data-id="${it.id}">選擇這道食譜</button>
      </article>
    `).join('');
  }

  function renderSelection() {
    if (!selected) {
      selectionEl.innerHTML = '<p class="selection__empty">尚未選擇食譜，請先輸入預算並挑選。</p>';
      saveBtn.disabled = true;
      return;
    }

    saveBtn.disabled = false;
    selectionEl.innerHTML = `
      <h3>${selected.name}</h3>
      <p>${selected.summary}</p>
      <p class="meta">預估花費：約 ${selected.estimatedCost} 元 · ${selected.duration} 分鐘 · ${selected.servings} 人份</p>
    `;
  }

  async function fetchRecipes() {
    try {
      const resp = await fetch('./json/budget-recipes.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      recipes = await resp.json();
      filtered = recipes;
      renderList(filtered.slice(0, 20));
      renderStatus('已載入 100 筆附近的節約食譜，輸入預算開始篩選。');
    } catch (err) {
      console.error(err);
      renderStatus('無法載入食譜清單，請重新整理。');
    }
  }

  function filterByBudget(budget) {
    if (!recipes.length) return;
    if (!budget || budget <= 0) {
      filtered = recipes;
    } else {
      filtered = recipes.filter(r => r.estimatedCost <= budget);
    }
    filtered.sort((a, b) => a.estimatedCost - b.estimatedCost || a.id - b.id);
    renderList(filtered);
    selected = null;
    renderSelection();
    renderStatus(`找到 ${filtered.length} 道符合預算的食譜。`);
  }

  recipeList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="pick"]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    selected = filtered.find(it => it.id === id) || recipes.find(it => it.id === id) || null;
    renderSelection();
    renderStatus(`已選擇「${selected?.name ?? ''}」。`);
  });

  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const budget = Number(budgetInput.value);
    filterByBudget(budget);
  });

  async function saveToDataFile() {
    if (!selected) {
      renderStatus('請先選擇一個食譜。');
      return;
    }

    try {
      const resp = await fetch('./json/data.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const base = await resp.json();
      const payload = Array.isArray(base)
        ? { pages: base, budgetSelections: [] }
        : { pages: base.pages || [], budgetSelections: base.budgetSelections || [] };

      const userBudget = Number(budgetInput.value) || selected.estimatedCost;
      payload.budgetSelections.push({
        id: selected.id,
        name: selected.name,
        estimatedCost: selected.estimatedCost,
        userBudget,
        duration: selected.duration,
        servings: selected.servings,
        tags: selected.tags,
        summary: selected.summary,
        savedAt: new Date().toISOString()
      });

      const text = JSON.stringify(payload, null, 2);
      localStorage.setItem('cookbook-budget-data', text);

      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      renderStatus('已把食譜寫入 data.json 並觸發下載，可覆蓋你的資料檔。');
    } catch (err) {
      console.error(err);
      renderStatus('儲存失敗，請稍後再試。');
    }
  }

  saveBtn.addEventListener('click', saveToDataFile);

  fetchRecipes();
  renderSelection();
});
