
// --- Seletores e Variáveis Globais ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const modal = document.getElementById('task-modal');
const modalTextContainer = document.getElementById('modal-task-text');
const closeModalBtn = document.querySelector('.close-btn');
const kanbanBoard = document.querySelector('.kanban-board');

// --- Estado da Aplicação (Dados) ---
let columns = JSON.parse(localStorage.getItem('kanban_columns')) || [
  { id: 'todo', title: 'A Fazer' },
  { id: 'doing', title: 'Fazendo' },
  { id: 'done', title: 'Feito' }
];
let tasks = JSON.parse(localStorage.getItem('kanban_tasks') || '[]');

// --- Funções de Persistência (Salvar/Carregar) ---
function saveColumns() { localStorage.setItem('kanban_columns', JSON.stringify(columns)); }
function saveTasks() { localStorage.setItem('kanban_tasks', JSON.stringify(tasks)); }

// --- Lógica do Tema, Logout e Modal ---
if (localStorage.getItem('theme') === 'dark') { body.classList.add('dark'); themeToggle.checked = true; }
themeToggle.addEventListener('change', () => { body.classList.toggle('dark', themeToggle.checked); localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light'); });
function logout() { localStorage.removeItem('kanban_auth'); window.location.href = 'login.html'; }
function openModal(fullText) { modalTextContainer.textContent = fullText; modal.style.display = 'flex'; }
function closeModal() { modal.style.display = 'none'; }
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });


// --- Funções de Renderização ---

function renderBoard() {
  kanbanBoard.innerHTML = '';
  
  columns.forEach(column => {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.id = column.id;
    columnEl.draggable = true;

    const h2 = document.createElement('h2');
    h2.textContent = column.title;
    h2.addEventListener('click', () => makeTitleEditable(h2, column));

    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'add-task-btn';
    addTaskBtn.textContent = '+ Adicionar Tarefa';
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks';

    columnEl.appendChild(h2);
    columnEl.appendChild(addTaskBtn);
    columnEl.appendChild(tasksContainer);
    
    kanbanBoard.appendChild(columnEl);
  });
  
  const addColumnContainer = document.createElement('div');
  addColumnContainer.className = 'add-column-container';
  addColumnContainer.innerHTML = `<button id="add-column-btn" class="add-task-btn">+ Adicionar outra coluna</button>`;
  kanbanBoard.appendChild(addColumnContainer);

  addEventListenersToButtons();
  addEventListenersToDropZones();
  
  renderTasks();
}

function renderTasks() {
  document.querySelectorAll('.tasks').forEach(el => el.innerHTML = '');
  tasks.forEach(t => { if (document.getElementById(t.column)) addTaskToDOM(t.id, t.text, t.column); });
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
    const safeText = text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    actionsContainer.innerHTML = `<button class="task-view-btn" title="Ver tarefa completa" onclick="openModal('${safeText}')">👁️</button>
                                  <button title="Editar" onclick="editTask('${id}')">✏️</button>
                                  <button title="Excluir" onclick="deleteTask('${id}')">🗑️</button>`;

    task.appendChild(textContainer);
    task.appendChild(actionsContainer);
    
    // ATUALIZAÇÃO 1: Adiciona um prefixo para identificar que é uma tarefa
    task.addEventListener('dragstart', (e) => { 
        e.target.classList.add('dragging'); 
        e.dataTransfer.setData('text/plain', 'task-' + id); 
    });
    task.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));

    document.querySelector(`#${columnId} .tasks`).appendChild(task);
}

// --- Lógica de Ações e Eventos ---

function addEventListenersToButtons() {
  document.getElementById('add-column-btn').addEventListener('click', handleAddColumn);
  document.querySelectorAll('.add-task-btn:not(#add-column-btn)').forEach(button => {
    button.addEventListener('click', (e) => showTaskInput(e.target));
  });
}

function handleAddColumn() {
  const title = prompt("Digite o título da nova coluna:");
  if (title?.trim()) {
    const newColumn = { id: `col-${Date.now()}`, title: title.trim() };
    columns.push(newColumn);
    saveColumns();
    renderBoard();
  }
}

