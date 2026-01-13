# Resume to Candidate Profile Summarizer

## Overview

Recruiters spend significant time manually reviewing resumes that come in different formats and levels of detail. This project automates the **conversion of unstructured resumes into structured candidate profiles** using Generative AI, helping recruiters quickly understand a candidate’s background while keeping final hiring decisions fully human-driven.

The system focuses strictly on **information extraction and summarization**, not candidate ranking or hiring predictions.

---

## Problem Statement

Resume screening is a time-consuming and inconsistent process due to:

* Varied resume formats (PDF, DOCX)
* Unstructured and verbose content
* Manual effort required to extract key details

This leads to slower screening and inconsistent evaluations.

---

## Solution

This project provides an AI-powered pipeline that:

1. Accepts resumes in PDF or DOCX format
2. Extracts plain text from the document
3. Uses a Large Language Model (LLM) to generate a **structured candidate profile**
4. Optionally compares the resume with a provided Job Description (JD) to highlight overlapping skills

The output is returned in a clean, consistent JSON format.

---

## Key Features

* Resume text extraction (PDF / DOCX)
* Structured candidate profile generation
* Optional Job Description matching (no scoring)
* JSON-based output for easy integration
* Fast and explainable results

---

## Scope and Limitations

### In Scope

* Resume summarization
* Skill, education, and experience extraction
* JD overlap highlighting

### Out of Scope

* Candidate ranking or scoring
* Hiring recommendations
* Predictive analytics
* Bias-sensitive decision automation

---

## System Architecture

```
Resume (PDF/DOCX)
        ↓
Text Extraction
        ↓
Prompted LLM
        ↓
Structured Candidate Profile (JSON)
```

---

## Input and Output

### Input

* Resume file (PDF or DOCX)
* Optional Job Description (plain text)

### Output Schema

```json
{
  "name": "",
  "total_experience_years": "",
  "current_role": "",
  "current_company": "",
  "key_skills": [],
  "education": [],
  "industry_domain": "",
  "professional_summary": "",
  "jd_match_highlights": []
}
```

**Rule:** If any information is not present in the resume, the system returns `"Not mentioned"`.

---



## Run Locally

**Prerequisites:**  Node.js


1. Run the RunApp.bat
   
