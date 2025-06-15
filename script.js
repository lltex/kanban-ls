document.addEventListener('DOMContentLoaded', () => {
  const board = document.querySelector('.kanban-board');
  const themeToggle = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const taskModal = document.getElementById('task-modal');
  const modalText = document.getElementById('modal-task-text');
  const closeBtn = document.querySelector('.close-btn');

  let data = JSON.parse(localStorage.getItem('kanban_data')) || {
    columns: {
      'A Fazer': [],
      'Em Progresso': [],
      'Concluído': []
    }
  };

  function save() {
    localStorage.setItem('kanban_data', JSON.stringify(data));
  }

  function renderBoard() {
    board.innerHTML = '';
    Object.keys(data.columns).forEach(title => createColumn(title, data.columns[title]));
  }

  function createColumn(title, tasks) {
    const column = document.createElement('div');
    column.className = 'kanban-column';

    const titleEl = document.createElement('h2');
    titleEl.contentEditable = true;
    titleEl.innerText = title;
    titleEl.addEventListener('blur', () => renameColumn(title, titleEl.innerText));
    column.appendChild(titleEl);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-task-btn';
    addBtn.textContent = '+ Nova Tarefa';
    addBtn.onclick = () => openTaskInput(column, title);
    column.appendChild(addBtn);

    const taskContainer = document.createElement('div');
    taskContainer.className = 'tasks';

    tasks.forEach(task => {
      if (task.text.toLowerCase().includes(searchInput.value.toLowerCase())) {
        taskContainer.appendChild(createTaskCard(task, title));
      }
    });

    column.appendChild(taskContainer);
    board.appendChild(column);
  }

  function createTaskCard(task, columnName) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      save();
      renderBoard();
    });

    const text = document.createElement('div');
    text.className = 'task-card-text';
    text.textContent = task.text;

    const labels = document.createElement('div');
    labels.innerHTML = (task.labels || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = '🔍';
    viewBtn.className = 'task-view-btn';
    viewBtn.onclick = () => openModal(task.text);

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.onclick = () => {
      data.columns[columnName] = data.columns[columnName].filter(t => t !== task);
      save();
      renderBoard();
    };

    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);

    card.appendChild(checkbox);
    card.appendChild(text);
    card.appendChild(labels);
    card.appendChild(actions);

    return card;
  }

  function openTaskInput(columnEl, columnName) {
    const container = document.createElement('div');
    container.className = 'new-task-input-container';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Descrição da tarefa';

    const labelInput = document.createElement('input');
    labelInput.placeholder = 'Etiquetas (separadas por vírgula)';
    labelInput.style = 'margin-top: 0.5rem; width: 100%;';

    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Salvar';
    saveBtn.onclick = () => {
      const text = textarea.value.trim();
      const rawLabels = labelInput.value.split(',').map(l => l.trim()).filter(Boolean);
      if (!text) return;

      data.columns[columnName].push({ text, done: false, labels: rawLabels });
      save();
      renderBoard();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => container.remove();

    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);

    container.appendChild(textarea);
    container.appendChild(labelInput);
    container.appendChild(buttons);

    columnEl.insertBefore(container, columnEl.children[2]);
  }

  function renameColumn(oldName, newName) {
    if (!newName || oldName === newName) return;
    if (data.columns[newName]) {
      alert('Já existe uma coluna com esse nome.');
      renderBoard();
      return;
    }
    data.columns[newName] = data.columns[oldName];
    delete data.columns[oldName];
    save();
    renderBoard();
  }

  function openModal(text) {
    modalText.textContent = text;
    taskModal.style.display = 'flex';
  }

  closeBtn.onclick = () => taskModal.style.display = 'none';
  window.onclick = e => { if (e.target === taskModal) taskModal.style.display = 'none'; };

  searchInput.addEventListener('input', renderBoard);

  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', themeToggle.checked);
    localStorage.setItem('kanban_theme', themeToggle.checked ? 'dark' : 'light');
  });

  if (localStorage.getItem('kanban_theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.checked = true;
  }

  renderBoard();
});
