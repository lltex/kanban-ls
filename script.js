// ===================================================
// ARQUIVO SCRIPT.JS COMPLETO COM COLUNAS DINÂMICAS
// ===================================================

// --- Seletores e Variáveis Globais ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const modal = document.getElementById('task-modal');
const modalTextContainer = document.getElementById('modal-task-text');
const closeModalBtn = document.querySelector('.close-btn');
const kanbanBoard = document.querySelector('.kanban-board');
const addColumnBtn = document.getElementById('add-column-btn');

// --- Estado da Aplicação (Dados) ---
// Carrega colunas do localStorage ou usa um valor padrão
let columns = JSON.parse(localStorage.getItem('kanban_columns')) || [
  { id: 'todo', title: 'A Fazer' },
  { id: 'doing', title: 'Fazendo' },
  { id: 'done', title: 'Feito' }
];
let tasks = JSON.parse(localStorage.getItem('kanban_tasks') || '[]');

// --- Funções de Persistência (Salvar/Carregar) ---
function saveColumns() {
  localStorage.setItem('kanban_columns', JSON.stringify(columns));
}
function saveTasks() {
  localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
}

// --- Lógica do Tema ---
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
  themeToggle.checked = true;
}
themeToggle.addEventListener('change', () => {
  body.classList.toggle('dark', themeToggle.checked);
  localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
});

// --- Lógica de Logout ---
function logout() {
  localStorage.removeItem('kanban_auth');
  window.location.href = 'login.html';
}

// --- Funções do Modal ---
function openModal(fullText) {
  modalTextContainer.textContent = fullText;
  modal.style.display = 'flex';
}
function closeModal() {
  modal.style.display = 'none';
}
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
  if (event.target == modal) {
    closeModal();
  }
});

// --- Funções de Renderização (Desenhar na Tela) ---

// NOVO: Renderiza as colunas primeiro
function renderBoard() {
  // Limpa o quadro (exceto o botão de adicionar coluna)
  kanbanBoard.innerHTML = '';
  
  columns.forEach(column => {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.id = column.id;
    
    columnEl.innerHTML = `
      <h2>${column.title}</h2>
      <button class="add-task-btn">+ Adicionar Tarefa</button>
      <div class="tasks"></div>
    `;
    kanbanBoard.appendChild(columnEl);
  });
  
  // Re-anexa o botão de adicionar coluna no final
  const addColumnContainer = document.createElement('div');
  addColumnContainer.className = 'add-column-container';
  addColumnContainer.innerHTML = `<button id="add-column-btn" class="add-task-btn">+ Adicionar outra coluna</button>`;
  kanbanBoard.appendChild(addColumnContainer);

  // Re-adiciona o event listener para o novo botão
  document.getElementById('add-column-btn').addEventListener('click', handleAddColumn);
  
  // Adiciona os event listeners para os botões de adicionar tarefa
  addEventListenersToTaskButtons();
  // Adiciona os event listeners para drag & drop
  addEventListenersToDropZones();
  
  // Finalmente, renderiza as tarefas dentro das colunas recém-criadas
  renderTasks();
}

// ATUALIZADO: Renderiza as tarefas nas colunas existentes
function renderTasks() {
  // Limpa todas as tarefas antes de redesenhar
  document.querySelectorAll('.tasks').forEach(el => el.innerHTML = '');
  // Desenha cada tarefa na sua respectiva coluna
  tasks.forEach(t => {
    // Verifica se a coluna para esta tarefa ainda existe
    if (document.getElementById(t.column)) {
      addTaskToDOM(t.id, t.text, t.column);
    }
  });
}

function addTaskToDOM(id, text, columnId) {
  const task = document.createElement('div');
  task.className = 'task-card';
  task.draggable = true;
  task.dataset.id = id;

  const textContainer = document.createElement('div');
  textContainer.className = 'task-card-text';
  textContainer.textContent = text;

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'task-actions';

  const viewBtn = document.createElement('button');
  viewBtn.innerHTML = '👁️';
  viewBtn.title = 'Ver tarefa completa';
  viewBtn.className = 'task-view-btn';
  viewBtn.onclick = () => openModal(text);

  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Editar';
  editBtn.onclick = () => editTask(id);

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Excluir';
  deleteBtn.onclick = () => deleteTask(id);
  
  actionsContainer.appendChild(viewBtn);
  actionsContainer.appendChild(editBtn);
  actionsContainer.appendChild(deleteBtn);
  
  task.appendChild(textContainer);
  task.appendChild(actionsContainer);
  
  task.addEventListener('dragstart', () => task.classList.add('dragging'));
  task.addEventListener('dragend', () => task.classList.remove('dragging'));

  document.querySelector(`#${columnId} .tasks`).appendChild(task);
}

// --- Lógica de Ações (CRUD e Drag & Drop) ---

function handleAddColumn() {
  const title = prompt("Digite o título da nova coluna:");
  if (title && title.trim()) {
    const newColumn = {
      id: title.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      title: title.trim()
    };
    columns.push(newColumn);
    saveColumns();
    renderBoard();
  }
}

function addEventListenersToTaskButtons() {
  // AQUI ESTÁ A MUDANÇA: O seletor agora é mais específico
  document.querySelectorAll('.kanban-column .add-task-btn').forEach(button => {
    // Esta técnica de clonar garante que não haja listeners duplicados
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Adiciona o listener ao novo botão clonado
    newButton.addEventListener('click', () => {
      const column = newButton.closest('.kanban-column').id;
      const text = prompt('Nova tarefa:');
      if (text?.trim()) {
        const newTask = { id: Date.now().toString(), text, column };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
      }
    });
  });
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Editar tarefa:', task.text);
  if (newText?.trim()) {
    task.text = newText;
    saveTasks();
    renderBoard(); // Renderiza o board para refletir a mudança
  }
}

function deleteTask(id) {
  if (confirm('Deseja excluir esta tarefa?')) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderBoard();
  }
}

function addEventListenersToDropZones() {
  document.querySelectorAll('.tasks').forEach(container => {
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const dragging = document.querySelector('.dragging');
      if (!dragging) return;
      if (afterElement == null) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }
    });

    container.addEventListener('drop', e => {
      e.preventDefault();
      const dragging = document.querySelector('.dragging');
      if (!dragging) return;
      const taskId = dragging.dataset.id;
      const column = container.closest('.kanban-column').id;
      const task = tasks.find(t => t.id === taskId);
      if (task && task.column !== column) {
        task.column = column;
        saveTasks();
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return elements.reduce((closest, el) => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return (offset < 0 && offset > closest.offset) ? { offset, element: el } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Inicialização da Página ---
document.addEventListener('DOMContentLoaded', renderBoard);