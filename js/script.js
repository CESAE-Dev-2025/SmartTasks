/******************************************************************************
              Projeto Final 1: “Gestor de Tarefas Inteligente”:
                                Leandro Gabriel
******************************************************************************/
/*
Data de entrega: até 3a (2/11) à noite
Data da apresentação: dia 5/11 de manhã


Sistema completo de gestão de tarefas com as seguintes funcionalidades:
  - Adicionar tarefas via formulário
  - Marcar tarefas como concluídas
  - Editar e remover tarefas
  - Contar tarefas ativas/concluídas
  - Filtros (Todas / Ativas / Concluídas)
  - Personalização de tema (claro/escuro)
  - Mostra hora/data atual
  - Conectar com uma APi à vossa escolha e mostrar dados (por exemplo tempo)

Entrega através de zip com o vosso nome ou link para o GitHub.

Avaliação:
  - Realização das funcionalidades propostas e defesa: 17v
  - Criatividade e Extras (funcionalidades): 2v
  - Boas práticas de programação e organização de código (1v)

Nota: a nota dos items anteriores só é validada com a explicação da mesma
      (apresentação do trabalho).

O projecto e sua defesa vale 50% da nota 
(outros 50% participação em aula e tarefas intermédias)
*/

// ----------------------------------------------------------------------------
// ------------------------------------------------------------------ Variables
// ----------------------------------------------------------------------------

// -------------------------------- Language ----------------------------------
let selectedLocale = document.documentElement.getAttribute("data-lang");
let appTexts = [
    { selector: "h1", en: "Task Manager", pt: "Gestor de Tarefas" },
    {
        selector: "#statistics > :nth-child(1) p",
        en: "Active Tasks",
        pt: "Tarefas Activas",
    },
    {
        selector: "#statistics > :nth-child(2) p",
        en: "Completed Tasks",
        pt: "Tarefas Completadas",
    },
    {
        selector: "#taskForm input",
        en: "Add a new task...",
        pt: "Adicione nova tarefa...",
    },
    {
        selector: "#taskForm button span.add-task",
        en: "Add",
        pt: "Adicionar",
    },
    {
        selector: "#taskForm button span.update-task",
        en: "Update",
        pt: "Atualizar",
    },
    {
        selector: "#filterButtons button:nth-of-type(1)",
        en: "All",
        pt: "Todas",
    },
    {
        selector: "#filterButtons button:nth-of-type(2)",
        en: "Active",
        pt: "Activas",
    },
    {
        selector: "#filterButtons button:nth-of-type(3)",
        en: "Completed",
        pt: "Completadas",
    },
    {
        selector: "#emptyState p",
        en: "No tasks yet. Add one to get started!",
        pt: "Sem tarefas. Adicione uma para iniciar!",
    },
];

// ---------------------------------- Theme -----------------------------------
let themeToggle = document.getElementById("themeToggle");
let languageToggle = document.getElementById("languageToggle");

// ----------------------------------- Date -----------------------------------
let currentDateTime = document.getElementById("currentDateTime");
const hourOptions = { hour: "2-digit", minute: "2-digit" };
const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
};

// ------------------------------- Statistics ---------------------------------
let activeCount = document.getElementById("activeCount");
let completedCount = document.getElementById("completedCount");

// ---------------------------------- Quote -----------------------------------
let quote = document.querySelector("#quote p");
let quoteAuthor = document.querySelector("#quote .quote-author");

// ---------------------------------- Tasks -----------------------------------
let taskForm = document.getElementById("taskForm");
let taskList = document.getElementById("taskList");
let emptyState = document.getElementById("emptyState");
let currentId;
let tasks;
let taskItem;

// ---------------------------------- Filter ----------------------------------
const filterButtons = document.getElementById("filterButtons");
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ------------------------------------------------------------------ Functions
// ----------------------------------------------------------------------------

// -------------------------------- Language ----------------------------------
function updateLocale() {
    for (item of appTexts) {
        let currentElement = document.querySelector(item.selector);
        let localeText = selectedLocale == "en" ? item.en : item.pt;

        if (currentElement.tagName.toLowerCase() === "input") {
            currentElement.setAttribute("placeholder", localeText);
        } else {
            currentElement.textContent = localeText;
        }
    }
    updateDateTime();
}

function toggleLanguage() {
    selectedLocale = selectedLocale == "en" ? "pt" : "en";
    if (selectedLocale == "en") {
        document.documentElement.setAttribute("data-lang", "en");
    } else {
        document.documentElement.setAttribute("data-lang", "pt");
    }
    updateLocale();
}

