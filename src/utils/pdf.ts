import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Downloads a DOM element as a crisp, high-resolution A4 PDF document
 * with full Lao character rendering fidelity.
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename = 'emscps_referral.pdf',
  onProgress?: (status: string) => void
): Promise<void> {
  try {
    if (onProgress) onProgress('ກຳລັງສ້າງຮູບພາບເອກະສານ...');

    // Render DOM node to canvas at 2x scale for sharp print quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    if (onProgress) onProgress('ກຳລັງປະມວນຜົນໄຟລ໌ PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    
    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // If content exceeds 1 page, calculate height and split if needed
    if (pdfHeight > 297) {
      let position = 0;
      let remainingHeight = pdfHeight;
      const pageHeight = 297;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        remainingHeight -= pageHeight;
        position -= pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(filename);
    if (onProgress) onProgress('ດາວໂຫຼດສຳເລັດແລ້ວ');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Triggers native browser print dialog for the current referral slip
 */
export function triggerPrint(): void {
  window.print();
}
