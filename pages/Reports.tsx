import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Percent, Gift } from 'lucide-react';
import { Invoice, Supplier } from '../types';

const Reports: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'monthly' | 'extra_discount'>('monthly');

  // Monthly Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Extra Discount Filters
  const [edStartDate, setEdStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [edEndDate, setEdEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [edSupplierId, setEdSupplierId] = useState('');

  useEffect(() => {
    setInvoices(StorageService.getInvoices());
    setSuppliers(StorageService.getSuppliers());
  }, []);

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Monthly Stats Logic
  const stats = useMemo(() => {
    const filtered = invoices.filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalSpent = filtered.reduce((sum, inv) => sum + inv.totalValue, 0);
    const invoiceCount = filtered.length;
    
    let totalDiscountPoints = 0;
    let totalItems = 0;
    
    filtered.forEach(inv => {
        inv.items.forEach(item => {
            totalDiscountPoints += item.realDiscountPct;
            totalItems++;
        });
    });
    
    const avgDiscount = totalItems > 0 ? totalDiscountPoints / totalItems : 0;

    const dailyData = new Array(31).fill(0).map((_, i) => ({ day: i + 1, amount: 0 }));
    filtered.forEach(inv => {
        const day = new Date(inv.date).getDate();
        if(dailyData[day-1]) dailyData[day-1].amount += inv.totalValue;
    });

    return { totalSpent, invoiceCount, avgDiscount, dailyData: dailyData.filter(d => d.amount > 0) };
  }, [invoices, selectedMonth, selectedYear]);

  // Extra Discount Stats Logic
  const extraDiscountStats = useMemo(() => {
      const filteredItems: any[] = [];
      let totalExtraValue = 0;

      invoices.forEach(inv => {
          const d = inv.date.split('T')[0];
          // Filter by Date
          if (d < edStartDate || d > edEndDate) return;
          // Filter by Supplier
          if (edSupplierId && inv.supplierId !== edSupplierId) return;

          inv.items.forEach(item => {
              // Check if item has extra discount
              if (item.extraDiscountValue > 0 || item.extraDiscountPct > 0) {
                  filteredItems.push({
                      ...item,
                      supplierName: inv.supplierName,
                      invDate: inv.date
                  });
                  totalExtraValue += item.extraDiscountValue;
              }
          });
      });

      return { items: filteredItems, totalExtraValue };
  }, [invoices, edStartDate, edEndDate, edSupplierId]);

  return (
    <div className="space-y-6">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'monthly' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            التقرير الشهري
          </button>
          <button 
            onClick={() => setActiveTab('extra_discount')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'extra_discount' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            تقارير الخصومات الإضافية
          </button>
      </div>

      {/* MONTHLY REPORT VIEW */}
      {activeTab === 'monthly' && (
      <>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">التقرير الشهري</h2>
                <p className="text-gray-500">تحليل المشتريات والخصومات</p>
            </div>
            <div className="flex gap-2">
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="p-2 border rounded-lg bg-gray-50"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="p-2 border rounded-lg bg-gray-50"
                >
                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
                <div className="flex items-center gap-3 mb-2 opacity-90">
                    <DollarSign />
                    <span>إجمالي المشتريات</span>
                </div>
                <div className="text-3xl font-bold">
                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(stats.totalSpent)}
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <ShoppingBag className="text-orange-500" />
                    <span>عدد الفواتير</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                    {stats.invoiceCount}
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <Percent className="text-green-500" />
                    <span>متوسط الخصم الحقيقي</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                    {stats.avgDiscount.toFixed(2)}%
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <TrendingUp size={20} /> تحليل الإنفاق اليومي
            </h3>
            <div className="h-64 w-full">
                {stats.dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip 
                                formatter={(value) => [`${value} EGP`, 'القيمة']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        لا توجد بيانات لعرضها لهذا الشهر
                    </div>
                )}
            </div>
        </div>
      </>
      )}

      {/* EXTRA DISCOUNT REPORT VIEW */}
      {activeTab === 'extra_discount' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-4 items-end mb-6 pb-6 border-b">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                    <input type="date" className="p-2 border rounded-lg" value={edStartDate} onChange={e => setEdStartDate(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                    <input type="date" className="p-2 border rounded-lg" value={edEndDate} onChange={e => setEdEndDate(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                    <select 
                        value={edSupplierId} 
                        onChange={e => setEdSupplierId(e.target.value)}
                        className="p-2 border rounded-lg min-w-[200px]"
                    >
                        <option value="">جميع الموردين</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="mb-6 bg-green-50 text-green-800 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                  <div className="bg-white p-2 rounded-full text-green-600"><Gift size={24} /></div>
                  <div>
                      <div className="text-sm">إجمالي قيمة الخصومات الإضافية في الفترة المحددة</div>
                      <div className="text-2xl font-bold">{extraDiscountStats.totalExtraValue.toFixed(2)} EGP</div>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                          <tr>
                              <th className="p-3">التاريخ</th>
                              <th className="p-3">الصنف</th>
                              <th className="p-3">المورد</th>
                              <th className="p-3">نسبة الخصم الإضافي</th>
                              <th className="p-3">قيمة الخصم الإضافي</th>
                              <th className="p-3">إجمالي الصنف</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y">
                          {extraDiscountStats.items.map((item, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                  <td className="p-3 text-gray-500">{new Date(item.invDate).toLocaleDateString('ar-EG')}</td>
                                  <td className="p-3 font-medium">{item.name}</td>
                                  <td className="p-3">{item.supplierName || '-'}</td>
                                  <td className="p-3 text-green-600 font-bold">{item.extraDiscountPct}%</td>
                                  <td className="p-3 font-mono">{item.extraDiscountValue.toFixed(2)}</td>
                                  <td className="p-3">{item.netTotalCost.toFixed(2)}</td>
                              </tr>
                          ))}
                          {extraDiscountStats.items.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد أصناف بخصم إضافي في هذه الفترة</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

    </div>
  );
};

export default Reports;