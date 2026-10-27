// ---------- Types ----------
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = "all" | "active" | "completed";

// ---------- Model (class with getter, array methods) ----------
class TodoList {
  private todos: Todo[] = [];
  private nextId = 1;

  add(text: string): void {
    this.todos = [...this.todos, { id: this.nextId++, text, completed: false }]; // spread
  }

  toggle(id: number): void {
    this.todos = this.todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)); // map
  }

  edit(id: number, text: string): void {
    this.todos = this.todos.map(t => (t.id === id ? { ...t, text } : t));
  }

  remove(id: number): void {
    this.todos = this.todos.filter(t => t.id !== id); // filter
  }

  clearCompleted(): void {
    this.todos = this.todos.filter(t => !t.completed);
  }

  clearAll(): void {
    this.todos = [];
  }

  get activeCount(): number {
    return this.todos.filter(t => !t.completed).length;
  }

  getFiltered(filter: Filter): Todo[] {
    switch (filter) {
      case "active":
        return this.todos.filter(t => !t.completed);
      case "completed":
        return this.todos.filter(t => t.completed);
      default:
        return [...this.todos];
    }
  }
}

// ---------- State ----------
const list = new TodoList();
let currentFilter: Filter = "all";
let editingId: number | null = null;

// ---------- DOM helpers ----------
function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
}

const form = $<HTMLFormElement>("add-form");
const newTodoInput = $<HTMLInputElement>("new-todo");
const listEl = $<HTMLUListElement>("todo-list");
const countEl = $<HTMLSpanElement>("count");

// ---------- Rendering ----------
function createItem(todo: Todo): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.completed ? " completed" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.addEventListener("change", () => {
    list.toggle(todo.id);
    render();
  });
  li.append(checkbox);

  if (editingId === todo.id) {
    const input = document.createElement("input");
    input.className = "edit";
    input.value = todo.text;

    const finish = (save: boolean): void => {
      if (editingId !== todo.id) return; // already finished
      editingId = null;
      if (save) {
        const text = input.value.trim();
        if (text) list.edit(todo.id, text);
        else list.remove(todo.id); // empty text deletes the todo
      }
      render();
    };

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") finish(true);
      else if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
    li.append(input);
  } else {
    const label = document.createElement("span");
    label.className = "todo-text";
    label.textContent = todo.text; // textContent avoids HTML injection
    label.addEventListener("dblclick", () => {
      editingId = todo.id;
      render();
    });
    li.append(label);
  }

  const del = document.createElement("button");
  del.className = "btn-delete";
  del.type = "button";
  del.title = "Delete todo";
  del.setAttribute("aria-label", `Delete ${todo.text}`);
  del.textContent = "🗑";
  del.addEventListener("click", () => {
    list.remove(todo.id);
    render();
  });
  li.append(del);

  return li;
}

function render(): void {
  const items = list.getFiltered(currentFilter);

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Nothing here. Add a todo above.";
    listEl.replaceChildren(empty);
  } else {
    listEl.replaceChildren(...items.map(createItem));
  }

  const n = list.activeCount;
  countEl.textContent = `${n} item${n === 1 ? "" : "s"} left`;

  document.querySelectorAll<HTMLButtonElement>(".filter").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });

  listEl.querySelector<HTMLInputElement>(".edit")?.focus();
}

// ---------- Events ----------
form.addEventListener("submit", e => {
  e.preventDefault();
  const text = newTodoInput.value.trim();
  if (!text) return;
  list.add(text);
  newTodoInput.value = "";
  render();
});

document.querySelectorAll<HTMLButtonElement>(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter as Filter;
    render();
  });
});

$("clear-completed").addEventListener("click", () => {
  list.clearCompleted();
  render();
});

$("clear-all").addEventListener("click", () => {
  list.clearAll();
  render();
});

render();

