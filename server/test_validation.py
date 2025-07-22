"""
Test script for file validation system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.file_validator import file_validator

class MockFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.content = content.encode('utf-8')
        self.file = MockFileObj(self.content)

class MockFileObj:
    def __init__(self, content):
        self.content = content
        self.position = 0
    
    def read(self):
        return self.content
    
    def seek(self, position):
        self.position = position

def test_validation():
    print("Testing File Validation System")
    print("=" * 50)
    
    # Test Case 1: Valid financial document
    print("\nTest Case 1: Valid Financial Document")
    financial_content = """
    TechStart Inc. Financial Statement
    
    Balance Sheet
    Assets:
    Current Assets: $500,000
    Cash: $200,000
    Accounts Receivable: $150,000
    Inventory: $150,000
    
    Liabilities:
    Accounts Payable: $100,000
    Current Liabilities: $150,000
    
    Equity:
    Shareholder Equity: $350,000
    Retained Earnings: $50,000
    
    Income Statement
    Revenue: $1,000,000
    Expenses: $800,000
    Net Income: $200,000
    EBITDA: $250,000
    """
    
    files = [MockFile("techstart_financials.pdf", financial_content)]
    result = file_validator.validate_files(files, "TechStart")
    print(f"Valid: {result['is_valid']}")
    print(f"Errors: {result['errors']}")
    print(f"Warnings: {result['warnings']}")
    if result['file_analyses']:
        analysis = result['file_analyses'][0]
        print(f"Financial Score: {analysis['financial_score']}")
        print(f"Detected Type: {analysis['detected_type']}")
        print(f"Startup Consistent: {analysis['startup_consistent']}")
    
    # Test Case 2: Non-financial document (personal)
    print("\n" + "=" * 50)
    print("\nTest Case 2: Non-Financial Document")
    personal_content = """
    My Personal Diary
    
    Today I went to the grocery store and bought:
    - Milk
    - Bread
    - Eggs
    - Bananas
    
    Then I came home and watched my favorite TV show.
    Tomorrow I need to call my family and plan our vacation.
    I'm thinking about going to the beach this summer.
    """
    
    files = [MockFile("personal_diary.txt", personal_content)]
    result = file_validator.validate_files(files, "TechStart")
    print(f"Valid: {result['is_valid']}")
    print(f"Errors: {result['errors']}")
    print(f"Warnings: {result['warnings']}")
    if result['file_analyses']:
        analysis = result['file_analyses'][0]
        print(f"Financial Score: {analysis['financial_score']}")
        print(f"Detected Type: {analysis['detected_type']}")
        print(f"Red Flags: {analysis['red_flags']}")
    
    # Test Case 3: Financial document for different company
    print("\n" + "=" * 50)
    print("\nTest Case 3: Financial Document for Different Company")
    different_company_content = """
    MegaCorp Industries Financial Report
    
    Revenue: $10,000,000
    Profit: $2,000,000
    Assets: $50,000,000
    Liabilities: $30,000,000
    
    This financial statement represents MegaCorp Industries'
    performance for the fiscal year ending December 31, 2024.
    
    The board of directors of MegaCorp Industries has approved
    this financial report.
    """
    
    files = [MockFile("megacorp_financials.pdf", different_company_content)]
    result = file_validator.validate_files(files, "TechStart")
    print(f"Valid: {result['is_valid']}")
    print(f"Errors: {result['errors']}")
    print(f"Warnings: {result['warnings']}")
    if result['file_analyses']:
        analysis = result['file_analyses'][0]
        print(f"Financial Score: {analysis['financial_score']}")
        print(f"Detected Type: {analysis['detected_type']}")
        print(f"Startup Consistent: {analysis['startup_consistent']}")
        print(f"Startup Score: {analysis['startup_score']}")
    
    # Test Case 4: Minimal financial content (edge case)
    print("\n" + "=" * 50)
    print("\nTest Case 4: Minimal Financial Content")
    minimal_content = """
    TechStart Revenue Report
    
    Q1 Revenue: $100,000
    Q2 Revenue: $120,000
    """
    
    files = [MockFile("revenue_summary.txt", minimal_content)]
    result = file_validator.validate_files(files, "TechStart")
    print(f"Valid: {result['is_valid']}")
    print(f"Errors: {result['errors']}")
    print(f"Warnings: {result['warnings']}")
    if result['file_analyses']:
        analysis = result['file_analyses'][0]
        print(f"Financial Score: {analysis['financial_score']}")
        print(f"Detected Type: {analysis['detected_type']}")
    
    print("\n" + "=" * 50)
    print("Testing Complete!")

if __name__ == "__main__":
    test_validation()
