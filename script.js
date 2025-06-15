const kanbanBoard = document.querySelector('.kanban-board');
const themeToggle = document.getElementById('theme-toggle');
const taskModal = document.getElementById('task-modal');
const modalTaskText = document.getElementById('modal-task-text');
const modalCloseBtn = taskModal.querySelector('.close-btn');

let columns = JSON.parse(localStorage.getItem('kanban_columns')) || [
  { id: 'todo', title: 'A Fazer', color: '#ffeb3b' },
  { id: 'doing', title: 'Fazendo', color: '#03a9f4' },
  { id: 'done', title: 'Feito', color: '#4caf50' }
];

let tasks = JSON.parse(localStorage.getItem('kanban_tasks')) || [];

// === SALVAR E CARREGAR ===

function saveColumns() {
  localStorage.setItem('kanban_columns', JSON.stringify(columns));
}

function saveTasks() {
  localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
}

// === RENDERIZAÇÃO ===

function renderBoard() {
  kanbanBoard.innerHTML = '';

  columns.forEach(column => {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.id = column.id;
    columnEl.style.backgroundColor = column.color || '#fff';
    columnEl.draggable = false; // Colunas não arrastáveis

    // Título editável
    const h2 = document.createElement('h2');
    h2.textContent = column.title;
    h2.title = 'Clique para editar o título';
    h2.addEventListener('click', () => makeTitleEditable(h2, column));

    // Seletor de cor
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = column.color || '#ffffff';
    colorInput.title = 'Selecionar cor da coluna';
    colorInput.addEventListener('input', (e) => {
      column.color = e.target.value;
      saveColumns();
      renderBoard();
    });

    // Botão adicionar tarefa
    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'add-task-btn';
    addTaskBtn.textContent = '+ Adicionar Tarefa';
    addTaskBtn.addEventListener('click', () => showNewTaskInput(column.id));

    // Container tarefas
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks';

    columnEl.appendChild(createTitleContainer(h2, colorInput));
    columnEl.appendChild(addTaskBtn);
    columnEl.appendChild(tasksContainer);

    kanbanBoard.appendChild(columnEl);
  });

  // Botão adicionar coluna
  const addColumnContainer = document.createElement('div');
  addColumnContainer.className = 'add-column-container';
  const addColumnBtn = document.createElement('button');
  addColumnBtn.textContent = '+ Adicionar outra coluna';
  addColumnBtn.addEventListener('click', handleAddColumn);
  addColumnContainer.appendChild(addColumnBtn);
  kanbanBoard.appendChild(addColumnContainer);

  renderTasks();
  addDropListeners();
}

// Cria container flex para título + seletor de cor
function createTitleContainer(h2, colorInput) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.marginBottom = '8px';
  container.appendChild(h2);
  container.appendChild(colorInput);
  return container;
}

// Renderiza as tarefas dentro das colunas
function renderTasks() {
  columns.forEach(column => {
    const columnEl = document.getElementById(column.id);
    if (!columnEl) return;
    const tasksContainer = columnEl.querySelector('.tasks');
    tasksContainer.innerHTML = '';

    const filteredTasks = tasks.filter(t => t.column === column.id);
    filteredTasks.forEach(task => {
      const taskEl = createTaskElement(task);
      tasksContainer.appendChild(taskEl);
    });
  });
}

function createTaskElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.id = `task-${task.id}`;

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', `task-${task.id}`);
  });

  // Texto da tarefa
  const textEl = document.createElement('div');
  textEl.className = 'task-card-text';
  textEl.textContent = task.text;
  card.appendChild(textEl);

  // Ações da tarefa (editar, excluir, ver)
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const viewBtn = document.createElement('button');
  viewBtn.textContent = '👁️';
  viewBtn.title = 'Visualizar tarefa';
  viewBtn.className = 'task-view-btn';
  viewBtn.addEventListener('click', () => openTaskModal(task));
  actions.appendChild(viewBtn);

  const editBtn = document.createElement('button');
  editBtn.textContent = '✏️';
  editBtn.title = 'Editar tarefa';
  editBtn.addEventListener('click', () => editTask(task));
  actions.appendChild(editBtn);

  const delBtn = document.createElement('button');
  delBtn.textContent = '🗑️';
  delBtn.title = 'Excluir tarefa';
  delBtn.addEventListener('click', () => deleteTask(task.id));
  actions.appendChild(delBtn);

  card.appendChild(actions);

  return card;
}

