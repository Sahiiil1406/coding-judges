import React, { useState, useCallback } from 'react';
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
import { Database, Play, Plus, Trash2, X, AlertCircle, BookOpen, Trophy, RefreshCw, Code } from 'lucide-react';

// ==================== SQL ENGINE ====================
class SimpleDB {
  constructor() {
    this.tables = {};
  }

  run(sql) {
    const normalized = sql.trim().toLowerCase();
    
    if (normalized.startsWith('create table')) {
      const match = sql.match(/create table (\w+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        this.tables[tableName] = [];
      }
    } else if (normalized.startsWith('drop table')) {
      const match = sql.match(/drop table(?: if exists)? (\w+)/i);
      if (match) {
        delete this.tables[match[1].toLowerCase()];
      }
    } else if (normalized.startsWith('delete from')) {
      const match = sql.match(/delete from (\w+)/i);
      if (match) {
        this.tables[match[1].toLowerCase()] = [];
      }
    } else if (normalized.startsWith('insert into')) {
      const tableMatch = sql.match(/insert into (\w+)/i);
      const tableName = tableMatch[1].toLowerCase();
      
      const valuesMatch = sql.match(/values\s*\((.*?)\)/i);
      if (valuesMatch && this.tables[tableName]) {
        const values = valuesMatch[1].split(',').map(v => {
          v = v.trim();
          if (v.startsWith("'") && v.endsWith("'")) {
            return v.slice(1, -1);
          }
          return isNaN(v) ? v : Number(v);
        });
        this.tables[tableName].push(values);
      }
    }
  }

  exec(sql) {
    const normalized = sql.trim().toLowerCase();
    
    if (normalized.startsWith('select')) {
      const fromMatch = sql.match(/from\s+(\w+)/i);
      if (!fromMatch) return [];
      
      const tableName = fromMatch[1].toLowerCase();
      const table = this.tables[tableName] || [];
      
      let filteredData = [...table];
      const whereMatch = sql.match(/where\s+(.+?)(?:$|order|limit|group)/i);
      if (whereMatch) {
        const condition = whereMatch[1].trim();
        filteredData = this.filterData(filteredData, condition);
      }
      
      if (normalized.includes('count(*)')) {
        return [{
          columns: ['COUNT(*)'],
          values: [[filteredData.length]]
        }];
      }
      
      if (normalized.includes('group by')) {
        const groupMatch = sql.match(/group by\s+(\w+)/i);
        if (groupMatch && normalized.includes('count(*)')) {
          const groupCol = groupMatch[1].toLowerCase();
          const colIndex = this.getColumnIndex(tableName, groupCol);
          
          const grouped = {};
          filteredData.forEach(row => {
            const key = row[colIndex];
            grouped[key] = (grouped[key] || 0) + 1;
          });
          
          return [{
            columns: [groupCol, 'COUNT(*)'],
            values: Object.entries(grouped).map(([k, v]) => [k, v])
          }];
        }
      }
      
      const columns = this.getTableColumns(tableName);
      
      return [{
        columns: columns,
        values: filteredData
      }];
    }
    
    return [];
  }

  execRawQuery(sql) {
    return this.exec(sql);
  }

  filterData(data, condition) {
    if (condition.includes('like')) {
      const match = condition.match(/(\w+)\s+like\s+'([^']+)'/i);
      if (match) {
        const pattern = match[2].replace(/%/g, '.*');
        const regex = new RegExp(pattern, 'i');
        
        return data.filter(row => {
          return row.some(cell => regex.test(String(cell)));
        });
      }
    }
    
    if (condition.includes('=')) {
      const match = condition.match(/(\w+)\s*=\s*'([^']+)'/i);
      if (match) {
        const value = match[2];
        return data.filter(row => {
          return row.some(cell => String(cell) === value);
        });
      }
      
      const numMatch = condition.match(/(\w+)\s*=\s*(\d+)/i);
      if (numMatch) {
        const value = Number(numMatch[2]);
        return data.filter(row => row[0] === value);
      }
    }
    
    if (condition.includes('>')) {
      const match = condition.match(/(\w+)\s*>\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        const threshold = Number(match[2]);
        return data.filter(row => {
          const value = row[row.length - 1];
          return Number(value) > threshold;
        });
      }
    }
    
