// ==========================================
// MODERN TO-DO LIST APPLICATION
// Features: CRUD, localStorage, Filters, Theme Toggle
// ==========================================

// Global Variables
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize the application on page load
 */
function init() {
    loadTasksFromStorage();
    renderTasks();
    setupEventListeners();
    updateStats();
    loadThemePreference();
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Add task button
    document.getElementById('addBtn').addEventListener('click', addTask);

    // Enter key for task input
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Modal close buttons
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('saveBtn').addEventListener('click', saveEditedTask);

    // Close modal on outside click
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeModal();
    });
}

// ==========================================
// TASK CRUD OPERATIONS
// ==========================================

/**
 * Add a new task
 */
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const priorityInput = document.getElementById('priorityInput');

    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    // Validate input
    if (!taskText) {
        alert('Please enter a task');
        taskInput.focus();
        return;
    }

    // Create new task object
    const task = {
        id: generateId(),
        text: taskText,
        completed: false,
        dueDate: dueDate || null,
        priority: priority,
        createdAt: new Date().toISOString()
    };

    // Add task to array and save
    tasks.push(task);
    saveTasksToStorage();
    renderTasks();
    updateStats();

    // Clear input fields
    taskInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'medium';
    taskInput.focus();
}

/**
 * Delete a task by ID
 */
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

/**
 * Toggle task completion status
 */
function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

/**
 * Open edit modal for a task
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('editTaskInput').value = task.text;
    document.getElementById('editDueDateInput').value = task.dueDate || '';
    document.getElementById('editPriorityInput').value = task.priority;

    document.getElementById('editModal').classList.add('show');
    document.getElementById('editTaskInput').focus();
}

/**
 * Close edit modal
 */
function closeModal() {
    document.getElementById('editModal').classList.remove('show');
    editingTaskId = null;
}

/**
 * Save edited task
 */
function saveEditedTask() {
    if (!editingTaskId) return;

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    const editedText = document.getElementById('editTaskInput').value.trim();
    const editedDate = document.getElementById('editDueDateInput').value;
    const editedPriority = document.getElementById('editPriorityInput').value;

    if (!editedText) {
        alert('Task cannot be empty');
        return;
    }

    task.text = editedText;
    task.dueDate = editedDate || null;
    task.priority = editedPriority;

    saveTasksToStorage();
    renderTasks();
    closeModal();
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

/**
 * Render all tasks based on current filter
 */
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');

    // Filter tasks based on current filter
    const filteredTasks = getFilteredTasks();

    // Show/hide empty state
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        tasksList.innerHTML = '';
        return;
    }

    // Show empty state message for specific filter
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        tasksList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    // Render filtered tasks
    tasksList.innerHTML = filteredTasks
        .map(task => createTaskElement(task))
        .join('');

    // Add event listeners to task elements
    attachTaskEventListeners();
}

/**
 * Create HTML for a task element
 */
function createTaskElement(task) {
    const formattedDate = task.dueDate ? formatDate(task.dueDate) : null;

    return `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="checkbox" 
                ${task.completed ? 'checked' : ''} 
                data-id="${task.id}"
            >
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    ${formattedDate ? `
                        <div class="task-date">
                            <i class="fas fa-calendar"></i>
                            ${formattedDate}
                        </div>
                    ` : ''}
                    <div class="priority-badge ${task.priority}">
                        ${task.priority}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" data-id="${task.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" data-id="${task.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `;
}

/**
 * Attach event listeners to dynamically created task elements
 */
function attachTaskEventListeners() {
    // Checkboxes
    document.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleTaskCompletion(e.target.dataset.id);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditModal(e.currentTarget.dataset.id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteTask(e.currentTarget.dataset.id);
        });
    });
}

// ==========================================
// FILTER FUNCTIONS
// ==========================================

/**
 * Handle filter button clicks
 */
function handleFilterChange(e) {
    const filterValue = e.currentTarget.dataset.filter;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Update current filter and re-render
    currentFilter = filterValue;
    renderTasks();
}

/**
 * Get filtered tasks based on current filter
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'pending':
            return tasks.filter(task => !task.completed);
        case 'all':
        default:
            return tasks;
    }
}

// ==========================================
// STATS FUNCTIONS
// ==========================================

/**
 * Update task statistics
 */
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

// ==========================================
// STORAGE FUNCTIONS
// ==========================================

/**
 * Save tasks to localStorage
 */
function saveTasksToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Load tasks from localStorage
 */
function loadTasksFromStorage() {
    const stored = localStorage.getItem('tasks');
    tasks = stored ? JSON.parse(stored) : [];
}

// ==========================================
// THEME FUNCTIONS
// ==========================================

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Update icon
    const icon = document.querySelector('#themeToggle i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Load theme preference from localStorage
 */
function loadThemePreference() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Generate unique ID for tasks
 */
function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================
// START APPLICATION
// ==========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}