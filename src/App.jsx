import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Save, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  Cloud,
  Printer,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Activity,
  Microscope,
  MapPin
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
  ReferenceLine
} from 'recharts';

// --- CONFIGURACIÓN ---
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwfBN6Ez6GdfXJf05pL5m8sUmkRp8kuqCdtHgS6hPp_C-YyR6C557CcHMsWVrNej_eU/exec"; 

const COMPANY_NAME = "UNIÓN MEDICA DEL NORTE";
const COMPANY_SLOGAN = "Salud al Alcance de Todos";
const APP_TITLE = "Control de Temperatura y Humedad";
const PRIMARY_COLOR = "#158F97"; 
const COMPANY_LOGO_URL = "https://i.postimg.cc/L8QN7rqJ/LOGO-CJ-removebg-preview.png";

const AREAS = ["OPTICA", "FARMACIA", "PROCEDIMIENTOS", "TOMA MUESTRA", "ODONTOLOGIA", "LABORATORIO"];

const LAB_ZONES = [
  "LABORATORIO", 
  "BAÑO SEROLOGICO",
  "CLUB DE LEONES",
  "DEPOSITO INSUMOS",
  "NEVERA TRANSPORTE",
  "NEVERA ULTRALAB",
  "NEVERA WHIRPOOL",
  "CONGELADOR",
  "TOMA DE MUESTRA",
  "TOMA DE MUESTRA CLAN"
];

// --- RANGOS ---
const ZONE_LIMITS = {
  "DEFAULT": { temp: [15, 30], hum: [35, 70] }, 
  "BAÑO SEROLOGICO":    { temp: [10, 50], hum: [0, 100] },
  "NEVERA TRANSPORTE":  { temp: [2, 8],   hum: [0, 100] },
  "NEVERA ULTRALAB":    { temp: [2, 8],   hum: [0, 100] },
  "NEVERA WHIRPOOL":    { temp: [2, 8],   hum: [0, 100] },
  "CONGELADOR":         { temp: [-5, 0],  hum: [0, 100] }, 
};

