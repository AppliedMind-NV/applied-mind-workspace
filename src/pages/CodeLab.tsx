import { Play, Terminal } from "lucide-react";
import { useState } from "react";

export default function CodeLab() {
  const [code, setCode] = useState(`# Binary Search implementation
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test
result = binary_search([1, 3, 5, 7, 9, 11], 7)
print(f"Found at index: {result}")
`);
  const [output, setOutput] = useState("▸ Click Run to execute code");

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Code Lab</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-mono">
            Python
          </span>
        </div>
        <button
          onClick={() => setOutput("Found at index: 3")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Play size={12} />
          Run
        </button>
      </div>

      {/* Editor + Output */}
      <div className="flex-1 flex flex-col">
        {/* Code Editor */}
        <div className="flex-1 min-h-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm bg-background resize-none outline-none leading-6 scrollbar-thin"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="h-32 border-t">
          <div className="flex items-center gap-1.5 px-4 py-1.5 border-b bg-chrome">
            <Terminal size={12} className="text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
          </div>
          <pre className="p-4 font-mono text-sm text-foreground/80 overflow-auto scrollbar-thin">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
