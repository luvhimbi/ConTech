// src/utils/pdfGenerator.ts
import jsPDF from "jspdf";
import type { Quotation } from "../services/quotationService";

/**
 * Improved quotation PDF template:
 * - Cleaner header with brand block + meta cards
 * - Proper “Bill To” block + From block
 * - Zebra items table + auto page breaks
 * - Totals in a subtle card
 * - Notes/terms block
 * - Footer with page numbers
 *
 * Works without extra plugins (no autoTable).
 */
export const generateQuotationPDF = (
    quotation: Quotation,
    userProfile: { firstName: string; lastName: string; companyName: string; email: string },
    projectName?: string
) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // ---------- Page + layout ----------
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    const contentW = pageW - margin * 2;

    // ---------- Theme ----------
    // Slightly more modern, neutral palette
    const C = {
        primary: [33, 150, 243] as const, // blue
        primaryDark: [25, 118, 210] as const,
        text: [32, 33, 36] as const,
        muted: [95, 99, 104] as const,
        border: [218, 220, 224] as const,
        soft: [245, 247, 250] as const,
        zebra: [250, 251, 252] as const,
        white: [255, 255, 255] as const,
        danger: [220, 53, 69] as const,
        success: [40, 167, 69] as const,
        warning: [255, 193, 7] as const,
    };

    // ---------- Helpers ----------
    const fmtMoney = (n: any) => `R${(Number(n) || 0).toFixed(2)}`;
    const safeText = (s: any) => String(s ?? "").trim();
    const formatDate = (value: any) => {
        try {
            if (!value) return "-";
            if (value?.toLocaleDateString) return value.toLocaleDateString();
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return "-";
            return d.toLocaleDateString();
        } catch {
            return "-";
        }
    };

    const setTextColor = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const setFillColor = (rgb: readonly [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const setDrawColor = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

    const text = (str: string, x: number, y: number, opt?: any) => doc.text(str, x, y, opt);

    const roundedRect = (x: number, y: number, w: number, h: number, r = 2.5, style: "S" | "F" | "FD" = "S") => {
        // jsPDF supports roundedRect in newer versions; fallback to rect if unavailable
        // @ts-ignore
        if (typeof doc.roundedRect === "function") {
            // @ts-ignore
            doc.roundedRect(x, y, w, h, r, r, style);
        } else {
            doc.rect(x, y, w, h, style);
        }
    };

    const hr = (y: number) => {
        setDrawColor(C.border);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
    };

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    // Page-break guard
    const ensureSpace = (y: number, needed: number, headerReprint?: () => number) => {
        const bottom = pageH - margin;
        if (y + needed <= bottom) return y;

        doc.addPage();
        const newY = headerReprint ? headerReprint() : margin;
        return newY;
    };

    const drawBadge = (label: string, x: number, y: number, variant: "draft" | "sent" | "accepted" | "rejected") => {
        const padX = 3.2;
        const padY = 2.1;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        const w = doc.getTextWidth(label) + padX * 2;
        const h = 6.4;

        let bg = C.soft;
        let fg = C.muted;
        if (variant === "accepted") {
            bg = [233, 245, 236] as const;
            fg = C.success;
        }
        if (variant === "rejected") {
            bg = [252, 237, 239] as const;
            fg = C.danger;
        }
        if (variant === "sent") {
            bg = [232, 244, 253] as const;
            fg = C.primaryDark;
        }

        setFillColor(bg);
        setDrawColor(bg);
        roundedRect(x, y - h + 1.8, w, h, 2, "F");

        setTextColor(fg);
        text(label, x + padX, y, { baseline: "alphabetic" });

        // reset
        setDrawColor(C.border);
        setTextColor(C.text);
        doc.setFont("helvetica", "normal");
    };

    // ---------- Compute totals if missing ----------
    const items = Array.isArray(quotation.items) ? quotation.items : [];
    const computedSubtotal = items.reduce((sum, it) => sum + (Number(it.total) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)), 0);
    const taxRate = Number((quotation as any).taxRate ?? 0) || 0;
    const computedTax = computedSubtotal * (taxRate / 100);
    const computedTotal = computedSubtotal + computedTax;

    const subtotal = Number((quotation as any).subtotal ?? computedSubtotal) || 0;
    const taxAmount = Number((quotation as any).taxAmount ?? computedTax) || 0;
    const total = Number((quotation as any).total ?? computedTotal) || 0;

    const quotationNo = safeText((quotation as any).quotationNumber || (quotation as any).id || "—");

    // ---------- Header + meta ----------
    const drawHeader = () => {
        // Top band
        setFillColor(C.primary);
        doc.rect(0, 0, pageW, 34, "F");

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        setTextColor(C.white);
        text("Quotation", margin, 20);

        // Number on right
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        setTextColor([235, 241, 255]);
        text(`#${quotationNo}`, pageW - margin, 20, { align: "right" });

        // Small brand line (company)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        setTextColor(C.white);
        text(safeText(userProfile.companyName || "Your Company"), margin, 29);

        // Content start
        return 44;
    };

    const drawMetaRow = (y: number) => {
        const cardGap = 6;
        const cardH = 20;
        const cardW = (contentW - cardGap * 2) / 3;

        const x1 = margin;
        const x2 = margin + cardW + cardGap;
        const x3 = margin + (cardW + cardGap) * 2;

        const makeCard = (x: number, title: string, value: string) => {
            setFillColor(C.soft);
            setDrawColor(C.border);
            doc.setLineWidth(0.3);
            roundedRect(x, y, cardW, cardH, 2.5, "F");

            // Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            setTextColor(C.muted);
            text(title.toUpperCase(), x + 6, y + 7);

            // Value
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            setTextColor(C.text);

            const maxW = cardW - 12;
            const clipped = doc.splitTextToSize(value, maxW);
            text(String(clipped[0] ?? ""), x + 6, y + 15);
        };

        const created = formatDate((quotation as any).createdAt);
        const validUntil = (quotation as any).validUntil ? formatDate((quotation as any).validUntil) : "-";
        const status = safeText((quotation as any).status || "draft").toLowerCase() as QuotationStatus;

        makeCard(x1, "Created", created);
        makeCard(x2, "Valid until", validUntil);
        makeCard(x3, "Status", status.charAt(0).toUpperCase() + status.slice(1));

        // Badge on top of status card
        const badgeLabel = status.charAt(0).toUpperCase() + status.slice(1);
        drawBadge(badgeLabel, x3 + cardW - doc.getTextWidth(badgeLabel) - 14, y + 8.6, status);

        return y + cardH + 8;
    };

    // ---------- From / Bill To blocks ----------
    const drawTwoColumnInfo = (y: number) => {
        const gap = 10;
        const colW = (contentW - gap) / 2;
        const leftX = margin;
        const rightX = margin + colW + gap;

        const boxH = 34;

        const drawBox = (x: number, title: string, lines: string[]) => {
            setFillColor(C.white);
            setDrawColor(C.border);
            doc.setLineWidth(0.3);
            roundedRect(x, y, colW, boxH, 2.5, "S");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            setTextColor(C.text);
            text(title, x + 6, y + 8);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.8);
            setTextColor(C.muted);

            let yy = y + 14;
            for (const line of lines) {
                const wrapped = doc.splitTextToSize(line, colW - 12);
                for (const w of wrapped) {
                    text(String(w), x + 6, yy);
                    yy += 4.6;
                    if (yy > y + boxH - 4) break;
                }
                if (yy > y + boxH - 4) break;
            }
        };

        const fromLines: string[] = [];
        fromLines.push(safeText(userProfile.companyName));
        const fullName = `${safeText(userProfile.firstName)} ${safeText(userProfile.lastName)}`.trim();
        if (fullName) fromLines.push(fullName);
        if (userProfile.email) fromLines.push(safeText(userProfile.email));
        if (projectName) fromLines.push(`Project: ${safeText(projectName)}`);

        const toLines: string[] = [];
        toLines.push(safeText((quotation as any).clientName));
        if ((quotation as any).clientEmail) toLines.push(safeText((quotation as any).clientEmail));
        if ((quotation as any).clientPhone) toLines.push(`Phone: ${safeText((quotation as any).clientPhone)}`);
        if ((quotation as any).clientAddress) toLines.push(safeText((quotation as any).clientAddress));

        drawBox(leftX, "From", fromLines);
        drawBox(rightX, "Bill To", toLines);

        return y + boxH + 10;
    };

    // ---------- Table ----------
    const drawItemsTableHeader = (y: number) => {
        const headerH = 9;
        setFillColor(C.soft);
        setDrawColor(C.border);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentW, headerH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        setTextColor(C.text);

        const cols = getTableCols();
        text("Description", cols.descX, y + 6.2);
        text("Qty", cols.qtyX, y + 6.2, { align: "right" });
        text("Unit Price", cols.unitX, y + 6.2, { align: "right" });
        text("Total", cols.totalX, y + 6.2, { align: "right" });

        return y + headerH;
    };

    const getTableCols = () => {
        // column layout
        // Description: left, flexible
        // Qty: right
        // Unit price: right
        // Total: right
        const totalX = margin + contentW;
        const unitX = totalX - 30;
        const qtyX = unitX - 20;
        const descX = margin + 2;
        const descW = qtyX - descX - 6;
        return { descX, descW, qtyX, unitX, totalX };
    };

    const drawItemsTable = (yStart: number) => {
        let y = yStart;
        const rowPadY = 3.2;
        const minRowH = 9;

        const cols = getTableCols();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(C.muted);

        const headerReprint = () => {
            let yy = drawHeader();
            yy = drawMetaRow(yy);
            // Only reprint table header (not the From/BillTo blocks to save space)
            yy += 2;
            yy = drawItemsTableHeader(yy);
            return yy;
        };

        // Safety if items are empty
        if (items.length === 0) {
            y = ensureSpace(y, 16, headerReprint);
            setTextColor(C.muted);
            doc.setFont("helvetica", "italic");
            text("No items on this quotation.", margin, y + 8);
            doc.setFont("helvetica", "normal");
            return y + 16;
        }

        for (let i = 0; i < items.length; i++) {
            const it = items[i] as any;
            const desc = safeText(it.description);
            const qty = Number(it.quantity) || 0;
            const unit = Number(it.unitPrice) || 0;
            const lineTotal = Number(it.total) || qty * unit;

            const descLines = doc.splitTextToSize(desc, cols.descW);
            const rowH = Math.max(minRowH, descLines.length * 4.6 + rowPadY * 2);

            y = ensureSpace(y, rowH + 2, headerReprint);

            // zebra background
            if (i % 2 === 1) {
                setFillColor(C.zebra);
                doc.rect(margin, y, contentW, rowH, "F");
            }

            // row border bottom
            setDrawColor(C.border);
            doc.setLineWidth(0.2);
            doc.line(margin, y + rowH, margin + contentW, y + rowH);

            // description
            setTextColor(C.text);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            let yy = y + rowPadY + 4.3;
            for (const line of descLines) {
                text(String(line), cols.descX, yy);
                yy += 4.6;
                if (yy > y + rowH - 2) break;
            }

            // qty / unit / total
            setTextColor(C.muted);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const midY = y + rowH / 2 + 3; // visually centered

            text(String(qty), cols.qtyX, midY, { align: "right" });
            text(fmtMoney(unit), cols.unitX, midY, { align: "right" });

            doc.setFont("helvetica", "bold");
            setTextColor(C.text);
            text(fmtMoney(lineTotal), cols.totalX, midY, { align: "right" });

            y += rowH;
        }

        return y + 8;
    };

    // ---------- Totals card ----------
    const drawTotalsCard = (y: number) => {
        const cardW = 76;
        const cardH = 30;
        const x = pageW - margin - cardW;

        y = ensureSpace(y, cardH + 6, () => {
            let yy = drawHeader();
            yy = drawMetaRow(yy);
            yy += 2;
            yy = drawItemsTableHeader(yy);
            return yy + 6;
        });

        setFillColor(C.soft);
        setDrawColor(C.border);
        doc.setLineWidth(0.3);
        roundedRect(x, y, cardW, cardH, 2.5, "F");

        const labelX = x + 6;
        const valueX = x + cardW - 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(C.muted);

        text("Subtotal", labelX, y + 10);
        text(fmtMoney(subtotal), valueX, y + 10, { align: "right" });

        text(`Tax (${taxRate.toFixed(2)}%)`, labelX, y + 17);
        text(fmtMoney(taxAmount), valueX, y + 17, { align: "right" });

        // Divider
        setDrawColor(C.border);
        doc.setLineWidth(0.25);
        doc.line(x + 6, y + 20.5, x + cardW - 6, y + 20.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setTextColor(C.text);
        text("Total", labelX, y + 28);
        text(fmtMoney(total), valueX, y + 28, { align: "right" });

        return y + cardH + 10;
    };

    // ---------- Notes / Terms ----------
    const drawNotes = (y: number) => {
        const notes = safeText((quotation as any).notes);
        if (!notes) return y;

        const boxHMin = 18;
        const lines = doc.splitTextToSize(notes, contentW - 12);
        const estH = 10 + lines.length * 4.6 + 6;
        const boxH = Math.max(boxHMin, clamp(estH, boxHMin, 70));

        y = ensureSpace(y, boxH + 6, () => {
            let yy = drawHeader();
            yy = drawMetaRow(yy);
            return yy + 6;
        });

        setFillColor(C.white);
        setDrawColor(C.border);
        doc.setLineWidth(0.3);
        roundedRect(margin, y, contentW, boxH, 2.5, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        setTextColor(C.text);
        text("Notes / Terms", margin + 6, y + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setTextColor(C.muted);

        let yy = y + 14;
        for (const line of lines) {
            if (yy > y + boxH - 5) break;
            text(String(line), margin + 6, yy);
            yy += 4.6;
        }

        return y + boxH + 8;
    };

    // ---------- Footer (page numbers) ----------
    const drawFooter = () => {
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);

            const footerY = pageH - 10;
            setTextColor(C.muted);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            const left = `Generated on ${new Date().toLocaleDateString()}`;
            const right = `Page ${p} of ${totalPages}`;

            text(left, margin, footerY);
            text(right, pageW - margin, footerY, { align: "right" });

            // subtle top line
            setDrawColor(C.border);
            doc.setLineWidth(0.2);
            doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
        }
    };

    // ---------- Build document ----------
    let y = drawHeader();
    y = drawMetaRow(y);
    y = drawTwoColumnInfo(y);

    // Items table
    y = drawItemsTableHeader(y);
    y = drawItemsTable(y);

    // Totals
    y = drawTotalsCard(y);

    // Notes
    y = drawNotes(y);

    // Final footer pass
    drawFooter();

    // Save
    doc.save(`quotation-${quotationNo}.pdf`);
};
