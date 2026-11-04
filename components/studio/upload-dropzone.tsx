/* eslint-disable @next/next/no-img-element */

"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

type UploadDropzoneProps = {
  label: string;
  description: string;
  previewUrl?: string | null;
  fileName?: string | null;
  compact?: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
  onDemo?: () => void;
  onClear?: () => void;
};

export function UploadDropzone({
  label,
  description,
  previewUrl,
  fileName,
  compact = false,
  disabled = false,
  onFile,
  onDemo,
  onClear,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const acceptFile = (file?: File) => {
    if (file) onFile(file);
  };

  if (previewUrl) {
    return (
      <div className={compact ? "upload-preview compact" : "upload-preview"}>
        <img src={previewUrl} alt={label} />
        <div className="upload-preview-copy">
          <span className="eyebrow">{label}</span>
          <strong>{fileName || "已载入图片"}</strong>
        </div>
        <div className="upload-preview-actions">
          {!compact && onDemo ? (
            <button type="button" className="ghost-button small" onClick={onDemo} disabled={disabled}>
              换一张
            </button>
          ) : null}
          {onClear ? (
            <button type="button" className="icon-button" onClick={onClear} aria-label={`移除${label}`} disabled={disabled}>
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${compact ? "compact" : ""} ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) acceptFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => acceptFile(event.target.files?.[0])}
        disabled={disabled}
      />
      <button type="button" className="dropzone-main" onClick={pick} disabled={disabled}>
        <span className="dropzone-icon">{compact ? <Upload size={17} /> : <ImagePlus size={24} />}</span>
        <span>
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </button>
      {onDemo ? (
        <button type="button" className="text-button" onClick={onDemo} disabled={disabled}>
          载入演示照片
        </button>
      ) : null}
    </div>
  );
}

