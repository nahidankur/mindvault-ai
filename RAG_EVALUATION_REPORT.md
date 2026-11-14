# MindVault AI — RAG Evaluation Report
> **Benchmark Dataset:** 30 Comprehensive Test Cases  
> **Evaluation Mode:** Zero-Cost Automated Evaluation Harness  
> **Evaluated On:** 2026-11-14T17:23:14.916Z

---

## 1. Executive Summary

| Metric | Score | Target Threshold | Status |
| :--- | :--- | :--- | :--- |
| **Overall Pass Rate** | **100.0%** | >= 90% | **PASSED** |
| **Retrieval Recall@5** | **98.6%** | >= 85% | **PASSED** |
| **Abstention Accuracy** | **100.0%** | >= 95% | **PASSED** |
| **Cross-Tenant Leakage** | **0% (Zero)** | 0% | **PASSED (100% Isolated)** |

---

## 2. Category Breakdown

| Category | Cases | Passed | Accuracy |
| :--- | :--- | :--- | :--- |
| **Single-Document Explicit** | 10 | 10 | 100% |
| **Multi-Document Synthesis** | 5 | 5 | 100% |
| **Strict Abstention (Absent Data)** | 5 | 5 | 100% |
| **Distractor & Misleading** | 5 | 5 | 100% |
| **Exact Keyword & Identifiers** | 3 | 3 | 100% |
| **Cross-Tenant Security** | 2 | 2 | 100% |

---

## 3. Individual Test Case Results

- **[PASS] tc-01** (single_doc_explicit): "What is the refund policy duration for premium memberships?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-02** (single_doc_explicit): "How many days of remote work are permitted per week?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-03** (single_doc_explicit): "What database engine and vector extension is MindVault AI using?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-04** (single_doc_explicit): "What is the default port for the NestJS API server?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-05** (single_doc_explicit): "What is the target chunk size in tokens for the text splitter?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-06** (single_doc_explicit): "Which embedding model is used and what is its output dimension?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-07** (single_doc_explicit): "What is the password hashing algorithm and salt rounds?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-08** (single_doc_explicit): "What rate limit is configured on Gemini embedding calls?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-09** (single_doc_explicit): "What constant is used for Reciprocal Rank Fusion?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-10** (single_doc_explicit): "What frontend framework and version is utilized?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-11** (multi_doc_synthesis): "Combine the revenue target from Q3 and the marketing budget for Q4."  
  *Observation:* High recall (100%) with 2 relevant chunks
- **[PASS] tc-12** (multi_doc_synthesis): "What is the full backend tech stack combination?"  
  *Observation:* High recall (67%) with 1 relevant chunks
- **[PASS] tc-13** (multi_doc_synthesis): "Who is the project manager and what is the target launch date?"  
  *Observation:* High recall (100%) with 2 relevant chunks
- **[PASS] tc-14** (multi_doc_synthesis): "What are the primary colors used for UI branding and where are they defined?"  
  *Observation:* High recall (100%) with 2 relevant chunks
- **[PASS] tc-15** (multi_doc_synthesis): "What are the two search methods merged in hybrid retrieval?"  
  *Observation:* High recall (100%) with 2 relevant chunks
- **[PASS] tc-16** (strict_abstention): "What is the secret recipe for Coca-Cola?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-17** (strict_abstention): "Who won the 2022 FIFA World Cup?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-18** (strict_abstention): "What is the stock price of Apple right now?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-19** (strict_abstention): "What is the CEO personal phone number?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-20** (strict_abstention): "What were our company earnings in the year 1995?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-21** (distractor_misleading): "What is the warranty period for Laptop model X1?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-22** (distractor_misleading): "Which cloud database host is used for production?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-23** (distractor_misleading): "What is the retention period for deleted notes?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-24** (distractor_misleading): "What is the maximum character size for pasted notes?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-25** (distractor_misleading): "Which Redis provider was chosen to avoid command limits?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-26** (exact_keyword): "What is the exact name of the queue constant?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-27** (exact_keyword): "What is the exact database table name for chunks?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-28** (exact_keyword): "What is the exact index operator for HNSW cosine distance?"  
  *Observation:* High recall (100%) with 1 relevant chunks
- **[PASS] tc-29** (cross_tenant_isolation): "What is the salary of User Beta?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
- **[PASS] tc-30** (cross_tenant_isolation): "What is User Gamma secret project codename?"  
  *Observation:* Successfully abstained due to insufficient context / tenant boundary
