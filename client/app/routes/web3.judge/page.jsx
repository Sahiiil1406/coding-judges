import React, { useState, useEffect } from 'react';
import { FileCode, Play, CheckCircle, XCircle, AlertTriangle, Code2, Terminal, Download } from 'lucide-react';

const SolidityIDEWithRemix = () => {
  const [code, setCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    
    event ValueUpdated(uint256 newValue, address updatedBy);
    
    constructor() {
        owner = msg.sender;
    }
    
    function set(uint256 value) public {
        storedValue = value;
        emit ValueUpdated(value, msg.sender);
    }
    
    function get() public view returns (uint256) {
        return storedValue;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
}`);

  const [compilerVersion, setCompilerVersion] = useState('v0.8.17+commit.8df45f5f');
  const [compiling, setCompiling] = useState(false);
  const [compiledData, setCompiledData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [output, setOutput] = useState([]);
  const [compilerReady, setCompilerReady] = useState(false);

  useEffect(() => {
    addOutput('Initializing compiler...', 'info');
  }, []);

  const addOutput = (message, type = 'info') => {
    setOutput(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const compile = async () => {
    setCompiling(true);
    setErrors([]);
    setWarnings([]);
    setCompiledData(null);
    addOutput('Starting compilation...', 'info');

    try {
      // Create input for the compiler
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: code
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata', 'storageLayout']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };

      // Use solc-js via CDN with worker
      addOutput('Loading compiler (this may take a moment)...', 'info');
      
      // Import solc dynamically
      const solcScript = document.createElement('script');
      solcScript.src = `https://binaries.soliditylang.org/bin/soljson-${compilerVersion}.js`;
      
      await new Promise((resolve, reject) => {
        solcScript.onload = resolve;
        solcScript.onerror = reject;
        document.head.appendChild(solcScript);
      });

      addOutput('Compiler loaded, compiling contract...', 'info');

      // Wait a bit for the module to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!window.Module) {
        throw new Error('Compiler module not available');
      }

      // Compile using the standard JSON input/output
      const wrapper = window.Module.cwrap('solidity_compile', 'string', ['string', 'number']);
      const outputJson = wrapper(JSON.stringify(input), 0);
      const output = JSON.parse(outputJson);

      // Clean up script
      document.head.removeChild(solcScript);

      if (output.errors) {
        const errorList = output.errors.filter(e => e.severity === 'error');
        const warningList = output.errors.filter(e => e.severity === 'warning');
        
        if (errorList.length > 0) {
          setErrors(errorList);
          errorList.forEach(err => {
            const msg = err.formattedMessage || err.message;
            addOutput(msg, 'error');
          });
          setCompiling(false);
          return;
        }
        
        if (warningList.length > 0) {
          setWarnings(warningList);
          warningList.forEach(warn => {
            const msg = warn.formattedMessage || warn.message;
            addOutput(msg, 'warning');
          });
        }
      }

      if (output.contracts && output.contracts['contract.sol']) {
        const contractName = Object.keys(output.contracts['contract.sol'])[0];
        const contract = output.contracts['contract.sol'][contractName];
        
        setCompiledData({
          name: contractName,
          abi: contract.abi,
          bytecode: contract.evm.bytecode.object,
          deployedBytecode: contract.evm.deployedBytecode.object,
          metadata: contract.metadata
        });
        
        addOutput(`✓ Compilation successful: ${contractName}`, 'success');
        addOutput(`Bytecode size: ${contract.evm.bytecode.object.length / 2} bytes`, 'info');
        addOutput(`Functions: ${contract.abi.filter(i => i.type === 'function').length}`, 'info');
        setCompilerReady(true);
      }

    } catch (err) {
      addOutput(`Compilation error: ${err.message}`, 'error');
      setErrors([{ formattedMessage: err.message }]);
    }

    setCompiling(false);
  };

  const analyzeContract = () => {
    if (!compiledData) {
      addOutput('Please compile the contract first', 'warning');
      return;
    }

    addOutput('Running static analysis...', 'info');
    
    const issues = [];
    
    // Simple static analysis checks
    if (code.includes('tx.origin')) {
      issues.push({
        severity: 'warning',
        message: 'Use of tx.origin: Use msg.sender instead of tx.origin to prevent authorization attacks'
      });
    }
    
    if (code.includes('block.timestamp') || code.includes('now')) {
      issues.push({
        severity: 'info',
        message: 'Timestamp dependence: Be aware that block.timestamp can be manipulated by miners'
      });
    }
    
    if (code.match(/selfdestruct|suicide/)) {
      issues.push({
        severity: 'warning',
        message: 'Use of selfdestruct: This permanently destroys the contract'
      });
    }
    
    if (code.includes('.call(') || code.includes('.delegatecall(')) {
      issues.push({
        severity: 'warning',
        message: 'Low-level call detected: Ensure proper error handling and reentrancy protection'
      });
    }
    
    if (!code.includes('// SPDX-License-Identifier')) {
      issues.push({
        severity: 'warning',
        message: 'Missing SPDX license identifier'
      });
    }

    const hasReentrancyGuard = code.includes('nonReentrant') || code.includes('ReentrancyGuard');
    if ((code.includes('.call') || code.includes('.transfer') || code.includes('.send')) && !hasReentrancyGuard) {
      issues.push({
        severity: 'warning',
        message: 'Potential reentrancy vulnerability: Consider using a reentrancy guard'
      });
    }
    
    if (issues.length === 0) {
      addOutput('✓ No major issues found in static analysis', 'success');
    } else {
      addOutput(`Found ${issues.length} potential issue(s)`, 'warning');
      issues.forEach(issue => {
        addOutput(`[${issue.severity.toUpperCase()}] ${issue.message}`, issue.severity);
      });
    }
  };

  const downloadABI = () => {
    if (!compiledData) return;
    
    const blob = new Blob([JSON.stringify(compiledData.abi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compiledData.name}_abi.json`;
    a.click();
    URL.revokeObjectURL(url);
    addOutput(`Downloaded ABI for ${compiledData.name}`, 'success');
  };

  const downloadBytecode = () => {
    if (!compiledData) return;
    
    const blob = new Blob([compiledData.bytecode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compiledData.name}_bytecode.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addOutput(`Downloaded bytecode for ${compiledData.name}`, 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Code2 className="text-purple-400" size={40} />
            Solidity IDE
          </h1>
          <p className="text-purple-200">Compile and Analyze Solidity Smart Contracts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg shadow-2xl border border-purple-500/30 overflow-hidden">
              <div className="bg-slate-700 px-4 py-3 flex items-center justify-between border-b border-purple-500/30 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <FileCode className="text-purple-400" size={20} />
                  <span className="text-white font-semibold">contract.sol</span>
                  <select
                    value={compilerVersion}
                    onChange={(e) => setCompilerVersion(e.target.value)}
                    className="bg-slate-600 text-white px-3 py-1 rounded text-sm border border-slate-500"
                  >
                    <option value="v0.8.17+commit.8df45f5f">v0.8.17</option>
                    <option value="v0.8.20+commit.a1b79de6">v0.8.20</option>
                    <option value="v0.8.19+commit.7dd6d404">v0.8.19</option>
                    <option value="v0.8.18+commit.87f61d96">v0.8.18</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={compile}
                    disabled={compiling}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Play size={16} />
                    {compiling ? 'Compiling...' : 'Compile'}
                  </button>
                  <button
                    onClick={analyzeContract}
                    disabled={!compiledData}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <AlertTriangle size={16} />
                    Analyze
                  </button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-slate-900 text-green-400 font-mono text-sm p-4 focus:outline-none resize-none"
                spellCheck="false"
                placeholder="Write your Solidity code here..."
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg shadow-2xl border border-purple-500/30 h-full">
              <div className="bg-slate-700 px-4 py-3 border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Terminal className="text-purple-400" size={20} />
                  <span className="text-white font-semibold">Console Output</span>
                </div>
              </div>
              <div className="h-96 overflow-y-auto p-4 space-y-2">
                {output.map((log, idx) => (
                  <div
                    key={idx}
                    className={`text-xs font-mono p-2 rounded ${
                      log.type === 'success'
                        ? 'bg-green-950/50 text-green-400'
                        : log.type === 'error'
                        ? 'bg-red-950/50 text-red-400'
                        : log.type === 'warning'
                        ? 'bg-yellow-950/50 text-yellow-400'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 mr-2">{log.timestamp}</span>
                    <div className="whitespace-pre-wrap break-words">{log.message}</div>
                  </div>
                ))}
                {output.length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-8">
                    Console output will appear here...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <XCircle size={20} />
                Compilation Errors ({errors.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errors.map((err, idx) => (
                  <pre key={idx} className="text-xs text-red-300 bg-red-950/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {err.formattedMessage || err.message}
                  </pre>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="bg-yellow-950/30 border border-yellow-500/50 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Warnings ({warnings.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {warnings.map((warn, idx) => (
                  <pre key={idx} className="text-xs text-yellow-300 bg-yellow-950/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {warn.formattedMessage || warn.message}
                  </pre>
                ))}
              </div>
            </div>
          )}

          {compiledData && (
            <div className="bg-green-950/30 border border-green-500/50 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Compilation Success
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-slate-900/50 p-3 rounded">
                  <p className="text-slate-400 mb-1">Contract Name:</p>
                  <p className="text-white font-mono">{compiledData.name}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded">
                  <p className="text-slate-400 mb-1">ABI Functions:</p>
                  <p className="text-white font-mono">{compiledData.abi.filter(i => i.type === 'function').length} functions</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded">
                  <p className="text-slate-400 mb-1">Bytecode Size:</p>
                  <p className="text-white font-mono">{compiledData.bytecode.length / 2} bytes</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={downloadABI}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Download size={16} />
                    ABI
                  </button>
                  <button
                    onClick={downloadBytecode}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Download size={16} />
                    Bytecode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-950/30 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">About This IDE</h3>
          <p className="text-slate-300 text-sm mb-2">This IDE uses the official Solidity compiler (solc-js) loaded dynamically from binaries.soliditylang.org</p>
          <ul className="text-slate-400 text-xs space-y-1">
            <li>• Full Solidity compilation support</li>
            <li>• Multiple compiler versions available</li>
            <li>• Built-in static analysis</li>
            <li>• Download ABI and bytecode</li>
            <li>• Optimization enabled (200 runs)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SolidityIDEWithRemix;