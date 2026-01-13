// src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import type { Quotation } from '../services/quotationService';

export const generateQuotationPDF = (quotation: Quotation, userProfile: { firstName: string; lastName: string; companyName: string; email: string }, projectName?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Colors - Google-like
    const textColor = '#202124';
    const secondaryText = '#5F6368';

    // Header
    doc.setFillColor(66, 133, 244);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', margin, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${quotation.quotationNumber}`, pageWidth - margin, 30, { align: 'right' });

    yPos = 70;

    // Company Info
    doc.setTextColor(textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(userProfile.companyName, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryText);
    doc.setFontSize(9);
    yPos += 6;
    doc.text(userProfile.email, margin, yPos);
    
    yPos += 15;

    // Client Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Bill To:', pageWidth - 100, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryText);
    yPos += 6;
    doc.text(quotation.clientName, pageWidth - 100, yPos);
    yPos += 5;
    doc.text(quotation.clientEmail, pageWidth - 100, yPos);
    yPos += 5;
    const clientAddressLines = doc.splitTextToSize(quotation.clientAddress, 80);
    clientAddressLines.forEach((line: string) => {
        doc.text(line, pageWidth - 100, yPos);
        yPos += 5;
    });

    if (quotation.clientPhone) {
        yPos += 5;
        doc.text(`Phone: ${quotation.clientPhone}`, pageWidth - 100, yPos);
    }

    yPos = 120;

    // Project Name if exists
    if (projectName) {
        doc.setFontSize(9);
        doc.setTextColor(secondaryText);
        doc.text(`Project: ${projectName}`, margin, yPos);
        yPos += 10;
    }

    // Items Table Header
    doc.setDrawColor(218, 220, 224);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Description', margin, yPos);
    doc.text('Qty', margin + 80, yPos);
    doc.text('Unit Price', margin + 110, yPos, { align: 'right' });
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 8;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryText);
    quotation.items.forEach((item) => {
        const descriptionLines = doc.splitTextToSize(item.description, 60);
        const itemHeight = Math.max(descriptionLines.length * 5, 8);
        
        descriptionLines.forEach((line: string, index: number) => {
            doc.text(line, margin, yPos + (index * 5));
        });
        
        doc.text(item.quantity.toString(), margin + 80, yPos);
        doc.text(`R${item.unitPrice.toFixed(2)}`, margin + 110, yPos, { align: 'right' });
        doc.text(`R${item.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        
        yPos += itemHeight + 3;
    });

    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Totals
    const totalsX = pageWidth - margin - 60;
    
    doc.setFontSize(9);
    doc.setTextColor(secondaryText);
    doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
    doc.text(`R${quotation.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text(`Tax (${quotation.taxRate}%):`, totalsX, yPos, { align: 'right' });
    doc.text(`R${quotation.taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textColor);
    doc.text('Total:', totalsX, yPos, { align: 'right' });
    doc.text(`R${quotation.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;

    // Notes
    if (quotation.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(secondaryText);
        doc.text('Notes:', margin, yPos);
        yPos += 6;
        const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - (margin * 2));
        notesLines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
        });
    }

    // Valid Until
    if (quotation.validUntil) {
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(secondaryText);
        const validDate = quotation.validUntil.toLocaleDateString();
        doc.text(`Valid until: ${validDate}`, margin, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(secondaryText);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 15);
    doc.text('CONTECH - Construction Technology Solutions', pageWidth - margin, pageHeight - 15, { align: 'right' });

    // Save PDF
    doc.save(`quotation-${quotation.quotationNumber}.pdf`);
};

