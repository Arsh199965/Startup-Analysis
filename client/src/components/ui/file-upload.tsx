"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxSize?: number;
}

export function FileUpload({
  onFileSelect,
  acceptedFileTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"],
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles(acceptedFiles);
      onFileSelect(acceptedFiles);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/vnd.ms-powerpoint": [".ppt"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          [".pptx"],
        "text/plain": [".txt"],
      },
      maxFiles,
      maxSize,
    });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFileSelect(newFiles);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-600/10 backdrop-blur-sm"
            : "border-gray-700 hover:border-blue-500",
          uploadedFiles.length > 0
            ? "border-green-500 bg-green-600/10 backdrop-blur-sm"
            : "hover:bg-blue-600/5"
        )}
      >
        <input {...getInputProps()} />

        {uploadedFiles.length === 0 ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">
                {isDragActive
                  ? "Drop your files here"
                  : "Drop your tear sheet or portfolio here"}
              </p>
              <p className="text-sm text-gray-400">or click to browse files</p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOC, DOCX, PPT, PPTX, TXT (max{" "}
                {maxSize / (1024 * 1024)}MB)
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <p className="text-lg font-medium text-green-400">
              Files uploaded successfully!
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-red-400 mb-2">Upload Error:</p>
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index} className="text-sm text-red-400">
              <p className="font-medium">{file.name}:</p>
              <ul className="list-disc list-inside ml-2">
                {errors.map((error) => (
                  <li key={error.code}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
