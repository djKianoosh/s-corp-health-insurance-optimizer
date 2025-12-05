# S-Corp Health Insurance Optimizer

![App Screenshot](./screenshot.png)

## Purpose

This application is a financial modeling tool designed specifically for S-Corp owners (2% shareholders). It helps navigate the complex decision between two primary health insurance funding strategies:

1.  **S-Corp Deduction Path (SEHI):** The traditional route where the S-Corp pays premiums, reported as W-2 wages, and deducted on the personal return.
2.  **ACA Subsidies Path (PTC):** An alternative strategy where premiums are paid personally to qualify for the Premium Tax Credit (PTC) under the Affordable Care Act, often optimized via Tax-Loss Harvesting to reduce Modified Adjusted Gross Income (MAGI).

The tool provides real-time comparisons of net after-tax costs, visualizes the "ACA Cliff" impact for 2026, and models total healthcare liability including deductibles and out-of-pocket maximums.

## Privacy & Security

**Your data is private.**

*   **Client-Side Processing:** All financial calculations are performed entirely within your browser using React.
*   **No Database:** This application does not connect to a database or backend server to store your personal financial data.
*   **AI Analysis:** If you use the "AI Financial Advisor" feature, the specific inputs visible on the screen are sent to Google's Gemini API solely to generate the analysis. This data is not used to train models and is not stored by this application.

## Features

*   **Detailed Pay Stub Calculator:** Inputs for S-Corp owner and spouse gross pay, taxes, and deductions.
*   **MAGI Optimization:** Models the impact of pre-tax deductions (401k, HSA) and Tax-Loss Harvesting on ACA subsidy eligibility.
*   **ACA Cliff Visualization:** Automatically detects if household income exceeds 400% FPL (for 2026 rules) and removes subsidies accordingly.
*   **Total Cost Modeling:** Compares scenarios based on Low, Medium, and High medical usage years, factoring in plan deductibles and coinsurance.
*   **AI-Powered Insights:** Uses Google Gemini 2.5 with Search Grounding to provide up-to-date, context-aware financial context.

## License

MIT