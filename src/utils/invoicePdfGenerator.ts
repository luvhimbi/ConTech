// src/utils/invoicePdfGenerator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "../services/invoiceService";

type UserProfileForDocs = {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
};

const money = (n: number) => `R${(Number(n) || 0).toFixed(2)}`;

const safeDate = (d: any) => {
    try {
        if (!d) return "";
        const dt = d instanceof Date ? d : new Date(d);
        return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString();
    } catch {
        return "";
    }
};

const trimOrEmpty = (v: any) => (typeof v === "string" ? v.trim() : "");

const nonEmpty = (v: any) => {
    const s = trimOrEmpty(v);
    return s.length ? s : "";
};

const asNumber = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
};

export const generateInvoicePDF = (
    invoice: Invoice,
    userProfile: UserProfileForDocs,
    projectName?: string
) => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    let y = 14;

    // NEW: Billing block from invoice.billing (fallback to profile)
    const billing = invoice.billing || ({} as any);

    const companyName = nonEmpty(billing.businessName) || nonEmpty(userProfile.companyName) || "Company";
    const companyEmail = nonEmpty(billing.email) || nonEmpty(userProfile.email) || "";
    const companyPhone = nonEmpty(billing.phone) || "";
    const companyAddress = nonEmpty(billing.address) || "";
    const contactName =
        nonEmpty(billing.contactName) ||
        `${trimOrEmpty(userProfile.firstName)} ${trimOrEmpty(userProfile.lastName)}`.trim();

    // ===== Header =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(companyName, marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    y += 6;
    if (contactName) doc.text(`Prepared by: ${contactName}`, marginX, y);

    y += 5;
    if (companyEmail) doc.text(`Email: ${companyEmail}`, marginX, y);

    y += 5;
    if (companyPhone) doc.text(`Phone: ${companyPhone}`, marginX, y);

    if (companyAddress) {
        y += 5;
        const addrLines = doc.splitTextToSize(companyAddress, 90);
        doc.text(addrLines, marginX, y);
        y += addrLines.length * 5;
    }

    // Right side header block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INVOICE", pageWidth - marginX, 14, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber || ""}`, pageWidth - marginX, 20, { align: "right" });
    doc.text(`Date: ${safeDate(invoice.createdAt)}`, pageWidth - marginX, 25, { align: "right" });
    doc.text(`Due: ${safeDate(invoice.dueDate)}`, pageWidth - marginX, 30, { align: "right" });

    if (projectName) {
        doc.text(`Project: ${projectName}`, pageWidth - marginX, 35, { align: "right" });
    }

    // Divider line
    y = Math.max(y, 42);
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    // ===== Client info =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Bill To", marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 6;

    doc.text(invoice.clientName || "", marginX, y);
    y += 5;

    doc.text(invoice.clientEmail || "", marginX, y);
    y += 5;

    const clientPhone = nonEmpty(invoice.clientPhone);
    if (clientPhone) {
        doc.text(clientPhone, marginX, y);
        y += 5;
    }

    if (invoice.clientAddress) {
        const addrLines = doc.splitTextToSize(invoice.clientAddress, 90);
        doc.text(addrLines, marginX, y);
        y += addrLines.length * 5;
    } else {
        y += 2;
    }

    // ===== Items table =====
    y += 6;

    const itemsBody = (invoice.items || []).map((it, idx) => {
        const qty = asNumber(it.quantity);
        const price = asNumber(it.unitPrice);
        const total = asNumber(it.total) || qty * price;

        return [String(idx + 1), it.description || "", String(qty), money(price), money(total)];
    });

    autoTable(doc, {
        startY: y,
        head: [["#", "Description", "Qty", "Unit Price", "Total"]],
        body: itemsBody.length ? itemsBody : [["-", "No items", "-", "-", "-"]],
        styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [245, 245, 245],
            textColor: 20,
            fontStyle: "bold",
        },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 92 },
            2: { cellWidth: 16, halign: "right" },
            3: { cellWidth: 28, halign: "right" },
            4: { cellWidth: 28, halign: "right" },
        },
        margin: { left: marginX, right: marginX },
    });

    let cursorY = (doc as any).lastAutoTable?.finalY ?? y + 20;

    // ===== Milestones table (phases) =====
    const milestones = Array.isArray((invoice as any).milestones) ? (invoice as any).milestones : [];
    const hasMilestones = milestones.length > 0;

    if (hasMilestones) {
        cursorY += 10;

        // add page if needed
        if (cursorY + 40 > pageHeight - 14) {
            doc.addPage();
            cursorY = 14;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Milestones / Phases", marginX, cursorY);

        const milestoneBody = milestones.map((m: any, idx: number) => {
            const title = m.title || "";
            const desc = m.description || "";
            const amount = money(asNumber(m.amount));
            const due = safeDate(m.dueDate);
            const status = (m.status || "").toString();

            return [
                String(idx + 1),
                title,
                desc,
                amount,
                due,
                status,
            ];
        });

        autoTable(doc, {
            startY: cursorY + 4,
            head: [["#", "Title", "Description", "Amount", "Due", "Status"]],
            body: milestoneBody,
            styles: {
                font: "helvetica",
                fontSize: 8.5,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [245, 245, 245],
                textColor: 20,
                fontStyle: "bold",
            },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 38 },
                2: { cellWidth: 58 },
                3: { cellWidth: 24, halign: "right" },
                4: { cellWidth: 20 },
                5: { cellWidth: 18 },
            },
            margin: { left: marginX, right: marginX },
        });

        cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 30;
    }

    // ===== Deposit + Totals box =====
    cursorY += 10;

    // add page if needed
    if (cursorY + 45 > pageHeight - 14) {
        doc.addPage();
        cursorY = 14;
    }

    const deposit = (invoice as any).deposit || { enabled: false, ratePercent: 0, amount: 0 };
    const depositEnabled = Boolean(deposit.enabled);
    const depositRate = asNumber(deposit.ratePercent);
    const depositAmount = asNumber(deposit.amount);
    const depositDue = safeDate(deposit.dueDate);

    // Totals box (right)
    const boxWidth = 75;
    const boxX = pageWidth - marginX - boxWidth;

    doc.setDrawColor(230);
    doc.rect(boxX, cursorY, boxWidth, depositEnabled ? 40 : 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const labelX = boxX + 6;
    const valueX = boxX + boxWidth - 6;

    doc.text("Subtotal:", labelX, cursorY + 8);
    doc.text(money(invoice.subtotal), valueX, cursorY + 8, { align: "right" });

    doc.text(`Tax (${asNumber(invoice.taxRate)}%):`, labelX, cursorY + 14);
    doc.text(money(invoice.taxAmount), valueX, cursorY + 14, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Total:", labelX, cursorY + 22);
    doc.text(money(invoice.totalAmount), valueX, cursorY + 22, { align: "right" });

    // Deposit line
    if (depositEnabled) {
        doc.setFont("helvetica", "normal");
        doc.text(`Deposit (${depositRate}%):`, labelX, cursorY + 30);
        doc.text(money(depositAmount), valueX, cursorY + 30, { align: "right" });

        if (depositDue) {
            doc.setFontSize(9);
            doc.setTextColor(90);
            doc.text(`Deposit due: ${depositDue}`, labelX, cursorY + 37);
            doc.setTextColor(0);
            doc.setFontSize(10);
        }
    }

    // ===== Payment / Banking details block (left) =====
    const hasBank =
        nonEmpty(billing.bankName) ||
        nonEmpty(billing.accountName) ||
        nonEmpty(billing.accountNumber) ||
        nonEmpty(billing.branchCode) ||
        nonEmpty(billing.accountType) ||
        nonEmpty(billing.paymentReferenceNote);

    const leftBlockX = marginX;
    let leftY = cursorY;

    if (hasBank) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Payment Details", leftBlockX, leftY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        leftY += 6;
        const lines: string[] = [];

        if (nonEmpty(billing.bankName)) lines.push(`Bank: ${billing.bankName}`);
        if (nonEmpty(billing.accountName)) lines.push(`Account Name: ${billing.accountName}`);
        if (nonEmpty(billing.accountNumber)) lines.push(`Account No: ${billing.accountNumber}`);
        if (nonEmpty(billing.branchCode)) lines.push(`Branch Code: ${billing.branchCode}`);
        if (nonEmpty(billing.accountType)) lines.push(`Account Type: ${billing.accountType}`);
        if (nonEmpty(billing.paymentReferenceNote))
            lines.push(`Reference: ${billing.paymentReferenceNote}`);

        const wrapped = doc.splitTextToSize(lines.join("\n"), pageWidth - marginX * 2 - boxWidth - 10);
        doc.text(wrapped, leftBlockX, leftY);
    }

    // ===== Footer =====
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Generated by CONTECH", marginX, footerY);

    // Download
    const fileName = `${invoice.invoiceNumber || "invoice"}.pdf`;
    doc.save(fileName);
};
