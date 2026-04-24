import React from 'react';
import { BillingDocument } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

import { LOGO_BASE64, COMPANY_NAME_BASE64, SIGN_OF_QUALITY_BASE64 } from '../image-data';

const logoImg = LOGO_BASE64;
const companyNameImg = COMPANY_NAME_BASE64;
const signOfQualityImg = SIGN_OF_QUALITY_BASE64;

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
        <div className="mb-8 px-2 space-y-6">
          {/* Row 1: Date & Ref No */}
          <div className="grid grid-cols-2 gap-16">
            <div className="flex flex-col h-12 justify-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-1">Date:</span>
              <div className="text-[13px] font-bold text-black border-b border-black pb-1">
                {formatDate(data.date)}
              </div>
            </div>
            <div className="flex flex-col h-12 justify-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-1">Ref No.</span>
              <div className="text-[13px] font-black text-black border-b border-black pb-1 inline-block font-mono tracking-wider">
                {data.refNo}
              </div>
            </div>
          </div>
          
          {/* Row 2: Customer & PO No */}
          <div className="grid grid-cols-2 gap-16">
            <div className="flex flex-col h-12 justify-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-1">M/S.</span>
              <div className="text-[13px] font-bold text-black border-b border-black pb-1 uppercase truncate">
                {data.customer}
              </div>
            </div>
            <div className="flex flex-col h-12 justify-end">
              {type !== 'quotation' && (
                <>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-1">Purchase Order No.</span>
                  <div className="text-[13px] font-bold text-black border-b border-black pb-1 truncate">
                    {data.poNo || '---'}
                  </div>
                </>
              )}
            </div>
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
            {type === 'bill' && data.terms && (
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
