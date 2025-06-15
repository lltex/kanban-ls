// Estado das colunas agora inclui cor (se não tiver, adiciona cor padrão)
let columns = JSON.parse(localStorage.getItem('kanban_columns')) || [
  { id: 'todo', title: 'A Fazer', color: '#ffeb3b' },   // amarelo claro
  { id: 'doing', title: 'Fazendo', color: '#03a9f4' },  // azul claro
  { id: 'done', title: 'Feito', color: '#4caf50' }      // verde claro
];

// ...

function renderBoard() {
  kanbanBoard.innerHTML = '';
  
  columns.forEach(column => {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.id = column.id;
    columnEl.style.backgroundColor = column.color || '#fff'; // aplica cor da coluna
    columnEl.draggable = false;  // DESATIVA drag das colunas
    
    // Título editável
    const h2 = document.createElement('h2');
    h2.textContent = column.title;
    h2.style.display = 'inline-block';
    h2.style.marginRight = '8px';
    h2.addEventListener('click', () => makeTitleEditable(h2, column));

    // Seletor de cor
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = column.color || '#ffffff';
    colorInput.title = 'Selecionar cor da coluna';
    colorInput.style.verticalAlign = 'middle';
    colorInput.addEventListener('input', (e) => {
      column.color = e.target.value;
      saveColumns();
      renderBoard();
    });

    // Botão adicionar tarefa
    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'add-task-btn';
    addTaskBtn.textContent = '+ Adicionar Tarefa';
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks';

    // Apêndices
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.marginBottom = '8px';
    titleContainer.appendChild(h2);
    titleContainer.appendChild(colorInput);

    columnEl.appendChild(titleContainer);
    columnEl.appendChild(addTaskBtn);
    columnEl.appendChild(tasksContainer);
    
    kanbanBoard.appendChild(columnEl);
  });
  
  const addColumnContainer = document.createElement('div');
  addColumnContainer.className = 'add-column-container';
  addColumnContainer.innerHTML = '<button id="add-column-btn" class="add-task-btn">+ Adicionar outra coluna</button>';
  kanbanBoard.appendChild(addColumnContainer);

  addEventListenersToButtons();
  addEventListenersToDropZones();
  
  renderTasks();
}

// Na função addEventListenersToDropZones, REMOVA toda a lógica de drag and drop das colunas
function addEventListenersToDropZones() {
    // Drag & drop só para tarefas
    document.querySelectorAll('.tasks').forEach(container => {
        container.addEventListener('dragover', e => { e.preventDefault(); });
        container.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            
            if (!data.startsWith('task-')) return;

            e.stopPropagation();

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

    // REMOVA TODO o código referente a drag das colunas daqui para baixo (inclusive as variáveis draggedColumn etc)
}

// Ajuste na função handleAddColumn para adicionar cor padrão
function handleAddColumn() {
  const title = prompt("Digite o título da nova coluna:");
  if (title?.trim()) {
    const newColumn = { id: `col-${Date.now()}`, title: title.trim(), color: '#ffffff' }; // cor branca padrão
    columns.push(newColumn);
    saveColumns();
    renderBoard();
  }
}
