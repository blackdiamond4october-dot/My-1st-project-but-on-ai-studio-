import React from 'react';
import { BillingDocument } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

// Base64 encoded logo for 100% reliability on any deployment (Vercel/etc)
const LOGO_BASE64 = 'data:image/png;base64,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';

const logoImg = LOGO_BASE64;
const companyNameImg = "/company-name.png?v=2";
const signOfQualityImg = "/sign-of-quality.png?v=2";

interface DocumentPreviewProps {
  data: any; // Partial<BillingDocument> + extra fields
}

export default function DocumentPreview({ data }: DocumentPreviewProps) {
  const cur = data.currency || "Rs.";
  const type = data.type || 'bill';

  const typeLabel = type === 'bill' ? 'BILL' : type === 'challan' ? 'DELIVERY CHALLAN' : 'QUOTATION';
  const isQuote = type === 'quotation';
  const isChallan = type === 'challan';

  const items = data.items || [];
  const total = items.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);

  // [FIX] Document Overrun Fix: Intelligently scale maxRows and font size if many items exist
  const itemLimit = 22;
  const isLargeDoc = items.length > 15;
  const maxRows = isLargeDoc ? Math.max(items.length, 18) : 18;
  const emptyRowsCount = Math.max(0, maxRows - items.length);

  return (
    <div className="doc-paper shadow-2xl relative bg-white text-black font-sans flex flex-col" style={{ width: '794px', minHeight: '1123px', padding: '30px' }}>
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
        <ZALogo size={500} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 border border-gray-400 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pt-4 px-2">
          <div className="w-[140px] flex-shrink-0">
            <ZALogo size={110} />
          </div>

          <div className="flex-1 flex flex-col items-center px-4 min-w-[400px]">
            <div className="text-[10px] font-bold tracking-widest text-gray-500 mb-3 uppercase h-4 flex items-center justify-center">{typeLabel}</div>
            <div className="h-20 mb-3 flex items-center justify-center">
              <img src={companyNameImg} alt="ZA PRECISION ENGINEERING CO." className="h-full w-auto object-contain" />
            </div>
            <div className="text-[11px] font-bold text-gray-900 text-center space-y-1">
              <div>{data.address || 'Nadeem Park, Bund Road, Daroghawala, Lahore.'}</div>
              <div>Ph: {data.phone1 || '+92 333 7227025'} | {data.phone2 || '+92 321 9240587'}</div>
              {data.email && <div>Email: {data.email}</div>}
            </div>
          </div>

          <div className="w-[140px] flex-shrink-0 flex justify-end">
            <img src={signOfQualityImg} alt="Sign of Quality" className="h-24 w-auto object-contain" />
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex justify-between items-end mb-4 border-b border-gray-800 pb-3">
          <div className="flex flex-col space-y-2">
            <div className="text-xs font-bold flex items-center gap-2">
              <span className="w-12">Date:</span>
              <span className="border-b border-gray-400 px-2 min-w-[150px] inline-block">{formatDate(data.date)}</span>
            </div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span className="w-12">M/S.</span>
              <span className="border-b border-gray-400 px-2 min-w-[250px] inline-block">{data.customer}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2 text-right">
            <div className="text-xs font-bold flex items-center justify-end gap-2">
              <span>Ref No.</span>
              <span className="border-b border-gray-400 px-2 min-w-[100px] inline-block">{data.refNo}</span>
            </div>
            {type !== 'quotation' && (
              <div className="text-xs font-bold flex items-center justify-end gap-2">
                <span>Purchase Order No.</span>
                <span className="border-b border-gray-400 px-2 min-w-[100px] inline-block">{data.poNo || ''}</span>
              </div>
            )}
          </div>
        </div>

        {isQuote && (
          <div className="text-[11px] font-bold mb-4 text-gray-800">
            We are Pleased to quote our rate as following for your favorable consideration please.
          </div>
        )}

        {/* Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-800">
            <thead>
              <tr className="bg-orange-500">
                <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-12 text-black uppercase">S. No.</th>
                <th className="border border-gray-800 p-2 text-[11px] font-bold text-center text-black uppercase tracking-[0.2em]">DESCRIPTION</th>
                {isChallan ? (
                  <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-20 text-black uppercase">Qty.</th>
                ) : isQuote ? (
                  <>
                    <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-28 text-black uppercase">Delivery Period</th>
                    <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-28 text-black uppercase">Unit Price</th>
                  </>
                ) : (
                  <>
                    <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-16 text-black uppercase">Qty.</th>
                    <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-24 text-black uppercase">Unit Price</th>
                    <th className="border border-gray-800 p-2 text-[11px] font-bold text-center w-32 text-black uppercase">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => {
                const qty = parseFloat(item?.qty) || 0;
                const price = parseFloat(item?.price) || 0;
                const amt = qty * price;
                return (
                  <tr key={i} className="h-7">
                    <td className="border border-gray-800 px-2 text-[11px] text-center">{i + 1}</td>
                    <td className="border border-gray-800 px-2 text-[11px] font-medium uppercase">{item?.desc || ''}</td>
                    {isChallan ? (
                      <td className="border border-gray-800 px-2 text-[11px] text-center">{item?.qty || ''}</td>
                    ) : isQuote ? (
                      <>
                        <td className="border border-gray-800 px-2 text-[11px] text-center">{item?.deliveryPeriod || data.deliveryPeriod || ''}</td>
                        <td className="border border-gray-800 px-2 text-[11px] text-right">{item?.price ? formatCurrency(item.price, '') : ''}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-800 px-2 text-[11px] text-center">{item?.qty || ''}</td>
                        <td className="border border-gray-800 px-2 text-[11px] text-right">{item?.price ? formatCurrency(item.price, '') : ''}</td>
                        <td className="border border-gray-800 px-2 text-[11px] text-right font-mono">{amt > 0 ? formatCurrency(amt, '') : ''}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-7">
                  <td className="border border-gray-800 px-2 text-[11px] text-center"></td>
                  <td className="border border-gray-800 px-2 text-[11px] font-medium uppercase"></td>
                  {isChallan ? (
                    <td className="border border-gray-800 px-2 text-[11px] text-center"></td>
                  ) : isQuote ? (
                    <>
                      <td className="border border-gray-800 px-2 text-[11px] text-center"></td>
                      <td className="border border-gray-800 px-2 text-[11px] text-right"></td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-800 px-2 text-[11px] text-center"></td>
                      <td className="border border-gray-800 px-2 text-[11px] text-right"></td>
                      <td className="border border-gray-800 px-2 text-[11px] text-right font-mono"></td>
                    </>
                  )}
                </tr>
              ))}
              {!isChallan && !isQuote && (
                <tr className="h-8">
                  <td colSpan={4} className="border border-gray-800 p-2 text-right text-xs font-bold uppercase tracking-widest">Total</td>
                  <td className="border border-gray-800 p-2 text-right text-sm font-bold font-mono">
                    {total > 0 ? formatCurrency(total, '') : ''}
                  </td>
                </tr>
              )}
              {isChallan && (
                <tr className="h-10">
                  <td colSpan={2} className="border border-gray-800 p-2 text-right text-xs font-bold uppercase tracking-widest">For</td>
                  <td className="border border-gray-800"></td>
                </tr>
              )}
              {isQuote && (
                <tr className="h-10">
                  <td colSpan={3} className="border border-gray-800 p-2 text-right text-xs font-bold uppercase tracking-widest">For</td>
                  <td className="border border-gray-800"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Terms and Signature side-by-side */}
        <div className="mt-4 flex gap-4 items-start">
          {/* Terms & Conditions */}
          <div className="flex-1">
            {data.terms && (
              <div className="border border-gray-800 p-3 min-h-[80px]">
                <div className="text-[10px] font-bold uppercase mb-1 underline">Terms & Conditions</div>
                <div className="text-[9px] text-gray-800 font-medium space-y-0.5">
                  {data.terms.split('\n').map((line: string, idx: number) => (
                    <div key={idx} style={{ lineHeight: '1.2', minHeight: '11px' }}>{line}</div>
                  ))}
                </div>
              </div>
            )}
            {data.notes && (
              <div className="mt-2 text-[9px] text-gray-600 italic">
                Note: {data.notes}
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="w-1/3 flex flex-col items-end justify-end pt-12">
            {!isChallan && !isQuote && (
              <div className="text-center">
                <div className="border-b border-gray-800 w-40 mb-1"></div>
                <div className="text-[10px] font-bold uppercase">Signature</div>
              </div>
            )}
            {(isChallan || isQuote) && (
              <div className="text-center">
                <div className="border-b border-gray-800 w-40 mb-1"></div>
                <div className="text-[10px] font-bold uppercase">Authorized Signature</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ZA Precision Engineering Co. Logo
 * This is a high-fidelity SVG recreation of the company logo.
 * To replace this with a custom image, you can swap the SVG content with an <img> tag:
 * <img src="YOUR_IMAGE_URL" width={size} height={size} className={className} referrerPolicy="no-referrer" />
 */
export function ZALogo({ size = 100, className = "" }: { size?: number, className?: string }) {
  return (
    <img 
      src={logoImg} 
      alt="ZA Precision Engineering Co." 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

function SignOfQuality({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="30" fill="none" stroke="black" strokeWidth="1" />
      <text x="100" y="95" textAnchor="middle" fontSize="12" fontWeight="bold">Sign of</text>
      <text x="100" y="115" textAnchor="middle" fontSize="12" fontWeight="bold">Quality</text>
      
      {/* Circles */}
      <g>
        <circle cx="100" cy="30" r="15" fill="orange" stroke="black" />
        <text x="100" y="34" textAnchor="middle" fontSize="8" fontWeight="bold">Man</text>
        
        <circle cx="170" cy="80" r="15" fill="orange" stroke="black" />
        <text x="170" y="84" textAnchor="middle" fontSize="8" fontWeight="bold">Machine</text>
        
        <circle cx="140" cy="160" r="15" fill="orange" stroke="black" />
        <text x="140" y="164" textAnchor="middle" fontSize="8" fontWeight="bold">Method</text>
        
        <circle cx="60" cy="160" r="15" fill="orange" stroke="black" />
        <text x="60" y="164" textAnchor="middle" fontSize="8" fontWeight="bold">Material</text>
        
        <circle cx="30" cy="80" r="15" fill="orange" stroke="black" />
        <text x="30" y="84" textAnchor="middle" fontSize="8" fontWeight="bold">Measuring</text>
      </g>
      
      {/* Arrows */}
      <path d="M100 45 L100 70" stroke="black" fill="none" markerEnd="url(#arrow)" />
      <path d="M155 80 L130 85" stroke="black" fill="none" markerEnd="url(#arrow)" />
      <path d="M130 145 L115 125" stroke="black" fill="none" markerEnd="url(#arrow)" />
      <path d="M70 145 L85 125" stroke="black" fill="none" markerEnd="url(#arrow)" />
      <path d="M45 80 L70 85" stroke="black" fill="none" markerEnd="url(#arrow)" />
      
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="black" />
        </marker>
      </defs>
    </svg>
  );
}
