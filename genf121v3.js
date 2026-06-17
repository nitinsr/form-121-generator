const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");

const records = require("./data.json");

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique"
  }
};

const printer = new PdfPrinter(fonts);

function cell(text = "", options = {}) {
  return {
    text: String(text),
    fontSize: 9,
    margin: [5, 4, 5, 4],
    ...options
  };
}

function valueCell(text = "") {
  return cell(text, {
    alignment: "center",
    margin: [5, 7, 5, 4]
  });
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function getTaxYearShort(taxYear) {
  if (!taxYear) return "";

  const [startYear, endYear] = String(taxYear).split("-");

  if (!startYear || !endYear) return taxYear;

  return `${startYear.slice(-2)}-${endYear.slice(-2)}`;
}

function calculateAggregateCurrentIncome(data) {
  return Number(data.estimatedIncome || 0) + Number(data.aggregateEarlierIncome || 0);
}

function getItrRows(data) {
  const rows = data.itrPreviousTwoYears || [];

  if (!rows.length) {
    return [
      ["NA", "NA", "NA", "NA"],
      ["NA", "NA", "NA", "NA"]
    ];
  }

  const normalizedRows = rows.slice(0, 2).map((row, index) => [
    row.slNo || String(index + 1),
    row.taxYear || "NA",
    row.acknowledgementNo || "NA",
    row.returnIncome || "NA"
  ]);

  while (normalizedRows.length < 2) {
    normalizedRows.push(["NA", "NA", "NA", "NA"]);
  }

  return normalizedRows;
}

function sanitizeFileName(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

function getOutputFileName(data) {
  const bondName = sanitizeFileName(data.bondName || "Bond");
  const isin = sanitizeFileName(data.isin || "ISIN");
  const name = sanitizeFileName(data.name || "Name");

  return `form121_${bondName}_${isin}_${name}.pdf`;
}

async function generateForm121(data, outputPath) {
  const taxYearShort = getTaxYearShort(data.taxYear);
  const aggregateCurrentIncome = calculateAggregateCurrentIncome(data);
  const itrRows = getItrRows(data);

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [32, 28, 32, 28],
    defaultStyle: {
      font: "Helvetica",
      fontSize: 9
    },
    content: [
      {
        text: "FORM NO. 121",
        bold: true,
        alignment: "center",
        fontSize: 15,
        margin: [0, 0, 0, 2]
      },
      {
        text: "[See rule 211]",
        italics: true,
        alignment: "center",
        fontSize: 9
      },
      {
        text:
          "Declaration under section 393(6) for receipt of certain incomes without deduction of tax",
        alignment: "center",
        fontSize: 10,
        margin: [0, 2, 0, 3]
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 530,
            y2: 0,
            lineWidth: 1
          }
        ],
        margin: [0, 0, 0, 8]
      },
      {
        text: "PART A",
        bold: true,
        alignment: "center",
        fontSize: 12,
        margin: [0, 0, 0, 4]
      },
      {
        text:
          "[To be Filled by the person for receipt of certain incomes without deduction of tax]",
        bold: true,
        alignment: "center",
        fontSize: 9,
        margin: [0, 0, 0, 8]
      },
      {
        table: {
          widths: [38, 205, "*"],
          body: [
            [
              cell("Details of the declarant", {
                colSpan: 3,
                bold: true,
                fontSize: 10
              }),
              {},
              {}
            ],
            ["1.", cell("Name"), valueCell(data.name)],
            ["2.", cell("Address"), valueCell(data.address)],
            ["3.", cell("Permanent Account Number"), valueCell(data.pan)],
            ["4.", cell("Status"), valueCell(data.status)],
            ["5.", cell("Residential status"), valueCell("Resident")],
            [
              "5(a).",
              cell(
                "If resident individual, whether age is 60 years or more at any time during the tax year"
              ),
              valueCell(data.isSenior ? "Yes" : "No")
            ],
            ["6.", cell("Email id"), valueCell(data.email)],
            [
              "7.",
              cell("Contact number"),
              valueCell(`${data.countryCode} ${data.contactNumber}`)
            ],
            [
              "8.",
              cell("Tax Year (for which declaration is made)"),
              valueCell(taxYearShort)
            ],
            [
              cell("Details of income", {
                colSpan: 3,
                bold: true,
                fontSize: 10
              }),
              {},
              {}
            ],
            ["9.", cell("Nature of income"), valueCell(data.natureOfIncome)],
            [
              "10.",
              cell("Estimated income for which declaration is made"),
              valueCell(formatAmount(data.estimatedIncome))
            ],
            [
              "11.",
              cell(
                "Details of Form No. 121 other than this form filed during the tax year, if any"
              ),
              valueCell(data.form121FiledEarlier || "No")
            ],
            [
              "11(a).",
              cell("Total number of Form No. 121 filed earlier"),
              valueCell(data.totalFormsFiledEarlier || 0)
            ],
            [
              "11(b).",
              cell("Aggregate amount of income for which Form No. 121 were filed"),
              valueCell(formatAmount(data.aggregateEarlierIncome))
            ],
            [
              "12.",
              cell(
                "Aggregate amount of income for which declaration is made during the tax year [sum of column 10 and 11(b)]"
              ),
              valueCell(formatAmount(aggregateCurrentIncome))
            ],
            [
              "13.",
              cell(
                "Estimated total income of the tax year including the income mentioned in column 12"
              ),
              valueCell(formatAmount(data.estimatedTotalIncome))
            ],
            [
              "14.",
              {
                colSpan: 2,
                stack: [
                  cell("Details of the ITR filed for previous two tax years"),
                  {
                    table: {
                      widths: [40, 90, 160, "*"],
                      body: [
                        [
                          cell("Sl No"),
                          cell("Tax Year"),
                          cell("Acknowledgement No"),
                          cell("Return Income")
                        ],
                        itrRows[0].map(v => cell(v)),
                        itrRows[1].map(v => cell(v))
                      ]
                    },
                    layout: {
                      hLineWidth: () => 0.8,
                      vLineWidth: () => 0.8
                    },
                    margin: [0, 5, 0, 8]
                  }
                ]
              },
              {}
            ]
          ].map(row =>
            row.map(item =>
              typeof item === "string"
                ? cell(item, { alignment: "center" })
                : item
            )
          )
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8
        }
      },
      {
        text: "DECLARATION",
        pageBreak: "before",
        bold: true,
        alignment: "center",
        fontSize: 12,
        margin: [0, 45, 0, 50]
      },
      {
        text: [
          "I, ",
          {
            text: data.name || "________________________",
            bold: true,
            decoration: "underline"
          },
          ", having Permanent Account Number ",
          {
            text: data.pan || "________________________",
            bold: true,
            decoration: "underline"
          },
          " do hereby declare that:"
        ],
        fontSize: 10,
        margin: [0, 0, 0, 12]
      },
      {
        table: {
          widths: [28, "*"],
          body: [
            [
              cell("(i)", { border: [false, false, false, false] }),
              cell(
                "to the best of my knowledge and belief what is stated above is correct, complete and is truly stated.",
                { border: [false, false, false, false] }
              )
            ],
            [
              cell("(ii)", { border: [false, false, false, false] }),
              cell(
                "the incomes referred to in this form are not includible in the total income of any other person under sections 96 to 99",
                { border: [false, false, false, false] }
              )
            ],
            [
              cell("(iii)", { border: [false, false, false, false] }),
              cell(
                `tax on my estimated total income as referred to in column 13 of Part A including the income referred to in column 12 of Part A for tax year ${taxYearShort} will be nil.`,
                { border: [false, false, false, false] }
              )
            ],
            [
              cell("(iv)", { border: [false, false, false, false] }),
              cell(
                `my income as referred to in column 12 of Part A does not exceed the maximum amount not chargeable to tax for tax year ${taxYearShort}.`,
                { border: [false, false, false, false] }
              )
            ],
            [
              cell("(v)", { border: [false, false, false, false] }),
              cell(
                "in case this declaration is found to be false, I shall be liable to prosecution/penalty under the Act.",
                { border: [false, false, false, false] }
              )
            ]
          ]
        },
        layout: "noBorders"
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              {
                text: `Place: ${data.place}`,
                margin: [0, 65, 0, 18],
                fontSize: 10
              },
              {
                text: `Date: ${data.declarationDate}`,
                fontSize: 10
              }
            ]
          },
          {
            width: "50%",
            stack: [
              {
                text: "Signature of the Declarant",
                alignment: "right",
                margin: [0, 65, 0, 18],
                fontSize: 10
              },
              {
                text: `Name: ${data.name}`,
                alignment: "right",
                fontSize: 10
              }
            ]
          }
        ]
      }
    ]
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(outputPath);

    pdfDoc.pipe(stream);
    pdfDoc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

async function generateAllPdfs() {
  const outputDir = path.join(__dirname, "output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const record of records) {
    const fileName = getOutputFileName(record);
    const outputPath = path.join(outputDir, fileName);

    await generateForm121(record, outputPath);
    console.log(`Generated: ${outputPath}`);
  }
}

generateAllPdfs().catch(error => {
  console.error("PDF generation failed:", error);
});