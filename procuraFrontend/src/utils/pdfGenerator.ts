import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CompanyInfo {
  name?: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface SupplierInfo {
  name: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactName?: string;
}

export interface ProjectInfo {
  name?: string;
  code?: string;
  address?: string;
}

export interface DocumentItem {
  description: string;
  quantity: number | string;
  unit?: string;
  unitPrice?: number | string;
  total: number | string;
  observations?: string;
}

export interface PDFDocumentData {
  title: string;
  documentNumber: string;
  documentDate: string;
  status?: string;
  company: CompanyInfo;
  supplier: SupplierInfo;
  project?: ProjectInfo;
  items: DocumentItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  taxRate?: number;
  total: number;
  paymentTerms?: string;
  deliveryTime?: string;
  observations?: string;
  notes?: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Gestiona',
  rut: '',
  address: '',
  phone: '',
  email: ''
};

function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null) return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function generatePDF(data: PDFDocumentData): void {
  const doc = new jsPDF();
  const company = { ...DEFAULT_COMPANY, ...data.company };
  
  let yPos = 20;

  // Header - Company Info
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name || 'Gestiona', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (company.rut) {
    doc.text(`RUT: ${company.rut}`, 20, yPos);
    yPos += 5;
  }
  if (company.address) {
    doc.text(`Dirección: ${company.address}`, 20, yPos);
    yPos += 5;
  }
  if (company.phone) {
    doc.text(`Teléfono: ${company.phone}`, 20, yPos);
    yPos += 5;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, 20, yPos);
    yPos += 5;
  }

  // Document Title (right aligned)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 190, 25, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${data.documentNumber}`, 190, 32, { align: 'right' });
  doc.text(`Fecha: ${formatDate(data.documentDate)}`, 190, 38, { align: 'right' });
  if (data.status) {
    doc.text(`Estado: ${data.status}`, 190, 44, { align: 'right' });
  }

  yPos = 65;

  // Supplier Info Box
  doc.setFillColor(245, 247, 250);
  doc.rect(15, yPos - 5, 180, 35, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVEEDOR', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(data.supplier.name || 'Sin nombre', 20, yPos);
  yPos += 5;
  if (data.supplier.rut) {
    doc.text(`RUT: ${data.supplier.rut}`, 20, yPos);
    yPos += 5;
  }
  if (data.supplier.address) {
    doc.text(`Dirección: ${data.supplier.address}`, 20, yPos);
    yPos += 5;
  }
  if (data.supplier.phone || data.supplier.email) {
    doc.text(`Contacto: ${data.supplier.phone || ''} ${data.supplier.email || ''}`.trim(), 20, yPos);
    yPos += 5;
  }
  if (data.supplier.contactName) {
    doc.text(`Atención: ${data.supplier.contactName}`, 20, yPos);
  }

  // Project Info Box (if exists)
  if (data.project && (data.project.name || data.project.code)) {
    yPos = 105;
    doc.setFillColor(250, 250, 245);
    doc.rect(15, yPos - 5, 180, 25, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PROYECTO / OBRA', 20, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    if (data.project.name) {
      doc.text(data.project.name, 20, yPos);
      yPos += 5;
    }
    if (data.project.code) {
      doc.text(`Código: ${data.project.code}`, 20, yPos);
      yPos += 5;
    }
    if (data.project.address) {
      doc.text(`Dirección: ${data.project.address}`, 20, yPos);
    }
  }

  // Items Table
  const tableStartY = data.project ? 140 : 115;
  
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.quantity.toString(),
    item.unit || '',
    item.unitPrice !== undefined ? formatCurrency(item.unitPrice) : '',
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  let totalsY = finalY;
  
  doc.setFontSize(10);
  
  if (data.subtotal !== undefined) {
    doc.text('Subtotal:', 140, totalsY);
    doc.text(formatCurrency(data.subtotal), 190, totalsY, { align: 'right' });
    totalsY += 6;
  }
  
  if (data.discount !== undefined && data.discount > 0) {
    doc.text('Descuento:', 140, totalsY);
    doc.text(`-${formatCurrency(data.discount)}`, 190, totalsY, { align: 'right' });
    totalsY += 6;
  }
  
  if (data.tax !== undefined && data.tax > 0) {
    doc.text(`IVA (${data.taxRate || 19}%):`, 140, totalsY);
    doc.text(formatCurrency(data.tax), 190, totalsY, { align: 'right' });
    totalsY += 6;
  }
  
  // Total (bold)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 140, totalsY + 5);
  doc.text(formatCurrency(data.total), 190, totalsY + 5, { align: 'right' });

  // Payment Terms and Delivery Time
  let infoY = totalsY + 20;
  
  if (data.paymentTerms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Forma de Pago:', 20, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.paymentTerms, 60, infoY);
    infoY += 6;
  }
  
  if (data.deliveryTime) {
    doc.setFont('helvetica', 'bold');
    doc.text('Tiempo de Entrega:', 20, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.deliveryTime, 60, infoY);
    infoY += 6;
  }

  // Observations
  if (data.observations || data.notes) {
    infoY += 5;
    doc.setFillColor(255, 255, 245);
    doc.rect(15, infoY - 3, 180, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 20, infoY + 3);
    doc.setFont('helvetica', 'normal');
    const obsText = data.observations || data.notes || '';
    const splitText = doc.splitTextToSize(obsText, 170);
    doc.text(splitText.slice(0, 3), 20, infoY + 10);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento generado por Gestiona - Sistema de Compras', 105, pageHeight - 10, { align: 'center' });
  doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-CL')}`, 105, pageHeight - 5, { align: 'center' });

  // Save the PDF
  doc.save(`${data.title}_${data.documentNumber}.pdf`);
}

// Helper function to generate Requisition PDF
export function generateRequisitionPDF(
  requisition: any,
  company: CompanyInfo,
  supplier?: SupplierInfo
): void {
  const items = (requisition.items || []).map((item: any) => ({
    description: item.description || item.material?.name || 'Sin descripción',
    quantity: item.quantity,
    unit: item.unitOfMeasure,
    unitPrice: '-',
    total: '-'
  }));

  generatePDF({
    title: 'Requisición',
    documentNumber: requisition.code,
    documentDate: requisition.createdAt,
    status: requisition.status,
    company,
    supplier: supplier || {
      name: 'Sin proveedor asignado',
      rut: '',
      address: '',
      phone: '',
      email: ''
    },
    project: requisition.projectName ? { name: requisition.projectName } : undefined,
    items,
    total: 0,
    observations: requisition.description
  });
}

// Helper function to generate Quotation PDF
export function generateQuotationPDF(
  quotation: any,
  company: CompanyInfo,
  supplier: SupplierInfo,
  project?: ProjectInfo
): void {
  const items = (quotation.items || []).map((item: any) => ({
    description: item.quotationRequestItem?.description || item.material?.name || 'Sin descripción',
    quantity: item.quantity,
    unit: item.quotationRequestItem?.unitOfMeasure || '-',
    unitPrice: item.unitPrice,
    total: item.total
  }));

  generatePDF({
    title: 'Cotización',
    documentNumber: quotation.code,
    documentDate: quotation.quotationDate,
    status: quotation.status,
    company,
    supplier,
    project,
    items,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    taxRate: 19,
    total: quotation.total,
    paymentTerms: quotation.paymentTerms,
    deliveryTime: quotation.deliveryTime,
    observations: quotation.notes
  });
}

// Helper function to generate Purchase Order PDF
export function generatePurchaseOrderPDF(
  order: any,
  company: CompanyInfo,
  supplier: SupplierInfo,
  project?: ProjectInfo
): void {
  const items = (order.items || []).map((item: any) => ({
    description: item.description || item.material?.name || 'Sin descripción',
    quantity: item.quantity,
    unit: item.unitOfMeasure,
    unitPrice: item.unitPrice,
    total: item.total
  }));

  generatePDF({
    title: 'Orden de Compra',
    documentNumber: order.code,
    documentDate: order.orderDate,
    status: order.status,
    company,
    supplier,
    project,
    items,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    taxRate: 19,
    total: order.total,
    paymentTerms: order.paymentTerms,
    deliveryTime: order.deliveryTerms || order.deliveryTime,
    observations: order.description
  });
}

// Helper function to generate Work Order PDF
export function generateWorkOrderPDF(
  workOrder: any,
  company: CompanyInfo,
  supplier: SupplierInfo,
  project?: ProjectInfo
): void {
  const items = (workOrder.items || []).map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    total: item.totalPrice,
    observations: item.observations
  }));

  generatePDF({
    title: 'Orden de Trabajo',
    documentNumber: workOrder.code,
    documentDate: workOrder.createdAt,
    status: workOrder.status,
    company,
    supplier,
    project,
    items,
    subtotal: workOrder.subtotal,
    tax: workOrder.iva,
    taxRate: 19,
    total: workOrder.totalValue,
    paymentTerms: workOrder.paymentTerms,
    observations: workOrder.observations
  });
}

// Helper function to generate Contract PDF
export function generateContractPDF(
  contract: any,
  company: CompanyInfo,
  supplier: SupplierInfo,
  project?: ProjectInfo
): void {
  const items = [{
    description: `Contrato N° ${contract.code}`,
    quantity: 1,
    unit: 'unds',
    unitPrice: contract.value,
    total: contract.value
  }];

  generatePDF({
    title: 'Contrato',
    documentNumber: contract.code,
    documentDate: contract.startDate,
    status: contract.status,
    company,
    supplier,
    project,
    items,
    subtotal: contract.value,
    discount: 0,
    tax: 0,
    total: contract.finalValue,
    observations: contract.observations
  });
}