    return data;
  }

  getTableColumns(tableName) {
    if (tableName === 'users') {
      return ['id', 'name', 'email', 'password'];
    } else if (tableName === 'customers') {
      return ['id', 'name', 'email'];
    } else if (tableName === 'orders') {
      return ['id', 'customer_id', 'order_date', 'total'];
    } else if (tableName === 'posts') {
      return ['id', 'author_id', 'content', 'created_at'];
    } else if (tableName === 'likes') {
      return ['id', 'user_id', 'post_id'];
    }
    return ['col1', 'col2', 'col3'];
  }

  getColumnIndex(tableName, columnName) {
    const cols = this.getTableColumns(tableName);
    return cols.indexOf(columnName.toLowerCase());
  }

  getTableNames() {
    return Object.keys(this.tables);
  }
}

// ==================== PROBLEM DEFINITIONS ====================
const PROBLEMS = [
  {
    id: 1,
    title: "User Authentication System",
    difficulty: "Easy",
    description: "Design a user authentication database with proper schema and query capabilities",
    requirements: [
      "Create a 'users' table with id, name, email, and password columns",
      "The id column should be the primary key",
      "Store user's full name for display purposes",
      "Email should be used for login authentication",
      "Password field for secure authentication"
    ],
    hints: [
      "Start by clicking 'Add Table' to create the users table",
      "Use INT for id, VARCHAR(255) for text fields",
      "Mark id as Primary Key (PK)",
      "Make sure all required columns are present"
    ],
    testCases: [
      {
        name: "Schema Validation",
        type: "schema",
        description: "Verify users table has all required columns",
        expectedTables: [
          {
            name: "users",
            columns: ["id", "name", "email", "password"]
          }
        ],
        points: 30
      },
      {
        name: "Get All Users",
        type: "query",
        description: "SELECT * FROM users",
        query: "SELECT * FROM users",
        seedData: [
          [1, 'Alice Johnson', 'alice@gmail.com', 'alice123'],
          [2, 'Bob Smith', 'bob@yahoo.com', 'bob456'],
          [3, 'Charlie Brown', 'charlie@gmail.com', 'charlie789'],
          [4, 'Diana Prince', 'diana@outlook.com', 'diana321'],
          [5, 'Eve Wilson', 'eve@gmail.com', 'eve654']
        ],
        expectedOutput: [
          [1, 'Alice Johnson', 'alice@gmail.com', 'alice123'],
          [2, 'Bob Smith', 'bob@yahoo.com', 'bob456'],
          [3, 'Charlie Brown', 'charlie@gmail.com', 'charlie789'],
          [4, 'Diana Prince', 'diana@outlook.com', 'diana321'],
          [5, 'Eve Wilson', 'eve@gmail.com', 'eve654']
        ],
        points: 15
      },
      {
        name: "Find Gmail Users",
        type: "query",
        description: "SELECT * FROM users WHERE email LIKE '%gmail.com%'",
        query: "SELECT * FROM users WHERE email LIKE '%gmail.com%'",
        expectedOutput: [
          [1, 'Alice Johnson', 'alice@gmail.com', 'alice123'],
          [3, 'Charlie Brown', 'charlie@gmail.com', 'charlie789'],
          [5, 'Eve Wilson', 'eve@gmail.com', 'eve654']
        ],
        points: 20
      },
      {
        name: "Get Specific User",
        type: "query",
        description: "SELECT * FROM users WHERE email = 'bob@yahoo.com'",
        query: "SELECT * FROM users WHERE email = 'bob@yahoo.com'",
        expectedOutput: [
          [2, 'Bob Smith', 'bob@yahoo.com', 'bob456']
        ],
        points: 15
      },
      {
        name: "Count Total Users",
        type: "query",
        description: "SELECT COUNT(*) FROM users",
        query: "SELECT COUNT(*) FROM users",
        expectedOutput: [[5]],
        points: 20
      }
    ]
  },
  {
    id: 2,
    title: "E-Commerce Order System",
    difficulty: "Medium",
    description: "Design a two-table database system for tracking customer orders",
    requirements: [
      "Create a 'customers' table with id, name, and email",
      "Create an 'orders' table with id, customer_id, order_date, and total",
      "Link orders to customers using customer_id as foreign key",
      "Support tracking order dates and monetary totals"
    ],
    hints: [
      "You need two separate tables",
      "The orders.customer_id should reference customers.id",
      "Mark customer_id in orders as a Foreign Key (FK)",
      "Use DECIMAL type for monetary values"
    ],
    testCases: [
      {
        name: "Schema Validation",
        type: "schema",
        description: "Verify both customers and orders tables exist with correct structure",
        expectedTables: [
          {
            name: "customers",
            columns: ["id", "name", "email"]
          },
          {
            name: "orders",
            columns: ["id", "customer_id", "order_date", "total"]
          }
        ],
        points: 40
      },
      {
        name: "Get All Customers",
        type: "query",
        description: "SELECT * FROM customers",
        query: "SELECT * FROM customers",
        seedData: {
          customers: [
            [1, 'John Doe', 'john@example.com'],
            [2, 'Jane Smith', 'jane@example.com'],
            [3, 'Bob Wilson', 'bob@example.com']
          ],
          orders: [
            [1, 1, '2024-01-15', 99.99],
            [2, 1, '2024-02-20', 149.50],
            [3, 2, '2024-01-10', 299.99],
            [4, 3, '2024-03-05', 49.99]
          ]
        },
        expectedOutput: [
          [1, 'John Doe', 'john@example.com'],
          [2, 'Jane Smith', 'jane@example.com'],
          [3, 'Bob Wilson', 'bob@example.com']
        ],
        points: 20
      },
      {
        name: "Find High Value Orders",
        type: "query",
        description: "SELECT * FROM orders WHERE total > 100",
        query: "SELECT * FROM orders WHERE total > 100",
        expectedOutput: [
          [2, 1, '2024-02-20', 149.50],
          [3, 2, '2024-01-10', 299.99]
        ],
        points: 20
      },
      {
        name: "Count Total Orders",
        type: "query",
        description: "SELECT COUNT(*) FROM orders",
        query: "SELECT COUNT(*) FROM orders",
        expectedOutput: [[4]],
        points: 20
      }
    ]
  }
];

