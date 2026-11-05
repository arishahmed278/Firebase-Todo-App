
import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


// 1. FIREBASE CONFIGURATION

const firebaseConfig = {
    apiKey: "AIzaSyDqXRpVIcYPQkhWS9FZY4ryQIAGM2s4BxQ",
    authDomain: "fir-todo-app-9d020.firebaseapp.com",
    projectId: "fir-todo-app-9d020",
    storageBucket: "fir-todo-app-9d020.firebasestorage.app",
    messagingSenderId: "1093059947021",
    appId: "1:1093059947021:web:4c25ac25a6448991e34344",
    measurementId: "G-HPSDS0X9NT"
};


// 2. INITIALIZE FIREBASE

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 3. PAGE DETECTION

const todoSection = document.getElementById("todo-section");
const isDashboard = todoSection !== null;


// 4. HTML ELEMENTS

const loadingSpinner = document.getElementById("loading-spinner");
const authSection = document.getElementById("auth-section");
const authNavSection = document.getElementById("auth-nav-section");

const authForm = document.getElementById("auth-form");
const authFormTitle = document.getElementById("auth-form-title");
const authFormSubtitle = document.getElementById("auth-form-subtitle");
const authBtn = document.getElementById("auth-btn");
const toggleAuthText = document.getElementById("toggle-auth-text");
const authAlert = document.getElementById("auth-alert");

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const noTodos = document.getElementById("no-todos");
const taskCount = document.getElementById("task-count");
const todoAlert = document.getElementById("todo-alert");
const addTaskBtn = document.getElementById("add-task-btn");
const todoLoading = document.getElementById("todo-loading");

let isSignupMode = false;
let unsubscribeTodos = null;


// 5. DEFAULT LOGIN PAGE

function setLoginDefault() {

    isSignupMode = false;

    if (authFormTitle) {
        authFormTitle.textContent = "Welcome Back";
    }

    if (authFormSubtitle) {
        authFormSubtitle.textContent =
            "Enter your details to manage your daily tasks.";
    }

    if (authBtn) {
        authBtn.textContent = "Login";
    }

    if (toggleAuthText) {
        toggleAuthText.innerHTML = `Don't have an account?
            <a href="#" id="toggle-auth-mode"
            class="fw-bold text-decoration-none text-purple">Sign Up</a>`;
    }

    const password = document.getElementById("password");

    if (password) {
        password.setAttribute("autocomplete", "current-password");
    }
}

setLoginDefault();


// 6. ALERT FUNCTION

function showAlert(element, message, type = "danger") {

    if (!element) return;

    element.textContent = message;

    const spacing = element === todoAlert ? "mt-3 mb-0" : "";

    element.className =
        `alert alert-${type} py-2 small border-0 ${spacing}`;
}


// 7. FIREBASE ERROR MESSAGES

function getFriendlyError(error) {

    const messages = {
        "auth/email-already-in-use":
            "This email is already registered.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/weak-password":
            "Password must be at least 6 characters.",

        "auth/invalid-credential":
            "Incorrect email or password.",

        "auth/user-not-found":
            "No account found with this email.",

        "auth/wrong-password":
            "Incorrect password.",

        "auth/network-request-failed":
            "Network error. Check your internet connection.",

        "permission-denied":
            "Permission denied. Please check Firestore rules.",

        "unavailable":
            "Service temporarily unavailable. Try again."
    };

    return messages[error.code] ||
        error.message ||
        "Something went wrong. Please try again.";
}


// 8. LOADING HELPERS

function waitOneSecond(startTime) {

    const remainingTime = 1000 - (Date.now() - startTime);

    if (remainingTime > 0) {
        return new Promise(function(resolve) {
            setTimeout(resolve, remainingTime);
        });
    }

    return Promise.resolve();
}


// 9. LOGIN / SIGNUP SWITCH

