# Form 121 PDF Generator

A Node.js utility that generates **Form No. 121** PDF declarations from JSON input data.

The utility reads records from a JSON file and generates one PDF per record using a template based on the Form No. 121 declaration format.

---

## Features

* Generate Form No. 121 PDFs from JSON data
* Supports multiple records in a single run
* Creates one PDF per declarant
* Automatically calculates:

  * Aggregate amount of income for declaration (Column 12)
* Supports previous two years ITR details
* Automatically fills "NA" for missing ITR details
* Generates PDF filenames using:

  * Bond Name
  * ISIN
  * Declarant Name
* Uses async/await for PDF generation
* Outputs PDFs to a dedicated `output` directory

---

## Prerequisites

### Node.js

Node.js version 18 or later is recommended.

Verify installation:

```bash
node -v
npm -v
```

---

## Installation

Clone or download the project.

Install dependencies:

```bash
npm install pdfmake@0.2.10
```

---

## Project Structure

```text
project/
│
├── genf121v3.js
├── data.json
├── output/
└── README.md
```

---

## Input Data

The application expects an array of records in `data.json`.

Example:

```json
[
  {
    "name": "Nitin Sharma",
    "address": "Flat 101, India",
    "pan": "ABCDE1234F",
    "isSenior": false,
    "email": "nitin@example.com",
    "countryCode": "+91",
    "contactNumber": "501234567",
    "status": "Individual",
    "taxYear": "2026-2027",
    "natureOfIncome": "Interest on securities",
    "place": "India",
    "declarationDate": "2026-04-01",

    "isin": "INE123A01016",
    "bondName": "ABC Bond",

    "estimatedIncome": 100000,
    "form121FiledEarlier": "No",
    "totalFormsFiledEarlier": 0,
    "aggregateEarlierIncome": 0,
    "estimatedTotalIncome": 400000,

    "itrPreviousTwoYears": []
  }
]
```

---

## Supported Fields

### Declarant Information

| Field           | Type    | Required |
| --------------- | ------- | -------- |
| name            | string  | Yes      |
| address         | string  | Yes      |
| pan             | string  | Yes      |
| isSenior        | boolean | Yes      |
| email           | string  | Yes      |
| countryCode     | string  | Yes      |
| contactNumber   | string  | Yes      |
| status          | string  | Yes      |
| taxYear         | string  | Yes      |
| place           | string  | Yes      |
| declarationDate | string  | Yes      |

---

### Income Details

| Field                  | Type   | Required |
| ---------------------- | ------ | -------- |
| natureOfIncome         | string | Yes      |
| estimatedIncome        | number | Yes      |
| form121FiledEarlier    | string | No       |
| totalFormsFiledEarlier | number | No       |
| aggregateEarlierIncome | number | No       |
| estimatedTotalIncome   | number | Yes      |

---

### Bond Information

| Field    | Type   | Required |
| -------- | ------ | -------- |
| bondName | string | Yes      |
| isin     | string | Yes      |

---

### Previous ITR Details

Provide up to two records.

Example:

```json
"itrPreviousTwoYears": [
  {
    "slNo": "1",
    "taxYear": "2024-2025",
    "acknowledgementNo": "123456789",
    "returnIncome": "350000"
  },
  {
    "slNo": "2",
    "taxYear": "2023-2024",
    "acknowledgementNo": "987654321",
    "returnIncome": "325000"
  }
]
```

If no records are supplied:

```json
"itrPreviousTwoYears": []
```

The PDF will display:

```text
NA | NA | NA | NA
NA | NA | NA | NA
```

---

## Calculations

### Column 12

The following value is calculated automatically:

```text
Aggregate amount of income for which declaration is made during the tax year
```

Formula:

```text
Column 12 = Estimated Income + Aggregate Earlier Income
```

Example:

```text
Estimated Income = 100000
Aggregate Earlier Income = 50000

Column 12 = 150000
```

---

## Tax Year Formatting

Input:

```text
2026-2027
```

Displayed in PDF:

```text
26-27
```

---

## PDF Naming Convention

Generated PDF filenames follow the format:

```text
form121_<BondName>_<ISIN>_<Name>.pdf
```

Example:

```text
form121_ABC_Bond_INE123A01016_Nitin_Sharma.pdf
```

Invalid filename characters are automatically removed.

---

## Running the Utility

Generate PDFs:

```bash
node genf121v3.js
```

Example output:

```text
Generated: output/form121_ABC_Bond_INE123A01016_Nitin_Sharma.pdf
Generated: output/form121_XYZ_Bond_INE987B01012_Rahul_Verma.pdf
```

---

## Output Directory

All generated PDFs are saved to:

```text
output/
```

Example:

```text
output/
├── form121_ABC_Bond_INE123A01016_Nitin_Sharma.pdf
├── form121_XYZ_Bond_INE987B01012_Rahul_Verma.pdf
└── form121_DEF_Bond_INE456C01020_Amit_Kumar.pdf
```

---

## Error Handling

The utility handles:

* Missing ITR records
* Invalid filename characters
* Missing optional fields
* PDF generation failures
* File write errors

Errors are logged to the console:

```text
PDF generation failed: <error message>
```

---

## Dependency Versions

| Package | Version |
| ------- | ------- |
| pdfmake | 0.2.10  |
| Node.js | >=18    |

---

## Notes

* One PDF is generated per JSON record.
* PDF generation is performed sequentially using async/await.
* The generated form is based on Form No. 121.
* Name and PAN are rendered in bold and underlined in the declaration section.
* Tax year is displayed in short format (e.g. 26-27).