// ==================== CUSTOM TABLE NODE ====================
const TableNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg min-w-[220px]">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 font-bold rounded-t-lg flex items-center gap-2">
        <Database size={18} />
        <span className="text-lg">{data.label}</span>
      </div>
      <div className="p-3">
        {data.columns?.map((col, idx) => (
          <div key={idx} className="py-2 px-3 text-sm border-b last:border-b-0 flex items-center gap-2 hover:bg-gray-50">
            {col.isPrimary && <span className="text-yellow-500 text-lg">🔑</span>}
            {col.isForeign && <span className="text-purple-500 text-lg">🔗</span>}
            <span className="font-semibold text-gray-800">{col.name}</span>
            <span className="text-gray-500 text-xs ml-auto">({col.type})</span>
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

// ==================== MAIN COMPONENT ====================
export default function SQLLearningPlatform() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [db] = useState(() => new SimpleDB());
  
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showProblemList, setShowProblemList] = useState(true);
  
  const [testResults, setTestResults] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  
  const [feedback, setFeedback] = useState('');
  const [showTableForm, setShowTableForm] = useState(false);
  const [newTable, setNewTable] = useState({ 
    name: '', 
    columns: [{ name: '', type: 'VARCHAR(255)', isPrimary: false, isForeign: false }] 
  });
  const [sqlGenerated, setSqlGenerated] = useState('');

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const selectProblem = (problem) => {
    setSelectedProblem(problem);
    setShowProblemList(false);
    setNodes([]);
    setEdges([]);
    setTestResults([]);
    setTotalScore(0);
    setFeedback('');
    setSqlGenerated('');
    setUserQuery('');
    setQueryResult(null);
  };

  const addColumn = () => {
    setNewTable({
      ...newTable,
      columns: [...newTable.columns, { name: '', type: 'VARCHAR(255)', isPrimary: false, isForeign: false }]
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
      position: { x: 100 + nodes.length * 280, y: 100 + nodes.length * 50 },
      data: { 
        label: newTable.name, 
        columns: validColumns 
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowTableForm(false);
    setNewTable({ name: '', columns: [{ name: '', type: 'VARCHAR(255)', isPrimary: false, isForeign: false }] });
    setFeedback('✅ Table added! Continue designing or click "Run All Tests"');
  };

  const generateSQL = () => {
    if (nodes.length === 0) {
      return '';
    }

    let sql = '-- Database Schema\n\n';
    
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

    return sql;
  };

  const runAllTests = async () => {
    if (nodes.length === 0) {
      setFeedback('⚠️ Please design your database schema first by adding tables');
      return;
    }

    setTestResults([]);
    setTotalScore(0);
    setFeedback('🧪 Running tests...');

    const results = [];
    let score = 0;

    const ddl = generateSQL();
    setSqlGenerated(ddl);

    try {
      db.getTableNames().forEach(tableName => {
        db.run(`DROP TABLE IF EXISTS ${tableName}`);
      });

      const statements = ddl.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement);
        }
      });

      for (let i = 0; i < selectedProblem.testCases.length; i++) {
        const testCase = selectedProblem.testCases[i];
        const result = await runTestCase(testCase);
        results.push(result);
        if (result.passed) {
          score += testCase.points;
        }
      }

      setTestResults(results);
      setTotalScore(score);
      
      const maxScore = selectedProblem.testCases.reduce((sum, tc) => sum + tc.points, 0);
      const percentage = Math.round((score / maxScore) * 100);
      
      if (percentage === 100) {
        setFeedback(`🎉 Perfect! All tests passed! Score: ${score}/${maxScore} (${percentage}%)`);
      } else if (percentage >= 70) {
        setFeedback(`✅ Good job! Score: ${score}/${maxScore} (${percentage}%). Check failed tests below.`);
      } else {
        setFeedback(`❌ Some tests failed. Score: ${score}/${maxScore} (${percentage}%). Review feedback and try again.`);
      }
    } catch (error) {
      setFeedback(`❌ Error running tests: ${error.message}`);
      console.error('Test execution error:', error);
    }
  };

  const runTestCase = async (testCase) => {
    try {
      if (testCase.type === 'schema') {
        return validateSchema(testCase);
      } else if (testCase.type === 'query') {
        return await validateQuery(testCase);
      }
    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        message: `Error: ${error.message}`,
        points: 0,
        maxPoints: testCase.points,
        query: testCase.query
      };
    }
  };

  const validateSchema = (testCase) => {
    const actualTables = nodes.map(n => ({
      name: n.data.label.toLowerCase(),
      columns: n.data.columns.map(c => c.name.toLowerCase())
    }));

    const expectedTables = testCase.expectedTables.map(t => ({
      name: t.name.toLowerCase(),
      columns: t.columns.map(c => c.toLowerCase())
    }));

    let missingTables = [];
    let missingColumns = [];

    expectedTables.forEach(expected => {
      const found = actualTables.find(t => t.name === expected.name);
      if (!found) {
        missingTables.push(expected.name);
      } else {
        expected.columns.forEach(col => {
          if (!found.columns.includes(col)) {
            missingColumns.push(`${expected.name}.${col}`);
          }
        });
      }
    });

    const passed = missingTables.length === 0 && missingColumns.length === 0;
    
    let message = '';
    if (passed) {
      message = '✅ Schema structure is correct!';
    } else {
      if (missingTables.length > 0) {
        message += `Missing tables: ${missingTables.join(', ')}. `;
      }
      if (missingColumns.length > 0) {
        message += `Missing columns: ${missingColumns.join(', ')}`;
      }
    }

    return {
      name: testCase.name,
      passed,
      message,
      points: passed ? testCase.points : 0,
      maxPoints: testCase.points
    };
  };

  const validateQuery = async (testCase) => {
    if (testCase.seedData) {
      try {
        if (Array.isArray(testCase.seedData)) {
          const tableName = nodes[0]?.data.label || 'users';
          db.run(`DELETE FROM ${tableName}`);
          
          testCase.seedData.forEach(row => {
            const values = row.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
            db.run(`INSERT INTO ${tableName} VALUES (${values})`);
          });
        } else {
          for (const [tableName, data] of Object.entries(testCase.seedData)) {
            db.run(`DELETE FROM ${tableName}`);
            
            data.forEach(row => {
              const values = row.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
              db.run(`INSERT INTO ${tableName} VALUES (${values})`);
            });
          }
        }
      } catch (error) {
        return {
          name: testCase.name,
          passed: false,
          message: `❌ Failed to seed data: ${error.message}`,
          points: 0,
          maxPoints: testCase.points,
          query: testCase.query
        };
      }
    }

    try {
      const result = db.execRawQuery(testCase.query);
      const actualOutput = result[0]?.values || [];
      const expectedOutput = testCase.expectedOutput;

      const passed = JSON.stringify(actualOutput) === JSON.stringify(expectedOutput);

      return {
        name: testCase.name,
        passed,
        message: passed 
          ? '✅ Query executed correctly!' 
          : `❌ Expected ${expectedOutput.length} rows but got ${actualOutput.length}`,
        points: passed ? testCase.points : 0,
        maxPoints: testCase.points,
        query: testCase.query
      };
    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        message: `❌ Query error: ${error.message}`,
        points: 0,
        maxPoints: testCase.points,
        query: testCase.query
      };
    }
  };

  const runUserQuery = () => {
    if (!userQuery.trim()) {
      setFeedback('⚠️ Please enter a SQL query');
      return;
    }

    try {
      const result = db.execRawQuery(userQuery);
      setQueryResult(result);
      setFeedback('✅ Query executed successfully!');
    } catch (error) {
      setQueryResult(null);
      setFeedback(`❌ SQL Error: ${error.message}`);
    }
  };

  const resetProblem = () => {
    setNodes([]);
    setEdges([]);
    setTestResults([]);
    setTotalScore(0);
    setFeedback('');
    setSqlGenerated('');
    setUserQuery('');
    setQueryResult(null);
    
    db.getTableNames().forEach(tableName => {
      db.run(`DROP TABLE IF EXISTS ${tableName}`);
    });
  };

  // ==================== PROBLEM LIST SCREEN ====================
  if (showProblemList) {
    const maxScore = (problem) => problem.testCases.reduce((sum, tc) => sum + tc.points, 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-4">
              <Database className="text-blue-600" size={56} />
              SQL Learning Platform
            </h1>
            <p className="text-gray-600 text-xl">Master database design and SQL queries through interactive problems</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {PROBLEMS.map(problem => (
              <div
                key={problem.id}
                className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500"
                onClick={() => selectProblem(problem)}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-gray-600 text-lg font-bold flex items-center gap-1">
                      <Trophy size={20} className="text-yellow-500" />
                      {maxScore(problem)} pts
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{problem.title}</h3>
                  <p className="text-gray-600 mb-6">{problem.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <BookOpen size={18} />
                      <span className="font-medium">{problem.testCases.length} test cases</span>
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-bold text-lg">
                      Start Challenge →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN PROBLEM SOLVING INTERFACE ====================
  const maxPossibleScore = selectedProblem.testCases.reduce((sum, tc) => sum + tc.points, 0);
  const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT PANEL */}
      <div className="w-[420px] bg-white border-r border-gray-300 overflow-y-auto shadow-lg">
        <div className="p-6">
          <button
            onClick={() => setShowProblemList(true)}
            className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-base font-semibold hover:underline"
          >
            ← Back to Problems
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{selectedProblem.title}</h1>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              selectedProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
              selectedProblem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {selectedProblem.difficulty}
            </span>
          </div>

          <p className="text-gray-700 mb-6 text-base leading-relaxed">{selectedProblem.description}</p>
          
          {/* Requirements */}
          <div className="mb-6 bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-lg">
              <AlertCircle size={20} />
              Requirements
            </h3>
            <ul className="text-sm text-purple-800 space-y-2">
              {selectedProblem.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1 font-bold">•</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hints */}
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg">
            <h3 className="font-bold text-yellow-900 mb-3 text-lg">💡 Hints</h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              {selectedProblem.hints.map((hint, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1 font-bold">•</span>
                  <span className="leading-relaxed">{hint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Score Display */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg">Your Score</span>
              <Trophy size={24} />
            </div>
            <div className="text-4xl font-bold mb-2">{totalScore} / {maxPossibleScore}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden mb-2">
              <div 
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <div className="text-sm opacity-90">{scorePercentage}% Complete</div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-lg mb-6 text-base font-medium ${
              feedback.includes('✅') || feedback.includes('🎉') 
                ? 'bg-green-50 border-l-4 border-green-500 text-green-800' 
                : feedback.includes('❌') 
                ? 'bg-red-50 border-l-4 border-red-500 text-red-800'
                : 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
            }`}>
              {feedback}
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Test Results</h3>
              <div className="space-y-3">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      result.passed 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base">
                        {result.passed ? '✅' : '❌'} {result.name}
                      </span>
                      <span className="text-sm font-bold">
                        {result.points}/{result.maxPoints} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                    {result.query && (
                      <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono mt-2">
                        {result.query}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setShowTableForm(!showTableForm)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold text-base shadow-md"
            >
              <Plus size={20} />
              Add Table
            </button>

            {nodes.length > 0 && (
              <button
                onClick={runAllTests}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-base shadow-md"
              >
                <Play size={20} />
                Run All Tests
              </button>
            )}

            <button
              onClick={resetProblem}
              className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold text-base shadow-md"
            >
              <RefreshCw size={20} />
              Reset Problem
            </button>
          </div>

          {/* Practice Query Section */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center gap-2">
              <Code size={20} />
              Practice Queries
            </h3>
            <p className="text-sm text-gray-600 mb-3">Write and test your SQL queries here</p>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Write your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM users&#10;WHERE email LIKE '%gmail.com%'"
              className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 resize-none"
              style={{ lineHeight: '1.6' }}
            />
            <button
              onClick={runUserQuery}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold shadow-md"
            >
              <Play size={20} />
              Execute Query
            </button>
          </div>

          {/* Generated SQL Display */}
          {sqlGenerated && (
            <div className="mt-6">
              <h3 className="font-bold mb-3 text-base">Generated DDL:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64 font-mono leading-relaxed">
                {sqlGenerated}
              </pre>
            </div>
          )}

          {/* Query Results Display */}
          {queryResult && queryResult.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-3 text-base">Query Results:</h3>
              <div className="overflow-x-auto max-h-80 border-2 border-gray-300 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-200 sticky top-0">
                    <tr>
                      {queryResult[0].columns.map((col, i) => (
                        <th key={i} className="border border-gray-400 px-4 py-3 text-left font-bold text-gray-800">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult[0].values.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-gray-300 px-4 py-3 text-gray-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {queryResult && queryResult.length === 0 && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center text-gray-600 font-medium">
              Query executed (0 rows returned)
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - React Flow Canvas */}
      <div className="flex-1 relative bg-gray-100">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
        </ReactFlow>

        {nodes.length === 0 && !showTableForm && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <Database size={80} className="mx-auto mb-6 opacity-20" />
              <p className="text-2xl font-bold mb-2">Design Your Database</p>
              <p className="text-lg">Click "Add Table" to start building your schema</p>
            </div>
          </div>
        )}

        {/* Table Creation Form Modal */}
        {showTableForm && (
          <div className="absolute top-6 left-6 bg-white p-6 rounded-2xl shadow-2xl border-2 border-blue-500 z-10 w-[480px] max-h-[85vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-5 flex items-center gap-2 text-gray-800">
              <Database size={24} />
              Create New Table
            </h3>
            
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Table Name</label>
              <input
                type="text"
                placeholder="e.g., users, orders, customers"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            <div className="mb-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Columns:</p>
              <div className="space-y-3">
                {newTable.columns.map((col, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Column name"
                        value={col.name}
                        onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-base"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-base"
                      >
                        <option value="INT">INT</option>
                        <option value="VARCHAR(255)">VARCHAR(255)</option>
                        <option value="TEXT">TEXT</option>
                        <option value="DATE">DATE</option>
                        <option value="TIMESTAMP">TIMESTAMP</option>
                        <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                      </select>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={col.isPrimary}
                            onChange={(e) => updateColumn(idx, 'isPrimary', e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          Primary Key
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={col.isForeign}
                            onChange={(e) => updateColumn(idx, 'isForeign', e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          Foreign Key
                        </label>
                      </div>
                    </div>
                    {newTable.columns.length > 1 && (
                      <button
                        onClick={() => removeColumn(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                        title="Remove column"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addColumn}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-semibold transition-colors"
              >
                + Add Column
              </button>
              <button
                onClick={createTable}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors"
              >
                ✓ Create Table
              </button>
              <button
                onClick={() => setShowTableForm(false)}
                className="px-5 bg-gray-300 hover:bg-gray-400 py-3 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}