// === INTERAÇÃO TÍTULO COLUNA ===

function makeTitleEditable(h2, column) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = column.title;
  input.className = 'column-title-edit';
  h2.replaceWith(input);
  input.focus();

  input.addEventListener('blur', () => {
    column.title = input.value.trim() || column.title;
    saveColumns();
    renderBoard();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      input.blur();
    }
  });
}

// === ADICIONAR/EDITAR/EXCLUIR TAREFAS ===

function showNewTaskInput(columnId) {
  const columnEl = document.getElementById(columnId);
  const tasksContainer = columnEl.querySelector('.tasks');

  // Evita múltiplos inputs
  if (tasksContainer.querySelector('.new-task-input-container')) return;

  const container = document.createElement('div');
  container.className = 'new-task-input-container';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Descrição da nova tarefa...';

  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'buttons';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Salvar';
  saveBtn.className = 'save-btn';
  saveBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) return alert('A descrição da tarefa não pode ser vazia.');
    addTask(columnId, text);
    container.remove();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.addEventListener('click', () => container.remove());

  buttonsDiv.appendChild(saveBtn);
  buttonsDiv.appendChild(cancelBtn);

  container.appendChild(textarea);
  container.appendChild(buttonsDiv);

  tasksContainer.prepend(container);
  textarea.focus();
}

function addTask(columnId, text) {
  const newTask = {
    id: `t${Date.now()}`,
    column: columnId,
    text: text
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
}

function editTask(task) {
  const newText = prompt('Editar tarefa:', task.text);
  if (newText !== null) {
    task.text = newText.trim() || task.text;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(taskId) {
  if (confirm('Deseja realmente excluir esta tarefa?')) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
  }
}

// === DRAG AND DROP DAS TAREFAS ===

function addDropListeners() {
  document.querySelectorAll('.tasks').forEach(container => {
    container.addEventListener('dragover', e => e.preventDefault());

    container.addEventListener('drop', e => {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      if (!data.startsWith('task-')) return;
      const taskId = data.substring(5);
      const task = tasks.find(t => t.id === taskId);
      const columnId = container.closest('.kanban-column').id;
      if (task && task.column !== columnId) {
        task.column = columnId;
        saveTasks();
        renderTasks();
      }
    });
  });
}

// === MODAL TAREFA ===

function openTaskModal(task) {
  modalTaskText.textContent = task.text;
  taskModal.style.display = 'flex';
}

modalCloseBtn.addEventListener('click', () => {
  taskModal.style.display = 'none';
});

window.addEventListener('click', e => {
  if (e.target === taskModal) {
    taskModal.style.display = 'none';
  }
});

// === ADICIONAR COLUNA ===

function handleAddColumn() {
  const title = prompt('Digite o título da nova coluna:');
  if (title && title.trim()) {
    const newColumn = {
      id: `col-${Date.now()}`,
      title: title.trim(),
      color: '#ffffff'
    };
    columns.push(newColumn);
    saveColumns();
    renderBoard();
  }
}

// === MODO ESCURO ===

function loadTheme() {
  const dark = localStorage.getItem('kanban_dark_mode');
  if (dark === 'true') {
    document.body.classList.add('dark');
    themeToggle.checked = true;
  } else {
    document.body.classList.remove('dark');
    themeToggle.checked = false;
  }
}

themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.add('dark');
    localStorage.setItem('kanban_dark_mode', 'true');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('kanban_dark_mode', 'false');
  }
});

// === INICIALIZAÇÃO ===

loadTheme();
renderBoard();
