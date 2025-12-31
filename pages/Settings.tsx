import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Download, Upload, Database, Check } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleSave = () => {
    StorageService.saveSettings(settings);
    setMsg('تم حفظ الإعدادات بنجاح');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleReset = () => {
    if(window.confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية؟')) {
      setSettings(DEFAULT_SETTINGS);
      StorageService.saveSettings(DEFAULT_SETTINGS);
    }
  };

  // Backup Functions
  const handleBackup = () => {
    const data = StorageService.createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmamind_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg('تم تحميل ملف النسخة الاحتياطية');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              const success = StorageService.restoreBackup(content);
              if (success) {
                  setMsg('تم استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة...');
                  setTimeout(() => window.location.reload(), 2000);
              } else {
                  alert('فشل استعادة الملف. تأكد من أنه ملف نسخة احتياطية صالح.');
              }
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">إعدادات النظام</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصيدلية</label>
            <input 
              type="text" 
              value={settings.pharmacyName}
              onChange={(e) => setSettings({...settings, pharmacyName: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="col-span-full border-t pt-4 mt-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">نسب الخصم الافتراضية (%)</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">خصم الصنف العادي (Normal)</label>
            <input 
              type="number" 
              value={settings.discountNormal}
              onChange={(e) => setSettings({...settings, discountNormal: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">خصم الصنف الخاص (Special)</label>
            <input 
              type="number" 
              value={settings.discountSpecial}
              onChange={(e) => setSettings({...settings, discountSpecial: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">خصومات أخرى</label>
            <input 
              type="number" 
              value={settings.discountOther}
              onChange={(e) => setSettings({...settings, discountOther: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-6">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
                <RefreshCw size={18} /> استعادة الافتراضي
            </button>
            
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
            >
                <Save size={20} /> حفظ الإعدادات
            </button>
        </div>
        
        {msg && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center animate-pulse flex justify-center items-center gap-2">
                <Check size={18} /> {msg}
            </div>
        )}
      </div>

      {/* Backup and Restore Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <Database className="text-purple-600" /> إدارة البيانات والنسخ الاحتياطي
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
              يمكنك تنزيل نسخة كاملة من بياناتك (الفواتير، العملاء، الموردين) والاحتفاظ بها، أو استعادتها في جهاز آخر.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleBackup}
                className="flex-1 bg-purple-50 text-purple-700 border border-purple-200 px-6 py-4 rounded-xl hover:bg-purple-100 transition-all flex items-center justify-center gap-3 font-bold"
              >
                  <Download size={24} /> حفظ نسخة احتياطية
              </button>

              <div className="flex-1 relative">
                  <input 
                    type="file" 
                    accept=".json"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleRestore}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gray-50 text-gray-700 border border-gray-200 px-6 py-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 font-bold h-full"
                  >
                      <Upload size={24} /> استعادة نسخة احتياطية
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Settings;