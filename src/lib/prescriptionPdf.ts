import jsPDF from 'jspdf';
import { formatDateDMY } from '@/lib/utils';

export async function generatePrescriptionPDF(prescription: any) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Page setup
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Clean, modern color scheme
  const primaryBlue: [number, number, number] = [37, 99, 235]; // Blue-600
  const lightBlue: [number, number, number] = [219, 234, 254]; // Blue-100
  const grayText: [number, number, number] = [55, 65, 81]; // Gray-700
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400
  const darkGray: [number, number, number] = [31, 41, 55]; // Gray-800
  const white: [number, number, number] = [255, 255, 255];

  // Function to load logo
  const loadLogo = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.warn('Error processing logo:', error);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.warn('Logo failed to load');
        resolve(null);
      };
      
      img.src = '/medsync_logo.png';
    });
  };

  // Load logo before generating PDF
  const logoData = await loadLogo();

  let currentY = margin;

  // Clean header with hospital name
  doc.setFillColor(...lightBlue);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Add logo if available
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 8, 24, 24);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }

  // Hospital name and basic info - positioned to account for logo
  const textStartX = logoData ? margin + 30 : pageWidth / 2;
  const textAlign = logoData ? 'left' : 'center';

  doc.setTextColor(...primaryBlue);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDSYNC HOSPITAL', textStartX, 18, { align: textAlign });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text('Digital Healthcare Solutions', textStartX, 26, { align: textAlign });
  doc.text('Phone: +91-1234567890 | Email: info@medsync.com', textStartX, 32, { align: textAlign });

  currentY = 50;

  // Patient Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('PATIENT INFORMATION', margin, currentY);
  currentY += 3;

  // Underline
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, margin + 60, currentY);
  currentY += 10;

  // Patient details in a clean two-column layout
  const leftCol = margin;
  const rightCol = margin + (contentWidth / 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.patient?.user?.name || prescription.patient?.name || 'Not provided', leftCol + 30, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Age:', leftCol, currentY + 8);
  doc.setFont('helvetica', 'normal');
  const age = prescription.patient?.user?.age || 'Not provided';
  doc.text(age.toString(), leftCol + 30, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Gender:', leftCol, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.patient?.user?.gender || 'Not specified', leftCol + 30, currentY + 16);

  // Right column
  const patientId = prescription.patient?._id || prescription.patient?.id || '';
  const displayId = patientId ? `#${patientId.slice(-8).toUpperCase()}` : 'Not assigned';

  doc.setFont('helvetica', 'bold');
  doc.text('Patient ID:', rightCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(displayId, rightCol + 25, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', rightCol, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.patient?.user?.contact || 'Not provided', rightCol + 25, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Blood Group:', rightCol, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.patient?.bloodGroup || 'Not specified', rightCol + 25, currentY + 16);

  currentY += 35;

  // Prescription Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('PRESCRIPTION DETAILS', margin, currentY);
  currentY += 3;

  doc.setDrawColor(...primaryBlue);
  doc.line(margin, currentY, margin + 70, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setTextColor(...grayText);

  // Prescription info
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateDMY(prescription.date), leftCol + 30, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Doctor:', leftCol, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.doctor?.user?.name || prescription.doctor?.name || 'Not provided', leftCol + 30, currentY + 8);

  const prescriptionId = prescription._id || prescription.id || '';
  const displayPrescriptionId = prescriptionId ? `#${prescriptionId.slice(-8).toUpperCase()}` : 'Not assigned';

  doc.setFont('helvetica', 'bold');
  doc.text('Prescription ID:', rightCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(displayPrescriptionId, rightCol + 35, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', rightCol, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.doctor?.department || prescription.department || 'General', rightCol + 35, currentY + 8);

  currentY += 25;

  // Diagnosis Section (if available)
  if (prescription.diagnosis && prescription.diagnosis.trim()) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.text('DIAGNOSIS', margin, currentY);
    currentY += 3;

    doc.setDrawColor(...primaryBlue);
    doc.line(margin, currentY, margin + 35, currentY);
    currentY += 8;

    doc.setFillColor(...lightBlue);
    doc.rect(margin, currentY, contentWidth, 20, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    
    const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, contentWidth - 10);
    diagnosisLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, currentY + 8 + (index * 5));
    });

    currentY += 30;
  }

  // Medications Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('PRESCRIBED MEDICATIONS', margin, currentY);
  currentY += 3;

  doc.setDrawColor(...primaryBlue);
  doc.line(margin, currentY, margin + 85, currentY);
  currentY += 10;

  if (Array.isArray(prescription.medications) && prescription.medications.length > 0) {
    // Simple table for medications
    const tableHeaders = ['Medicine', 'Dosage', 'Frequency', 'Duration'];
    const colWidths = [50, 35, 35, 40];
    
    // Table header
    doc.setFillColor(...primaryBlue);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    
    let colX = margin + 2;
    tableHeaders.forEach((header, index) => {
      doc.text(header, colX, currentY + 5);
      colX += colWidths[index];
    });
    
    currentY += 10;

    // Medication rows
    prescription.medications.forEach((med: any, index: number) => {
      const rowBg: [number, number, number] = index % 2 === 0 ? [248, 250, 252] : white;
      doc.setFillColor(...rowBg);
      doc.rect(margin, currentY, contentWidth, 10, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);

      colX = margin + 2;
      const cellData = [
        med.name || 'Not specified',
        med.dosage || 'As directed',
        Array.isArray(med.frequency) ? med.frequency.join(', ') : (med.frequency || 'As needed'),
        med.duration || 'Consult doctor'
      ];

      cellData.forEach((data, cellIndex) => {
        const truncatedData = data.length > 20 ? data.substring(0, 17) + '...' : data;
        doc.text(truncatedData, colX, currentY + 6);
        colX += colWidths[cellIndex];
      });

      currentY += 10;
    });
  } else {
    doc.setFillColor(254, 252, 232);
    doc.rect(margin, currentY, contentWidth, 15, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayText);
    doc.text('No medications prescribed. Please follow up as advised.', pageWidth / 2, currentY + 8, { align: 'center' });
    currentY += 20;
  }

  currentY += 15;

  // Notes Section (if available)
  if (prescription.notes && prescription.notes.trim()) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.text('ADDITIONAL NOTES', margin, currentY);
    currentY += 3;

    doc.setDrawColor(...primaryBlue);
    doc.line(margin, currentY, margin + 60, currentY);
    currentY += 8;

    doc.setFillColor(...lightBlue);
    doc.rect(margin, currentY, contentWidth, 20, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    
    const notesLines = doc.splitTextToSize(prescription.notes, contentWidth - 10);
    notesLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, currentY + 8 + (index * 5));
    });

    currentY += 30;
  }

  // Compact footer
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);

  // Footer content - single line
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, footerY + 6);
  doc.text('Digitally Generated Prescription', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text('Valid 30 days', pageWidth - margin, footerY + 6, { align: 'right' });

  // Generate clean filename
  const patientName = (prescription.patient?.user?.name || prescription.patient?.name || 'Patient')
    .replace(/[^a-zA-Z0-9]/g, '_');
  const prescriptionDate = formatDateDMY(prescription.date).replace(/[^a-zA-Z0-9]/g, '_');
  const prescriptionIdShort = displayPrescriptionId.replace('#', '');
  const filename = `Prescription_${patientName}_${prescriptionDate}_${prescriptionIdShort}.pdf`;
  
  doc.save(filename);
}