// ---------------------------------- Theme -----------------------------------
function thoggletheme() {
    let currentTheme = document.documentElement.getAttribute("data-bs-theme");
    if (currentTheme == "dark") {
        document.documentElement.setAttribute("data-bs-theme", "light");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }
}

// ----------------------------------- Date -----------------------------------
function updateDateTime() {
    let currentDate = new Date();

    // Apenas para legibilidade do código
    let date = currentDate.toLocaleDateString(selectedLocale, dateOptions);
    let hour = currentDate.toLocaleTimeString(selectedLocale, hourOptions);

    currentDateTime.textContent = `${date} • ${hour}`;
}

// ------------------------------- Statistics ---------------------------------
function updateStatistics() {
    let taskCount = tasks.length;
    let activeTasks = 0,
        completedTasks = 0;
    if (taskCount > 0) {
        for (task of taskList.children) {
            if (task.getAttribute("data-completed") == "true") {
                completedTasks++;
            } else {
                activeTasks++;
            }
        }
    }
    activeCount.textContent = activeTasks;
    completedCount.textContent = completedTasks;
}

// ----------------------------------- Quote ----------------------------------
function updateQuote() {
    fetch("https://motivational-spark-api.vercel.app/api/quotes/random")
        .then((response) => response.json())
        .then((data) => {
            quote.textContent = data.quote;
            quoteAuthor.textContent = data.author;
        });
}

// ---------------------------------- Tasks -----------------------------------
function handleEmptyState() {
    if (tasks.length > 0) {
        emptyState.classList.add("d-none");
    } else {
        emptyState.classList.remove("d-none");
    }
}

