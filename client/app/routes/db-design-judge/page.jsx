import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Database, Play, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import initSqlJs from 'sql.js';

// Custom Table Node Component
const TableNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg min-w-[200px]">
      <div className="bg-blue-500 text-white px-3 py-2 font-bold rounded-t-lg flex items-center gap-2">
        <Database size={16} />
        {data.label}
      </div>
      <div className="p-2">
        {data.columns?.map((col, idx) => (
          <div key={idx} className="py-1 px-2 text-sm border-b last:border-b-0 flex items-center gap-2">
            {col.isPrimary && <span className="text-yellow-500">🔑</span>}
            <span className="font-medium">{col.name}</span>
            <span className="text-gray-500 text-xs">({col.type})</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

// Single Problem: Build Authentication System
const problem = {
  id: 1,
  title: "Build User Authentication System",
  description: "Design and query a user authentication database",
  requirements: [
    "Store user account information",
    "Track user email addresses for login",
    "Secure password storage",
    "Unique identifier for each user",
    "Store user's full name"
  ],
  hints: [
    "You need a table to store user information",
    "Think about what fields are needed: identifier, name, email, password",
    "One field should be a primary key",
    "Email and password fields should support variable length text"
  ],
  steps: [
    {
      step: 1,
      title: "Database Design",
      instruction: "Design your database schema based on the requirements above. Create appropriate table(s) with necessary columns.",
      type: "design",
      expectedStructure: {
        tableName: "users",
        requiredColumns: ["id", "name", "email", "password"]
      }
    },
    {
      step: 2,
      title: "Query: Get All Users",
      instruction: "Write a SQL query to retrieve all user records from the database",
      type: "query",
      points: 25,
      seedData: [
        { id: 1, name: 'Alice Johnson', email: 'alice@gmail.com', password: 'alice123' },
        { id: 2, name: 'Bob Smith', email: 'bob@yahoo.com', password: 'bob456' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@gmail.com', password: 'charlie789' },
        { id: 4, name: 'Diana Prince', email: 'diana@outlook.com', password: 'diana321' },
        { id: 5, name: 'Eve Wilson', email: 'eve@gmail.com', password: 'eve654' }
      ],
      expectedQuery: "SELECT * FROM users",
      expectedOutput: [
        [1, 'Alice Johnson', 'alice@gmail.com', 'alice123'],
        [2, 'Bob Smith', 'bob@yahoo.com', 'bob456'],
        [3, 'Charlie Brown', 'charlie@gmail.com', 'charlie789'],
        [4, 'Diana Prince', 'diana@outlook.com', 'diana321'],
        [5, 'Eve Wilson', 'eve@gmail.com', 'eve654']
      ]
    },
    {
      step: 3,
      title: "Query: Get Gmail Users",
      instruction: "Write a SQL query to find all users who have Gmail email addresses (email contains 'gmail.com')",
      type: "query",
      points: 30,
      expectedQuery: "SELECT * FROM users WHERE email LIKE '%gmail.com%'",
      expectedOutput: [
        [1, 'Alice Johnson', 'alice@gmail.com', 'alice123'],
        [3, 'Charlie Brown', 'charlie@gmail.com', 'charlie789'],
        [5, 'Eve Wilson', 'eve@gmail.com', 'eve654']
      ]
    },
    {
      step: 4,
      title: "Query: Get Specific User",
      instruction: "Write a SQL query to find the user with email 'bob@yahoo.com'",
      type: "query",
      points: 20,
      expectedQuery: "SELECT * FROM users WHERE email = 'bob@yahoo.com'",
      expectedOutput: [
        [2, 'Bob Smith', 'bob@yahoo.com', 'bob456']
      ]
    },
    {
      step: 5,
      title: "Query: Count Users",
      instruction: "Write a SQL query to count the total number of users in the database",
      type: "query",
      points: 25,
      expectedQuery: "SELECT COUNT(*) FROM users",
      expectedOutput: [[5]]
    }
  ]
};

export default function SQLLearningPlatform() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [db, setDb] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showTableForm, setShowTableForm] = useState(false);
  const [newTable, setNewTable] = useState({ 
    name: '', 
    columns: [{ name: '', type: 'VARCHAR(255)', isPrimary: false }] 
  });
  const [sqlGenerated, setSqlGenerated] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore] = useState(problem.steps.reduce((sum, s) => sum + (s.points || 0), 0));
  const [tableCreated, setTableCreated] = useState(false);
  const [dataSeeded, setDataSeeded] = useState(false);

  // Initialize SQL.js
  useEffect(() => {
    const initDb = async () => {
      try {
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const database = new SQL.Database();
        setDb(database);
        //create a table called test
        database.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT)");
        //insert some test data
            database.run("INSERT INTO test (name, email, password) VALUES (?,?,?)", ['Test User', 'test@example.com', 'test123']);
            database.run("INSERT INTO test (name, email, password) VALUES (?,?,?)", ['Alice', 'alice@example.com', 'alice123']);
            //fetch and log the data
            const res = database.exec("SELECT * FROM test");
            console.log('Test table data:', res);
        setSqlLoading(false);
      } catch (error) {
        console.error('Failed to initialize SQL.js:', error);
        setFeedback('❌ Failed to load SQL engine. Please refresh the page.');
        setSqlLoading(false);
      }
    };
    initDb();
  }, []);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addColumn = () => {
    setNewTable({
      ...newTable,
      columns: [...newTable.columns, { name: '', type: 'VARCHAR(255)', isPrimary: false }]
    });
  };

  const updateColumn = (index, field, value) => {
    const updatedColumns = [...newTable.columns];
    if (field === 'isPrimary' && value) {
      updatedColumns.forEach((col, idx) => {
        if (idx !== index) col.isPrimary = false;
      });
    }
    updatedColumns[index][field] = value;
    setNewTable({ ...newTable, columns: updatedColumns });
  };

  const removeColumn = (index) => {
    if (newTable.columns.length === 1) {
      alert('Table must have at least one column');
      return;
    }
    const updatedColumns = newTable.columns.filter((_, i) => i !== index);
    setNewTable({ ...newTable, columns: updatedColumns });
  };

  const createTable = () => {
    if (!newTable.name || !newTable.name.trim()) {
      alert('Please provide a table name');
      return;
    }

    const validColumns = newTable.columns.filter(c => c.name && c.name.trim());
    if (validColumns.length === 0) {
      alert('Please provide at least one column with a name');
      return;
    }

    const hasPrimaryKey = validColumns.some(c => c.isPrimary);
    if (!hasPrimaryKey) {
      alert('Please designate at least one column as PRIMARY KEY');
      return;
    }

    const newNode = {
      id: `table-${Date.now()}`,
      type: 'tableNode',
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data: { 
        label: newTable.name, 
        columns: validColumns 
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowTableForm(false);
    setNewTable({ name: '', columns: [{ name: '', type: 'VARCHAR(255)', isPrimary: false }] });
    setFeedback('✅ Table added! Review your design and click "Generate SQL"');
  };

  const generateSQL = () => {
    if (nodes.length === 0) {
      setFeedback('⚠️ Please create at least one table first');
      return;
    }

    let sql = '-- DDL: Table Creation\n\n';
    
    nodes.forEach(node => {
      const tableName = node.data.label;
      const columns = node.data.columns;
      
      sql += `CREATE TABLE ${tableName} (\n`;
      sql += columns.map(col => {
        let colDef = `  ${col.name} ${col.type}`;
        if (col.isPrimary) colDef += ' PRIMARY KEY';
        return colDef;
      }).join(',\n');
      sql += '\n);\n\n';
    });

    setSqlGenerated(sql);
    setFeedback('✅ SQL generated! Click "Execute DDL" to create tables.');
    return sql;
  };

  const executeDDL = () => {
    if (!db) {
      alert('Database not initialized. Please refresh the page.');
      return;
    }

    if (!sqlGenerated) {
      const sql = generateSQL();
      if (!sql || sql.includes('No tables')) return;
    }

    try {
      // Clear existing tables
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (tables[0]) {
        tables[0].values.forEach(([tableName]) => {
          db.run(`DROP TABLE IF EXISTS ${tableName}`);
        });
      }

      // Execute DDL
      const statements = sqlGenerated.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement);
        }
      });

      setTableCreated(true);
      setDataSeeded(false);
      setFeedback('✅ Tables created successfully! Now click "Seed Data" to insert test data.');
      checkDesignStep();
    } catch (error) {
      setFeedback(`❌ DDL Error: ${error.message}`);
      console.error('DDL execution error:', error);
    }
  };

  const seedData = () => {
    if (!db || !tableCreated) {
      alert('Please execute DDL first to create tables');
      return;
    }

    const step = problem.steps[currentStep];
    if (!step.seedData) {
      setFeedback('⚠️ No seed data available for this step');
      return;
    }

    try {
      // Clear existing data
      db.run('DELETE FROM users');

      // Insert seed data
      const columns = Object.keys(step.seedData[0]);
      const insertSQL = `INSERT INTO users (${columns.join(', ')}) VALUES (?, ?, ?, ?)`;
      
      step.seedData.forEach(row => {
        db.run(insertSQL, [row.id, row.name, row.email, row.password]);
      });

      setDataSeeded(true);
      setFeedback(`✅ Seeded ${step.seedData.length} records! Now write your query to retrieve the data.`);
    } catch (error) {
      setFeedback(`❌ Seed Error: ${error.message}. Make sure your table structure is correct.`);
      console.error('Seed error:', error);
    }
  };

  const checkDesignStep = () => {
    const step = problem.steps[currentStep];
    if (step.type !== 'design') return;

    const tableNames = nodes.map(n => n.data.label.toLowerCase());
    const expectedTableName = step.expectedStructure.tableName.toLowerCase();
    
    // Check if table exists
    if (!tableNames.includes(expectedTableName)) {
      setScore(0);
      setFeedback(`❌ Table '${step.expectedStructure.tableName}' not found. Please create it.`);
      return;
    }

    // Check columns
    const userTable = nodes.find(n => n.data.label.toLowerCase() === expectedTableName);
    const userColumns = userTable.data.columns.map(c => c.name.toLowerCase());
    const requiredColumns = step.expectedStructure.requiredColumns.map(c => c.toLowerCase());
    
    const foundColumns = requiredColumns.filter(col => userColumns.includes(col));
    const columnScore = (foundColumns.length / requiredColumns.length) * 100;

    setScore(Math.round(columnScore));
    
    if (columnScore >= 100) {
      setFeedback(`🎉 Perfect! All required columns present. Click "Seed Data" to continue.`);
    } else {
      const missing = requiredColumns.filter(col => !userColumns.includes(col));
      setFeedback(`⚠️ Score: ${Math.round(columnScore)}%. Missing columns: ${missing.join(', ')}`);
    }
  };

  const runQuery = () => {
    if (!db || !tableCreated) {
      alert('Please execute DDL first to create tables');
      return;
    }

    if (!dataSeeded) {
      alert('Please seed data first before running queries');
      return;
    }

    if (!userQuery.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    try {
      const result = db.exec(userQuery);
      setQueryResult(result);

      const step = problem.steps[currentStep];
      if (step.type === 'query' && step.expectedOutput) {
        // Compare actual output with expected output
        const matchResult = compareQueryOutput(result, step.expectedOutput);
        
        setScore(matchResult.score);
        const earnedPoints = Math.round((matchResult.score / 100) * step.points);
        
        if (matchResult.score === 100) {
          setTotalScore(prev => prev + step.points);
          setFeedback(`🎉 Perfect! 100% match! Earned ${step.points} points. ${matchResult.message}`);
        } else if (matchResult.score >= 70) {
          setTotalScore(prev => prev + earnedPoints);
          setFeedback(`✅ Good! ${matchResult.score}% match. Earned ${earnedPoints}/${step.points} points. ${matchResult.message}`);
        } else {
          setFeedback(`❌ ${matchResult.score}% match. ${matchResult.message}`);
        }
      } else {
        setFeedback('✅ Query executed successfully!');
      }
    } catch (error) {
      setQueryResult(null);
      setFeedback(`❌ SQL Error: ${error.message}`);
      setScore(0);
    }
  };

  const compareQueryOutput = (actualResult, expectedOutput) => {
    if (!actualResult || actualResult.length === 0) {
      if (expectedOutput.length === 0) {
        return { score: 100, message: 'Both queries returned no results' };
      }
      return { score: 0, message: 'Your query returned no results' };
    }

    const actual = actualResult[0].values;
    
    // Check row count
    if (actual.length !== expectedOutput.length) {
      const rowScore = Math.max(0, 100 - Math.abs(actual.length - expectedOutput.length) * 20);
      return { 
        score: Math.round(rowScore), 
        message: `Row count mismatch: got ${actual.length}, expected ${expectedOutput.length}` 
      };
    }

    // Compare each row
    let matchingRows = 0;
    let totalCells = 0;
    let matchingCells = 0;

    for (let i = 0; i < expectedOutput.length; i++) {
      const expectedRow = expectedOutput[i];
      const actualRow = actual.find(row => {
        // Try to match by first column (usually ID)
        return row[0] === expectedRow[0];
      });

      if (!actualRow) continue;

      let rowMatch = true;
      for (let j = 0; j < expectedRow.length; j++) {
        totalCells++;
        const expected = String(expectedRow[j]).toLowerCase().trim();
        const actual = String(actualRow[j]).toLowerCase().trim();
        
        if (expected === actual) {
          matchingCells++;
        } else {
          rowMatch = false;
        }
      }

      if (rowMatch) matchingRows++;
    }

    const score = Math.round((matchingCells / totalCells) * 100);
    
    if (score === 100) {
      return { score: 100, message: 'Perfect match!' };
    } else if (score >= 80) {
      return { score, message: `${matchingRows}/${expectedOutput.length} rows match perfectly` };
    } else {
      return { score, message: `${matchingCells}/${totalCells} cells match. Check your WHERE clause.` };
    }
  };

  const nextStep = () => {
    if (currentStep < problem.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setUserQuery('');
      setQueryResult(null);
      setFeedback('');
      setScore(0);
      setDataSeeded(false);
      
      // Re-seed data for next step if needed
      const nextStepData = problem.steps[currentStep + 1];
      if (nextStepData.type === 'query' && nextStepData.seedData) {
        setTimeout(() => {
          setFeedback('Click "Seed Data" to load test data for this query step.');
        }, 500);
      }
    } else {
      setFeedback(`🎊 Challenge Complete! Final Score: ${totalScore}/${maxTotalScore} points (${Math.round((totalScore/maxTotalScore)*100)}%)`);
    }
  };

  const resetProblem = () => {
    setNodes([]);
    setEdges([]);
    setCurrentStep(0);
    setUserQuery('');
    setQueryResult(null);
    setScore(0);
    setTotalScore(0);
    setFeedback('');
    setSqlGenerated('');
    setTableCreated(false);
    setDataSeeded(false);
    
    if (db) {
      try {
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        if (tables[0]) {
          tables[0].values.forEach(([tableName]) => {
            db.run(`DROP TABLE IF EXISTS ${tableName}`);
          });
        }
      } catch (e) {
        console.error('Error clearing tables:', e);
      }
    }
  };

  const currentStepData = problem.steps[currentStep];

  if (sqlLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SQL Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{problem.title}</h1>
          <p className="text-gray-600 mb-4">{problem.description}</p>
          
          {/* Requirements Section */}
          <div className="mb-4 bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Requirements
            </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              {problem.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hints Section */}
          {currentStepData.type === 'design' && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h3 className="font-semibold text-yellow-900 mb-2">💡 Hints</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {problem.hints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Current Step */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Step {currentStep + 1} of {problem.steps.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Score: {totalScore}/{maxTotalScore}
              </span>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">
                {currentStepData.type === 'design' ? '📐 ' : '💻 '}
                {currentStepData.title}
              </h3>
              <p className="text-gray-700 text-sm">{currentStepData.instruction}</p>
              {currentStepData.points && (
                <p className="text-blue-600 text-xs mt-2 font-semibold">Points: {currentStepData.points}</p>
              )}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded mb-4 text-sm ${
              feedback.includes('✅') || feedback.includes('🎉') 
                ? 'bg-green-50 border-l-4 border-green-500 text-green-800' 
                : feedback.includes('❌') 
                ? 'bg-red-50 border-l-4 border-red-500 text-red-800'
                : 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
            }`}>
              {feedback}
            </div>
          )}

          {/* Design Step Actions */}
          {currentStepData.type === 'design' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowTableForm(!showTableForm)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Table
              </button>

              {nodes.length > 0 && (
                <>
                  <button
                    onClick={generateSQL}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Database size={20} />
                    Generate SQL
                  </button>
                  
                  <button
                    onClick={executeDDL}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={20} />
                    Execute DDL
                  </button>

                  {tableCreated && (
                    <button
                      onClick={seedData}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <Database size={20} />
                      Seed Data
                    </button>
                  )}
                </>
              )}

              {score >= 100 && tableCreated && dataSeeded && (
                <button
                  onClick={nextStep}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors font-semibold"
                >
                  <Check size={20} />
                  Next Step →
                </button>
              )}
            </div>
          )}

          {/* Query Step Actions */}
          {currentStepData.type === 'query' && (
            <div className="space-y-3">
              {!dataSeeded && (
                <button
                  onClick={seedData}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <Database size={20} />
                  Seed Data
                </button>
              )}

              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Write your SQL query here...&#10;Example: SELECT * FROM users"
                className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!dataSeeded}
              />
              
              <button
                onClick={runQuery}
                disabled={!dataSeeded}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={20} />
                Run Query
              </button>

              {score >= 70 && (
                <button
                  onClick={nextStep}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors font-semibold"
                >
                  {currentStep < problem.steps.length - 1 ? '➡️ Next Step' : '🏁 Complete'}
                </button>
              )}
            </div>
          )}

          <button
            onClick={resetProblem}
            className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            🔄 Reset Challenge
          </button>

          {/* Generated SQL Display */}
          {sqlGenerated && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-sm">Generated DDL:</h3>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-48">
                {sqlGenerated}
              </pre>
            </div>
          )}

          {/* Query Results Display */}
          {queryResult && queryResult.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-sm">Query Results:</h3>
              <div className="overflow-x-auto max-h-64 border border-gray-300 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {queryResult[0].columns.map((col, i) => (
                        <th key={i} className="border border-gray-300 px-3 py-2 text-left font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult[0].values.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-gray-300 px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {queryResult && queryResult.length === 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-center text-gray-600 text-sm">
              Query executed (0 rows)
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background color="#ddd" gap={16} />
          <Controls />
        </ReactFlow>

        {nodes.length === 0 && !showTableForm && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <Database size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Click "Add Table" to start designing</p>
              <p className="text-sm mt-2">Follow the requirements on the left</p>
            </div>
          </div>
        )}

        {/* Table Creation Form Modal */}
        {showTableForm && (
          <div className="absolute top-4 left-4 bg-white p-6 rounded-lg shadow-2xl border-2 border-blue-500 z-10 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Database size={20} />
              Create New Table
            </h3>
            
            <input
              type="text"
              placeholder="Table Name (e.g., users)"
              value={newTable.name}
              onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Columns:</p>
              {newTable.columns.map((col, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                  <input
                    type="text"
                    placeholder="Column name"
                    value={col.name}
                    onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm w-32"
                  >
                    <option value="INT">INT</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DATE">DATE</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={col.isPrimary}
                      onChange={(e) => updateColumn(idx, 'isPrimary', e.target.checked)}
                      className="w-4 h-4"
                    />
                    PK
                  </label>
                  {newTable.columns.length > 1 && (
                    <button
                      onClick={() => removeColumn(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove column"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={addColumn}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded text-sm transition-colors"
              >
                + Add Column
              </button>
              <button
                onClick={createTable}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm transition-colors"
              >
                ✓ Create
              </button>
              <button
                onClick={() => setShowTableForm(false)}
                className="px-4 bg-gray-300 hover:bg-gray-400 py-2 rounded text-sm transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      {score > 0 && (
        <div className="absolute top-4 right-4 bg-white px-6 py-3 rounded-lg shadow-xl border-2 border-green-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{score}%</div>
            <div className="text-sm text-gray-600">Step Score</div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-300">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-1">
            {problem.steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-2 rounded ${
                  idx < currentStep
                    ? 'bg-green-500'
                    : idx === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-600 font-medium">
            {currentStep + 1}/{problem.steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}