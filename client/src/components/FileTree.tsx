import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileJson,
  FileText,
  Database,
  Settings,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { ScaffoldFile } from "../../../shared/scaffold-types";

interface FileTreeProps {
  files: ScaffoldFile[];
  selectedPath: string | null;
  onSelect: (file: ScaffoldFile) => void;
  extraFiles?: { path: string; label: string; icon?: React.ReactNode }[];
  onSelectExtra?: (path: string) => void;
  selectedExtra?: string | null;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: ScaffoldFile;
}

function buildTree(files: ScaffoldFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap = new Map<string, TreeNode>();

  const getOrCreateDir = (parts: string[], upTo: number): TreeNode[] => {
    if (upTo === 0) return root;
    const dirPath = parts.slice(0, upTo).join("/");
    if (dirMap.has(dirPath)) return dirMap.get(dirPath)!.children;

    const parentChildren = getOrCreateDir(parts, upTo - 1);
    const node: TreeNode = {
      name: parts[upTo - 1]!,
      path: dirPath,
      isDir: true,
      children: [],
    };
    parentChildren.push(node);
    dirMap.set(dirPath, node);
    return node.children;
  };

  for (const file of files) {
    const parts = file.path.split("/");
    const parentChildren = getOrCreateDir(parts, parts.length - 1);
    parentChildren.push({
      name: parts[parts.length - 1]!,
      path: file.path,
      isDir: false,
      children: [],
      file,
    });
  }

  return root;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "json") return <FileJson className="size-3.5 text-yellow-400 flex-shrink-0" />;
  if (ext === "sql") return <Database className="size-3.5 text-cyan-400 flex-shrink-0" />;
  if (ext === "md") return <FileText className="size-3.5 text-blue-400 flex-shrink-0" />;
  if (ext === "css") return <FileCode2 className="size-3.5 text-pink-400 flex-shrink-0" />;
  if (name.startsWith(".env")) return <Settings className="size-3.5 text-emerald-400 flex-shrink-0" />;
  if (name === "package.json") return <FileJson className="size-3.5 text-orange-400 flex-shrink-0" />;
  return <FileCode2 className="size-3.5 text-violet-400 flex-shrink-0" />;
}

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (file: ScaffoldFile) => void;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 transition-colors text-left group"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {open
            ? <ChevronDown className="size-3 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="size-3 text-muted-foreground flex-shrink-0" />}
          {open
            ? <FolderOpen className="size-3.5 text-yellow-500/70 flex-shrink-0" />
            : <Folder className="size-3.5 text-yellow-500/70 flex-shrink-0" />}
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {node.name}
          </span>
        </button>
        {open && node.children.map(child => (
          <TreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;
  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-left ${
        isSelected
          ? "bg-violet-600/20 text-violet-300"
          : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
      }`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      {getFileIcon(node.name)}
      <span className="text-xs truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({
  files,
  selectedPath,
  onSelect,
  extraFiles,
  onSelectExtra,
  selectedExtra,
}: FileTreeProps) {
  const tree = buildTree(files);

  return (
    <div className="h-full overflow-y-auto py-2">
      {/* Extra special files (schema, readme, env) */}
      {extraFiles && extraFiles.length > 0 && (
        <div className="mb-2 pb-2 border-b border-border/50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 py-1">
            Generated Assets
          </p>
          {extraFiles.map(ef => (
            <button
              key={ef.path}
              onClick={() => onSelectExtra?.(ef.path)}
              className={`w-full flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-left ${
                selectedExtra === ef.path
                  ? "bg-cyan-600/20 text-cyan-300"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {ef.icon}
              <span className="text-xs truncate">{ef.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Source files */}
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 py-1">
        Source Files
      </p>
      {tree.map(node => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