function updateTaskStatus(taskId, status) {
    let currentTaskIndex = tasks.indexOf(
        tasks.find((item) => item.id == taskId)
    );
    tasks[currentTaskIndex].completed = status;

    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function toggleCheckbox() {
    let currentTaskId =
        this.parentElement.parentElement.getAttribute("data-task-id");

    this.parentElement.parentElement.setAttribute(
        "data-completed",
        this.checked
    );

    if (this.checked) {
        this.nextElementSibling.classList.add(
            "text-decoration-line-through",
            "text-muted"
        );
    } else {
        this.nextElementSibling.classList.remove(
            "text-decoration-line-through",
            "text-muted"
        );
    }

    updateTaskStatus(currentTaskId, this.checked);
    updateStatistics();
}

function renderTask(itemToRender) {
    let newItem = new DOMParser().parseFromString(taskItem, "text/html").body
        .firstElementChild;

    newItem.setAttribute("data-task-id", itemToRender.id);
    newItem.querySelector(".task-text").textContent = itemToRender.text;
    newItem.setAttribute("data-completed", itemToRender.completed);

    if (itemToRender.completed) {
        newItem.querySelector(".task-checkbox").checked = true;
        newItem
            .querySelector(".task-text")
            .classList.add("text-decoration-line-through", "text-muted");
    }

    newItem
        .querySelector(".task-checkbox")
        .addEventListener("change", toggleCheckbox);

    newItem.querySelector(".delete-btn").addEventListener("click", deleteTask);
    newItem.querySelector(".edit-btn").addEventListener("click", editTask);

    taskList.appendChild(newItem);

    updateStatistics();
}

function editTask() {
    // TODO: Organizar código de edição
    // TODO: Previnir nova edição durante edição
    let currentCard = this.parentElement.parentElement.parentElement;
    let currentTask = {
        id: currentCard.getAttribute("data-task-id"),
        text: currentCard.querySelector(".task-text").textContent,
        completed: currentCard.querySelector(".task-checkbox").checked,
    };

    let currentTaskIndex = tasks.indexOf(
        tasks.find((item) => item.id == currentTask.id)
    );

    currentCard.classList.add("d-none");

    taskInput.setAttribute("data-task-id", currentTask.id);
    taskInput.setAttribute("data-task-index", currentTaskIndex);
    taskInput.value = currentTask.text;
    taskForm
        .querySelectorAll(".add-task")
        .forEach((item) => item.classList.add("d-none"));
    taskForm
        .querySelectorAll(".update-task")
        .forEach((item) => item.classList.remove("d-none"));
}

function handleTask(e) {
    e.preventDefault();

    let taskId = taskInput.getAttribute("data-task-id");
    let formData = new FormData(e.target);

    if (taskId == 0) {
        // Nova tarefa
        let newTask = {
            id: currentId,
            text: formData.get("task-item"),
            completed: false,
        };
        tasks.push(newTask);

        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("currentId", currentId++);

        renderTask(newTask);
    } else {
        // Tarefa existente
        let currentTask = {
            id: taskId,
            text: formData.get("task-item"),
            completed: taskInput.getAttribute("data-completed"),
        };

        let currentTaskIndex = tasks.indexOf(
            tasks.find((item) => item.id == currentTask.id)
        );
        tasks[currentTaskIndex].text = currentTask.text;

        localStorage.setItem("tasks", JSON.stringify(tasks));

        for (const child of taskList.children) {
            let childId = child.getAttribute("data-task-id");
            if (childId == taskId) {
                child.querySelector(".task-text").textContent =
                    currentTask.text;

                child.classList.remove("d-none");
            }
        }
        taskInput.setAttribute("data-task-id", "");
        taskInput.setAttribute("data-task-index", 0);

        taskForm
            .querySelectorAll(".add-task")
            .forEach((item) => item.classList.remove("d-none"));
        taskForm
            .querySelectorAll(".update-task")
            .forEach((item) => item.classList.add("d-none"));
    }

    e.target.reset();
    handleEmptyState();
}

function removeTaskById(taskId) {
    let itemIndex = tasks.indexOf(tasks.find((item) => item.id == taskId));
    tasks.splice(itemIndex, 1);

    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function deleteTask() {
    let taskCard = this.parentElement.parentElement.parentElement;
    let taskId = taskCard.getAttribute("data-task-id");
    removeTaskById(taskId);
    taskCard.remove();
    handleEmptyState();
}

// ---------------------------------- Filter ----------------------------------
function filterBy(attribute, value) {
    for (const child of taskList.children) {
        if (child.getAttribute(attribute) == value) {
            child.classList.remove("d-none");
        } else {
            child.classList.add("d-none");
        }
    }
}

function clearFilter() {
    for (const child of taskList.children) {
        child.classList.remove("d-none");
    }
}

function clearFilterBtnClasses() {
    for (const filter of filterButtons.children) {
        filter.classList.add("btn-outline-primary");
        filter.classList.remove("btn-primary");
        filter.classList.remove("active");
    }
}

function handleFilterBtnClasses(filterBtn) {
    clearFilterBtnClasses();
    filterBtn.classList.remove("btn-outline-primary");
    filterBtn.classList.add("btn-primary");
    filterBtn.classList.add("active");
}

function filterTasks() {
    handleFilterBtnClasses(this);
    switch (this.getAttribute("data-filter")) {
        case "all":
            clearFilter();
            break;
        case "active":
            filterBy("data-completed", "false");
            break;
        case "completed":
            filterBy("data-completed", "true");
            break;
    }
}

function addTestData() {
    let testTasks = [
        { id: 1, text: "Complete project documentation", completed: false },
        { id: 2, text: "Review pull requests", completed: true },
        { id: 3, text: "Update task management system", completed: false },
    ];
    currentId = 4;
    testTasks.forEach((item) => tasks.push(item));
    tasks.forEach((task) => renderTask(task));
}

// --------------------------------- Startup ----------------------------------
function getLastId() {
    if (tasks.length > 1) {
        return tasks.reduce(function (prev, current) {
            return prev && prev.id > current.id ? prev.id : current.id;
        });
    }

    return tasks[0].id;
}

function startupActions() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    currentId = 1;
    taskItem = `
    <div class="card mb-2 task-item" data-task-id="" data-completed="false">
        <div class="card-body d-flex align-items-center gap-3">
            <input type="checkbox" class="form-check-input mt-0 task-checkbox"/>
            <span class="flex-grow-1 task-text"></span>
            <div class="task-actions">
                <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" aria-label="Edit task">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" aria-label="Delete task">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    </div>`;

    if (tasks.length > 0) {
        tasks.forEach((task) => renderTask(task));
        currentId += getLastId();
    }

    handleEmptyState();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    updateQuote();
    setInterval(updateQuote, 300000);

    // addTestData();

    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("currentId", currentId);
}
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ------------------------------------------------------------ Event Listeners
// ----------------------------------------------------------------------------

// -------------------------------- Language ----------------------------------
languageToggle.addEventListener("click", toggleLanguage);

// ---------------------------------- Theme -----------------------------------
themeToggle.addEventListener("click", thoggletheme);

// ---------------------------------- Tasks -----------------------------------
taskForm.addEventListener("submit", handleTask);

// ---------------------------------- Filter ----------------------------------
for (const filter of filterButtons.children) {
    filter.addEventListener("click", filterTasks);
}

// --------------------------------- Startup ----------------------------------
window.addEventListener("load", (event) => {
    startupActions();
});
// ----------------------------------------------------------------------------
