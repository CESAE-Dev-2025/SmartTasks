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

*/

// ----------------------------------------------------------------------------
// ------------------------------------------------------------------ Variables
// ----------------------------------------------------------------------------

// -------------------------------- Language ----------------------------------
let selectedLocale =
    localStorage.getItem("userLocale") ||
    document.documentElement.getAttribute("lang");

const lang = { EN: "en", PT: "pt" };
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
        pt: "Tarefas Concluídas",
    },
    {
        selector: ".invalid-feedback",
        en: "Please provide a text for the task (between 5 and 100 characters).",
        pt: "Por favor digiteum texto válido para a tarefa (entre 5 e 100 characteres).",
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
    // {
    //     selector: ".toast-body.add",
    //     en: "Task added succefully",
    //     pt: "Tarefa adicionada com sucesso",
    // },
    // {
    //     selector: ".toast-body.update",
    //     en: "Task updated succefully",
    //     pt: "Tarefa atualizada com sucesso",
    // },
    // {
    //     selector: ".toast-body.remove",
    //     en: "Task removed succefully",
    //     pt: "Tarefa removida com sucesso",
    // },
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
        pt: "Concluídas",
    },
    {
        selector: "#emptyState p",
        en: "No tasks yet. Add one to get started!",
        pt: "Sem tarefas. Adicione uma para iniciar!",
    },
];

const notificationTexts = [
    {
        action: "add",
        en: "Task added succefully",
        pt: "Tarefa adicionada com sucesso",
    },
    {
        action: "update",
        en: "Task updated succefully",
        pt: "Tarefa atualizada com sucesso",
    },
    {
        action: "remove",
        en: "Task removed succefully",
        pt: "Tarefa removida com sucesso",
    },
];

// ---------------------------------- Theme -----------------------------------
const theme = { DARK: "dark", LIGHT: "light" };
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

// ------------------------------ Notifications -------------------------------
const toastTrigger = document.querySelector("#taskForm button");
const notificationToast = document.getElementById("notificationToast");
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// ------------------------------------------------------------------ Functions
// ----------------------------------------------------------------------------

// -------------------------------- Language ----------------------------------
function updateLocale() {
    for (item of appTexts) {
        let currentElement = document.querySelector(item.selector);
        let localeText = selectedLocale == lang.EN ? item.en : item.pt;

        if (currentElement.tagName.toLowerCase() === "input") {
            currentElement.setAttribute("placeholder", localeText);
        } else {
            currentElement.textContent = localeText;
        }
    }
    updateDateTime();
    localStorage.setItem("userLocale", selectedLocale);
}

function toggleLanguage() {
    selectedLocale = selectedLocale == lang.EN ? lang.PT : lang.EN;

    if (selectedLocale == lang.EN) {
        document.documentElement.setAttribute("lang", lang.EN);
    } else {
        document.documentElement.setAttribute("lang", lang.PT);
    }
    updateLocale();
}

// ---------------------------------- Theme -----------------------------------
function thoggleTheme() {
    let currentTheme = document.documentElement.getAttribute("data-bs-theme");
    if (currentTheme == theme.DARK) {
        document.documentElement.setAttribute("data-bs-theme", theme.LIGHT);
    } else {
        document.documentElement.setAttribute("data-bs-theme", theme.DARK);
    }
}

// ----------------------------------- Date -----------------------------------
function capitalize(stringToCapitalize) {
    return (stringToCapitalize = []
        .concat(
            stringToCapitalize.substring(0, 1).toUpperCase(),
            stringToCapitalize.substring(1)
        )
        .join(""));
}

function formatDate(date) {
    let formattedDate = date.split(" ");

    formattedDate[0] = capitalize(formattedDate[0]);
    formattedDate[3] = capitalize(formattedDate[3]);

    return formattedDate.join(" ");
}

