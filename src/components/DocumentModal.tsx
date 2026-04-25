import React, { useRef, useState } from 'react';
import { X, Printer, Download, Receipt, Package, ClipboardList, Loader2, Share2, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '../lib/utils';
import { BillingDocument, AppSettings } from '../types';
import DocumentPreview from './DocumentPreview';

interface DocumentModalProps {
  document: BillingDocument;
  settings: AppSettings;
  onUpdate: (doc: BillingDocument) => Promise<void>;
  onClose: () => void;
}

export default function DocumentModal({ document: doc, settings, onUpdate, onClose }: DocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(doc.date);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const handleUpdateDate = async () => {
    setIsUpdatingDate(true);
    try {
      await onUpdate({ ...doc, date: newDate });
      setIsEditingDate(false);
    } catch (err) {
      alert('Failed to update date');
    } finally {
      setIsUpdatingDate(false);
    }
  };

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

  const generatePDFBlob = async () => {
    const el = printRef.current;
    if (!el) return null;

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

    // Sufficient time for layout stabilization
    await new Promise(r => setTimeout(r, 1000));

    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: el.scrollHeight > 1123 ? el.scrollHeight : 1123,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const root = clonedDoc.getElementById('pdf-capture-root') as HTMLElement;
        if (root) {
          root.style.transform = 'none';
          root.style.width = '794px';
          root.style.height = 'auto';
          root.style.margin = '0';
          root.style.padding = '0';
          root.style.display = 'block';
          root.style.position = 'absolute';
          root.style.top = '0';
          root.style.left = '0';
        }
        const docPaper = clonedDoc.querySelector('.doc-paper') as HTMLElement;
        if (docPaper) {
          docPaper.style.transform = 'none';
          docPaper.style.boxShadow = 'none';
          docPaper.style.margin = '0';
          docPaper.style.width = '794px';
          docPaper.style.minHeight = '1123px';
        }
      }
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvasWidth, canvasHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight, undefined, 'FAST');
    return { pdf, filename: `ZA_Precision_${doc.refNo}.pdf` };
  };

  const handleShare = async () => {
    if (sharedFile) {
      // Step 2: Share the prepared file (direct user gesture)
      try {
        if (navigator.share) {
          await navigator.share({
            files: [sharedFile],
            title: sharedFile.name,
            text: `Document ${doc.refNo} from ZA Precision`
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') alert('Failed to share.');
      }
      return;
    }

    if (isSharing) return;
    setIsSharing(true);
    try {
      const result = await generatePDFBlob();
      if (!result) return;
      const { pdf, filename } = result;

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      setSharedFile(file);
      
      // Try calling share immediately, but if it fails due to gesture expiry, 
      // the user will see "CLICK TO SEND" and can click again.
      if (typeof navigator !== 'undefined' && navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: filename,
              text: `Document ${doc.refNo} from ZA Precision`
            });
          } catch (shareErr: any) {
            if (shareErr.name === 'NotAllowedError') {
              // This is expected if the async generation took too long for a single gesture
              // The button label change to "CLICK TO SEND" will handle the second step
              console.log('Gesture expired, waiting for second click...');
            } else if (shareErr.name !== 'AbortError') {
              throw shareErr;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Share Error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const result = await generatePDFBlob();
      if (!result) return;
      const { pdf, filename } = result;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF Error:', err);
      alert('Failed to generate PDF.');
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
            {isEditingDate ? (
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
                <input 
                  type="date" 
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none border-none p-1 w-28"
                />
                <button 
                  onClick={handleUpdateDate}
                  disabled={isUpdatingDate}
                  className="px-3 py-1 rounded bg-orange-500 text-black text-[10px] font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {isUpdatingDate ? '...' : 'SAVE'}
                </button>
                <button 
                  onClick={() => { setIsEditingDate(false); setNewDate(doc.date); }}
                  className="px-3 py-1 rounded bg-white/10 text-white text-[10px] font-bold hover:bg-white/20"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingDate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
              >
                <Calendar size={16} /> <span className="hidden sm:inline">EDIT DATE</span>
              </button>
            )}
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold disabled:opacity-50",
                sharedFile ? "bg-emerald-500 text-black hover:bg-emerald-600 animate-pulse" : "bg-orange-500 text-black hover:bg-orange-600"
              )}
            >
              {isSharing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              <span className="hidden sm:inline">
                {isSharing ? 'PREPARING...' : sharedFile ? 'CLICK TO SEND' : 'SHARE'}
              </span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
            >
              <Printer size={16} /> <span className="hidden sm:inline">PRINT</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all text-xs font-bold disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="hidden sm:inline">{isGeneratingPDF ? 'GENERATING...' : 'SAVE PDF'}</span>
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
              id="pdf-capture-root"
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