function toggleAuthMode() {

    isSignupMode = !isSignupMode;

    if (authAlert) {
        authAlert.classList.add("d-none");
    }

    const password = document.getElementById("password");

    if (password) {
        password.value = "";
    }

    if (isSignupMode) {

        authFormTitle.textContent = "Create Account";

        authFormSubtitle.textContent =
            "Sign up to start organizing your workflow.";

        authBtn.textContent = "Sign Up";

        password.setAttribute("autocomplete", "new-password");

        toggleAuthText.innerHTML = `Already have an account?
            <a href="#" id="toggle-auth-mode"
            class="fw-bold text-decoration-none text-purple">Login</a>`;

    } else {

        setLoginDefault();

    }
}


// 10. AUTH FORM EVENTS

if (toggleAuthText) {

    toggleAuthText.addEventListener("click", function(event) {

        if (event.target.closest("#toggle-auth-mode")) {

            event.preventDefault();

            toggleAuthMode();
        }
    });
}


if (authForm) {

    authForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        authAlert.classList.add("d-none");

        authBtn.disabled = true;

        authBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Please wait...';

        try {

            if (isSignupMode) {

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            } else {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            }

            authForm.reset();

        } catch (error) {

            console.error("Authentication error:", error);

            showAlert(authAlert, getFriendlyError(error));

        } finally {

            authBtn.disabled = false;

            authBtn.textContent = isSignupMode ? "Sign Up" : "Login";

        }

    });

}


// 11. NAVBAR USER AND LOGOUT

function renderNavbar(user) {

    if (!authNavSection) return;

    authNavSection.replaceChildren();

    if (!user) return;

    const emailSpan = document.createElement("span");

    emailSpan.id = "user-email";
    emailSpan.className = "text-white small me-2";
    emailSpan.textContent = user.email || "User";

    const logoutBtn = document.createElement("button");

    logoutBtn.type = "button";

    logoutBtn.className =
        "btn btn-light btn-sm fw-bold rounded-3 px-3 shadow-sm";

    logoutBtn.innerHTML =
        '<i class="fa-solid fa-arrow-right-from-bracket me-1"></i>Logout';

    logoutBtn.addEventListener("click", async function() {

        logoutBtn.disabled = true;

        logoutBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-1"></span>Logging out...';

        try {

            await signOut(auth);

        } catch (error) {

            console.error("Logout error:", error);

            showAlert(todoAlert, getFriendlyError(error));

            logoutBtn.disabled = false;

            logoutBtn.innerHTML =
                '<i class="fa-solid fa-arrow-right-from-bracket me-1"></i>Logout';
        }

    });

    authNavSection.append(emailSpan, logoutBtn);
}


// 12. AUTHENTICATION STATE

onAuthStateChanged(auth, function(user) {

    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }

    if (isDashboard) {

        if (!user) {

            window.location.replace("index.html");

            return;
        }

        if (todoSection) {
            todoSection.style.display = "flex";
        }

        renderNavbar(user);

        loadUserTodos(user.uid);

        return;
    }

    if (user) {

        window.location.replace("dashboard.html");

        return;
    }

    if (authSection) {
        authSection.style.display = "flex";
    }

}, function(error) {

    console.error("Authentication state error:", error);

    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }

    if (isDashboard) {

        if (todoSection) {
            todoSection.style.display = "flex";
        }

        showAlert(todoAlert, getFriendlyError(error));

    } else {

        if (authSection) {
            authSection.style.display = "flex";
        }

        showAlert(authAlert, getFriendlyError(error));

    }

});


// 13. ADD TASK TO FIRESTORE

if (todoForm) {

    todoForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const text = todoInput.value.trim();

        const user = auth.currentUser;

        if (!user || !text) return;

        if (text.length > 300) {

            showAlert(todoAlert, "Task cannot exceed 300 characters.");

            return;
        }

        const startTime = Date.now();

        addTaskBtn.disabled = true;

        addTaskBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-1"></span>Adding...';

        todoAlert.classList.add("d-none");

        try {

            await addDoc(collection(db, "todos"), {

                text: text,

                uid: user.uid,

                createdAt: serverTimestamp()

            });

            todoInput.value = "";

            todoInput.focus();

            showAlert(todoAlert, "Task added successfully!", "success");

        } catch (error) {

            console.error("Add task error:", error);

            showAlert(todoAlert, getFriendlyError(error));

        }

        await waitOneSecond(startTime);

        addTaskBtn.disabled = false;

        addTaskBtn.innerHTML =
            '<i class="fa-solid fa-paper-plane me-1"></i>Add Task';

    });

}


