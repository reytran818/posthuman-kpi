"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Attachment } from "@/lib/kpi-engine";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from "lucide-react";

interface FileUploadProps {
  founderId: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onRemove: (attachmentId: string) => void;
}

export function FileUpload({
  founderId,
  attachments,
  onUpload,
  onRemove,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("founderId", founderId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        url: data.url,
        filename: data.filename,
        type: data.type,
        size: data.size,
        uploadedAt: new Date().toISOString(),
      };

      onUpload(attachment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function isImage(type: string) {
    return type.startsWith("image/");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${founderId}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Upload PDF or Image"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Resume, contracts, evidence of contributions (max 10MB)
        </span>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isImage(att.type) ? (
                  <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm truncate block hover:underline"
                  >
                    {att.filename}
                  </a>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {att.type.split("/")[1]?.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(att.size)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(att.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isImage(attachments[0]?.type || "") && attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments
            .filter((a) => isImage(a.type))
            .map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.url}
                  alt={att.filename}
                  className="rounded-md border border-border w-full h-24 object-cover hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
