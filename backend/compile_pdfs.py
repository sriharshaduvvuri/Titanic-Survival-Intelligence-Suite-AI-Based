import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class SimplePDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(148, 163, 184) # light slate
        self.cell(0, 10, 'Titanic Survival Intelligence Suite - Submission Documents', 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='R')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

def sanitize_latin1(text):
    # Mapping of common unicode characters to standard Latin-1/ASCII
    replacements = {
        '├': '|--',
        '└': '|__',
        '│': '|',
        '─': '-',
        '→': '->',
        '✓': 'Done',
        '🔒': '[SECURE]',
        '•': '*',
        '’': "'",
        '”': '"',
        '“': '"',
        '≈': '~',
        'ϕ': 'phi',
        'μ': 'mu',
        'σ': 'sigma',
        '∑': 'sum',
        '•': '*',
        '🟢': '[PASS]'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    
    # Keep only characters within Latin-1 (range < 256)
    sanitized = []
    for c in text:
        if ord(c) < 256:
            sanitized.append(c)
        else:
            sanitized.append('?') # Replace other symbols with ?
    return "".join(sanitized)

def convert_md_to_pdf(md_path, pdf_path, title):
    if not os.path.exists(md_path):
        print(f"Source file not found: {md_path}")
        return

    print(f"Compiling {md_path} -> {pdf_path}...")
    pdf = SimplePDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_margins(15, 20, 15)
    
    # Document Title
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(15, 23, 42) # dark slate
    pdf.cell(0, 15, title, 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    pdf.ln(5)
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(4)
            continue
            
        # Skip mermaid blocks or standard markdown separators
        if line.startswith('```') or line.startswith('---'):
            continue
            
        # Parse Headings
        if line.startswith('# '):
            text = sanitize_latin1(line[2:])
            pdf.set_font('Helvetica', 'B', 16)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 12, text, 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        elif line.startswith('## '):
            text = sanitize_latin1(line[3:])
            pdf.set_font('Helvetica', 'B', 13)
            pdf.set_text_color(79, 70, 229) # indigo
            pdf.cell(0, 10, text, 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        elif line.startswith('### '):
            text = sanitize_latin1(line[4:])
            pdf.set_font('Helvetica', 'B', 11)
            pdf.set_text_color(30, 41, 59)
            pdf.cell(0, 8, text, 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        # Bullet list items
        elif line.startswith('- ') or line.startswith('* '):
            text = sanitize_latin1(line[2:])
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(51, 65, 85)
            # Indent bullet slightly
            pdf.set_x(25)
            pdf.multi_cell(160, 6, f'* {text}')
            pdf.set_x(15)
        # Normal text paragraph
        else:
            text = sanitize_latin1(line)
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(51, 65, 85)
            pdf.multi_cell(180, 6, text)
            
    pdf.output(pdf_path)
    print(f"Compilation successful: {pdf_path}")

def main():
    workspace_root = os.path.dirname(os.path.dirname(__file__))
    # Artifact path (adjusting to our source documents)
    artifact_dir = os.path.join(
        "C:\\Users\\SRI HARSHA\\.gemini\\antigravity-ide\\brain\\369dee50-83e9-4593-9633-58e0b3cf87d9"
    )
    submission_dir = os.path.join(workspace_root, "submission")
    os.makedirs(submission_dir, exist_ok=True)
    os.makedirs(os.path.join(submission_dir, "screenshots"), exist_ok=True)

    # Documents to compile
    docs = [
        (
            os.path.join(workspace_root, "README.md"),
            os.path.join(submission_dir, "README.pdf"),
            "Titanic Survival Intelligence Suite - Master README"
        ),
        (
            os.path.join(artifact_dir, "architecture.md"),
            os.path.join(submission_dir, "architecture.pdf"),
            "System Architecture & Deep Dive Specifications"
        ),
        (
            os.path.join(artifact_dir, "test_report.md"),
            os.path.join(submission_dir, "test_report.pdf"),
            "End-to-End Verification Test Results Report"
        ),
        (
            os.path.join(artifact_dir, "user_manual.md"),
            os.path.join(submission_dir, "user_manual.pdf"),
            "Suite Operation & End-User Instruction Manual"
        )
    ]

    for src, dest, title in docs:
        convert_md_to_pdf(src, dest, title)

if __name__ == '__main__':
    main()