// 14. LOAD USER TASKS

function loadUserTodos(uid) {

    if (unsubscribeTodos) {
        unsubscribeTodos();
    }

    if (todoLoading) {
        todoLoading.classList.remove("d-none");
    }

    if (noTodos) {
        noTodos.classList.add("d-none");
    }

    if (todoList) {
        todoList.replaceChildren();
    }

    const todosQuery = query(
        collection(db, "todos"),
        where("uid", "==", uid)
    );

    unsubscribeTodos = onSnapshot(

        todosQuery,

        function(snapshot) {

            const todos = snapshot.docs.map(function(document) {

                return {
                    id: document.id,
                    ...document.data()
                };

            });

            todos.sort(function(a, b) {

                const timeA = a.createdAt?.toMillis?.() || 0;

                const timeB = b.createdAt?.toMillis?.() || 0;

                return timeB - timeA;

            });

            renderTodos(todos);

            if (todoLoading) {
                todoLoading.classList.add("d-none");
            }

        },

        function(error) {

            console.error("Firestore error:", error);

            if (todoLoading) {
                todoLoading.classList.add("d-none");
            }

            showAlert(todoAlert, getFriendlyError(error));

        }

    );

}


// 15. DISPLAY TASKS

function renderTodos(todos) {

    if (!todoList) return;

    todoList.replaceChildren();

    if (taskCount) {

        taskCount.textContent =
            `${todos.length} Task${todos.length === 1 ? "" : "s"}`;

    }

    if (todos.length === 0) {

        if (noTodos) {
            noTodos.classList.remove("d-none");
        }

        return;
    }

    if (noTodos) {
        noTodos.classList.add("d-none");
    }

    const fragment = document.createDocumentFragment();

    todos.forEach(function(todo) {

        const item = document.createElement("li");

        item.className =
            "list-group-item task-item d-flex justify-content-between align-items-center p-3 shadow-sm";

        const content = document.createElement("div");

        content.className =
            "d-flex align-items-center flex-grow-1 me-2";

        const icon = document.createElement("i");

        icon.className =
            "fa-regular fa-circle-check me-3 text-purple";

        const text = document.createElement("span");

        text.className = "fw-medium text-dark task-text";

        text.textContent = todo.text || "";

        content.append(icon, text);

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className =
            "btn btn-sm btn-link text-danger text-decoration-none border-0 delete-btn";

        deleteBtn.title = "Delete task";

        deleteBtn.setAttribute("aria-label", "Delete task");

        deleteBtn.innerHTML =
            '<i class="fa-solid fa-trash-can"></i>';

        deleteBtn.addEventListener("click", function() {

            deleteTodo(todo.id, deleteBtn);

        });

        item.append(content, deleteBtn);

        fragment.appendChild(item);

    });

    todoList.appendChild(fragment);

}


// 16. DELETE TASK PERMANENTLY

async function deleteTodo(id, button) {

    const user = auth.currentUser;

    if (!user) return;

    if (!window.confirm("Are you sure you want to delete this task?")) {
        return;
    }

    const startTime = Date.now();

    button.disabled = true;

    button.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span>';

    try {

        await deleteDoc(doc(db, "todos", id));

        showAlert(todoAlert, "Task deleted successfully!", "success");

    } catch (error) {

        console.error("Delete error:", error);

        showAlert(todoAlert, getFriendlyError(error));

        button.disabled = false;

        button.innerHTML =
            '<i class="fa-solid fa-trash-can"></i>';

        return;
    }

    await waitOneSecond(startTime);

}
