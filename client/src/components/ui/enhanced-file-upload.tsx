"use client";

import React, { useState } from "react";
import { Upload, FileText, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { TextEditor } from "@/components/ui/text-editor";

interface SubmissionMode {
  mode: "files" | "text";
  files: File[];
  textContent: string;
  documentTitle: string;
}

interface EnhancedFileUploadProps {
  onSubmissionChange: (submission: SubmissionMode) => void;
  maxFiles?: number;
  currentFiles?: number;
  initialMode?: "files" | "text";
  allowModeSwitch?: boolean;
}

export function EnhancedFileUpload({
  onSubmissionChange,
  maxFiles = 3,
  currentFiles = 0,
  initialMode = "files",
  allowModeSwitch = true,
}: EnhancedFileUploadProps) {
  const [mode, setMode] = useState<"files" | "text">(initialMode);
  const [files, setFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Manual Submission");

  const handleModeChange = (newMode: "files" | "text") => {
    setMode(newMode);

    // Clear the other mode's data when switching
    if (newMode === "files") {
      setTextContent("");
      setDocumentTitle("Manual Submission");
    } else {
      setFiles([]);
    }

    // Update parent component
    updateSubmission(
      newMode,
      newMode === "files" ? files : [],
      newMode === "text" ? textContent : "",
      documentTitle
    );
  };

  const updateSubmission = (
    currentMode: "files" | "text",
    currentFiles: File[],
    currentText: string,
    currentTitle: string
  ) => {
    onSubmissionChange({
      mode: currentMode,
      files: currentFiles,
      textContent: currentText,
      documentTitle: currentTitle,
    });
  };

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    updateSubmission(mode, selectedFiles, textContent, documentTitle);
  };

  const handleTextChange = (text: string) => {
    setTextContent(text);
    updateSubmission(mode, files, text, documentTitle);
  };

  const handleTitleChange = (title: string) => {
    setDocumentTitle(title);
    updateSubmission(mode, files, textContent, title);
  };

  return (
    <div className="w-full">
      {/* Mode Toggle */}
      {allowModeSwitch && (
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <Button
            type="button"
            onClick={() => handleModeChange("files")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              mode === "files"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
          <Button
            type="button"
            onClick={() => handleModeChange("text")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              mode === "text"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Manual Text
          </Button>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[200px]">
        {mode === "files" ? (
          <div>
            <FileUpload
              onFileSelect={handleFileSelect}
              maxFiles={maxFiles}
              currentFiles={currentFiles}
            />

            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-medium mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">{file.name}</span>
                        <span className="text-gray-400 text-xs">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const newFiles = files.filter((_, i) => i !== index);
                          setFiles(newFiles);
                          handleFileSelect(newFiles);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-blue-300 font-medium">
                  Manual Text Submission
                </h3>
              </div>
              <p className="text-gray-300 text-sm">
                Enter your startup information manually. This will be converted
                to a professional PDF document. Perfect for when you don't have
                existing financial documents or want to create custom content.
              </p>
            </div>

            <TextEditor
              value={textContent}
              onChange={handleTextChange}
              title={documentTitle}
              onTitleChange={handleTitleChange}
              placeholder="Enter your startup information here...

Example content:
- Company Overview
- Business Model & Revenue Streams  
- Financial Metrics (MRR, ARR, Customer Count, etc.)
- Market Analysis & TAM
- Team Information
- Funding Status & Plans
- Key Performance Indicators
- Growth Strategy

Be specific with numbers and metrics for better analysis."
            />

            {textContent.trim() && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>
                    Ready to generate: <strong>{documentTitle}.pdf</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { SubmissionMode };