function showTaskInput(button) {
    button.style.display = 'none';
    const container = document.createElement('div');
    container.className = 'new-task-input-container';
    container.innerHTML = `
        <textarea placeholder="Digite os detalhes da tarefa..."></textarea>
        <div class="buttons">
            <button class="save-btn">Salvar</button>
            <button class="cancel-btn">Cancelar</button>
        </div>
    `;
    button.insertAdjacentElement('afterend', container);
    const textarea = container.querySelector('textarea');
    textarea.focus();
    container.querySelector('.save-btn').onclick = () => {
        const text = textarea.value.trim();
        if (text) {
            const columnId = button.closest('.kanban-column').id;
            const newTask = { id: `task-${Date.now()}`, text, column: columnId };
            tasks.push(newTask);
            saveTasks();
            renderBoard();
        }
    };
    container.querySelector('.cancel-btn').onclick = () => {
        container.remove();
        button.style.display = 'block';
    };
}

function makeTitleEditable(h2, column) {
    const oldTitle = h2.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldTitle;
    input.className = 'column-title-edit';
    h2.replaceWith(input);
    input.focus();
    const save = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== oldTitle) {
            column.title = newTitle;
            saveColumns();
        }
        renderBoard();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Editar tarefa:', task.text);
  if (newText?.trim()) { task.text = newText; saveTasks(); renderBoard(); }
}

function deleteTask(id) {
  if (confirm('Deseja excluir esta tarefa?')) { tasks = tasks.filter(t => t.id !== id); saveTasks(); renderBoard(); }
}

// --- Lógica de Drag & Drop (A GRANDE ATUALIZAÇÃO) ---

function addEventListenersToDropZones() {
    // Para tarefas
    document.querySelectorAll('.tasks').forEach(container => {
        container.addEventListener('dragover', e => { e.preventDefault(); });
        container.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            
            // ATUALIZAÇÃO 2: Só executa a lógica se for uma tarefa
            if (!data.startsWith('task-')) {
                return;
            }
            e.stopPropagation(); // Impede o evento de borbulhar para o board

            const taskId = data.substring(5); // Pega o ID sem o prefixo 'task-'
            const task = tasks.find(t => t.id === taskId);
            const columnId = container.closest('.kanban-column').id;
            if (task && task.column !== columnId) { task.column = columnId; saveTasks(); renderTasks(); }
        });
    });

    // Para colunas
    let draggedColumn = null;
    document.querySelectorAll('.kanban-column').forEach(columnEl => {
        // ATUALIZAÇÃO 3: Adiciona um prefixo para identificar que é uma coluna
        columnEl.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedColumn = columnEl;
            e.dataTransfer.setData('text/plain', 'column-' + columnEl.id);
            setTimeout(() => e.target.classList.add('dragging-column'), 0);
        });
        columnEl.addEventListener('dragend', (e) => {
            if (draggedColumn) {
                e.stopPropagation();
                draggedColumn.classList.remove('dragging-column');
                draggedColumn = null;
            }
        });
    });

    kanbanBoard.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterColumn = getDragAfterColumn(kanbanBoard, e.clientX);
        if (draggedColumn) {
            if (afterColumn == null) {
                kanbanBoard.appendChild(draggedColumn);
            } else {
                kanbanBoard.insertBefore(draggedColumn, afterColumn);
            }
        }
    });

    kanbanBoard.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedColumn) return;
        
        const newColumnsOrder = [...kanbanBoard.querySelectorAll('.kanban-column')].map(col => col.id);
        columns.sort((a, b) => newColumnsOrder.indexOf(a.id) - newColumnsOrder.indexOf(b.id));
        saveColumns(); // AGORA VAI SALVAR CORRETAMENTE!
    });
}

function getDragAfterColumn(container, x) {
    const draggableColumns = [...container.querySelectorAll('.kanban-column:not(.dragging-column)')];
    return draggableColumns.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Inicialização da Página ---
document.addEventListener('DOMContentLoaded', renderBoard);
