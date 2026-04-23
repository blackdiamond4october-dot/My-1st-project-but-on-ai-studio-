import React, { useRef, useState } from 'react';
import { X, Printer, Share2, Receipt, Package, ClipboardList, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BillingDocument, AppSettings } from '../types';
import DocumentPreview from './DocumentPreview';

interface DocumentModalProps {
  document: BillingDocument;
  settings: AppSettings;
  onClose: () => void;
}

export default function DocumentModal({ document: doc, settings, onClose }: DocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open('', '_blank');
    if (!win) return;

    // Get all styles from the current document
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>ZA Precision - ${doc.refNo}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; padding: 0; background: white; }
              .doc-paper { 
                box-shadow: none !important; 
                margin: 0 !important; 
                border: none !important;
                width: 100% !important;
                height: auto !important;
                padding: 0 !important;
              }
              @page { size: A4; margin: 0; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    const el = printRef.current;
    if (!el || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      // Ensure images AND fonts are loaded
      await document.fonts.ready;
      
      const images = Array.from(el.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Sufficient time for layout stabilization - increased for Base64 images
      await new Promise(r => setTimeout(r, 1000));

      const canvas = await html2canvas(el, {
        scale: 3, // Reduced scale slightly for better performance/size balance
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        height: el.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          clonedDoc.body.style.margin = '0';
          clonedDoc.body.style.padding = '0';
          const docPaper = clonedDoc.querySelector('.doc-paper') as HTMLElement;
          if (docPaper) {
            docPaper.style.transform = 'none';
            docPaper.style.boxShadow = 'none';
            docPaper.style.margin = '0';
            docPaper.style.padding = '40px'; // Increased padding to pull borders inward
            docPaper.style.width = '794px';
            docPaper.style.minHeight = 'unset'; 
            docPaper.style.border = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate output height in mm
      // 794px is ~210mm (A4 width)
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF with dynamic page size to remove excess bottom white space
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      
      const filename = `ZA_Precision_${doc.refNo}.pdf`;
      
      // Use Web Share API for better mobile experience
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `ZA Precision - ${doc.refNo}`,
              text: `PDF Document: ${doc.refNo}`
            });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Share failed:', shareErr);
          } else {
            return; // User cancelled
          }
        }
      }
      
      // Fallback: Use standard download or open in new tab for mobile
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const blobUrl = URL.createObjectURL(pdf.output('blob'));
        window.open(blobUrl, '_blank');
      } else {
        pdf.save(filename);
      }
    } catch (err) {
      console.error('PDF Error:', err);
      alert('Failed to generate PDF. Please try again or use the Print option.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <FileIcon type={doc.type} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight text-[#ffffff]">{doc.refNo}</h3>
              <p className="text-xs text-[#9ca3af]">{doc.customer}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
            >
              <Printer size={16} /> <span className="hidden sm:inline">PRINT</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all text-xs font-bold disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              <span>{isGeneratingPDF ? 'PREPARING...' : 'SHARE PDF'}</span>
            </button>
            <div className="w-px h-8 bg-white/5 mx-2" />
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 lg:p-12 bg-black/40 flex justify-center scrollbar-hide">
          <div className="min-h-min py-8 flex justify-center">
            <div 
              ref={printRef} 
              className="origin-top shadow-2xl transition-transform duration-300"
              style={{
                transform: `scale(${typeof window !== 'undefined' && window.innerWidth < 1024 ? (window.innerWidth - 64) / 794 : 0.95})`,
                transformOrigin: 'top center'
              }}
            >
              <DocumentPreview data={{ ...doc, ...settings }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  if (type === 'bill') return <Receipt size={20} />;
  if (type === 'challan') return <Package size={20} />;
  return <ClipboardList size={20} />;
}
