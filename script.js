document.addEventListener('DOMContentLoaded', () => {
  const board = document.querySelector('.kanban-board');
  const themeToggle = document.getElementById('theme-toggle');
  const modal = document.getElementById('task-modal');
  const modalContent = document.getElementById('modal-task-text');
  const closeModal = document.querySelector('.close-btn');

  // Temas
  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', themeToggle.checked);
    localStorage.setItem('kanban_theme', themeToggle.checked ? 'dark' : 'light');
  });
  if (localStorage.getItem('kanban_theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.checked = true;
  }

  // Modal
  closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; }

  // Dados
  let data;
  try {
    const stored = JSON.parse(localStorage.getItem('kanban_data'));
    data = Array.isArray(stored) ? stored : [];
  } catch (e) {
    data = [];
  }


  function createTaskCard(task, columnIndex) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.innerHTML = `
      <div class="task-text">${task.text}</div>
      <div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}</div>
    `;

    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ columnIndex, taskIndex: data[columnIndex].tasks.indexOf(task) }));
    });

    card.addEventListener('click', () => {
      modalContent.textContent = task.text;
      modal.style.display = 'flex';
    });

    return card;
  }

  function renderBoard() {
    board.innerHTML = '';

    data.forEach((column, columnIndex) => {
      const col = document.createElement('div');
      col.className = 'kanban-column';
      col.style.backgroundColor = column.color || 'white';

      const title = document.createElement('h2');
      title.textContent = column.name;
      title.contentEditable = true;
      title.onblur = () => {
        column.name = title.textContent.trim();
        saveData();
      };

      const controls = document.createElement('div');
      controls.className = 'column-controls';

      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-picker';
      colorBtn.textContent = '🎨';
      colorBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.style.position = 'absolute';
        input.style.opacity = 0;
        document.body.appendChild(input);
        input.oninput = () => {
          column.color = input.value;
          saveData();
          renderBoard();
          input.remove();
        };
        input.click();
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-column';
      deleteBtn.textContent = '🗑️';
      deleteBtn.onclick = () => {
        data.splice(columnIndex, 1);
        saveData();
        renderBoard();
      };

      controls.append(colorBtn, deleteBtn);

      const taskContainer = document.createElement('div');
      taskContainer.className = 'tasks';
      taskContainer.ondragover = e => e.preventDefault();
      taskContainer.ondrop = e => {
        e.preventDefault();
        const { columnIndex: fromIndex, taskIndex } = JSON.parse(e.dataTransfer.getData('text/plain'));
        const [task] = data[fromIndex].tasks.splice(taskIndex, 1);
        data[columnIndex].tasks.push(task);
        saveData();
        renderBoard();
      };

      column.tasks.forEach(task => {
        taskContainer.appendChild(createTaskCard(task, columnIndex));
      });

      col.append(controls, title, taskContainer);
      board.appendChild(col);
    });

    // Botão para nova coluna
    const addCol = document.createElement('button');
    addCol.textContent = '+ Nova Coluna';
    addCol.className = 'add-column-btn';
    addCol.onclick = () => {
      const name = prompt('Nome da coluna:');
      if (name) {
        data.push({ name, color: '#ffffff', tasks: [] });
        saveData();
        renderBoard();
      }
    };
    board.appendChild(addCol);
  }

  renderBoard();
});