function updateDateTime() {
    let currentDate = new Date();

    // Apenas para legibilidade do código
    let date = currentDate.toLocaleDateString(selectedLocale, dateOptions);
    let hour = currentDate.toLocaleTimeString(selectedLocale, hourOptions);

    if (selectedLocale == lang.PT) {
        date = formatDate(date);
    }

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
    let newItem = taskItem.cloneNode(true);

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

function getTaskIndex(taskId) {
    return tasks.indexOf(tasks.find((item) => item.id == taskId));
}

function editTask() {
    let currentCard = this.parentElement.parentElement.parentElement;
    let currentTask = {
        id: currentCard.getAttribute("data-task-id"),
        text: currentCard.querySelector(".task-text").textContent,
        completed: currentCard.querySelector(".task-checkbox").checked,
    };

    let currentTaskIndex = getTaskIndex(currentTask.id);

    currentCard.classList.add("d-none");
    for (const child of taskList.children) {
        let childId = child.getAttribute("data-task-id");

        if (childId != currentTask.id) {
            child.setAttribute("style", "pointer-events:none");
        }
    }

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

function updateTask(taskId, formData) {
    let currentTask = {
        id: taskId,
        text: formData.get("task-item"),
        completed: taskInput.getAttribute("data-completed"),
    };

    let currentTaskIndex = getTaskIndex(currentTask.id);
    tasks[currentTaskIndex].text = currentTask.text;

    localStorage.setItem("tasks", JSON.stringify(tasks));

    for (const child of taskList.children) {
        let childId = child.getAttribute("data-task-id");
        if (childId == taskId) {
            child.querySelector(".task-text").textContent = currentTask.text;

            child.classList.remove("d-none");
        }
        child.setAttribute("style", "pointer-events:auto");
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

function addTask(formData) {
    let newTask = {
        id: currentId,
        text: formData.get("task-item"),
        completed: false,
    };
    tasks.push(newTask);

    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("currentId", currentId++);

    renderTask(newTask);
}

function handleTask(e) {
    e.preventDefault();
    let notificationText;
    if (!taskForm.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        taskForm.classList.add("was-validated");
    } else {
        let formData = new FormData(taskForm);
        let taskId = taskInput.getAttribute("data-task-id");

        if (taskId == 0) {
            // Nova tarefa
            addTask(formData);
            showNotification("add");
        } else {
            // Tarefa existente
            updateTask(taskId, formData);
            showNotification("update");
        }
        taskForm.classList.remove("was-validated");
        taskForm.reset();
        handleEmptyState();
    }
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
    updateStatistics();
    handleEmptyState();
    showNotification("remove");
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
    // tasks.forEach((task) => renderTask(task));
}

// ------------------------------ Notifications -------------------------------
function getToastMessage(currentAction) {
    let message = "Nofification message not found... :(";

    for (item of notificationTexts) {
        if (item.action == currentAction) {
            return item[selectedLocale];
        }
    }
    return message;
}

function showNotification(action) {
    let message = getToastMessage(action);
    notificationToast.querySelector(".toast-body").textContent = message;
    const toastBootstrap =
        bootstrap.Toast.getOrCreateInstance(notificationToast);
    toastBootstrap.show();
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
    updateLocale();
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    currentId = 1;

    taskItem = taskList.querySelector(".task-item");
    taskItem.remove();

    // addTestData();

    if (tasks.length > 0) {
        tasks.forEach((task) => renderTask(task));
        currentId += getLastId();
    }

    handleEmptyState();
    setInterval(updateDateTime, 60000);
    updateQuote();
    setInterval(updateQuote, 300000);

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
themeToggle.addEventListener("click", thoggleTheme);

// ---------------------------------- Tasks -----------------------------------
taskForm.addEventListener("submit", handleTask);

// ---------------------------------- Filter ----------------------------------
for (const filter of filterButtons.children) {
    filter.addEventListener("click", filterTasks);
}

// ------------------------------ Notifications -------------------------------

// --------------------------------- Startup ----------------------------------
window.addEventListener("load", startupActions);
// ----------------------------------------------------------------------------
