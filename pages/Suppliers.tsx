import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Truck, Search, FileBarChart } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Supplier, Invoice } from '../types';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [view, setView] = useState<'list' | 'report'>('list');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  
  // Form State
  const [newSupplier, setNewSupplier] = useState<Supplier>({ id: '', name: '', phone: '', notes: '' });

  // Report Date Range
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setSuppliers(StorageService.getSuppliers());
    setInvoices(StorageService.getInvoices());
  }, []);

  const handleSave = () => {
    if (!newSupplier.name) return alert('اسم المورد مطلوب');
    const supplier = { ...newSupplier, id: newSupplier.id || Date.now().toString() };
    StorageService.saveSupplier(supplier);
    setSuppliers(StorageService.getSuppliers());
    setNewSupplier({ id: '', name: '', phone: '', notes: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف المورد؟')) {
      StorageService.deleteSupplier(id);
      setSuppliers(StorageService.getSuppliers());
    }
  };

  const handleEdit = (s: Supplier) => {
    setNewSupplier(s);
  };

  // Report Calculation
  const getSupplierStats = (id: string) => {
    const supplierInvoices = invoices.filter(inv => {
        const d = inv.date.split('T')[0];
        return inv.supplierId === id && d >= startDate && d <= endDate;
    });

    const totalPurchases = supplierInvoices.reduce((sum, inv) => sum + inv.totalValue, 0);
    const totalItems = supplierInvoices.reduce((sum, inv) => sum + inv.totalItems, 0);
    
    // Detailed Item List
    const itemsList = supplierInvoices.flatMap(inv => inv.items.map(item => ({
        ...item,
        invDate: inv.date
    })));

    return { totalPurchases, totalItems, count: supplierInvoices.length, itemsList };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-primary-600" /> إدارة الموردين
        </h2>
        <div className="flex gap-2 bg-white p-1 rounded-lg border">
            <button 
                onClick={() => setView('list')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                قائمة الموردين
            </button>
            <button 
                onClick={() => setView('report')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'report' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                تقارير الموردين
            </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-700 mb-4">{newSupplier.id ? 'تعديل مورد' : 'إضافة مورد جديد'}</h3>
                <div className="space-y-3">
                    <input 
                        className="w-full p-2 border rounded-lg" 
                        placeholder="اسم المورد" 
                        value={newSupplier.name}
                        onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                    />
                    <input 
                        className="w-full p-2 border rounded-lg" 
                        placeholder="رقم الهاتف" 
                        value={newSupplier.phone}
                        onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                    />
                    <textarea 
                        className="w-full p-2 border rounded-lg" 
                        placeholder="ملاحظات" 
                        rows={3}
                        value={newSupplier.notes}
                        onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})}
                    />
                    <div className="flex gap-2">
                        {newSupplier.id && (
                            <button 
                                onClick={() => setNewSupplier({ id: '', name: '', phone: '', notes: '' })}
                                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg"
                            >
                                إلغاء
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 flex justify-center items-center gap-2"
                        >
                            <Save size={18} /> حفظ
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">لا يوجد موردين مسجلين</div>}
                {suppliers.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start group hover:border-primary-200 transition-all">
                        <div>
                            <div className="font-bold text-gray-800 text-lg">{s.name}</div>
                            {s.phone && <div className="text-sm text-gray-500">{s.phone}</div>}
                            {s.notes && <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-1 rounded">{s.notes}</div>}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(s)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Save size={16} /></button>
                             <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {view === 'report' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-4 items-end mb-6 border-b pb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                    <select 
                        className="p-2 border rounded-lg min-w-[200px]"
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                    >
                        <option value="">اختر مورد...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                    <input type="date" className="p-2 border rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                    <input type="date" className="p-2 border rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {selectedSupplierId ? (
                (() => {
                    const stats = getSupplierStats(selectedSupplierId);
                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl text-blue-700">
                                    <div className="text-sm opacity-75">إجمالي المشتريات</div>
                                    <div className="text-2xl font-bold">{stats.totalPurchases.toFixed(2)} EGP</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl text-purple-700">
                                    <div className="text-sm opacity-75">عدد الفواتير</div>
                                    <div className="text-2xl font-bold">{stats.count}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-green-700">
                                    <div className="text-sm opacity-75">عدد الأصناف</div>
                                    <div className="text-2xl font-bold">{stats.totalItems}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileBarChart size={18} /> سجل الأصناف وصافي الخصم</h4>
                                <div className="overflow-x-auto border rounded-xl">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="p-3">التاريخ</th>
                                                <th className="p-3">الصنف</th>
                                                <th className="p-3">النوع</th>
                                                <th className="p-3">الكمية</th>
                                                <th className="p-3">صافي الوحدة</th>
                                                <th className="p-3">نسبة الخصم</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {stats.itemsList.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 text-gray-500">{new Date(item.invDate).toLocaleDateString('ar-EG')}</td>
                                                    <td className="p-3 font-medium">{item.name}</td>
                                                    <td className="p-3">{item.type}</td>
                                                    <td className="p-3">{item.totalUnits}</td>
                                                    <td className="p-3 font-mono text-primary-600">{item.netUnitCost.toFixed(2)}</td>
                                                    <td className="p-3 font-bold">{item.realDiscountPct.toFixed(2)}%</td>
                                                </tr>
                                            ))}
                                            {stats.itemsList.length === 0 && (
                                                <tr><td colSpan={6} className="p-4 text-center text-gray-400">لا توجد أصناف في هذه الفترة</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()
            ) : (
                <div className="text-center py-10 text-gray-400">الرجاء اختيار مورد لعرض التقرير</div>
            )}
        </div>
      )}
    </div>
  );
};

export default Suppliers;