// src/utils/invoicePdfGenerator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "../services/invoiceService";

type UserProfileForDocs = {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    branding?: {
        logoUrl?: string | null;
        logoPath?: string | null;
    };
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

type TemplateId = "classic" | "modern" | "minimal";

const normalizeTemplateId = (v: any): TemplateId => {
    const t = (typeof v === "string" ? v.trim() : "") as TemplateId;
    if (t === "classic" || t === "modern" || t === "minimal") return t;
    return "classic";
};

type TemplateStyles = {
    titleFontSize: number;
    sectionTitleSize: number;
    headFillColor: [number, number, number];
    headTextColor: number;
    dividerColor: number;
    badgeFillColor?: [number, number, number];
};

const getTemplateStyles = (templateId: TemplateId): TemplateStyles => {
    switch (templateId) {
        case "modern":
            return {
                titleFontSize: 20,
                sectionTitleSize: 11,
                headFillColor: [28, 28, 28],
                headTextColor: 255,
                dividerColor: 40,
                badgeFillColor: [28, 28, 28],
            };
        case "minimal":
            return {
                titleFontSize: 16,
                sectionTitleSize: 10,
                headFillColor: [245, 245, 245],
                headTextColor: 20,
                dividerColor: 220,
            };
        case "classic":
        default:
            return {
                titleFontSize: 18,
                sectionTitleSize: 11,
                headFillColor: [245, 245, 245],
                headTextColor: 20,
                dividerColor: 220,
            };
    }
};

/** ---------------- LOGO HELPERS ---------------- **/

type ImgType = "PNG" | "JPEG"|"JFIF";

/**
 * Convert an image URL into a dataURL so jsPDF can embed it.
 * - Works for Firebase Storage download URLs if CORS allows it.
 * - If CORS blocks it, use a base64 logoUrl instead (recommended).
 */
const urlToDataUrl = async (url: string): Promise<{ dataUrl: string; imgType: ImgType }> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch logo: ${res.status}`);
    const blob = await res.blob();

    const mime = (blob.type || "").toLowerCase();
    const imgType: ImgType = mime.includes("png") ? "PNG" : "JPEG";

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read logo file"));
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(blob);
    });

    return { dataUrl, imgType };
};

const isDataUrl = (v: string) => typeof v === "string" && v.startsWith("data:image/");

const inferImgTypeFromDataUrl = (dataUrl: string): ImgType => {
    const lower = dataUrl.toLowerCase();
    if (lower.startsWith("data:image/png")) return "PNG";
    return "JPEG";
};

/**
 * Draw a logo inside a fixed box, maintaining aspect ratio.
 * Returns true if drawn, false if not.
 */
const drawLogo = async (
    doc: jsPDF,
    logoUrlMaybe: string | null | undefined,
    x: number,
    y: number,
    boxW: number,
    boxH: number
): Promise<boolean> => {
    const logoUrl = (logoUrlMaybe || "").trim();
    if (!logoUrl) return false;

    try {
        let dataUrl = logoUrl;
        let imgType: ImgType;

        if (isDataUrl(logoUrl)) {
            imgType = inferImgTypeFromDataUrl(logoUrl);
        } else {
            const converted = await urlToDataUrl(logoUrl);
            dataUrl = converted.dataUrl;
            imgType = converted.imgType;
        }

        // Load image to get natural size for aspect ratio
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Logo image failed to load"));
            i.src = dataUrl;
        });

        const iw = img.naturalWidth || 1;
        const ih = img.naturalHeight || 1;
        const scale = Math.min(boxW / iw, boxH / ih);

        const drawW = iw * scale;
        const drawH = ih * scale;

        const dx = x + (boxW - drawW) / 2;
        const dy = y + (boxH - drawH) / 2;

        doc.addImage(dataUrl, imgType, dx, dy, drawW, drawH);
        return true;
    } catch (e) {
        // Don’t break invoice generation if logo fails
        console.warn("Logo not added to PDF:", e);
        return false;
    }
};

/** ---------------- MAIN ---------------- **/

export const generateInvoicePDF = async (
    invoice: Invoice,
    userProfile: UserProfileForDocs,
    projectName?: string
) => {
    const templateId = normalizeTemplateId((invoice as any).templateId);
    const styles = getTemplateStyles(templateId);

    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;

    // Start Y a bit lower if we draw a logo
    let y = 14;

    // Billing block from invoice.billing (fallback to profile)
    const billing = (invoice as any).billing || ({} as any);

    const companyName = nonEmpty(billing.businessName) || nonEmpty(userProfile.companyName) || "Company";
    const companyEmail = nonEmpty(billing.email) || nonEmpty(userProfile.email) || "";
    const companyPhone = nonEmpty(billing.phone) || "";
    const companyAddress = nonEmpty(billing.address) || "";
    const contactName =
        nonEmpty(billing.contactName) ||
        `${trimOrEmpty(userProfile.firstName)} ${trimOrEmpty(userProfile.lastName)}`.trim();

    // ===== Logo (top-left) =====
    // Uses profile.branding.logoUrl by default.
    // - If logoUrl is a Firebase download URL, CORS must allow fetch().
    // - Best: store a base64 dataURL in logoUrl.
    const logoBoxW = 28;
    const logoBoxH = 28;
    const logoX = marginX;
    const logoY = 10;

    const logoUrl = userProfile?.branding?.logoUrl || null;

    const logoDrawn = await drawLogo(doc, logoUrl, logoX, logoY, logoBoxW, logoBoxH);

    // If logo is drawn, shift left header text to the right of logo
    const headerTextX = logoDrawn ? logoX + logoBoxW + 8 : marginX;

    // Make sure y starts below the logo box if drawn
    y = logoDrawn ? Math.max(y, logoY + logoBoxH - 2) : y;

    // ===== Header =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(styles.titleFontSize);
    doc.text(companyName, headerTextX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    y += 6;
    if (contactName) doc.text(`Prepared by: ${contactName}`, headerTextX, y);

    y += 5;
    if (companyEmail) doc.text(`Email: ${companyEmail}`, headerTextX, y);

    y += 5;
    if (companyPhone) doc.text(`Phone: ${companyPhone}`, headerTextX, y);

    if (companyAddress) {
        y += 5;
        const addrLines = doc.splitTextToSize(companyAddress, 90);
        doc.text(addrLines, headerTextX, y);
        y += addrLines.length * 5;
    }

    // Right side header block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INVOICE", pageWidth - marginX, 14, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No: ${(invoice as any).invoiceNumber || ""}`, pageWidth - marginX, 20, { align: "right" });
    doc.text(`Date: ${safeDate((invoice as any).createdAt)}`, pageWidth - marginX, 25, { align: "right" });
    doc.text(`Due: ${safeDate((invoice as any).dueDate)}`, pageWidth - marginX, 30, { align: "right" });

    if (projectName) {
        doc.text(`Project: ${projectName}`, pageWidth - marginX, 35, { align: "right" });
    }

    // Divider line
    y = Math.max(y, 42);
    doc.setDrawColor(styles.dividerColor);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    // ===== Client info =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(styles.sectionTitleSize);
    doc.text("Bill To", marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 6;

    doc.text((invoice as any).clientName || "", marginX, y);
    y += 5;

    doc.text((invoice as any).clientEmail || "", marginX, y);
    y += 5;

    const clientPhone = nonEmpty((invoice as any).clientPhone);
    if (clientPhone) {
        doc.text(clientPhone, marginX, y);
        y += 5;
    }

    if ((invoice as any).clientAddress) {
        const addrLines = doc.splitTextToSize((invoice as any).clientAddress, 90);
        doc.text(addrLines, marginX, y);
        y += addrLines.length * 5;
    } else {
        y += 2;
    }

    // ===== Milestones with Items =====
    const milestones = Array.isArray((invoice as any).milestones) ? (invoice as any).milestones : [];

    let cursorY = y + 8;

    for (let i = 0; i < milestones.length; i++) {
        const ms = milestones[i];

        // page break
        if (cursorY + 40 > pageHeight - 14) {
            doc.addPage();
            cursorY = 14;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(styles.sectionTitleSize);
        doc.text(`Milestone ${i + 1}: ${ms.title || ""}`, marginX, cursorY);

        cursorY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        const desc = nonEmpty(ms.description);
        if (desc) {
            const descLines = doc.splitTextToSize(desc, pageWidth - marginX * 2);
            doc.text(descLines, marginX, cursorY);
            cursorY += descLines.length * 4.5;
        }

        const metaParts: string[] = [];
        const due = safeDate(ms.dueDate);
        if (due) metaParts.push(`Due: ${due}`);
        if (ms.status) metaParts.push(`Status: ${String(ms.status)}`);
        if (metaParts.length) {
            doc.setTextColor(90);
            doc.text(metaParts.join("   •   "), marginX, cursorY);
            doc.setTextColor(0);
            cursorY += 6;
        } else {
            cursorY += 4;
        }

        const items = Array.isArray(ms.items) ? ms.items : [];
        const itemsBody = items.length
            ? items.map((it: any, idx: number) => {
                const qty = asNumber(it.quantity);
                const price = asNumber(it.unitPrice);
                const total = asNumber(it.total) || qty * price;
                return [String(idx + 1), it.description || "", String(qty), money(price), money(total)];
            })
            : [["-", "No items", "-", "-", "-"]];

        autoTable(doc, {
            startY: cursorY,
            head: [["#", "Description", "Qty", "Unit Price", "Total"]],
            body: itemsBody,
            styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: styles.headFillColor,
                textColor: styles.headTextColor,
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

        cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 18;

        // milestone subtotal
        const msSubtotal =
            asNumber(ms.subtotal) || items.reduce((sum: number, it: any) => sum + asNumber(it.total), 0);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Milestone Total:", pageWidth - marginX - 75, cursorY + 8);
        doc.text(money(msSubtotal), pageWidth - marginX, cursorY + 8, { align: "right" });

        cursorY += 16;
    }

    // ===== Totals box =====
    if (cursorY + 50 > pageHeight - 14) {
        doc.addPage();
        cursorY = 14;
    }

    const deposit = (invoice as any).deposit || { enabled: false, ratePercent: 0, amount: 0 };
    const depositEnabled = Boolean(deposit.enabled);
    const depositRate = asNumber(deposit.ratePercent);
    const depositAmount = asNumber(deposit.amount);
    const depositDue = safeDate(deposit.dueDate);

    const boxWidth = 75;
    const boxX = pageWidth - marginX - boxWidth;

    doc.setDrawColor(230);
    doc.rect(boxX, cursorY, boxWidth, depositEnabled ? 40 : 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const labelX = boxX + 6;
    const valueX = boxX + boxWidth - 6;

    doc.text("Subtotal:", labelX, cursorY + 8);
    doc.text(money(asNumber((invoice as any).subtotal)), valueX, cursorY + 8, { align: "right" });

    doc.text(`Tax (${asNumber((invoice as any).taxRate)}%):`, labelX, cursorY + 14);
    doc.text(money(asNumber((invoice as any).taxAmount)), valueX, cursorY + 14, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Total:", labelX, cursorY + 22);
    doc.text(money(asNumber((invoice as any).totalAmount)), valueX, cursorY + 22, { align: "right" });

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

    // ===== Payment details block (left) =====
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
        doc.setFontSize(styles.sectionTitleSize);
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
        if (nonEmpty(billing.paymentReferenceNote)) lines.push(`Reference: ${billing.paymentReferenceNote}`);

        const wrapped = doc.splitTextToSize(lines.join("\n"), pageWidth - marginX * 2 - boxWidth - 10);
        doc.text(wrapped, leftBlockX, leftY);
    }

    // ===== Footer =====
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Generated by CONTECH", marginX, footerY);

    const fileName = `${(invoice as any).invoiceNumber || "invoice"}.pdf`;
    doc.save(fileName);
};
