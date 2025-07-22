# File Validation System

## Overview

The file validation system is designed to automatically detect unrelated files during upload and ensure that only financial documents related to the specific startup are accepted.

## Features

### 1. Financial Content Detection
- **Keyword Analysis**: Scans files for financial keywords across multiple categories:
  - Balance Sheet terms (assets, liabilities, equity, etc.)
  - Income Statement terms (revenue, expenses, profit, etc.)
  - Cash Flow terms (operating cash flow, investing cash flow, etc.)
  - Cap Table terms (shares, ownership, stockholders, etc.)
  - General Financial terms (investment, funding, valuation, etc.)

### 2. Non-Financial Content Detection
- **Red Flag Detection**: Identifies personal/non-business content:
  - Personal documents (diary, photos, family content)
  - Irrelevant content (recipes, entertainment, social media)
  - Non-business related keywords

### 3. Startup Consistency Validation
- **Company Name Matching**: Ensures documents reference the correct startup
- **Cross-file Consistency**: Validates that all files are related to the same company
- **Consistency Scoring**: Provides a score indicating how well the document matches the startup name

### 4. File Format Validation
- **Supported Formats**: 
  - PDF (.pdf)
  - Word Documents (.docx, .doc)
  - Excel Spreadsheets (.xlsx, .xls)
  - CSV Files (.csv)
  - Text Files (.txt)

## How It Works

### Validation Process

1. **File Extension Check**: Ensures uploaded files are in supported formats
2. **Content Extraction**: Extracts text content from various file types
3. **Financial Scoring**: Calculates a financial relevance score based on keyword matches
4. **Red Flag Detection**: Identifies non-financial content indicators
5. **Startup Consistency**: Checks if documents reference the correct startup
6. **Cross-file Validation**: Ensures all files are related to the same entity

### Scoring System

- **Financial Score**: Minimum threshold of 3 financial keywords required
- **Startup Consistency Score**: Minimum 70% match with startup name
- **Red Flag Threshold**: More than 2 personal/non-business keywords trigger rejection

## API Integration

The validation system is integrated into two main endpoints:

### 1. Submit Startup (`/api/submit-startup`)
- Validates all initial files during startup submission
- Returns detailed error messages for validation failures

### 2. Add Files (`/api/add-files/{startup_name}`)
- Validates additional files being added to existing startups
- Ensures consistency with existing startup data

### 3. Test Validation (`/api/test/test-validation`)
- Test endpoint for validating files without saving them
- Returns detailed validation analysis

## Error Handling

### Validation Errors (HTTP 422)
When files fail validation, the API returns:
```json
{
  "message": "File validation failed",
  "errors": ["List of specific errors"],
  "warnings": ["List of warnings"],
  "file_analyses": [
    {
      "filename": "document.pdf",
      "is_financial": false,
      "detected_type": "non_financial_personal",
      "financial_score": 1,
      "startup_consistent": false,
      "startup_score": 0.2,
      "red_flags": ["personal", "diary"]
    }
  ]
}
```

## Example Scenarios

### ✅ Valid Financial Document
```
TechStart Inc. Financial Statement
Revenue: $1,000,000
Expenses: $800,000
Assets: $500,000
Liabilities: $200,000
```
- High financial score (multiple financial keywords)
- References correct startup name
- **Result**: ✅ Accepted

### ❌ Personal Document
```
My Personal Shopping List
- Milk
- Bread  
- Call family
- Plan vacation
```
- Low financial score
- Multiple red flags (personal, family)
- **Result**: ❌ Rejected

### ⚠️ Different Company Document
```
MegaCorp Industries Financial Report
Revenue: $10,000,000
Assets: $50,000,000
```
- High financial score
- References different company
- **Result**: ⚠️ Warning (may be accepted with warning)

## Configuration

Key validation parameters (configurable in `file_validator.py`):

- `min_financial_score = 3`: Minimum financial keywords required
- `min_startup_consistency_score = 0.7`: Minimum startup name match threshold
- `allowed_extensions`: Supported file formats
- `financial_keywords`: Dictionary of financial terms by category
- `non_financial_keywords`: List of red flag terms

## Testing

Run the validation test script:
```bash
cd server
python test_validation.py
```

Use the test endpoint:
```bash
curl -X POST "http://localhost:8000/api/test/test-validation" \
  -F "startup_name=TechStart" \
  -F "files=@financial_document.pdf"
```

## Benefits

1. **Improved Data Quality**: Only relevant financial documents are processed
2. **Time Savings**: Prevents processing of irrelevant files
3. **User Feedback**: Clear error messages help users upload correct documents
4. **Consistency**: Ensures all files relate to the same startup
5. **Automated**: No manual review required for basic validation

## Limitations

1. **Text Extraction**: Some PDFs or images may not extract text properly
2. **Context Understanding**: Keyword-based approach may miss contextual relevance
3. **Language Support**: Currently optimized for English financial documents
4. **Threshold Tuning**: May need adjustment based on specific use cases
