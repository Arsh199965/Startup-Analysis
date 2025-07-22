"""
File validation module for detecting unrelated or non-financial files
"""

import os
import re
import mimetypes
from typing import List, Tuple, Dict, Any
import io
from pathlib import Path
import PyPDF2
import docx
from openpyxl import load_workbook
import pandas as pd
from fastapi import HTTPException

class FileValidator:
    def __init__(self):
        # Financial keywords that should be present in relevant documents
        self.financial_keywords = {
            'balance_sheet': [
                'assets', 'liabilities', 'equity', 'balance sheet', 'current assets',
                'fixed assets', 'accounts payable', 'accounts receivable', 'inventory',
                'cash', 'retained earnings', 'shareholder equity', 'working capital'
            ],
            'income_statement': [
                'revenue', 'income', 'expenses', 'profit', 'loss', 'ebitda', 'ebit',
                'gross profit', 'net income', 'operating expenses', 'cost of goods sold',
                'depreciation', 'amortization', 'interest expense', 'tax expense'
            ],
            'cash_flow': [
                'cash flow', 'operating cash flow', 'investing cash flow',
                'financing cash flow', 'cash receipts', 'cash payments',
                'net cash flow', 'beginning cash', 'ending cash'
            ],
            'cap_table': [
                'shares', 'ownership', 'equity', 'stockholders', 'shareholders',
                'common stock', 'preferred stock', 'options', 'warrants',
                'dilution', 'valuation', 'share price', 'capitalization table',
                'voting rights', 'liquidation preference'
            ],
            'financial_projections': [
                'forecast', 'projection', 'budget', 'plan', 'targets',
                'assumptions', 'growth rate', 'market size', 'projections'
            ],
            'general_financial': [
                'financial', 'money', 'dollar', 'currency', 'investment',
                'funding', 'capital', 'valuation', 'metrics', 'kpi',
                'performance', 'analysis', 'report', 'statement'
            ]
        }
        
        # Company/startup related keywords
        self.company_keywords = [
            'company', 'corporation', 'inc', 'llc', 'ltd', 'startup',
            'business', 'enterprise', 'firm', 'organization', 'venture'
        ]
        
        # Non-financial file indicators (red flags)
        self.non_financial_keywords = [
            'recipe', 'cooking', 'personal', 'diary', 'vacation', 'travel',
            'photo', 'image', 'music', 'video', 'game', 'entertainment',
            'social media', 'facebook', 'instagram', 'twitter', 'personal note',
            'shopping list', 'grocery', 'family', 'wedding', 'birthday'
        ]
        
        # Allowed file extensions
        self.allowed_extensions = {
            '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt'
        }
        
        # Minimum financial keyword threshold
        self.min_financial_score = 3
        self.min_startup_consistency_score = 0.7

    def validate_files(self, files: List[Any], startup_name: str) -> Dict[str, Any]:
        """
        Main validation function that checks all uploaded files
        """
        results = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'file_analyses': []
        }
        
        try:
            # Check file extensions
            for file in files:
                if not self._is_allowed_extension(file.filename):
                    results['is_valid'] = False
                    results['errors'].append(
                        f"File '{file.filename}' has unsupported format. "
                        f"Allowed formats: {', '.join(self.allowed_extensions)}"
                    )
            
            if not results['is_valid']:
                return results
            
            # Analyze each file content
            file_contents = []
            for file in files:
                try:
                    content = self._extract_file_content(file)
                    file_contents.append({
                        'filename': file.filename,
                        'content': content,
                        'size': len(content) if content else 0
                    })
                except Exception as e:
                    results['warnings'].append(
                        f"Could not analyze content of '{file.filename}': {str(e)}"
                    )
                    file_contents.append({
                        'filename': file.filename,
                        'content': '',
                        'size': 0
                    })
            
            # Validate each file
            startup_name_normalized = self._normalize_text(startup_name)
            
            for file_data in file_contents:
                analysis = self._analyze_file_content(
                    file_data['filename'],
                    file_data['content'],
                    startup_name_normalized
                )
                results['file_analyses'].append(analysis)
                
                # Check if file is financial
                if not analysis['is_financial']:
                    results['is_valid'] = False
                    results['errors'].append(
                        f"File '{file_data['filename']}' does not appear to be financial. "
                        f"Detected content type: {analysis['detected_type']}"
                    )
                
                # Check startup consistency
                if not analysis['startup_consistent'] and analysis['startup_score'] < self.min_startup_consistency_score:
                    results['warnings'].append(
                        f"File '{file_data['filename']}' may not be related to startup '{startup_name}'. "
                        f"Consistency score: {analysis['startup_score']:.2f}"
                    )
            
            # Cross-file consistency check
            consistency_check = self._check_cross_file_consistency(file_contents, startup_name_normalized)
            if not consistency_check['consistent']:
                results['warnings'].extend(consistency_check['warnings'])
            
        except Exception as e:
            results['is_valid'] = False
            results['errors'].append(f"Validation error: {str(e)}")
        
        return results

    def _is_allowed_extension(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        if not filename:
            return False
        return Path(filename).suffix.lower() in self.allowed_extensions

    def _extract_file_content(self, file) -> str:
        """Extract text content from uploaded file"""
        filename = file.filename.lower()
        content = ""
        
        try:
            # Reset file pointer
            file.file.seek(0)
            
            if filename.endswith('.pdf'):
                content = self._extract_pdf_content(file.file)
            elif filename.endswith(('.docx', '.doc')):
                content = self._extract_docx_content(file.file)
            elif filename.endswith(('.xlsx', '.xls')):
                content = self._extract_excel_content(file.file)
            elif filename.endswith('.csv'):
                content = self._extract_csv_content(file.file)
            elif filename.endswith('.txt'):
                content = file.file.read().decode('utf-8', errors='ignore')
            
            # Reset file pointer again for later processing
            file.file.seek(0)
            
        except Exception as e:
            print(f"Error extracting content from {filename}: {str(e)}")
            content = ""
        
        return content

    def _extract_pdf_content(self, file_obj) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(file_obj)
            content = ""
            for page in pdf_reader.pages:
                content += page.extract_text() + "\n"
            return content
        except:
            return ""

    def _extract_docx_content(self, file_obj) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_obj)
            content = ""
            for paragraph in doc.paragraphs:
                content += paragraph.text + "\n"
            return content
        except:
            return ""

    def _extract_excel_content(self, file_obj) -> str:
        """Extract text from Excel file"""
        try:
            df = pd.read_excel(file_obj, sheet_name=None)
            content = ""
            for sheet_name, sheet_df in df.items():
                content += f"Sheet: {sheet_name}\n"
                content += sheet_df.to_string() + "\n\n"
            return content
        except:
            return ""

    def _extract_csv_content(self, file_obj) -> str:
        """Extract text from CSV file"""
        try:
            df = pd.read_csv(file_obj)
            return df.to_string()
        except:
            return ""

    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison"""
        if not text:
            return ""
        return re.sub(r'[^a-zA-Z0-9\s]', '', text.lower()).strip()

    def _analyze_file_content(self, filename: str, content: str, startup_name: str) -> Dict[str, Any]:
        """Analyze individual file content"""
        analysis = {
            'filename': filename,
            'is_financial': False,
            'detected_type': 'unknown',
            'financial_score': 0,
            'startup_consistent': False,
            'startup_score': 0.0,
            'red_flags': []
        }
        
        if not content:
            analysis['detected_type'] = 'empty_or_unreadable'
            return analysis
        
        content_lower = content.lower()
        
        # Check for non-financial content (red flags)
        red_flag_count = 0
        for keyword in self.non_financial_keywords:
            if keyword in content_lower:
                red_flag_count += 1
                analysis['red_flags'].append(keyword)
        
        if red_flag_count > 2:
            analysis['detected_type'] = 'non_financial_personal'
            return analysis
        
        # Calculate financial score
        financial_score = 0
        detected_categories = []
        
        for category, keywords in self.financial_keywords.items():
            category_matches = 0
            for keyword in keywords:
                if keyword in content_lower:
                    category_matches += 1
                    financial_score += 1
            
            if category_matches > 0:
                detected_categories.append(category)
        
        analysis['financial_score'] = financial_score
        analysis['is_financial'] = financial_score >= self.min_financial_score
        
        if detected_categories:
            analysis['detected_type'] = ', '.join(detected_categories)
        elif financial_score > 0:
            analysis['detected_type'] = 'potentially_financial'
        else:
            analysis['detected_type'] = 'non_financial'
        
        # Check startup name consistency
        if startup_name:
            startup_words = startup_name.split()
            startup_score = 0
            total_words = len(startup_words)
            
            if total_words > 0:
                for word in startup_words:
                    if len(word) > 2 and word in content_lower:
                        startup_score += 1
                
                analysis['startup_score'] = startup_score / total_words
                analysis['startup_consistent'] = analysis['startup_score'] >= self.min_startup_consistency_score
        
        return analysis

    def _check_cross_file_consistency(self, file_contents: List[Dict], startup_name: str) -> Dict[str, Any]:
        """Check consistency across multiple files"""
        result = {
            'consistent': True,
            'warnings': []
        }
        
        if len(file_contents) < 2:
            return result
        
        # Check if files reference the same company/startup
        company_references = []
        
        for file_data in file_contents:
            content_lower = file_data['content'].lower()
            references = []
            
            # Look for company names or references
            for keyword in self.company_keywords:
                pattern = rf'\b\w*{keyword}\w*\b'
                matches = re.findall(pattern, content_lower)
                references.extend(matches)
            
            company_references.append({
                'filename': file_data['filename'],
                'references': list(set(references))
            })
        
        # Simple consistency check - if files have very different company references,
        # it might indicate they're for different companies
        all_references = []
        for ref_data in company_references:
            all_references.extend(ref_data['references'])
        
        unique_references = list(set(all_references))
        
        # If there are too many different company references, warn the user
        if len(unique_references) > 5:  # Threshold for concern
            result['warnings'].append(
                "Files may contain references to multiple different companies. "
                "Please ensure all files are related to the same startup."
            )
        
        return result


# Global validator instance
file_validator = FileValidator()
