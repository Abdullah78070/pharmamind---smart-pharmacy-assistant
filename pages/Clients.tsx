import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, Wallet, Save, History, ArrowDownLeft, ArrowUpRight, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Client, ClientTransaction } from '../types';

const formatCurrency = (val: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(val);

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview');
  
  // New Client Form
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState<Client>({ id: '', name: '', phone: '', balance: 0, notes: '' });

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');
  
  // Payment: Invoice Selection Logic
  const [selectedInvoiceIdsForPayment, setSelectedInvoiceIdsForPayment] = useState<string[]>([]);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setClients(StorageService.getClients());
  };

  const handleSaveClient = () => {
    if (!newClient.name) return alert('اسم العميل مطلوب');
    StorageService.saveClient({ ...newClient, id: newClient.id || Date.now().toString() });
    setIsAdding(false);
    setNewClient({ id: '', name: '', phone: '', balance: 0, notes: '' });
    refreshData();
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setTransactions(StorageService.getTransactions(client.id));
    setPaymentAmount('');
    setPaymentNote('');
    setSelectedInvoiceIdsForPayment([]);
    setActiveTab('overview');
  };

  const salesTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'SALE');
  }, [transactions]);

  // Handle checking invoices in payment section
  const toggleInvoiceSelection = (transId: string) => {
    setSelectedInvoiceIdsForPayment(prev => {
        if (prev.includes(transId)) return prev.filter(id => id !== transId);
        return [...prev, transId];
    });
  };

  // Calculate total of selected invoices
  const selectedInvoicesTotal = useMemo(() => {
      return salesTransactions
        .filter(t => selectedInvoiceIdsForPayment.includes(t.id))
        .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedInvoiceIdsForPayment, salesTransactions]);

  // Check if there is a discrepancy
  const paymentDiscrepancy = useMemo(() => {
      if (!paymentAmount) return 0;
      if (selectedInvoiceIdsForPayment.length === 0) return 0;
      return Number(paymentAmount) - selectedInvoicesTotal;
  }, [paymentAmount, selectedInvoicesTotal, selectedInvoiceIdsForPayment]);


  const handleAddPayment = () => {
    if (!selectedClient || !paymentAmount || Number(paymentAmount) <= 0) return;
    
    // Construct Note with invoice references
    let finalNote = paymentNote;
    if (selectedInvoiceIdsForPayment.length > 0) {
        const selectedInvNumbers = salesTransactions
            .filter(t => selectedInvoiceIdsForPayment.includes(t.id))
            .map(t => t.invoiceNumber || 'فاتورة')
            .join(', ');
        finalNote += ` (سداد عن: ${selectedInvNumbers})`;
    }

    const transaction: ClientTransaction = {
        id: Date.now().toString(),
        clientId: selectedClient.id,
        date: new Date().toISOString(),
        type: 'PAYMENT',
        amount: Number(paymentAmount),
        notes: finalNote || 'تسديد نقدية'
    };

    StorageService.addTransaction(transaction);
    
    // Refresh UI
    const updatedClient = StorageService.getClients().find(c => c.id === selectedClient.id);
    if (updatedClient) {
        setSelectedClient(updatedClient);
        setTransactions(StorageService.getTransactions(updatedClient.id));
    }
    refreshData();
    setPaymentAmount('');
    setPaymentNote('');
    setSelectedInvoiceIdsForPayment([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-primary-600" /> العملاء والديون
        </h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 flex items-center gap-2"
        >
            <Plus size={18} /> عميل جديد
        </button>
      </div>

      {/* Add Client Form */}
      {isAdding && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
              <h3 className="font-bold mb-4">إضافة عميل جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input 
                    placeholder="اسم العميل" 
                    className="p-2 border rounded-lg"
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                  />
                  <input 
                    placeholder="رقم الهاتف" 
                    className="p-2 border rounded-lg"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  />
                  <input 
                    placeholder="رصيد افتتاحي (عليه)" 
                    type="number"
                    className="p-2 border rounded-lg"
                    value={newClient.balance}
                    onChange={e => setNewClient({...newClient, balance: Number(e.target.value)})}
                  />
                  <input 
                    placeholder="ملاحظات" 
                    className="p-2 border rounded-lg"
                    value={newClient.notes}
                    onChange={e => setNewClient({...newClient, notes: e.target.value})}
                  />
              </div>
              <div className="flex gap-2">
                  <button onClick={handleSaveClient} className="bg-green-600 text-white px-6 py-2 rounded-lg">حفظ</button>
                  <button onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg">إلغاء</button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1 space-y-4">
              {clients.map(client => (
                  <div 
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${selectedClient?.id === client.id ? 'border-primary-500 shadow-md ring-1 ring-primary-500' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="font-bold text-gray-800">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.phone || 'لا يوجد هاتف'}</div>
                          </div>
                          <div className={`font-bold ${client.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {formatCurrency(client.balance)}
                          </div>
                      </div>
                  </div>
              ))}
              {clients.length === 0 && (
                  <div className="text-center text-gray-400 py-10">لا يوجد عملاء</div>
              )}
          </div>

          {/* Client Details & Transactions */}
          <div className="lg:col-span-2">
              {selectedClient ? (
                  <div className="space-y-6">
                      {/* Client Header Card */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="text-xl font-bold text-gray-800">{selectedClient.name}</h3>
                                  <p className="text-gray-500 text-sm">{selectedClient.notes}</p>
                              </div>
                              <div className="text-left">
                                  <div className="text-sm text-gray-500">الرصيد الحالي</div>
                                  <div className={`text-2xl font-bold ${selectedClient.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(selectedClient.balance)}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex gap-4 border-b">
                          <button 
                            onClick={() => setActiveTab('overview')}
                            className={`pb-2 px-2 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-primary-600 font-bold text-primary-600' : 'text-gray-500'}`}
                          >
                             نظرة عامة وسداد
                          </button>
                          <button 
                            onClick={() => setActiveTab('invoices')}
                            className={`pb-2 px-2 transition-colors ${activeTab === 'invoices' ? 'border-b-2 border-primary-600 font-bold text-primary-600' : 'text-gray-500'}`}
                          >
                             فواتير العميل
                          </button>
                      </div>

                      {/* Content: Overview & Payment */}
                      {activeTab === 'overview' && (
                      <>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                  <Wallet size={18} /> تسجيل تسديد نقدية
                              </h4>
                              
                              {/* Invoice Selection Area */}
                              {salesTransactions.length > 0 && (
                                  <div className="mb-4 bg-white p-3 rounded-lg border border-green-100 max-h-40 overflow-y-auto">
                                      <p className="text-xs font-bold text-gray-500 mb-2">اختر الفواتير المراد سدادها (اختياري):</p>
                                      <div className="space-y-2">
                                          {salesTransactions.map(t => (
                                              <label key={t.id} className="flex items-center justify-between gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                  <div className="flex items-center gap-2">
                                                      <input 
                                                          type="checkbox" 
                                                          checked={selectedInvoiceIdsForPayment.includes(t.id)}
                                                          onChange={() => toggleInvoiceSelection(t.id)}
                                                          className="rounded text-green-600 focus:ring-green-500"
                                                      />
                                                      <span>{new Date(t.date).toLocaleDateString('ar-EG')} - {t.invoiceNumber ? `فاتورة #${t.invoiceNumber}` : 'شراء'}</span>
                                                  </div>
                                                  <span className="font-mono font-bold text-gray-600">{formatCurrency(t.amount)}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              <div className="flex flex-col gap-3">
                                  <div className="flex gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="المبلغ المدفوع"
                                        className={`flex-1 p-2 border rounded-lg ${paymentDiscrepancy !== 0 ? 'border-orange-300 ring-1 ring-orange-200' : ''}`}
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                      />
                                      <input 
                                        type="text" 
                                        placeholder="بيان / ملاحظة"
                                        className="flex-1 p-2 border rounded-lg"
                                        value={paymentNote}
                                        onChange={e => setPaymentNote(e.target.value)}
                                      />
                                      <button 
                                        onClick={handleAddPayment}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700"
                                      >
                                          تسديد
                                      </button>
                                  </div>
                                  
                                  {/* Smart Warning */}
                                  {selectedInvoiceIdsForPayment.length > 0 && paymentAmount !== '' && Math.abs(paymentDiscrepancy) > 1 && (
                                      <div className="text-xs flex items-center gap-1 text-orange-700 bg-orange-100 p-2 rounded">
                                          <AlertTriangle size={12} />
                                          <span>
                                              تنبيه: المبلغ المدخل يختلف عن مجموع الفواتير المختارة بـ {formatCurrency(Math.abs(paymentDiscrepancy))} 
                                              {paymentDiscrepancy < 0 ? ' (أقل)' : ' (أكثر)'}
                                          </span>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* History Table */}
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="p-4 bg-gray-50 border-b flex items-center gap-2 font-bold text-gray-700">
                                  <History size={18} /> سجل الحساب
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-right text-sm">
                                      <thead className="text-gray-500">
                                          <tr>
                                              <th className="p-3">التاريخ</th>
                                              <th className="p-3">العملية</th>
                                              <th className="p-3">المبلغ</th>
                                              <th className="p-3">ملاحظات</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                          {transactions.map(t => (
                                              <tr key={t.id} className="hover:bg-gray-50">
                                                  <td className="p-3">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                                  <td className="p-3">
                                                      {t.type === 'SALE' ? (
                                                          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                                                              <ArrowUpRight size={14} /> شراء (دين)
                                                          </span>
                                                      ) : (
                                                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                                              <ArrowDownLeft size={14} /> تسديد
                                                          </span>
                                                      )}
                                                  </td>
                                                  <td className="p-3 font-bold">{formatCurrency(t.amount)}</td>
                                                  <td className="p-3 text-gray-500 max-w-xs truncate">{t.notes}</td>
                                              </tr>
                                          ))}
                                          {transactions.length === 0 && (
                                              <tr><td colSpan={4} className="p-6 text-center text-gray-400">لا توجد عمليات سابقة</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </>
                      )}

                      {/* Content: Client Invoices Report */}
                      {activeTab === 'invoices' && (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="p-4 border-b flex justify-between items-center">
                                  <h4 className="font-bold flex items-center gap-2"><FileText size={18} /> الفواتير الموزعة للعميل</h4>
                                  <div className="text-sm text-gray-500">إجمالي الفواتير: {salesTransactions.length}</div>
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-right text-sm">
                                      <thead className="bg-gray-50 text-gray-600">
                                          <tr>
                                              <th className="p-3">تاريخ البيع</th>
                                              <th className="p-3">رقم الفاتورة الأصلية</th>
                                              <th className="p-3">القيمة المستحقة</th>
                                              <th className="p-3">التفاصيل</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                          {salesTransactions.map(t => (
                                              <tr key={t.id} className="hover:bg-gray-50">
                                                  <td className="p-3">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                                  <td className="p-3 font-mono bg-gray-50 w-fit rounded px-2">{t.invoiceNumber || t.relatedInvoiceId?.slice(-4) || '-'}</td>
                                                  <td className="p-3 font-bold text-red-600">{formatCurrency(t.amount)}</td>
                                                  <td className="p-3 text-gray-500 text-xs">{t.notes}</td>
                                              </tr>
                                          ))}
                                          {salesTransactions.length === 0 && (
                                              <tr><td colSpan={4} className="p-8 text-center text-gray-400">لم يقم العميل بشراء أي فواتير بعد</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}

                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 p-10">
                      <Users size={48} className="mb-4 opacity-50" />
                      <p>اختر عميلاً لعرض التفاصيل وتسجيل العمليات</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Clients;