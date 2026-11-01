# S-Corp Health Insurance Optimizer

![App Screenshot](./screenshot.png)

## Purpose

This application is a financial modeling tool designed specifically for S-Corp owners (2% shareholders). It helps navigate the complex decision between two primary health insurance funding strategies:

1.  **S-Corp Deduction Path (SEHI):** The traditional route where the S-Corp pays premiums, reported as W-2 wages, and deducted on the personal return.
2.  **ACA Subsidies Path (PTC):** An alternative strategy where premiums are paid personally to qualify for the Premium Tax Credit (PTC) under the Affordable Care Act, often optimized via Tax-Loss Harvesting to reduce Modified Adjusted Gross Income (MAGI).

The tool provides real-time comparisons of net after-tax costs, visualizes the "ACA Cliff" impact for 2027, and models total healthcare liability including deductibles and out-of-pocket maximums.

## Privacy & Security

**Your data is private.**

*   **Client-Side Processing:** All financial calculations are performed entirely within your browser using React.
*   **No Database:** This application does not connect to a database or backend server to store your personal financial data.
*   **AI Analysis:** If you use the "AI Financial Advisor" feature, the specific inputs visible on the screen are sent to Google's Gemini API solely to generate the analysis. This data is not used to train models and is not stored by this application.

## Features

*   **Detailed Pay Stub Calculator:** Inputs for S-Corp owner and spouse gross pay, taxes, and deductions updated for 2027 rules.
*   **MAGI Optimization:** Models the impact of pre-tax deductions (401k, HSA up to 2027 limits of $4,500 individual / $9,000 family) and Tax-Loss Harvesting on ACA subsidy eligibility.
*   **2027 ACA Cliff & Policy Modeling:** Features a 2027 subsidy policy toggle between standard Strict 400% FPL Cliff and Enhanced Subsidies (Extension Scenario), with gap-to-cliff calculations.
*   **2027 Statutory HDHP Presets:** Quick-select presets for 2027 Individual HDHP ($1,750 deductible / $8,700 OOP max) and Family HDHP ($3,500 deductible / $17,400 OOP max).
*   **Total Cost Modeling:** Compares scenarios based on Low, Medium, and High medical usage years, factoring in plan deductibles and coinsurance.
*   **AI-Powered Insights:** Uses Google Gemini 3.8 Flash with Search Grounding to provide up-to-date, context-aware financial context grounded in 2027 IRS notices and Form 8962 rules.

## License

MIT