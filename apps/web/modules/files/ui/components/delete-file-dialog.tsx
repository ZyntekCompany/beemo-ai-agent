"use client";

import { api } from "@workspace/backend/_generated/api";
import { PublicFile } from "@workspace/backend/private/files";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useMutation } from "convex/react";
import { useState } from "react";

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: PublicFile | null;
  onDelete?: () => void;
}

export function DeleteFileDialog({
  file,
  onDelete,
  onOpenChange,
  open,
}: DeleteFileDialogProps) {
  const deleteFile = useMutation(api.private.files.deleteFile);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!file) return;

    setIsDeleting(true);
    try {
      await deleteFile({ entryId: file.id });

      onDelete?.();
      onOpenChange(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action connot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {file && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="font-medium">{file.name}</p>
                <p className="text-muted-foreground text-sm">
                  Type: {file.type.toUpperCase()} | Size: {file.size}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting || !file}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
