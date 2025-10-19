import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackPreview,
  SandpackTests,
} from "@codesandbox/sandpack-react";

const files = {
  "index.html": `<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>React Todo</title>
  </head>
  <body>
    <div id='root'></div>
    <script type='module' src='/index.js'></script>
  </body>
</html>`,

  "index.js": `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`,

  "App.js": `import React, { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), title: input.trim(), done: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
      <h2>Todo App</h2>
      <input
        type='text'
        placeholder='Enter todo'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: '5px', width: '70%' }}
      />
      <button onClick={addTodo} style={{ marginLeft: '10px', padding: '5px 10px' }}>Add</button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ marginTop: '10px' }}>
            <span
              onClick={() => toggleTodo(todo.id)}
              style={{
                cursor: 'pointer',
                textDecoration: todo.done ? 'line-through' : 'none'
              }}
            >
              {todo.title}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              style={{ marginLeft: '10px', color: 'red', cursor: 'pointer' }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,

  "package.json": `{
  "name": "sandpack-react-todo",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@testing-library/react": "14.0.0",
    "@testing-library/jest-dom": "6.2.0"
  },
  "devDependencies": {
    "vitest": "1.3.1"
  }
}`,

  // ✅ Vitest-compatible test (pure ESM)
  "App.test.js": `import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('Todo App', () => {
  it('adds a todo', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Enter todo');
    fireEvent.change(input, { target: { value: 'Learn React' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Learn React')).toBeInTheDocument();
  });
});`
};

const Page = () => {
  return (
    <SandpackProvider
      files={files}
      template="react"
      theme="light"
      options={{
        showNavigator: true,
        visibleFiles: Object.keys(files),
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer />
        <SandpackCodeEditor closableTabs showTabs />
        <SandpackPreview />
        <SandpackTests />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default Page;
