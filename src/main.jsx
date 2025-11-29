import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client'; // ✅ Importación necesaria para web real
import { 
  Thermometer, 
  Droplets, 
  Save, 
  History, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Trash2,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  BarChart2,
  Cloud,
  Wifi,
  Sheet, 
  Printer,
  RefreshCw 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

// --- CONFIGURACIÓN ---
// URL del Script de Google Apps Script
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwfBN6Ez6GdfXJf05pL5m8sUmkRp8kuqCdtHgS6hPp_C-YyR6C557CcHMsWVrNej_eU/exec"; 

// Constantes de Identidad
const COMPANY_NAME = "UNIÓN MEDICA DEL NORTE";
const COMPANY_SLOGAN = "Salud al Alcance de Todos";
const APP_TITLE = "Control de Temperatura y Humedad";
const PRIMARY_COLOR = "#158F97"; 
const COMPANY_LOGO_URL = "https://i.postimg.cc/L8QN7rqJ/LOGO-CJ-removebg-preview.png";

// Constantes de Negocio
const AREAS = ["OPTICA", "FARMACIA", "PROCEDIMIENTOS", "TOMA MUESTRA", "ODONTOLOGIA", "LABORATORIO"];
const JORNADAS = ["Mañana", "Tarde"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function App() {
  // --- AUTO-CORRECCIÓN DE ESTILOS (Tailwind CSS) ---
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  const [activeTab, setActiveTab] = useState('registro'); 
  const [formType, setFormType] = useState('temperatura'); 
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Filtros
  const [selectedAreaStats, setSelectedAreaStats] = useState(AREAS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    jornada: 'Mañana',
    area: AREAS[0],
    tempMin: '', tempActual: '', tempMax: '',
    humMin: '', humActual: '', humMax: '',
    registradoPor: '', observaciones: ''
  });

  // --- CARGA DE DATOS ---
  const fetchSheetData = async () => {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const processed = data.map((item, index) => ({
          ...item,
          id: index, 
          timestamp: item.fecha + ' ' + item.hora 
        }));
        processed.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        setRecords(processed);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSheetData(); }, [activeTab]);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // --- LÓGICA ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateTemperature = (val) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (num < 15 || num > 30) return 'text-red-600 font-bold';
    return 'text-green-600';
  };

  const isOutOfRange = (val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return num < 15 || num > 30;
  };

  const isHumidityOutOfRange = (val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return num < 35 || num > 70;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.registradoPor) { alert("El campo 'Registrado Por' es obligatorio."); return; }
    if (formType === 'temperatura' && !formData.tempActual) { alert("Debe ingresar la Temperatura Actual."); return; }
    if (formType === 'humedad' && !formData.humActual) { alert("Debe ingresar la Humedad Actual."); return; }

    const newRecord = {
      ...formData,
      type: formType,
      tempMin: formType === 'temperatura' ? formData.tempMin : '',
      tempActual: formType === 'temperatura' ? formData.tempActual : '',
      tempMax: formType === 'temperatura' ? formData.tempMax : '',
      humMin: formType === 'humedad' ? formData.humMin : '',
      humActual: formType === 'humedad' ? formData.humActual : '',
      humMax: formType === 'humedad' ? formData.humMax : '',
    };

    try {
      setIsSaving(true);
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      alert("✅ Registro guardado exitosamente en Google Sheets.");
      setFormData(prev => ({ ...prev, tempMin: '', tempActual: '', tempMax: '', humMin: '', humActual: '', humMax: '', observaciones: '' }));
      setTimeout(fetchSheetData, 1000); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    const filteredRecords = getFilteredRecords();
    const headers = ["Tipo", "Fecha", "Hora", "Area", "Jornada", "T. Min", "T. Act", "T. Max", "H. Min", "H. Act", "H. Max", "Resp", "Obs"];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map(r => [
        r.type || 'mixto', r.fecha, r.hora || '-', r.area, r.jornada,
        r.tempMin || '-', r.tempActual || '-', r.tempMax || '-',
        r.humMin || '-', r.humActual || '-', r.humMax || '-',
        r.registradoPor, `"${r.observaciones || ''}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IPS_Reporte.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getFilteredRecords = () => {
    return records.filter(r => {
      const recordDate = new Date(r.fecha + 'T00:00:00'); 
      return (
        r.area === selectedAreaStats &&
        recordDate.getFullYear() === parseInt(selectedYear) &&
        recordDate.getMonth() === parseInt(selectedMonth)
      );
    });
  };

  const getChartData = () => {
    const areaRecords = getFilteredRecords();
    const grouped = {};
    const sortedRecords = [...areaRecords].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

    sortedRecords.forEach(r => {
      const day = r.fecha.split('-')[2];
      const key = `${day}-${r.jornada}`;
      if (!grouped[key]) {
        grouped[key] = { 
          name: `${day} (${r.jornada ? r.jornada.substring(0,1) : '-'})`,
          fecha: r.fecha, 
          jornada: r.jornada, 
          tempMin: null, tempActual: null, tempMax: null,
          humMin: null, humActual: null, humMax: null
        };
      }
      const type = r.type ? r.type.toLowerCase() : 'temperatura';
      if (type === 'temperatura') {
        if (r.tempActual) grouped[key].tempActual = parseFloat(r.tempActual);
        if (r.tempMin) grouped[key].tempMin = parseFloat(r.tempMin);
        if (r.tempMax) grouped[key].tempMax = parseFloat(r.tempMax);
      }
      if (type === 'humedad') {
        const val = r.humActual || r.humedad; 
        if (val) grouped[key].humActual = parseFloat(val);
        if (r.humMin) grouped[key].humMin = parseFloat(r.humMin);
        if (r.humMax) grouped[key].humMax = parseFloat(r.humMax);
      }
    });
    return Object.values(grouped);
  };

  const chartData = getChartData();
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @media print {
          @page { margin: 1cm; size: landscape; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          body { background: white !important; }
          .recharts-responsive-container { height: 300px !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="bg-white shadow-md sticky top-0 z-50 print:hidden border-b border-slate-100">
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto justify-center md:justify-start">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
               <img src={COMPANY_LOGO_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold tracking-tight leading-none text-black uppercase">{COMPANY_NAME}</h1>
              <p className="text-xs font-bold text-slate-600 italic tracking-wide">{COMPANY_SLOGAN}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">{APP_TITLE}</span>
                {loading ? <RefreshCw size={12} className="text-blue-500 animate-spin"/> : <Cloud size={12} className="text-green-600" title="Sincronizado"/>}
              </div>
            </div>
          </div>

          <nav className="flex gap-2 p-1">
            <button onClick={() => setActiveTab('registro')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'registro' ? 'text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'registro' ? { backgroundColor: PRIMARY_COLOR } : {}}>
              <Save size={18} /> Registro
            </button>
            <button onClick={() => setActiveTab('estadisticas')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'estadisticas' ? 'text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'estadisticas' ? { backgroundColor: PRIMARY_COLOR } : {}}>
              <History size={18} /> Historial
            </button>
          </nav>
        </div>
      </header>

      {/* HEADER IMPRESIÓN */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img src={COMPANY_LOGO_URL} alt="Logo" className="h-20 w-auto object-contain" />
             <div>
               <h1 className="text-2xl font-extrabold text-black uppercase">{COMPANY_NAME}</h1>
               <p className="text-black font-bold italic">{COMPANY_SLOGAN}</p>
               <p className="text-slate-600 mt-2 font-medium">{APP_TITLE}</p>
             </div>
          </div>
          <div className="text-right text-sm text-slate-500">
             <p><strong>Área:</strong> {selectedAreaStats}</p>
             <p><strong>Periodo:</strong> {MONTHS[selectedMonth]} {selectedYear}</p>
             <p>Generado: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {!isOnline && <div className="bg-red-500 text-white text-center py-2 px-4 rounded mb-4 text-sm font-bold animate-pulse print:hidden">⚠️ Sin conexión a internet.</div>}

        {/* --- VISTA DE REGISTRO --- */}
        {activeTab === 'registro' && (
          <div className="max-w-4xl mx-auto print:hidden">
            <div className="flex justify-center mb-8">
              <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 inline-flex gap-1">
                <button onClick={() => setFormType('temperatura')} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${formType === 'temperatura' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}> <Thermometer size={20} /> Temperatura </button>
                <button onClick={() => setFormType('humedad')} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${formType === 'humedad' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}> <Droplets size={20} /> Humedad </button>
              </div>
            </div>

            <div className={`rounded-xl shadow-md border overflow-hidden transition-colors ${formType === 'temperatura' ? 'bg-white border-blue-100' : 'bg-white border-purple-100'}`}>
              <div className={`px-6 py-4 border-b flex justify-between items-center ${formType === 'temperatura' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${formType === 'temperatura' ? 'text-blue-800' : 'text-purple-800'}`}>
                  {formType === 'temperatura' ? <Thermometer /> : <Droplets />} 
                  {formType === 'temperatura' ? 'Nuevo Registro de Temperatura' : 'Nuevo Registro de Humedad'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Bloque 1 */}
                  <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha</label><input type="date" name="fecha" required value={formData.fecha} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Clock size={14}/> Jornada</label><select name="jornada" value={formData.jornada} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">{JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Building2 size={14}/> Área</label><select name="area" value={formData.area} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">{AREAS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                  </div>

                  {/* Bloque 2 */}
                  <div className={`space-y-4 p-4 rounded-lg border ${formType === 'temperatura' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                    {formType === 'temperatura' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Min (°C)</label><input type="number" step="0.1" name="tempMin" value={formData.tempMin} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500"/></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Max (°C)</label><input type="number" step="0.1" name="tempMax" value={formData.tempMax} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500"/></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Actual (°C)</label><div className="relative"><input type="number" step="0.1" name="tempActual" value={formData.tempActual} onChange={handleInputChange} className={`w-full border-2 rounded-lg px-3 py-2 text-lg font-bold outline-none ${isOutOfRange(formData.tempActual) ? 'border-red-400 text-red-700 bg-red-50' : 'border-blue-200 text-slate-700'}`} placeholder="Ej: 24.5"/><div className="absolute right-3 top-3">{formData.tempActual && (isOutOfRange(formData.tempActual) ? <AlertTriangle className="text-red-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />)}</div></div>{isOutOfRange(formData.tempActual) && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">⚠️ ¡Fuera de rango!</p>}</div>
                      </>
                    )}
                    {formType === 'humedad' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Min (%)</label><input type="number" name="humMin" value={formData.humMin} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-purple-500"/></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Max (%)</label><input type="number" name="humMax" value={formData.humMax} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-purple-500"/></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Actual (%)</label><div className="relative"><input type="number" name="humActual" value={formData.humActual} onChange={handleInputChange} className={`w-full border-2 rounded-lg px-3 py-2 text-lg font-bold outline-none ${isHumidityOutOfRange(formData.humActual) ? 'border-red-400 text-red-700 bg-red-50' : 'border-purple-200 text-purple-700'}`} placeholder="Ej: 60"/><div className="absolute right-3 top-3">{formData.humActual && (isHumidityOutOfRange(formData.humActual) ? <AlertTriangle className="text-red-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />)}</div></div>{isHumidityOutOfRange(formData.humActual) && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">⚠️ ¡Fuera de rango!</p>}</div>
                      </>
                    )}
                  </div>

                  {/* Bloque 3 */}
                  <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><User size={14}/> Registrado Por</label><input type="text" name="registradoPor" required value={formData.registradoPor} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre..."/></div>
                    <div className="h-full"><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><FileText size={14}/> Observaciones</label><textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none" placeholder="Novedades..."></textarea></div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button type="submit" className={`font-bold py-3 px-8 rounded-lg shadow-md transition-transform active:scale-95 flex items-center gap-2 text-white ${formType === 'temperatura' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    <Save size={20} /> {isSaving ? 'Guardando...' : 'Guardar en Sheets'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VISTA DE ESTADISTICAS --- */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 print:hidden">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área</label><select value={selectedAreaStats} onChange={(e) => setSelectedAreaStats(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{AREAS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mes</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                <div className="w-32"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Printer size={16} /> Imprimir / PDF</button>
                <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Download size={16} /> CSV</button>
                <a href={GOOGLE_SHEETS_WEBHOOK_URL.replace('/exec', '/edit')} target="_blank" rel="noreferrer" className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Sheet size={16} /> Ver Sheet</a>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-12 text-center rounded-lg shadow-sm print:shadow-none print:border-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4 print:hidden"></div>
                <p className="text-slate-500">Cargando datos desde Google Sheets...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                  {/* Gráficas igual que antes */}
                  <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Thermometer className="text-blue-500 print:text-black" /> Temperatura (°C)</h3></div>
                    <div className="h-64 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/><YAxis domain={[10, 35]} /><Tooltip /><Legend /><ReferenceArea y1={15} y2={30} fill="green" fillOpacity={0.1} label="Zona Segura" /><Line type="monotone" dataKey="tempMin" stroke="#3b82f6" name="Min" strokeDasharray="3 3" dot={false} /><Line type="monotone" dataKey="tempActual" stroke="#10b981" name="Actual" strokeWidth={3} /><Line type="monotone" dataKey="tempMax" stroke="#ef4444" name="Max" strokeDasharray="3 3" dot={false} /></LineChart></ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Droplets className="text-purple-500 print:text-black" /> Humedad (%)</h3></div>
                    <div className="h-64 w-full">
                      {chartData.some(d => d.humActual) ? (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/><YAxis domain={[0, 100]} /><Tooltip /><Legend /><ReferenceArea y1={35} y2={70} fill="purple" fillOpacity={0.1} label="Zona Segura" /><Line type="monotone" dataKey="humMin" stroke="#d8b4fe" name="Min" strokeDasharray="3 3" dot={false} /><Line type="monotone" dataKey="humActual" stroke="#8b5cf6" name="Actual" strokeWidth={3} /><Line type="monotone" dataKey="humMax" stroke="#581c87" name="Max" strokeDasharray="3 3" dot={false} /></LineChart></ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                    </div>
                  </div>
                </div>
                {/* Estadísticas */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 print:text-black">Estadísticas</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-2"><span className="text-slate-600 flex items-center gap-2"><Thermometer size={14}/> Prom. Temp</span><span className="text-xl font-bold text-blue-700 print:text-black">{(() => { const records = getFilteredRecords(); const temps = records.filter(r => r.tempActual).map(r => parseFloat(r.tempActual)); return temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) + '°C' : '--'; })()}</span></div>
                        <div className="flex justify-between items-end border-b pb-2"><span className="text-slate-600 flex items-center gap-2"><Droplets size={14}/> Prom. Hum</span><span className="text-xl font-bold text-purple-700 print:text-black">{(() => { const records = getFilteredRecords(); const hums = records.filter(r => (r.humActual || r.humedad)).map(r => parseFloat(r.humActual || r.humedad)); return hums.length ? (hums.reduce((a,b)=>a+b,0)/hums.length).toFixed(1) + '%' : '--'; })()}</span></div>
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// ✅ LÍNEA CRÍTICA: ESTO HACE QUE LA APP APAREZCA EN PANTALLA
// ----------------------------------------------------------------------
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

// --- CONFIGURACIÓN ---
// URL del Script de Google Apps Script
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwfBN6Ez6GdfXJf05pL5m8sUmkRp8kuqCdtHgS6hPp_C-YyR6C557CcHMsWVrNej_eU/exec"; 

// Constantes de Identidad
const COMPANY_NAME = "UNIÓN MEDICA DEL NORTE";
const COMPANY_SLOGAN = "Salud al Alcance de Todos";
const APP_TITLE = "Control de Temperatura y Humedad";
const PRIMARY_COLOR = "#158F97"; 
const COMPANY_LOGO_URL = "https://i.postimg.cc/L8QN7rqJ/LOGO-CJ-removebg-preview.png";

// Constantes de Negocio
const AREAS = ["OPTICA", "FARMACIA", "PROCEDIMIENTOS", "TOMA MUESTRA", "ODONTOLOGIA", "LABORATORIO"];
const JORNADAS = ["Mañana", "Tarde"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function App() {
  // --- AUTO-CORRECCIÓN DE ESTILOS (Tailwind CSS) ---
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  const [activeTab, setActiveTab] = useState('registro'); 
  const [formType, setFormType] = useState('temperatura'); 
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Filtros
  const [selectedAreaStats, setSelectedAreaStats] = useState(AREAS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    jornada: 'Mañana',
    area: AREAS[0],
    tempMin: '', tempActual: '', tempMax: '',
    humMin: '', humActual: '', humMax: '',
    registradoPor: '', observaciones: ''
  });

  // --- CARGA DE DATOS ---
  const fetchSheetData = async () => {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const processed = data.map((item, index) => ({
          ...item,
          id: index, 
          timestamp: item.fecha + ' ' + item.hora 
        }));
        processed.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        setRecords(processed);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSheetData(); }, [activeTab]);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // --- LÓGICA ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateTemperature = (val) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (num < 15 || num > 30) return 'text-red-600 font-bold';
    return 'text-green-600';
  };

  const isOutOfRange = (val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return num < 15 || num > 30;
  };

  const isHumidityOutOfRange = (val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return num < 35 || num > 70;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.registradoPor) { alert("El campo 'Registrado Por' es obligatorio."); return; }
    if (formType === 'temperatura' && !formData.tempActual) { alert("Debe ingresar la Temperatura Actual."); return; }
    if (formType === 'humedad' && !formData.humActual) { alert("Debe ingresar la Humedad Actual."); return; }

    const newRecord = {
      ...formData,
      type: formType,
      tempMin: formType === 'temperatura' ? formData.tempMin : '',
      tempActual: formType === 'temperatura' ? formData.tempActual : '',
      tempMax: formType === 'temperatura' ? formData.tempMax : '',
      humMin: formType === 'humedad' ? formData.humMin : '',
      humActual: formType === 'humedad' ? formData.humActual : '',
      humMax: formType === 'humedad' ? formData.humMax : '',
    };

    try {
      setIsSaving(true);
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      alert("✅ Registro guardado exitosamente en Google Sheets.");
      setFormData(prev => ({ ...prev, tempMin: '', tempActual: '', tempMax: '', humMin: '', humActual: '', humMax: '', observaciones: '' }));
      setTimeout(fetchSheetData, 1000); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    const filteredRecords = getFilteredRecords();
    const headers = ["Tipo", "Fecha", "Hora", "Area", "Jornada", "T. Min", "T. Act", "T. Max", "H. Min", "H. Act", "H. Max", "Resp", "Obs"];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map(r => [
        r.type || 'mixto', r.fecha, r.hora || '-', r.area, r.jornada,
        r.tempMin || '-', r.tempActual || '-', r.tempMax || '-',
        r.humMin || '-', r.humActual || '-', r.humMax || '-',
        r.registradoPor, `"${r.observaciones || ''}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IPS_Reporte.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getFilteredRecords = () => {
    return records.filter(r => {
      const recordDate = new Date(r.fecha + 'T00:00:00'); 
      return (
        r.area === selectedAreaStats &&
        recordDate.getFullYear() === parseInt(selectedYear) &&
        recordDate.getMonth() === parseInt(selectedMonth)
      );
    });
  };

  const getChartData = () => {
    const areaRecords = getFilteredRecords();
    const grouped = {};
    const sortedRecords = [...areaRecords].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

    sortedRecords.forEach(r => {
      const day = r.fecha.split('-')[2];
      const key = `${day}-${r.jornada}`;
      if (!grouped[key]) {
        grouped[key] = { 
          name: `${day} (${r.jornada ? r.jornada.substring(0,1) : '-'})`,
          fecha: r.fecha, 
          jornada: r.jornada, 
          tempMin: null, tempActual: null, tempMax: null,
          humMin: null, humActual: null, humMax: null
        };
      }
      const type = r.type ? r.type.toLowerCase() : 'temperatura';
      if (type === 'temperatura') {
        if (r.tempActual) grouped[key].tempActual = parseFloat(r.tempActual);
        if (r.tempMin) grouped[key].tempMin = parseFloat(r.tempMin);
        if (r.tempMax) grouped[key].tempMax = parseFloat(r.tempMax);
      }
      if (type === 'humedad') {
        const val = r.humActual || r.humedad; 
        if (val) grouped[key].humActual = parseFloat(val);
        if (r.humMin) grouped[key].humMin = parseFloat(r.humMin);
        if (r.humMax) grouped[key].humMax = parseFloat(r.humMax);
      }
    });
    return Object.values(grouped);
  };

  const chartData = getChartData();
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @media print {
          @page { margin: 1cm; size: landscape; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          body { background: white !important; }
          .recharts-responsive-container { height: 300px !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="bg-white shadow-md sticky top-0 z-50 print:hidden border-b border-slate-100">
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto justify-center md:justify-start">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
               <img src={COMPANY_LOGO_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold tracking-tight leading-none text-black uppercase">{COMPANY_NAME}</h1>
              <p className="text-xs font-bold text-slate-600 italic tracking-wide">{COMPANY_SLOGAN}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">{APP_TITLE}</span>
                {loading ? <RefreshCw size={12} className="text-blue-500 animate-spin"/> : <Cloud size={12} className="text-green-600" title="Sincronizado"/>}
              </div>
            </div>
          </div>

          <nav className="flex gap-2 p-1">
            <button onClick={() => setActiveTab('registro')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'registro' ? 'text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'registro' ? { backgroundColor: PRIMARY_COLOR } : {}}>
              <Save size={18} /> Registro
            </button>
            <button onClick={() => setActiveTab('estadisticas')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'estadisticas' ? 'text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'estadisticas' ? { backgroundColor: PRIMARY_COLOR } : {}}>
              <History size={18} /> Historial
            </button>
          </nav>
        </div>
      </header>

      {/* HEADER IMPRESIÓN */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img src={COMPANY_LOGO_URL} alt="Logo" className="h-20 w-auto object-contain" />
             <div>
               <h1 className="text-2xl font-extrabold text-black uppercase">{COMPANY_NAME}</h1>
               <p className="text-black font-bold italic">{COMPANY_SLOGAN}</p>
               <p className="text-slate-600 mt-2 font-medium">{APP_TITLE}</p>
             </div>
          </div>
          <div className="text-right text-sm text-slate-500">
             <p><strong>Área:</strong> {selectedAreaStats}</p>
             <p><strong>Periodo:</strong> {MONTHS[selectedMonth]} {selectedYear}</p>
             <p>Generado: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {!isOnline && <div className="bg-red-500 text-white text-center py-2 px-4 rounded mb-4 text-sm font-bold animate-pulse print:hidden">⚠️ Sin conexión a internet.</div>}

        {/* --- VISTA DE REGISTRO --- */}
        {activeTab === 'registro' && (
          <div className="max-w-4xl mx-auto print:hidden">
            <div className="flex justify-center mb-8">
              <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 inline-flex gap-1">
                <button onClick={() => setFormType('temperatura')} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${formType === 'temperatura' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}> <Thermometer size={20} /> Temperatura </button>
                <button onClick={() => setFormType('humedad')} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${formType === 'humedad' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}> <Droplets size={20} /> Humedad </button>
              </div>
            </div>

            <div className={`rounded-xl shadow-md border overflow-hidden transition-colors ${formType === 'temperatura' ? 'bg-white border-blue-100' : 'bg-white border-purple-100'}`}>
              <div className={`px-6 py-4 border-b flex justify-between items-center ${formType === 'temperatura' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${formType === 'temperatura' ? 'text-blue-800' : 'text-purple-800'}`}>
                  {formType === 'temperatura' ? <Thermometer /> : <Droplets />} 
                  {formType === 'temperatura' ? 'Nuevo Registro de Temperatura' : 'Nuevo Registro de Humedad'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Bloque 1 */}
                  <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha</label><input type="date" name="fecha" required value={formData.fecha} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Clock size={14}/> Jornada</label><select name="jornada" value={formData.jornada} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">{JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Building2 size={14}/> Área</label><select name="area" value={formData.area} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">{AREAS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                  </div>

                  {/* Bloque 2 */}
                  <div className={`space-y-4 p-4 rounded-lg border ${formType === 'temperatura' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                    {formType === 'temperatura' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Min (°C)</label><input type="number" step="0.1" name="tempMin" value={formData.tempMin} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500"/></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Max (°C)</label><input type="number" step="0.1" name="tempMax" value={formData.tempMax} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500"/></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Actual (°C)</label><div className="relative"><input type="number" step="0.1" name="tempActual" value={formData.tempActual} onChange={handleInputChange} className={`w-full border-2 rounded-lg px-3 py-2 text-lg font-bold outline-none ${isOutOfRange(formData.tempActual) ? 'border-red-400 text-red-700 bg-red-50' : 'border-blue-200 text-slate-700'}`} placeholder="Ej: 24.5"/><div className="absolute right-3 top-3">{formData.tempActual && (isOutOfRange(formData.tempActual) ? <AlertTriangle className="text-red-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />)}</div></div>{isOutOfRange(formData.tempActual) && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">⚠️ ¡Fuera de rango!</p>}</div>
                      </>
                    )}
                    {formType === 'humedad' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Min (%)</label><input type="number" name="humMin" value={formData.humMin} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-purple-500"/></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-1">Max (%)</label><input type="number" name="humMax" value={formData.humMax} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1.5 focus:ring-purple-500"/></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Actual (%)</label><div className="relative"><input type="number" name="humActual" value={formData.humActual} onChange={handleInputChange} className={`w-full border-2 rounded-lg px-3 py-2 text-lg font-bold outline-none ${isHumidityOutOfRange(formData.humActual) ? 'border-red-400 text-red-700 bg-red-50' : 'border-purple-200 text-purple-700'}`} placeholder="Ej: 60"/><div className="absolute right-3 top-3">{formData.humActual && (isHumidityOutOfRange(formData.humActual) ? <AlertTriangle className="text-red-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />)}</div></div>{isHumidityOutOfRange(formData.humActual) && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">⚠️ ¡Fuera de rango!</p>}</div>
                      </>
                    )}
                  </div>

                  {/* Bloque 3 */}
                  <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><User size={14}/> Registrado Por</label><input type="text" name="registradoPor" required value={formData.registradoPor} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre..."/></div>
                    <div className="h-full"><label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><FileText size={14}/> Observaciones</label><textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none" placeholder="Novedades..."></textarea></div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button type="submit" className={`font-bold py-3 px-8 rounded-lg shadow-md transition-transform active:scale-95 flex items-center gap-2 text-white ${formType === 'temperatura' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    <Save size={20} /> {isSaving ? 'Guardando...' : 'Guardar en Sheets'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VISTA DE ESTADISTICAS --- */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 print:hidden">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área</label><select value={selectedAreaStats} onChange={(e) => setSelectedAreaStats(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{AREAS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mes</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                <div className="w-32"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Printer size={16} /> Imprimir / PDF</button>
                <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Download size={16} /> CSV</button>
                <a href={GOOGLE_SHEETS_WEBHOOK_URL.replace('/exec', '/edit')} target="_blank" rel="noreferrer" className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Sheet size={16} /> Ver Sheet</a>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-12 text-center rounded-lg shadow-sm print:shadow-none print:border-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4 print:hidden"></div>
                <p className="text-slate-500">Cargando datos desde Google Sheets...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                  {/* Gráficas igual que antes */}
                  <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Thermometer className="text-blue-500 print:text-black" /> Temperatura (°C)</h3></div>
                    <div className="h-64 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/><YAxis domain={[10, 35]} /><Tooltip /><Legend /><ReferenceArea y1={15} y2={30} fill="green" fillOpacity={0.1} label="Zona Segura" /><Line type="monotone" dataKey="tempMin" stroke="#3b82f6" name="Min" strokeDasharray="3 3" dot={false} /><Line type="monotone" dataKey="tempActual" stroke="#10b981" name="Actual" strokeWidth={3} /><Line type="monotone" dataKey="tempMax" stroke="#ef4444" name="Max" strokeDasharray="3 3" dot={false} /></LineChart></ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Droplets className="text-purple-500 print:text-black" /> Humedad (%)</h3></div>
                    <div className="h-64 w-full">
                      {chartData.some(d => d.humActual) ? (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/><YAxis domain={[0, 100]} /><Tooltip /><Legend /><ReferenceArea y1={35} y2={70} fill="purple" fillOpacity={0.1} label="Zona Segura" /><Line type="monotone" dataKey="humMin" stroke="#d8b4fe" name="Min" strokeDasharray="3 3" dot={false} /><Line type="monotone" dataKey="humActual" stroke="#8b5cf6" name="Actual" strokeWidth={3} /><Line type="monotone" dataKey="humMax" stroke="#581c87" name="Max" strokeDasharray="3 3" dot={false} /></LineChart></ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
                    </div>
                  </div>
                </div>
                {/* Estadísticas */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 print:text-black">Estadísticas</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-2"><span className="text-slate-600 flex items-center gap-2"><Thermometer size={14}/> Prom. Temp</span><span className="text-xl font-bold text-blue-700 print:text-black">{(() => { const records = getFilteredRecords(); const temps = records.filter(r => r.tempActual).map(r => parseFloat(r.tempActual)); return temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) + '°C' : '--'; })()}</span></div>
                        <div className="flex justify-between items-end border-b pb-2"><span className="text-slate-600 flex items-center gap-2"><Droplets size={14}/> Prom. Hum</span><span className="text-xl font-bold text-purple-700 print:text-black">{(() => { const records = getFilteredRecords(); const hums = records.filter(r => (r.humActual || r.humedad)).map(r => parseFloat(r.humActual || r.humedad)); return hums.length ? (hums.reduce((a,b)=>a+b,0)/hums.length).toFixed(1) + '%' : '--'; })()}</span></div>
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
