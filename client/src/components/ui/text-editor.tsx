"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  onTitleChange?: (title: string) => void;
  className?: string;
  rows?: number;
}

export function TextEditor({
  value,
  onChange,
  placeholder = "Enter your startup information, financial data, business plan details, or any relevant text content here...",
  title = "Manual Submission",
  onTitleChange,
  className = "",
  rows = 12,
}: TextEditorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Document Title Input */}
      {onTitleChange && (
        <div>
          <Label htmlFor="document-title" className="text-white">
            Document Title
          </Label>
          <input
            id="document-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter document title..."
          />
        </div>
      )}

      {/* Text Editor */}
      <div>
        <Label htmlFor="text-content" className="text-white">
          Content
        </Label>
        <textarea
          id="text-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm leading-relaxed"
          placeholder={placeholder}
        />

        {/* Character/Word Count */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{value.length} characters</span>
          <span>
            {value.trim() ? value.trim().split(/\\s+/).length : 0} words
          </span>
        </div>
      </div>

      {/* Formatting Tips */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>
          <strong>Formatting Tips:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Use double line breaks to create new paragraphs</li>
          <li>Include financial metrics, KPIs, and specific numbers</li>
          <li>
            Structure your content with clear sections (e.g., Business Model,
            Financials, Market)
          </li>
          <li>The text will be converted to a professionally formatted PDF</li>
        </ul>
      </div>
    </div>
  );
}
