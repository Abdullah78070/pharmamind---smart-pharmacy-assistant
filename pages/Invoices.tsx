import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Invoice, Client, ItemType, ClientTransaction } from '../types';
import { FileText, Calendar, Package, ChevronDown, ChevronUp, Printer, Trash, Repeat, X, Check, Lock, UserCheck } from 'lucide-react';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Print State
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Resell Modal State
  const [showResellModal, setShowResellModal] = useState(false);
  const [resellInvoice, setResellInvoice] = useState<Invoice | null>(null);
  const [resellConfig, setResellConfig] = useState({
      clientId: '',
      discountReg: 0,
      discountSpe: 0,
      discountOth: 0
  });

  useEffect(() => {
    setInvoices(StorageService.getInvoices());
    setClients(StorageService.getClients());
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      StorageService.deleteInvoice(id);
      setInvoices(StorageService.getInvoices());
    }
  };

  const handlePrint = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Set the invoice to be printed to state
    setPrintInvoice(invoice);
    
    // 2. Wait for React to render the printable area, then trigger print
    setTimeout(() => {
        window.print();
        // 3. Clear the print state after printing dialog is closed/initiated
        // Note: In some browsers this happens immediately, so we clear it.
        // But for better UX we keep it briefly or rely on the CSS hiding the rest.
        // To be safe, we can clear it after a longer timeout or not clear it at all if hidden.
    }, 100);
  };

  // RESELL LOGIC
  const openResellModal = (invoice: Invoice, e: React.MouseEvent) => {
      e.stopPropagation();
      if (invoice.isSold) return; // Prevent opening if already sold
      
      setResellInvoice(invoice);
      setResellConfig({ clientId: '', discountReg: 0, discountSpe: 0, discountOth: 0 });
      setShowResellModal(true);
  };

  const calculateSellTotal = () => {
      if (!resellInvoice) return 0;
      let total = 0;
      resellInvoice.items.forEach(item => {
          let discount = 0;
          if (item.type === ItemType.NORMAL) discount = resellConfig.discountReg;
          else if (item.type === ItemType.SPECIAL) discount = resellConfig.discountSpe;
          else discount = resellConfig.discountOth;

          const sellPriceUnit = item.publicPrice * (1 - (discount / 100));
          total += sellPriceUnit * item.totalUnits; // Selling total units (qty + bonus)
      });
      return total;
  };

  const confirmResell = () => {
      if (!resellConfig.clientId) return alert('اختر العميل');
      if (!resellInvoice) return;

      const totalAmount = calculateSellTotal();
      const transaction: ClientTransaction = {
          id: Date.now().toString(),
          clientId: resellConfig.clientId,
          date: new Date().toISOString(),
          type: 'SALE',
          amount: totalAmount,
          notes: `إعادة بيع الفاتورة #${resellInvoice.invoiceNumber || resellInvoice.id.slice(-4)} (REG:${resellConfig.discountReg}%, SPE:${resellConfig.discountSpe}%)`,
          relatedInvoiceId: resellInvoice.id,
          invoiceNumber: resellInvoice.invoiceNumber || resellInvoice.id.slice(-4)
      };

      StorageService.addTransaction(transaction);
      StorageService.markInvoiceAsSold(resellInvoice.id, resellConfig.clientId);
      
      alert('تمت عملية البيع وتسجيل المبلغ على حساب العميل بنجاح');
      setShowResellModal(false);
      setInvoices(StorageService.getInvoices()); // Refresh list to show Sold status
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">سجل الفواتير</h2>
          <p className="text-gray-500 mt-1">يتم تخزين جميع الفواتير محلياً على هذا الجهاز</p>
        </div>
        <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-bold">
            {invoices.length} فاتورة
        </div>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">لا توجد فواتير محفوظة بعد</p>
            </div>
        ) : (
            invoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                    <div 
                        onClick={() => toggleExpand(inv.id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 gap-4"
                    >
                        <div className="flex items-start md:items-center gap-4">
                            <div className="bg-primary-100 p-3 rounded-full text-primary-600 hidden md:block">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <div className="font-bold text-gray-800 text-lg">
                                        {inv.supplierName ? inv.supplierName : 'مورد غير محدد'}
                                    </div>
                                    {inv.invoiceNumber && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
                                            #{inv.invoiceNumber}
                                        </span>
                                    )}
                                    {inv.isSold && (
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold flex items-center gap-1">
                                            <UserCheck size={12} /> تم التوزيع
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(inv.date).toLocaleDateString('ar-EG')}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1"><Package size={14} /> {inv.totalItems} أصناف</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs text-gray-400">ID: {inv.id.slice(-6)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                            <div className="text-xl font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
                                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(inv.totalValue)}
                            </div>
                            {expandedId === inv.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </div>
                    </div>

                    {/* Detailed View */}
                    {(expandedId === inv.id) && (
                        <div className="border-t border-gray-100 bg-gray-50 p-6">
                            <table className="w-full text-sm text-right bg-white rounded-lg border border-gray-200">
                                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                    <tr>
                                        <th className="py-2 px-3">الصنف</th>
                                        <th className="py-2 px-3">النوع</th>
                                        <th className="py-2 px-3">الكمية</th>
                                        <th className="py-2 px-3">السعر</th>
                                        <th className="py-2 px-3">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inv.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-3 font-medium">{item.name}</td>
                                            <td className="py-3 px-3 text-gray-500 text-xs">{item.type}</td>
                                            <td className="py-3 px-3">{item.totalUnits}</td>
                                            <td className="py-3 px-3">{item.netUnitCost.toFixed(2)}</td>
                                            <td className="py-3 px-3 font-bold">{item.netTotalCost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 border-t border-gray-300 font-bold text-lg">
                                        <td colSpan={4} className="py-4 px-3 text-left pl-6">الإجمالي</td>
                                        <td className="py-4 px-3 text-primary-700">{inv.totalValue.toFixed(2)} EGP</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="flex justify-end gap-3 mt-6">
                                {inv.isSold ? (
                                    <button 
                                        disabled
                                        className="flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed border border-gray-200"
                                    >
                                        <Lock size={18} /> تم بيعها للعميل
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => openResellModal(inv, e)}
                                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Repeat size={18} /> بيع لعميل (توزيع)
                                    </button>
                                )}
                                
                                <button 
                                    onClick={(e) => handleDelete(inv.id, e)}
                                    className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Trash size={18} /> حذف
                                </button>
                                <button 
                                    onClick={(e) => handlePrint(inv, e)}
                                    className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    <Printer size={18} /> طباعة
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

      {/* HIDDEN PRINTABLE AREA */}
      {/* This section will only be visible when printing due to CSS rules in index.html */}
      <div id="printable-area" style={{ display: 'none' }}>
        {printInvoice && (
             <div className="p-8 font-sans" dir="rtl">
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">فاتورة مشتريات</h1>
                        <div className="text-gray-600 text-lg">
                            {printInvoice.supplierName && <p className="mb-1"><strong>المورد:</strong> {printInvoice.supplierName}</p>}
                            {printInvoice.invoiceNumber && <p className="mb-1"><strong>رقم الفاتورة:</strong> {printInvoice.invoiceNumber}</p>}
                            <p><strong>التاريخ:</strong> {new Date(printInvoice.date).toLocaleString('ar-EG')}</p>
                        </div>
                    </div>
                    <div className="text-left text-sm text-gray-400">
                        Ref: {printInvoice.id}
                    </div>
                </div>

                <table className="w-full text-right border-collapse mb-8">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-lg">
                            <th className="py-3 px-4">الصنف</th>
                            <th className="py-3 px-4">النوع</th>
                            <th className="py-3 px-4">الكمية</th>
                            <th className="py-3 px-4">سعر الوحدة</th>
                            <th className="py-3 px-4">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printInvoice.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3 px-4">{item.name}</td>
                                <td className="py-3 px-4">{item.type}</td>
                                <td className="py-3 px-4">{item.totalUnits}</td>
                                <td className="py-3 px-4">{item.netUnitCost.toFixed(2)}</td>
                                <td className="py-3 px-4 font-bold">{item.netTotalCost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-800 font-bold text-xl">
                            <td colSpan={4} className="py-4 px-4 text-left pl-8">الإجمالي النهائي</td>
                            <td className="py-4 px-4">{printInvoice.totalValue.toFixed(2)} EGP</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-12 text-center text-gray-500 text-sm border-t pt-4">
                    تم إصدار هذه الفاتورة بواسطة نظام PharmaMind
                </div>
            </div>
        )}
      </div>

      {/* RESELL MODAL */}
      {showResellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b flex justify-between items-center bg-purple-50">
                      <h3 className="font-bold text-lg text-purple-800">توزيع / إعادة بيع الفاتورة</h3>
                      <button onClick={() => setShowResellModal(false)}><X className="text-gray-500 hover:text-red-500" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                          <select 
                             className="w-full p-2 border rounded-lg"
                             value={resellConfig.clientId}
                             onChange={e => setResellConfig({...resellConfig, clientId: e.target.value})}
                          >
                              <option value="">اختر العميل...</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">خصم العادي %</label>
                              <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg text-center"
                                value={resellConfig.discountReg}
                                onChange={e => setResellConfig({...resellConfig, discountReg: parseFloat(e.target.value) || 0})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">خصم الخاص %</label>
                              <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg text-center"
                                value={resellConfig.discountSpe}
                                onChange={e => setResellConfig({...resellConfig, discountSpe: parseFloat(e.target.value) || 0})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">خصم الأخرى %</label>
                              <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg text-center"
                                value={resellConfig.discountOth}
                                onChange={e => setResellConfig({...resellConfig, discountOth: parseFloat(e.target.value) || 0})}
                              />
                          </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl text-center mt-4">
                          <div className="text-sm text-gray-500 mb-1">صافي الفاتورة للعميل (بعد الخصومات)</div>
                          <div className="text-3xl font-bold text-purple-700">
                              {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(calculateSellTotal())}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                              (تلفة الشراء الأصلية: {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(resellInvoice?.totalValue || 0)})
                          </div>
                      </div>

                      <button 
                        onClick={confirmResell}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                          <Check /> تأكيد البيع وتسجيل الدين
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Invoices;