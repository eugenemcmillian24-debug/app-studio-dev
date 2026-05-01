import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

interface CloneProjectButtonProps {
  projectId: number;
  originalName: string;
  onClone?: (newProjectId: number) => void;
}

export function CloneProjectButton({
  projectId,
  originalName,
  onClone,
}: CloneProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(`${originalName} (Copy)`);
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!newName.trim()) {
      alert("Please enter a project name");
      return;
    }

    setLoading(true);
    try {
      // In production, call: await trpc.projectDuplication.cloneProject.mutate({
      //   projectId,
      //   newName,
      // });

      // Mock success
      console.log(`Cloning project ${projectId} as "${newName}"`);
      alert(`Project cloned successfully as "${newName}"`);
      setOpen(false);
      setNewName(`${originalName} (Copy)`);
      onClone?.(projectId + 1); // Mock new ID
    } catch (error) {
      alert("Failed to clone project: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="w-4 h-4" />
          Clone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Project</DialogTitle>
          <DialogDescription>
            Create a copy of "{originalName}" with a new name
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Project Name</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new project name"
              className="mt-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={loading}>
              {loading ? "Cloning..." : "Clone Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
