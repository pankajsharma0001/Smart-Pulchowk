import PDFDocument from "pdfkit";

/**
 * Converts an array of objects to a CSV string.
 */
export function jsonToCsv(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
}

/**
 * Generates a PDF from an array of objects.
 */
export async function generatePdf(title: string, subtitle: string, data: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: any[] = [];

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Title
        doc.fontSize(20).text(title, { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(subtitle, { align: "center" });
        doc.moveDown(2);

        if (data.length === 0) {
            doc.fontSize(12).text("No data available.");
        } else {
            const headers = Object.keys(data[0]);
            const colWidth = (doc.page.width - 100) / headers.length;

            // Draw Headers
            let currentY = doc.y;
            headers.forEach((header, i) => {
                doc.fontSize(10).font("Helvetica-Bold").text(header, 50 + i * colWidth, currentY, { width: colWidth });
            });
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
            doc.moveDown(0.5);

            // Draw Rows
            data.forEach(row => {
                currentY = doc.y;

                // Check for page break
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = doc.page.margins.top;

                    // Redraw headers on new page
                    headers.forEach((header, i) => {
                        doc.fontSize(10).font("Helvetica-Bold").text(header, 50 + i * colWidth, currentY, { width: colWidth });
                    });
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
                    doc.moveDown(0.5);
                    currentY = doc.y;
                }

                headers.forEach((header, i) => {
                    doc.fontSize(9).font("Helvetica").text('' + (row[header] ?? ''), 50 + i * colWidth, currentY, { width: colWidth });
                });
                doc.moveDown();
            });
        }

        doc.end();
    });
}