const JORNADAS = ["Mañana", "Tarde"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function App() {
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
  const [selectedJornadaStats, setSelectedJornadaStats] = useState('Todas');
  const [selectedTypeStats, setSelectedTypeStats] = useState('Temperatura'); 

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    jornada: 'Mañana',
    area: AREAS[0],
    subArea: LAB_ZONES[0], 
    tempMin: '', tempActual: '', tempMax: '',
    humMin: '', humActual: '', humMax: '',
    registradoPor: '', observaciones: ''
  });

  const parseNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const cleanVal = val.toString().replace(',', '.');
    const num = parseFloat(cleanVal);
    return isNaN(num) ? null : num;
  };

  const getCurrentLimits = (areaName) => {
    const specificKey = Object.keys(ZONE_LIMITS).find(key => 
      areaName.includes(key) && key !== "DEFAULT"
    );
    return specificKey ? ZONE_LIMITS[specificKey] : ZONE_LIMITS["DEFAULT"];
  };

  const fetchSheetData = async () => {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const processed = data.map((item, index) => {
          const normalizedItem = {};
          Object.keys(item).forEach(key => {
            normalizedItem[key.trim().toLowerCase()] = item[key];
          });

          const rawType = normalizedItem['tipo'] || normalizedItem['type'] || 'temperatura';
          const type = rawType.toString().toLowerCase();
          
          const valActual = parseNum(normalizedItem['actual']);
          const valMin = parseNum(normalizedItem['mínima'] || normalizedItem['minima'] || normalizedItem['min'] || normalizedItem['mÃnima']);
          const valMax = parseNum(normalizedItem['máxima'] || normalizedItem['maxima'] || normalizedItem['max'] || normalizedItem['mÃ¡xima']);

          return {
            id: index,
            fecha: normalizedItem['fecha'],
            hora: normalizedItem['hora registro'] || normalizedItem['hora'],
            jornada: normalizedItem['jornada'],
            area: normalizedItem['area'], 
            registradoPor: normalizedItem['responsable'] || normalizedItem['registradopor'],
            observaciones: normalizedItem['observaciones'],
            type: type,
            tempActual: type.includes('temp') ? valActual : null,
            tempMin: type.includes('temp') ? valMin : null,
            tempMax: type.includes('temp') ? valMax : null,
            humActual: type.includes('hum') ? valActual : null,
            humMin: type.includes('hum') ? valMin : null,
            humMax: type.includes('hum') ? valMax : null,
          };
        });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'registradoPor' || name === 'observaciones') {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const isOutOfRange = (val) => {
    if (!val) return false;
    const num = parseNum(val);
    const currentAreaName = formData.area === 'LABORATORIO' ? formData.subArea : formData.area;
    const limits = getCurrentLimits(currentAreaName);
    return num < limits.temp[0] || num > limits.temp[1];
  };

  const isHumidityOutOfRange = (val) => {
    if (!val) return false;
    const num = parseNum(val);
    const currentAreaName = formData.area === 'LABORATORIO' ? formData.subArea : formData.area;
    const limits = getCurrentLimits(currentAreaName);
    return num < limits.hum[0] || num > limits.hum[1];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.registradoPor) { alert("El campo 'Registrado Por' es obligatorio."); return; }
    if (formType === 'temperatura' && !formData.tempActual) { alert("Debe ingresar la Temperatura Actual."); return; }
    if (formType === 'humedad' && !formData.humActual) { alert("Debe ingresar la Humedad Actual."); return; }

    const finalAreaName = formData.area === 'LABORATORIO' 
      ? `LABORATORIO - ${formData.subArea}` 
      : formData.area;

    const newRecord = {
      ...formData,
      area: finalAreaName, 
      type: formType === 'temperatura' ? 'Temperatura' : 'Humedad', 
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
      alert("✅ Registro guardado exitosamente.");
      setFormData(prev => ({ 
        ...prev, 
        tempMin: '', tempActual: '', tempMax: '', 
        humMin: '', humActual: '', humMax: '', 
        observaciones: '' 
      }));
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
        r.type === 'temperatura' ? 'Temperatura' : (r.type === 'humedad' ? 'Humedad' : r.type),
        r.fecha, 
        r.hora || '-', 
        r.area, 
        r.jornada,
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
      if (!r.fecha) return false;
      const dateStr = r.fecha.toString().split('T')[0]; 
      const dateParts = dateStr.split('-');
      if(dateParts.length < 3) return false;

      const recordYear = parseInt(dateParts[0]);
      const recordMonth = parseInt(dateParts[1]) - 1; 

      const matchesJornada = selectedJornadaStats === 'Todas' || r.jornada === selectedJornadaStats;
      
      return (
        r.area === selectedAreaStats &&
        recordYear === parseInt(selectedYear) &&
        recordMonth === parseInt(selectedMonth) &&
        matchesJornada 
      );
    });
  };

  const getUniqueAreas = () => {
    const areasInRecords = records.map(r => r.area);
    const uniqueSet = new Set([...AREAS, ...areasInRecords]);
    return Array.from(uniqueSet).sort();
  };

  const getChartData = () => {
    const areaRecords = getFilteredRecords();
    const grouped = {};
    const sortedRecords = [...areaRecords].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

    sortedRecords.forEach(r => {
      if(!r.fecha) return;
      const dateStr = r.fecha.toString().split('T')[0];
      const day = dateStr.split('-')[2];
      const key = selectedJornadaStats === 'Todas' ? `${day}-${r.jornada}` : `${day}`;
      
      if (!grouped[key]) {
        grouped[key] = { 
          name: selectedJornadaStats === 'Todas' ? `${day} (${r.jornada ? r.jornada.substring(0,1) : '-'})` : `${day}`,
          fecha: r.fecha, 
          jornada: r.jornada, 
          tempMin: null, tempActual: null, tempMax: null,
          humMin: null, humActual: null, humMax: null
        };
      }
      
      if (r.type && r.type.includes('temp')) {
        if (r.tempActual !== null) grouped[key].tempActual = r.tempActual;
        if (r.tempMin !== null) grouped[key].tempMin = r.tempMin;
        if (r.tempMax !== null) grouped[key].tempMax = r.tempMax;
      }
      
      if (r.type && r.type.includes('hum')) {
        if (r.humActual !== null) grouped[key].humActual = r.humActual;
        if (r.humMin !== null) grouped[key].humMin = r.humMin;
        if (r.humMax !== null) grouped[key].humMax = r.humMax;
      }
    });
    return Object.values(grouped).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const chartData = getChartData();
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);
  const availableAreas = getUniqueAreas();
  const currentChartLimits = getCurrentLimits(selectedAreaStats);

  const calculateAverage = (field) => {
    const validRecords = getFilteredRecords().filter(r => r[field] !== null && r[field] !== undefined);
    if (validRecords.length === 0) return '--';
    const sum = validRecords.reduce((acc, curr) => acc + (parseFloat(curr[field]) || 0), 0);
    return (sum / validRecords.length).toFixed(1);
  };

  // Determinar colores del tema actual
  const themeColor = formType === 'temperatura' ? 'blue' : 'purple';
  const gradientHeader = formType === 'temperatura' 
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600' 
    : 'bg-gradient-to-r from-fuchsia-600 to-purple-700';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .recharts-responsive-container { height: 500px !important; }
        }
      `}</style>

      {/* HEADER WEB */}
      <header className="bg-white shadow-md sticky top-0 z-50 print:hidden border-b border-slate-100">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto justify-center md:justify-start">
            <div className="w-16 h-16 flex items-center justify-center shrink-0 bg-white rounded-full shadow-sm p-1">
               <img src={COMPANY_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight leading-none text-slate-800 uppercase">{COMPANY_NAME}</h1>
              <p className="text-xs font-bold text-slate-500 italic tracking-wide mt-0.5">{COMPANY_SLOGAN}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">{APP_TITLE}</span>
                {loading ? <RefreshCw size={12} className="text-blue-500 animate-spin"/> : <Cloud size={12} className="text-green-500" title="Sincronizado"/>}
              </div>
            </div>
          </div>

          <nav className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveTab('registro')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'registro' ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
              <Save size={18} /> Registro
            </button>
            <button onClick={() => setActiveTab('estadisticas')} className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm ${activeTab === 'estadisticas' ? 'bg-white text-purple-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
              <History size={18} /> Historial
            </button>
          </nav>
        </div>
      </header>

      {/* HEADER IMPRESIÓN */}
      <div className="hidden print:block w-full mb-8">
        <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-6">
             <img src={COMPANY_LOGO_URL} alt="Logo" className="h-24 w-auto object-contain" />
             <div>
               <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{COMPANY_NAME}</h1>
               <p className="text-lg text-slate-600 font-bold italic">{COMPANY_SLOGAN}</p>
               <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded text-sm font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                 {APP_TITLE}
               </div>
             </div>
          </div>
          <div className="text-right">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</div>
             <div className="text-xl font-bold text-slate-900">{new Date().toLocaleDateString()}</div>
             <div className="text-sm text-slate-500">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="border-2 border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Área</div>
            <div className="text-lg font-black text-slate-900 uppercase truncate">{selectedAreaStats}</div>
          </div>
          <div className="border-2 border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Variable</div>
            <div className="text-lg font-black text-slate-900 uppercase">{selectedTypeStats}</div>
          </div>
          <div className="border-2 border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jornada</div>
            <div className="text-lg font-black text-slate-900 uppercase">{selectedJornadaStats}</div>
          </div>
          <div className="border-2 border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mes</div>
            <div className="text-lg font-black text-slate-900 uppercase">{MONTHS[selectedMonth]}</div>
          </div>
          <div className="border-2 border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Año</div>
            <div className="text-lg font-black text-slate-900">{selectedYear}</div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {!isOnline && <div className="bg-red-500 text-white text-center py-2 px-4 rounded mb-4 text-sm font-bold animate-pulse print:hidden">⚠️ Sin conexión a internet.</div>}

        {/* --- VISTA DE REGISTRO --- */}
        {activeTab === 'registro' && (
          <div className="max-w-4xl mx-auto print:hidden">
            
            {/* BOTONES DE TIPO DE FORMULARIO */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 inline-flex gap-2">
                <button onClick={() => setFormType('temperatura')} 
                  className={`px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all duration-200 ${formType === 'temperatura' ? 'bg-cyan-500 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-50'}`}> 
                  <Thermometer size={20} /> Temperatura 
                </button>
                <button onClick={() => setFormType('humedad')} 
                  className={`px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all duration-200 ${formType === 'humedad' ? 'bg-fuchsia-500 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-50'}`}> 
                  <Droplets size={20} /> Humedad 
                </button>
              </div>
            </div>

            {/* TARJETA DEL FORMULARIO */}
            <div className={`rounded-3xl shadow-xl overflow-hidden border-2 transition-all duration-300 bg-white ${formType === 'temperatura' ? 'border-cyan-100' : 'border-fuchsia-100'}`}>
              
              {/* Encabezado Colorido */}
              <div className={`px-8 py-6 ${gradientHeader} text-white shadow-md relative overflow-hidden`}>
                <div className="relative z-10">
                  <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-wide">
                    {formType === 'temperatura' ? <Thermometer className="text-white/80" size={32}/> : <Droplets className="text-white/80" size={32}/>} 
                    {formType === 'temperatura' ? 'Registro Térmico' : 'Humedad Relativa'}
                  </h2>
                  <p className="text-white/80 font-medium mt-1 pl-11 text-sm">
                    Ingrese los datos del monitoreo diario para el control de calidad.
                  </p>
                </div>
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  
                  {/* Bloque 1: Contexto */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Fecha de Registro</label>
                      <div className="relative group">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${formType === 'temperatura' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100'}`}>
                          <Calendar size={16}/>
                        </div>
                        <input 
                          type="date" 
                          name="fecha" 
                          required 
                          value={formData.fecha} 
                          onChange={handleInputChange} 
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-slate-700 bg-white ${formType === 'temperatura' ? 'focus:ring-cyan-100 border-slate-200 focus:border-cyan-300' : 'focus:ring-fuchsia-100 border-slate-200 focus:border-fuchsia-300'}`} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Jornada</label>
                      <div className="relative group">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${formType === 'temperatura' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100'}`}>
                          <Clock size={16}/>
                        </div>
                        <select name="jornada" value={formData.jornada} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-slate-700 bg-white appearance-none cursor-pointer ${formType === 'temperatura' ? 'focus:ring-cyan-100 border-slate-200 focus:border-cyan-300' : 'focus:ring-fuchsia-100 border-slate-200 focus:border-fuchsia-300'}`}>
                          {JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    {/* SELECCIÓN DE ÁREA + SUB-ÁREA */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Área / Servicio</label>
                        <div className="relative group">
                          <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${formType === 'temperatura' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100'}`}>
                            <Building2 size={16}/>
                          </div>
                          <select name="area" value={formData.area} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-slate-700 bg-white appearance-none cursor-pointer ${formType === 'temperatura' ? 'focus:ring-cyan-100 border-slate-200 focus:border-cyan-300' : 'focus:ring-fuchsia-100 border-slate-200 focus:border-fuchsia-300'}`}>
                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      {/* Sub-zona Laboratorio */}
                      {formData.area === 'LABORATORIO' && (
                        <div className="animate-fade-in-down">
                          <label className={`block text-xs font-bold uppercase mb-2 ml-1 ${formType === 'temperatura' ? 'text-cyan-600' : 'text-fuchsia-600'}`}>Punto de Control (Lab)</label>
                          <div className="relative">
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full ${formType === 'temperatura' ? 'bg-cyan-100 text-cyan-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                              <Microscope size={16}/>
                            </div>
                            <select name="subArea" value={formData.subArea} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-all font-bold text-slate-700 bg-white cursor-pointer ${formType === 'temperatura' ? 'border-cyan-100 focus:border-cyan-400' : 'border-fuchsia-100 focus:border-fuchsia-400'}`}>
                              {LAB_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloque 2: Mediciones (Destacado) */}
                  <div className={`p-6 rounded-2xl border ${formType === 'temperatura' ? 'bg-cyan-50/50 border-cyan-100' : 'bg-fuchsia-50/50 border-fuchsia-100'} flex flex-col justify-center space-y-6`}>
                    {formType === 'temperatura' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínima (°C)</label>
                            <input type="number" step="0.1" name="tempMin" value={formData.tempMin} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-semibold text-slate-600 focus:ring-2 focus:ring-cyan-200 outline-none"/>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máxima (°C)</label>
                            <input type="number" step="0.1" name="tempMax" value={formData.tempMax} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-semibold text-slate-600 focus:ring-2 focus:ring-cyan-200 outline-none"/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-cyan-700 uppercase mb-2 text-center">Temperatura Actual</label>
                          <div className="relative">
                            <input type="number" step="0.1" name="tempActual" value={formData.tempActual} onChange={handleInputChange} 
                              className={`w-full border-2 rounded-2xl py-4 text-center text-3xl font-black outline-none transition-all shadow-sm ${isOutOfRange(formData.tempActual) ? 'border-red-300 text-red-600 bg-red-50' : 'border-cyan-200 text-slate-700 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100'}`} 
                              placeholder="--.-"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {formData.tempActual && (isOutOfRange(formData.tempActual) ? <AlertTriangle className="text-red-500 animate-bounce" size={24} /> : <CheckCircle className="text-green-500" size={24} />)}
                            </div>
                          </div>
                          {isOutOfRange(formData.tempActual) && <p className="text-center text-xs text-red-500 font-bold mt-2 animate-pulse">⚠️ FUERA DE RANGO PERMITIDO</p>}
                        </div>
                      </>
                    )}
                    
                    {formType === 'humedad' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínima (%)</label>
                            <input type="number" name="humMin" value={formData.humMin} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-semibold text-slate-600 focus:ring-2 focus:ring-fuchsia-200 outline-none"/>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máxima (%)</label>
                            <input type="number" name="humMax" value={formData.humMax} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-semibold text-slate-600 focus:ring-2 focus:ring-fuchsia-200 outline-none"/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-fuchsia-700 uppercase mb-2 text-center">Humedad Actual</label>
                          <div className="relative">
                            <input type="number" name="humActual" value={formData.humActual} onChange={handleInputChange} 
                              className={`w-full border-2 rounded-2xl py-4 text-center text-3xl font-black outline-none transition-all shadow-sm ${isHumidityOutOfRange(formData.humActual) ? 'border-red-300 text-red-600 bg-red-50' : 'border-fuchsia-200 text-slate-700 focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100'}`} 
                              placeholder="--"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {formData.humActual && (isHumidityOutOfRange(formData.humActual) ? <AlertTriangle className="text-red-500 animate-bounce" size={24} /> : <CheckCircle className="text-green-500" size={24} />)}
                            </div>
                          </div>
                          {isHumidityOutOfRange(formData.humActual) && <p className="text-center text-xs text-red-500 font-bold mt-2 animate-pulse">⚠️ FUERA DE RANGO PERMITIDO</p>}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bloque 3: Responsable y Observaciones */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Responsable</label>
                      <div className="relative group">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${formType === 'temperatura' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100'}`}>
                          <User size={16}/>
                        </div>
                        <input type="text" name="registradoPor" required value={formData.registradoPor} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-slate-700 ${formType === 'temperatura' ? 'focus:ring-cyan-100 border-slate-200 focus:border-cyan-300' : 'focus:ring-fuchsia-100 border-slate-200 focus:border-fuchsia-300'}`} placeholder="Nombre Completo" />
                      </div>
                    </div>
                    <div className="h-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Observaciones</label>
                      <div className="relative h-32 group">
                        <div className={`absolute left-3 top-3 p-1.5 rounded-full transition-colors ${formType === 'temperatura' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' : 'bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100'}`}>
                          <FileText size={16}/>
                        </div>
                        <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className={`w-full h-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-slate-700 resize-none ${formType === 'temperatura' ? 'focus:ring-cyan-100 border-slate-200 focus:border-cyan-300' : 'focus:ring-fuchsia-100 border-slate-200 focus:border-fuchsia-300'}`} placeholder="Sin novedades..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button type="submit" className={`font-black py-4 px-10 rounded-xl shadow-xl transition-transform active:scale-95 flex items-center gap-3 text-white text-lg ${formType === 'temperatura' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700' : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700'}`}>
                    <Save size={24} /> {isSaving ? 'Guardando...' : 'GUARDAR REGISTRO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VISTA DE ESTADISTICAS --- */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-8">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 print:hidden">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Variable</label>
                  <select value={selectedTypeStats} onChange={(e) => setSelectedTypeStats(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Temperatura">Temperatura</option>
                    <option value="Humedad">Humedad</option>
                  </select>
                </div>
                {/* ✅ FILTRO DE ÁREA DINÁMICO */}
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área</label><select value={selectedAreaStats} onChange={(e) => setSelectedAreaStats(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{availableAreas.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jornada</label><select value={selectedJornadaStats} onChange={(e) => setSelectedJornadaStats(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="Todas">Todas</option>{JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mes</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                <div className="w-32"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Printer size={16} /> Imprimir / PDF</button>
                <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-10 shadow-sm"><Download size={16} /> CSV</button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-12 text-center rounded-lg shadow-sm print:shadow-none print:border-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4 print:hidden"></div>
                <p className="text-slate-500">Cargando datos desde Google Sheets...</p>
              </div>
            ) : (
              <>
                {/* --- SECCIÓN 1: PROMEDIOS DETALLADOS (FILTRADOS) --- */}
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* Tarjeta Promedio Temp (SOLO SI SELECCIONADO) */}
                    {selectedTypeStats === 'Temperatura' && (
                      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                  <Thermometer className="text-blue-600" /> Temperatura Promedio
                              </h4>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowDown size={12}/> Mín</span>
                                  <span className="text-lg font-bold text-blue-600">{calculateAverage('tempMin') + '°C'}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Actual</span>
                                  <span className="text-2xl font-extrabold text-blue-800">{calculateAverage('tempActual') + '°C'}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowUp size={12}/> Máx</span>
                                  <span className="text-lg font-bold text-red-500">{calculateAverage('tempMax') + '°C'}</span>
                              </div>
                          </div>
                      </div>
                    )}

                    {/* Tarjeta Promedio Humedad (SOLO SI SELECCIONADO) */}
                    {selectedTypeStats === 'Humedad' && (
                      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                  <Droplets className="text-purple-600" /> Humedad Promedio
                              </h4>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowDown size={12}/> Mín</span>
                                  <span className="text-lg font-bold text-purple-500">{calculateAverage('humMin') + '%'}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Actual</span>
                                  <span className="text-2xl font-extrabold text-purple-800">{calculateAverage('humActual') + '%'}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowUp size={12}/> Máx</span>
                                  <span className="text-lg font-bold text-purple-600">{calculateAverage('humMax') + '%'}</span>
                              </div>
                          </div>
                      </div>
                    )}
                </div>

                {/* --- SECCIÓN 2: GRÁFICOS GRANDES (FILTRADOS) --- */}
                <div className="space-y-8">
                  {/* Gráfica de Temperatura */}
                  {selectedTypeStats === 'Temperatura' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                      <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Thermometer className="text-blue-500 print:text-black" /> Temperatura (°C)</h3></div>
                      <div className="h-96 w-full"> 
                        {chartData.some(d => d.tempActual !== null) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/>
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Legend />
                              {/* ✅ LÍMITES DINÁMICOS EN EL GRÁFICO */}
                              <ReferenceLine y={currentChartLimits.temp[0]} stroke="gold" strokeDasharray="5 5" label={{ value: `Min (${currentChartLimits.temp[0]})`, fill: "orange", fontSize: 10 }} />
                              <ReferenceLine y={currentChartLimits.temp[1]} stroke="gold" strokeDasharray="5 5" label={{ value: `Max (${currentChartLimits.temp[1]})`, fill: "orange", fontSize: 10 }} />
                              
                              <Line connectNulls={true} type="monotone" dataKey="tempMin" stroke="blue" name="Min Reg." dot={false} strokeWidth={2} />
                              <Line connectNulls={true} type="monotone" dataKey="tempActual" stroke="black" name="Actual" strokeWidth={3} />
                              <Line connectNulls={true} type="monotone" dataKey="tempMax" stroke="red" name="Max Reg." dot={false} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos de Temperatura</div>}
                      </div>
                    </div>
                  )}

                  {/* Gráfica de Humedad */}
                  {selectedTypeStats === 'Humedad' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-slate-300">
                      <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 print:text-black"><Droplets className="text-purple-500 print:text-black" /> Humedad (%)</h3></div>
                      <div className="h-96 w-full">
                        {chartData.some(d => d.humActual !== null) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50}/>
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Legend />
                              {/* ✅ LÍMITES DINÁMICOS EN EL GRÁFICO DE HUMEDAD */}
                              <ReferenceLine y={currentChartLimits.hum[0]} stroke="gold" strokeDasharray="5 5" label={{ value: `Min (${currentChartLimits.hum[0]})`, fill: "orange", fontSize: 10 }} />
                              <ReferenceLine y={currentChartLimits.hum[1]} stroke="gold" strokeDasharray="5 5" label={{ value: `Max (${currentChartLimits.hum[1]})`, fill: "orange", fontSize: 10 }} />
                              
                              <Line connectNulls={true} type="monotone" dataKey="humMin" stroke="blue" name="Min Reg." dot={false} strokeWidth={2} />
                              <Line connectNulls={true} type="monotone" dataKey="humActual" stroke="black" name="Actual" strokeWidth={3} />
                              <Line connectNulls={true} type="monotone" dataKey="humMax" stroke="red" name="Max Reg." dot={false} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos de Humedad</div>}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
