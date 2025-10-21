import React, { useState, useEffect } from "react";
import {
  FileCode,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code2,
  Terminal,
  Download,
} from "lucide-react";
import { fetchAndLoadSolc } from "web-solc"; // WebAssembly-ready compiler loader

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

  const [compilerVersion, setCompilerVersion] = useState("^0.8.20");
  const [compiling, setCompiling] = useState(false);
  const [compiledData, setCompiledData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [output, setOutput] = useState([]);

  const addOutput = (message, type = "info") => {
    setOutput((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  useEffect(() => {
    addOutput("Solidity IDE ready (WASM compiler supported)", "info");
  }, []);

  const compile = async () => {
    setCompiling(true);
    setErrors([]);
    setWarnings([]);
    setCompiledData(null);
    addOutput(`Loading Solidity compiler ${compilerVersion}...`, "info");

    try {
      const solc = await fetchAndLoadSolc(compilerVersion.replace(/^v/, ""));
      if (!solc) throw new Error("Failed to load Solidity compiler");

      const input = {
        language: "Solidity",
        sources: { "contract.sol": { content: code } },
        settings: {
          optimizer: { enabled: true, runs: 200 },
          outputSelection: { "*": { "*": ["abi", "evm.bytecode", "metadata"] } },
        },
      };

      addOutput("Compiling contract...", "info");
      const outputJSON = await solc.compile(input);
      solc.stopWorker();

      if (outputJSON.errors?.length) {
        const errorList = outputJSON.errors.filter((e) => e.severity === "error");
        const warningList = outputJSON.errors.filter(
          (e) => e.severity === "warning"
        );

        if (errorList.length) {
          setErrors(errorList);
          errorList.forEach((err) =>
            addOutput(err.formattedMessage || err.message, "error")
          );
          setCompiling(false);
          return;
        }

        if (warningList.length) {
          setWarnings(warningList);
          warningList.forEach((warn) =>
            addOutput(warn.formattedMessage || warn.message, "warning")
          );
        }
      }

      const contract = Object.values(outputJSON.contracts["contract.sol"])[0];
      const name = Object.keys(outputJSON.contracts["contract.sol"])[0];

      const compiled = {
        name,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        metadata: contract.metadata,
      };
      setCompiledData(compiled);

      addOutput(`✓ Compilation successful: ${name}`, "success");
      addOutput(`Bytecode Size: ${compiled.bytecode.length / 2} bytes`, "info");
    } catch (err) {
      addOutput(`Compilation error: ${err.message}`, "error");
      setErrors([{ formattedMessage: err.message }]);
    }

    setCompiling(false);
  };

  const analyzeContract = () => {
    if (!compiledData) {
      addOutput("Please compile the contract first", "warning");
      return;
    }

    addOutput("Running static analysis...", "info");
    const issues = [];

    if (code.includes("tx.origin")) {
      issues.push({
        severity: "warning",
        message: "Avoid using tx.origin for authentication.",
      });
    }

    if (code.includes("block.timestamp") || code.includes("now")) {
      issues.push({
        severity: "info",
        message:
          "Timestamp dependence found. Miners can manipulate block.timestamp slightly.",
      });
    }

    if (issues.length === 0) {
      addOutput("✓ No major issues found", "success");
    } else {
      issues.forEach((i) =>
        addOutput(`[${i.severity.toUpperCase()}] ${i.message}`, i.severity)
      );
    }
  };

  const downloadABI = () => {
    if (!compiledData) return;
    const blob = new Blob([JSON.stringify(compiledData.abi, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${compiledData.name}_abi.json`;
    a.click();
    URL.revokeObjectURL(url);
    addOutput("Downloaded ABI", "success");
  };

  const downloadBytecode = () => {
    if (!compiledData) return;
    const blob = new Blob([compiledData.bytecode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${compiledData.name}_bytecode.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addOutput("Downloaded Bytecode", "success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Code2 className="text-purple-400" size={32} /> Solidity IDE (WASM)
          </h1>
          <p className="text-purple-300">In-browser compiler with static analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-purple-500/30">
              <div className="bg-gray-700 px-4 py-2 flex justify-between">
                <div className="flex items-center gap-3">
                  <FileCode size={18} className="text-purple-400" />
                  <span>contract.sol</span>
                </div>
                <select
                  value={compilerVersion}
                  onChange={(e) => setCompilerVersion(e.target.value)}
                  className="bg-gray-600 text-white text-sm px-2 py-1 rounded"
                >
                  <option value="^0.8.20">v0.8.20</option>
                  <option value="^0.8.19">v0.8.19</option>
                  <option value="^0.8.18">v0.8.18</option>
                  <option value="^0.8.17">v0.8.17</option>
                </select>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-black text-green-400 font-mono text-sm p-3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={compile}
                disabled={compiling}
                className="bg-purple-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700 disabled:bg-gray-600"
              >
                <Play size={16} /> {compiling ? "Compiling..." : "Compile"}
              </button>

              <button
                onClick={analyzeContract}
                disabled={!compiledData}
                className="bg-blue-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-600"
              >
                <AlertTriangle size={16} /> Analyze
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-purple-500/30">
            <div className="bg-gray-700 px-4 py-2 flex items-center gap-2">
              <Terminal className="text-purple-400" size={18} />
              <span>Console Output</span>
            </div>
            <div className="p-3 h-96 overflow-y-auto text-xs space-y-2">
              {output.map((log, i) => (
                <div key={i} className={`p-2 rounded ${
                    log.type === "success"
                      ? "bg-green-900 text-green-300"
                      : log.type === "error"
                      ? "bg-red-900 text-red-300"
                      : log.type === "warning"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                  <span className="text-gray-400 mr-1">[{log.timestamp}]</span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {compiledData && (
          <div className="mt-4 bg-green-950/30 border border-green-600 p-4 rounded">
            <h3 className="text-green-400 flex items-center gap-2">
              <CheckCircle size={18} /> Compilation Success
            </h3>
            <p>Name: {compiledData.name}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={downloadABI} className="bg-green-600 px-3 py-2 rounded">
                <Download size={14} /> ABI
              </button>
              <button
                onClick={downloadBytecode}
                className="bg-green-600 px-3 py-2 rounded"
              >
                <Download size={14} /> Bytecode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolidityIDEWithRemix;
