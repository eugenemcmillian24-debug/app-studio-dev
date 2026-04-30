import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";


export function CollectionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#6366f1");


  const utils = trpc.useUtils();

  const collectionsQuery = trpc.collections.getMyCollections.useQuery();
  const createMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
      setNewCollectionName("");
      setNewCollectionColor("#6366f1");
      setIsOpen(false);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const deleteMutation = trpc.collections.delete.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
    },
  });

  const handleCreate = () => {
    if (!newCollectionName.trim()) {
      alert("Collection name is required");
      return;
    }

    createMutation.mutate({
      name: newCollectionName,
      color: newCollectionColor,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Collections</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., My SaaS Projects"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCollectionColor}
                    onChange={(e) => setNewCollectionColor(e.target.value)}
                    className="h-10 w-20 rounded border border-border cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{newCollectionColor}</span>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collectionsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {collectionsQuery.data && collectionsQuery.data.length > 0 ? (
        <div className="space-y-2">
          {collectionsQuery.data.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: collection.color || "#6366f1" }}
                />
                <div>
                  <div className="font-medium text-sm">{collection.name}</div>
                  {collection.description && (
                    <div className="text-xs text-muted-foreground">{collection.description}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteMutation.mutate({ id: collection.id })}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No collections yet. Create one to organize your projects.
        </div>
      )}
    </div>
  );
}
