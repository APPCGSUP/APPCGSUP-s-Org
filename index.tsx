import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowLeft, Search, Lock, CheckCircle, CircleDashed, 
  User as UserIcon, Shield, LogOut, MapPin, Upload, 
  FileText, FileSpreadsheet, Image as ImageIcon, X,
  LayoutDashboard, Table as TableIcon, FileCheck, Loader2,
  TrendingUp, AlertCircle, ChevronDown, Download, Printer, Filter,
  Edit2, File, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// --- Types ---
interface MaterialRecord {
  id: string;
  code?: string;
  rota: string;
  comarca: string;
  materialName: string;
  category: string;
  unit: string;
  predictedDemand: number;
  requestedQty: number;
  approvedQty: number;
  status: 'pending' | 'requested' | 'approved';
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  region?: string;
  rota?: string;
}

interface LocationStructure {
  rota: string;
  comarcas: string[];
}

// --- Data & Constants ---

// Extracted from PDF Context
const ROTAS_COMARCAS: LocationStructure[] = [
  { rota: "ROTA 1 (Cariri - Sul)", comarcas: ["ICÓ", "ICÓ_JECC", "UMARI", "IPAUMIRIM", "MAURITI", "MILAGRES", "ABAIARA", "JATI.PENAFORTE", "MISSÃO VELHA", "AURORA"] },
  { rota: "ROTA 2 (Centro sul/Vale do Salgado/Cariri)", comarcas: ["QUIXELÔ", "IGUATU - NAC", "IGUATU JECC", "IGUATU", "JUCÁS", "CARIÚS", "SABOEIRO", "AIUABA", "ANTONINA DO NORTE", "POTENGI", "ASSARÉ", "ALTANEIRA", "CEDRO"] },
  { rota: "ROTA 3 (Sertão de Crateús)", comarcas: ["CATARINA", "TAUÁ – JECC", "QUITERIANÓPOLIS", "NOVO ORIENTE", "CRATEÚS- DIR /JECC / NAC", "INDEPENDÊNCIA", "IPAPORANGA", "ARARENDÁ", "PORANGA", "IPUEIRAS"] },
  { rota: "ROTA 4 (Maciço de Baturité)", comarcas: ["ITAPIUNA"] },
  { rota: "ROTA 5 (Sertão de Sobral)", comarcas: ["SÃO LUÍS DO CURU", "ITAPAJÉ", "IRAUÇUBA", "SOBRAL JECC 1ª UNIDADE", "SOBRAL JECC 2ª UNIDADE", "MASSAPÊ", "URUOCA", "MORAÚJO", "COREAÚ", "ALCÂNTARAS", "GROAIRAS", "MIRAÍMA"] },
  { rota: "ROTA 6 (Serra da Ibiapaba/Litoral Norte)", comarcas: ["PENTECOSTE", "APUIARÉS", "GENERAL SAMPAIO", "TEJUÇUOCA", "PACUJÁ", "IBIAPINA", "CROATA", "FRECHEIRINHA", "TIANGUÁ JECC", "GRAÇA", "IPU", "PARAMOTI", "MADALENA", "ITATIRA"] },
  { rota: "ROTA 7 (Cariri 03)", comarcas: ["JAGUARIBE", "PEREIRO", "ERERE", "IRACEMA", "ALTO SANTO"] },
  { rota: "ROTA 7 (Vale do Curu/Centro Norte)", comarcas: ["PARAIPABA", "CAMOCIM", "BARROQUINHA", "BELA CRUZ"] },
  { rota: "ROTA 8 (Metropolitana)", comarcas: ["MARACANAU JECC", "ITAITINGA", "HORIZONTE", "PACAJUS"] },
  { rota: "ROTA 9 (Vale do Jaguaribe Litoral)", comarcas: ["ARACATI", "TABULEIRO DO NORTE", "POTIRETAMA", "CHOROZINHO"] },
  { rota: "ROTA 10 (Sertão central)", comarcas: ["QUIXADÁ J.V.D.", "QUIXADÁ JECC", "QUIXADÁ", "OCARA", "IBICUITINGA", "IBARETAMA", "CHORÓ", "QUIXERAMOBIM", "BANABUIÚ", "SOLONÓPOLE", "MILHÃ", "SENADOR POMPEU", "DEPUTADO IRAPUÃ PINHEIRO", "PIQUET CARNEIRO", "ACOPIARA", "MOMBAÇA", "BOA VIAGEM"] }
];

const CATALOGO_MATERIAIS = [
  { code: '390139', materialName: 'CAIXA PAPELÃO', unit: 'UNID', predictedDemand: 100, category: 'Expediente' },
  { code: '390.112', materialName: 'CAIXA PARA ARQUIVO MORTO', unit: 'UNID', predictedDemand: 100, category: 'Expediente' },
  { code: '460184', materialName: 'ÁLCOOL GEL', unit: 'UNID', predictedDemand: 100, category: 'Limpeza' },
  { code: '420.433', materialName: 'LUVAS CIRÚRGICAS', unit: 'CX', predictedDemand: 100, category: 'Limpeza' },
  { code: '420.313', materialName: 'MÁSCARAS DESCARTÁVEIS', unit: 'CX', predictedDemand: 100, category: 'Limpeza' },
  { code: '460.053', materialName: 'PAPEL HIGIÊNICO – ROLO GRANDE', unit: 'ROLO', predictedDemand: 100, category: 'Limpeza' },
  { code: '460.154', materialName: 'BALDE', unit: 'UNID', predictedDemand: 50, category: 'Limpeza' },
  { code: '460.158', materialName: 'PÁ COLETORA', unit: 'UNID', predictedDemand: 30, category: 'Limpeza' },
  { code: '460.013', materialName: 'PANO DE CHÃO', unit: 'UNID', predictedDemand: 60, category: 'Limpeza' },
  { code: '460.163', materialName: 'VASSOURA SANITÁRIA', unit: 'UNID', predictedDemand: 40, category: 'Limpeza' },
  { code: '460.166', materialName: 'VASSOURA NOVIÇA', unit: 'UNID', predictedDemand: 40, category: 'Limpeza' },
  { code: '460.020', materialName: 'VASSOURA PIAÇAVA', unit: 'UNID', predictedDemand: 20, category: 'Limpeza' },
  { code: '46.0124', materialName: 'DETERGENTE', unit: 'LT', predictedDemand: 120, category: 'Limpeza' },
  { code: '46.0019', materialName: 'SABÃO EM PÓ', unit: 'CX', predictedDemand: 50, category: 'Limpeza' },
  { code: '46.0079', materialName: 'PAPEL TOALHA', unit: 'FARDO', predictedDemand: 150, category: 'Limpeza' },
];

// Helper to generate initial dataset for ALL comarcas
const generateFullDataset = (): MaterialRecord[] => {
  let records: MaterialRecord[] = [];
  let idCounter = 1;
  
  ROTAS_COMARCAS.forEach(rc => {
    rc.comarcas.forEach(comarca => {
      CATALOGO_MATERIAIS.forEach(mat => {
        records.push({
          id: String(idCounter++),
          code: mat.code,
          rota: rc.rota,
          comarca: comarca,
          materialName: mat.materialName,
          category: mat.category,
          unit: mat.unit,
          predictedDemand: mat.predictedDemand, // In a real app, this might vary per comarca
          requestedQty: 0,
          approvedQty: 0,
          status: 'pending'
        });
      });
    });
  });
  return records;
};

// --- Components ---

const Button = ({ 
  onClick, 
  variant = 'primary', 
  icon: Icon, 
  children, 
  className,
  disabled,
  isLoading
}: { 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success', 
  icon?: React.ElementType, 
  children?: React.ReactNode, 
  className?: string,
  disabled?: boolean,
  isLoading?: boolean
}) => {
  const baseStyles = "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 border border-transparent",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 border border-transparent",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
  };
  
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${baseStyles} ${variants[variant]} ${className || ''}`}>
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : (Icon && <Icon size={18} />)}
      {children}
    </button>
  );
};

// 1. DASHBOARD COMPONENT (Updated with Reports)
const Dashboard = ({ data, viewMode, setViewMode }: { 
  data: MaterialRecord[], 
  viewMode: 'table' | 'dashboard' | 'reports', 
  setViewMode: (v: 'table' | 'dashboard' | 'reports') => void 
}) => {
  // Stats Calculation
  const stats = useMemo(() => {
    const totalItems = data.length;
    const totalRequested = data.filter(d => d.requestedQty > 0).length;
    const totalApproved = data.filter(d => d.approvedQty > 0).length;
    const pendingReview = data.filter(d => d.requestedQty > 0 && d.approvedQty === 0).length;
    
    const categoryData = data.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.predictedDemand;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(categoryData).map(key => ({
      name: key,
      value: categoryData[key]
    }));

    const statusData = [
      { name: 'Não Solicitado', value: totalItems - totalRequested, color: '#334155' },
      { name: 'Aguardando', value: pendingReview, color: '#f59e0b' },
      { name: 'Aprovado', value: totalApproved, color: '#10b981' },
    ];

    return { totalItems, totalRequested, totalApproved, pendingReview, chartData, statusData };
  }, [data]);

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Total de Materiais</div>
          <div className="text-3xl font-bold text-white">{stats.totalItems.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Solicitações Ativas</div>
          <div className="text-3xl font-bold text-amber-500">{stats.totalRequested.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
           <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Itens Aprovados</div>
           <div className="text-3xl font-bold text-emerald-400">{stats.totalApproved.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
           <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Pendente Aprovação</div>
           <div className="text-3xl font-bold text-blue-400">
             {stats.pendingReview}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        {/* Charts */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm flex flex-col">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500"/> Volume por Categoria (Demanda)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm flex flex-col">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-purple-500"/> Status Geral
          </h3>
          <div className="flex-1 min-h-0 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. REPORT COMPONENT (New)
const ReportView = ({ data }: { data: MaterialRecord[] }) => {
  const [selectedRota, setSelectedRota] = useState<string>("Todas");
  const [selectedComarca, setSelectedComarca] = useState<string>("Todas");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("Todos");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const availableRotas = useMemo(() => ["Todas", ...Array.from(new Set(data.map(d => d.rota)))], [data]);
  const availableMaterials = useMemo(() => ["Todos", ...Array.from(new Set(data.map(d => d.materialName))).sort()], [data]);
  
  const availableComarcas = useMemo(() => {
    let filtered = data;
    if (selectedRota !== "Todas") {
      filtered = filtered.filter(d => d.rota === selectedRota);
    }
    return ["Todas", ...Array.from(new Set(filtered.map(d => d.comarca)))];
  }, [data, selectedRota]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchRota = selectedRota === "Todas" || d.rota === selectedRota;
      const matchComarca = selectedComarca === "Todas" || d.comarca === selectedComarca;
      const matchMaterial = selectedMaterial === "Todos" || d.materialName === selectedMaterial;
      return matchRota && matchComarca && matchMaterial;
    });
  }, [data, selectedRota, selectedComarca, selectedMaterial]);

  const consolidatedData = useMemo(() => {
    // Group by material ID/Name to show totals
    const groups: Record<string, any> = {};
    filteredData.forEach(item => {
      if (!groups[item.code || item.materialName]) {
        groups[item.code || item.materialName] = {
          code: item.code,
          name: item.materialName,
          category: item.category,
          unit: item.unit,
          predicted: 0,
          requested: 0,
          approved: 0
        };
      }
      groups[item.code || item.materialName].predicted += item.predictedDemand;
      groups[item.code || item.materialName].requested += item.requestedQty;
      groups[item.code || item.materialName].approved += item.approvedQty;
    });
    return Object.values(groups);
  }, [filteredData]);

  // Export Functions
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Gestão de Materiais', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()} | Filtro: ${selectedRota} / ${selectedComarca} / ${selectedMaterial}`, 14, 30);

    const tableColumn = ["Cód", "Material", "Categoria", "Unid", "Previsto", "Solicitado", "Aprovado"];
    const tableRows = consolidatedData.map(item => [
      item.code,
      item.name,
      item.category,
      item.unit,
      item.predicted,
      item.requested,
      item.approved
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio_${new Date().getTime()}.pdf`);
    setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["Codigo", "Material", "Categoria", "Unidade", "Qtd Prevista", "Qtd Solicitada", "Qtd Aprovada"];
    const rows = consolidatedData.map(item => 
      [item.code, item.name, item.category, item.unit, item.predicted, item.requested, item.approved].join(";")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(";"), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    // Generates a simple HTML table compatible with Excel
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Relatório de Materiais</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f0f0f0; }
        </style>
      </head>
      <body>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Material</th>
            <th>Categoria</th>
            <th>Unidade</th>
            <th>Qtd Prevista</th>
            <th>Qtd Solicitada</th>
            <th>Qtd Aprovada</th>
          </tr>
        </thead>
        <tbody>
    `;

    const body = consolidatedData.map(item => `
          <tr>
            <td style="mso-number-format:'@'">${item.code || ''}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.unit}</td>
            <td style="mso-number-format:'0'">${item.predicted}</td>
            <td style="mso-number-format:'0'">${item.requested}</td>
            <td style="mso-number-format:'0'">${item.approved}</td>
          </tr>
    `).join('');

    const footer = `
        </tbody>
      </table>
      </body>
      </html>
    `;

    const html = header + body + footer;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_tabela_${new Date().getTime()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportImage = async (type: 'jpeg' | 'gif') => {
    if (!reportRef.current) return;
    try {
      // Temporarily remove max-height/overflow to capture full table if needed, 
      // or just capture visible area. Capture visible area for now to keep it simple.
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a', // Match theme background
        scale: 2
      });
      const dataUrl = canvas.toDataURL(`image/${type}`, 0.9);
      const link = document.createElement('a');
      link.download = `relatorio_visual_${new Date().getTime()}.${type}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao exportar imagem", err);
      alert("Erro ao gerar imagem.");
    }
    setIsExportMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Filtrar por Rota</label>
            <div className="relative">
              <select 
                value={selectedRota} 
                onChange={e => { setSelectedRota(e.target.value); setSelectedComarca("Todas"); }}
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none min-w-[200px]"
              >
                {availableRotas.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Filtrar por Comarca</label>
             <div className="relative">
              <select 
                value={selectedComarca} 
                onChange={e => setSelectedComarca(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none min-w-[200px]"
              >
                {availableComarcas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Filtrar por Material</label>
             <div className="relative">
              <select 
                value={selectedMaterial} 
                onChange={e => setSelectedMaterial(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none min-w-[200px]"
              >
                {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        <div className="relative">
          <Button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
            variant="primary" 
            icon={Download}
          >
            Exportar
            <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}/>
          </Button>
          
          {isExportMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden animate-fadeIn">
                <div className="p-2 space-y-1">
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors text-left">
                    <FileSpreadsheet size={16} className="text-emerald-500" /> Excel (.xls)
                  </button>
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors text-left">
                    <FileText size={16} className="text-red-500" /> PDF
                  </button>
                  <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors text-left">
                    <File size={16} className="text-blue-500" /> CSV
                  </button>
                  <div className="h-px bg-slate-800 my-1"></div>
                  <button onClick={() => handleExportImage('jpeg')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors text-left">
                    <ImageIcon size={16} className="text-purple-500" /> Imagem JPEG
                  </button>
                  <button onClick={() => handleExportImage('gif')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors text-left">
                    <ImageIcon size={16} className="text-pink-500" /> Imagem GIF
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={reportRef} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-slate-200">Consolidado de Materiais</h3>
          <span className="text-xs text-slate-500">{consolidatedData.length} itens listados</span>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 sticky top-0 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="p-3 border-b border-slate-800">Cód.</th>
                <th className="p-3 border-b border-slate-800">Material</th>
                <th className="p-3 border-b border-slate-800">Categoria</th>
                <th className="p-3 border-b border-slate-800 text-right">Previsto</th>
                <th className="p-3 border-b border-slate-800 text-right text-amber-500">Solicitado</th>
                <th className="p-3 border-b border-slate-800 text-right text-emerald-500">Atendido</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-300 divide-y divide-slate-800/50">
              {consolidatedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-xs text-slate-500">{item.code}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-xs opacity-70">{item.category}</td>
                  <td className="p-3 text-right font-mono">{item.predicted}</td>
                  <td className="p-3 text-right font-mono font-medium text-amber-500/80">{item.requested}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-500">{item.approved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 3. FILE IMPORT MODAL (Unchanged logic, just simplified for length)
const FileImportModal = ({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (data: Partial<MaterialRecord>[]) => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFile = () => {
    if (!fileName) return;
    setIsProcessing(true);
    // Simulating file processing
    setTimeout(() => {
      onImport(CATALOGO_MATERIAIS); // In a real app, we parse the file here
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFileName(e.target.files[0].name);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Upload size={20} className="text-blue-500" /> Importar Arquivo</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white"/></button>
        </div>
        <div className="p-8">
          {!fileName ? (
            <div className="border-2 border-dashed border-slate-700 rounded-xl h-48 flex flex-col items-center justify-center bg-slate-950/50">
              <Upload size={32} className="text-slate-500 mb-4"/>
              <p className="text-slate-400 mb-4">Arraste PDF, Excel ou Imagem</p>
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.xlsx,.csv,.jpg" />
                <span className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 text-white">Selecionar Arquivo</span>
              </label>
            </div>
          ) : (
            <div className="text-center">
              {isProcessing ? (
                <div className="flex flex-col items-center"><Loader2 className="animate-spin text-blue-500 mb-2" size={32}/> Processando...</div>
              ) : (
                 <>
                   <div className="bg-slate-800 p-3 rounded mb-4 text-white">{fileName}</div>
                   <Button onClick={processFile} className="w-full">Confirmar Importação</Button>
                 </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. MAIN TABLE LAYOUT
const InputTable = ({ 
  data, 
  currentUser,
  onUpdate,
  onLogout,
  onOpenImport
}: { 
  data: MaterialRecord[], 
  currentUser: User,
  onUpdate: (id: string, field: string, val: any) => void,
  onLogout: () => void,
  onOpenImport: () => void
}) => {
  const [filter, setFilter] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'dashboard' | 'reports'>('table');
  const isAdmin = currentUser.role === 'admin';
  const [forecastPeriod, setForecastPeriod] = useState<'semestral' | 'anual'>('semestral');
  const [isForecastMenuOpen, setIsForecastMenuOpen] = useState(false);

  // --- Filters ---
  const [selectedRota, setSelectedRota] = useState<string>("Todas");
  const [selectedComarca, setSelectedComarca] = useState<string>("Todas");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("Todos");

  const availableRotas = useMemo(() => ["Todas", ...Array.from(new Set(data.map(d => d.rota)))], [data]);
  const availableMaterials = useMemo(() => ["Todos", ...Array.from(new Set(data.map(d => d.materialName))).sort()], [data]);
  
  const availableComarcas = useMemo(() => {
    let filtered = data;
    if (selectedRota !== "Todas") {
      filtered = filtered.filter(d => d.rota === selectedRota);
    }
    return ["Todas", ...Array.from(new Set(filtered.map(d => d.comarca)))];
  }, [data, selectedRota]);

  // Filter logic: Admins see everything (filtered by filters & search), Users only see their comarca
  const displayedData = useMemo(() => {
    let d = data;
    
    if (!isAdmin && currentUser.region) {
      // User restriction
      d = d.filter(item => item.comarca === currentUser.region);
    } else if (isAdmin) {
      // Admin filters
      if (selectedRota !== "Todas") {
        d = d.filter(item => item.rota === selectedRota);
      }
      if (selectedComarca !== "Todas") {
        d = d.filter(item => item.comarca === selectedComarca);
      }
      if (selectedMaterial !== "Todos") {
        d = d.filter(item => item.materialName === selectedMaterial);
      }
    }

    // Text search
    if (filter) {
      const f = filter.toLowerCase();
      d = d.filter(item => item.materialName.toLowerCase().includes(f) || item.code?.includes(f) || item.comarca.toLowerCase().includes(f));
    }
    return d;
  }, [data, filter, isAdmin, currentUser.region, selectedRota, selectedComarca, selectedMaterial]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isAdmin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
             {isAdmin ? <Shield size={28} /> : <MapPin size={28} />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isAdmin ? 'Central de Comando' : currentUser.region}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              {isAdmin ? (
                <span className="text-purple-400 font-medium px-2 py-0.5 bg-purple-900/20 rounded">Administrador Global</span>
              ) : (
                <span className="text-blue-400 font-medium px-2 py-0.5 bg-blue-900/20 rounded">{currentUser.rota}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
           <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
             <TableIcon size={16} /> Tabela
           </button>
           <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
             <LayoutDashboard size={16} /> Dash
           </button>
           {isAdmin && (
             <button onClick={() => setViewMode('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'reports' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
               <FileText size={16} /> Relatórios
             </button>
           )}
           <div className="w-px h-6 bg-slate-800 mx-1"></div>
           {isAdmin && <Button onClick={onOpenImport} variant="ghost" icon={Upload} className="!p-2" />}
           <Button onClick={onLogout} variant="ghost" icon={LogOut} className="!p-2 text-red-400 hover:bg-red-900/20" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        {viewMode === 'dashboard' && (
          <div className="h-full overflow-auto custom-scrollbar">
            <Dashboard data={isAdmin ? data : displayedData} viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        )}

        {viewMode === 'reports' && isAdmin && (
          <div className="h-full overflow-hidden">
             <ReportView data={data} />
          </div>
        )}

        {viewMode === 'table' && (
          <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-950/30">
               
               {/* Filters (Admin Only) */}
               {isAdmin && (
                 <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Rota</label>
                      <div className="relative">
                        <select 
                          value={selectedRota} 
                          onChange={e => { setSelectedRota(e.target.value); setSelectedComarca("Todas"); }}
                          className="w-full sm:w-40 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none transition-colors"
                        >
                          {availableRotas.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                       <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Comarca</label>
                       <div className="relative">
                        <select 
                          value={selectedComarca} 
                          onChange={e => setSelectedComarca(e.target.value)}
                          className="w-full sm:w-40 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none transition-colors"
                        >
                          {availableComarcas.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                       <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Material</label>
                       <div className="relative">
                        <select 
                          value={selectedMaterial} 
                          onChange={e => setSelectedMaterial(e.target.value)}
                          className="w-full sm:w-48 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 pr-8 outline-none focus:border-blue-500 appearance-none transition-colors"
                        >
                          {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={14} />
                      </div>
                    </div>
                 </div>
               )}

               <div className="flex items-center gap-4 w-full lg:w-auto flex-1 justify-end mt-4 lg:mt-0">
                  <div className="relative group flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                      <input 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder={isAdmin ? "Buscar..." : "Buscar material..."}
                        className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-blue-500 outline-none w-full transition-all shadow-inner"
                      />
                  </div>
                  <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 whitespace-nowrap">
                    {displayedData.length} REGISTROS
                  </div>
               </div>
            </div>

            <div className="overflow-auto custom-scrollbar flex-1 pb-20">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 text-[11px] uppercase text-slate-400 font-bold tracking-wider shadow-sm">
                  <tr>
                    <th className="p-4 border-b border-slate-800 text-center w-20">Cód.</th>
                    {isAdmin && <th className="p-4 border-b border-slate-800 w-32">Comarca</th>}
                    <th className="p-4 border-b border-slate-800">Descrição Material</th>
                    <th className="p-4 border-b border-slate-800 w-24 text-center">Unid.</th>
                    
                    {/* PREVISTO COLUMN HEADER WITH DROPDOWN */}
                    <th className="p-4 border-b border-slate-800 text-right w-36 bg-slate-900/50 relative">
                       <div 
                        className="flex items-center justify-end gap-1.5 cursor-pointer group select-none"
                        onClick={() => setIsForecastMenuOpen(!isForecastMenuOpen)}
                       >
                         <span className={forecastPeriod === 'anual' ? 'text-blue-400' : ''}>
                           Previsto {forecastPeriod === 'anual' ? '(12M)' : ''}
                         </span>
                         <ChevronDown size={14} className={`text-slate-500 group-hover:text-blue-400 transition-transform ${isForecastMenuOpen ? 'rotate-180 text-blue-400' : ''}`} />
                       </div>
                       
                       {isForecastMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setIsForecastMenuOpen(false)}></div>
                          <div className="absolute top-[80%] right-2 mt-1 w-32 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 overflow-hidden animate-fadeIn">
                             <div className="p-1 space-y-0.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setForecastPeriod('semestral'); setIsForecastMenuOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[10px] rounded hover:bg-slate-800 transition-colors ${forecastPeriod === 'semestral' ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
                                >
                                  Semestral
                                  {forecastPeriod === 'semestral' && <CheckCircle size={10} />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setForecastPeriod('anual'); setIsForecastMenuOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-[10px] rounded hover:bg-slate-800 transition-colors ${forecastPeriod === 'anual' ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
                                >
                                  Anual (x2)
                                  {forecastPeriod === 'anual' && <CheckCircle size={10} />}
                                </button>
                             </div>
                          </div>
                        </>
                       )}
                    </th>

                    <th className="p-4 border-b border-slate-800 text-right w-32 bg-amber-900/5 text-amber-500 border-l border-slate-800">Solicitado</th>
                    <th className="p-4 border-b border-slate-800 text-right w-32 bg-emerald-900/5 text-emerald-500 border-l border-slate-800">Aprovado</th>
                    <th className="p-4 border-b border-slate-800 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 text-sm divide-y divide-slate-800/50">
                  {displayedData.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Filter size={40} className="opacity-20"/>
                        <span>Nenhum registro encontrado para este filtro.</span>
                      </div>
                    </td></tr>
                  ) : displayedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors bg-slate-900/20 group">
                      <td className="p-4 text-xs font-mono text-slate-500 text-center">{item.code || '-'}</td>
                      {isAdmin && <td className="p-4 text-xs text-slate-400 truncate max-w-[120px]" title={item.comarca}>{item.comarca}</td>}
                      <td className="p-4 font-medium text-white group-hover:text-blue-300 transition-colors">
                        {item.materialName}
                        <div className="text-[10px] text-slate-600 font-normal mt-0.5">{item.category}</div>
                      </td>
                      <td className="p-4 text-center"><span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{item.unit}</span></td>
                      
                      {/* PREVISTO COLUMN CELL */}
                      <td className={`p-4 text-right font-mono transition-colors duration-500 ${forecastPeriod === 'anual' ? 'text-blue-300 font-medium' : 'text-slate-400'}`}>
                        {forecastPeriod === 'anual' ? (item.predictedDemand * 2).toLocaleString() : item.predictedDemand.toLocaleString()}
                      </td>
                      
                      <td className="p-4 text-right bg-amber-900/5 border-l border-slate-800/50">
                        <input 
                          type="number" min="0"
                          disabled={isAdmin} 
                          className={`
                            w-20 bg-slate-950 border rounded px-2 py-1 text-right outline-none transition-all text-sm
                            ${item.requestedQty > 0 ? 'border-amber-600/50 text-amber-400 font-bold' : 'border-slate-800 text-slate-500'}
                            focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50
                            disabled:opacity-50 disabled:bg-transparent disabled:border-transparent
                          `}
                          value={item.requestedQty || ''}
                          onChange={e => onUpdate(item.id, 'requestedQty', Number(e.target.value))}
                          placeholder={!isAdmin ? "0" : String(item.requestedQty)}
                        />
                      </td>

                      <td className={`p-4 text-right border-l border-slate-800/50 ${isAdmin ? 'bg-emerald-900/5' : ''}`}>
                         <input 
                          type="number" min="0"
                          disabled={!isAdmin} 
                          className={`
                            w-20 rounded px-2 py-1 text-right outline-none transition-all text-sm
                            ${item.approvedQty > 0 ? 'border-emerald-600 text-emerald-400 font-bold' : 'border-slate-800 text-slate-500'}
                            ${isAdmin 
                              ? 'bg-slate-950 border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50' 
                              : 'bg-transparent border-transparent disabled:text-emerald-500 disabled:font-bold disabled:opacity-100' 
                            }
                          `}
                          value={item.approvedQty || ''}
                          onChange={e => onUpdate(item.id, 'approvedQty', Number(e.target.value))}
                          placeholder={isAdmin ? "0" : (item.approvedQty > 0 ? String(item.approvedQty) : "-")}
                        />
                      </td>

                      <td className="p-4 text-center">
                         {item.approvedQty > 0 ? <CheckCircle size={16} className="text-emerald-500 mx-auto" /> : 
                          (item.requestedQty > 0 ? <CircleDashed size={16} className="text-amber-500 animate-pulse mx-auto" />
                          : <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto"></div>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. LOGIN SCREEN (Secure)
const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'regional'>('regional');
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState(false);

  // System Customization State
  const [systemName, setSystemName] = useState(() => localStorage.getItem('sys_name') || 'Previsão de Prefil');
  const [systemLogo, setSystemLogo] = useState(() => localStorage.getItem('sys_logo') || null);

  // Regional Selection State
  const [selectedRota, setSelectedRota] = useState(ROTAS_COMARCAS[0].rota);
  const [selectedComarca, setSelectedComarca] = useState(ROTAS_COMARCAS[0].comarcas[0]);

  const availableComarcas = useMemo(() => {
    return ROTAS_COMARCAS.find(r => r.rota === selectedRota)?.comarcas || [];
  }, [selectedRota]);

  // Update selected comarca when rota changes
  useEffect(() => {
    setSelectedComarca(availableComarcas[0]);
  }, [selectedRota, availableComarcas]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === 'cgsup') {
      onLogin({ id: 'admin', name: 'Administrador Central', role: 'admin' });
    } else {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 2000);
    }
  };

  const handleRegionalLogin = () => {
    onLogin({ 
      id: `user-${selectedComarca}`, 
      name: `Resp. ${selectedComarca}`, 
      role: 'user', 
      region: selectedComarca,
      rota: selectedRota
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setSystemLogo(result);
        localStorage.setItem('sys_logo', result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemName(e.target.value);
    localStorage.setItem('sys_name', e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          
          {/* Editable Logo Area */}
          <div className="relative group w-20 h-20 mx-auto mb-4">
            <label className="cursor-pointer block w-full h-full">
              <input type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleLogoChange} />
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 overflow-hidden transition-transform group-hover:scale-105 relative">
                {systemLogo ? (
                  <img src={systemLogo} alt="System Logo" className="w-full h-full object-cover" />
                ) : (
                  <LayoutDashboard className="text-white" size={32} />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="text-white" size={20} />
                </div>
              </div>
            </label>
          </div>

          {/* Editable Title */}
          <div className="relative group inline-block w-full">
             <input 
                value={systemName}
                onChange={handleNameChange}
                className="w-full bg-transparent text-2xl font-bold text-white tracking-tight text-center outline-none border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-2 py-1 transition-all placeholder-slate-600"
                placeholder="Nome do Sistema"
             />
             <Edit2 className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" size={14}/>
          </div>
          
          <p className="text-slate-400 text-sm mt-1">Gestão de Materiais e Logística</p>
        </div>

        <div className="flex p-1 bg-slate-950 rounded-lg mb-6 border border-slate-800">
          <button 
            onClick={() => setActiveTab('regional')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'regional' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Acesso Regional
          </button>
          <button 
             onClick={() => setActiveTab('admin')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'admin' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Administrador
          </button>
        </div>

        <div className="min-h-[220px]">
          {activeTab === 'regional' ? (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Selecione a Rota</label>
                <div className="relative">
                  <select 
                    value={selectedRota}
                    onChange={(e) => setSelectedRota(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                  >
                    {ROTAS_COMARCAS.map(r => <option key={r.rota} value={r.rota}>{r.rota}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Selecione a Comarca</label>
                <div className="relative">
                   <select 
                    value={selectedComarca}
                    onChange={(e) => setSelectedComarca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                  >
                    {availableComarcas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                </div>
              </div>
              <Button onClick={handleRegionalLogin} className="w-full mt-4 py-2.5" icon={ArrowLeft}>
                Acessar Sistema
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-fadeIn pt-4">
              <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Código de Acesso</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                   <input 
                    type="password"
                    autoFocus
                    value={adminCode}
                    onChange={(e) => { setAdminCode(e.target.value); setAdminError(false); }}
                    className={`w-full bg-slate-950 border rounded-lg py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:ring-1 transition-all ${adminError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'}`}
                    placeholder="Digite a senha administrativa..."
                   />
                 </div>
                 {adminError && <p className="text-red-400 text-xs mt-2 ml-1">Código incorreto. Tente novamente.</p>}
              </div>
              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2.5 text-sm font-medium transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 mt-4"
              >
                <Shield size={16} /> Acessar Painel Central
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-xs text-slate-600">
        <p>Sistema de Gestão v3.0 • CGSUP Safe Access</p>
      </div>
    </div>
  );
}

// --- Main App ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<MaterialRecord[]>(generateFullDataset);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const handleUpdate = (id: string, field: string, value: any) => {
    setMaterials(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto status
        if (field === 'approvedQty' && value > 0) updated.status = 'approved';
        else if (field === 'requestedQty' && value > 0) updated.status = 'requested';
        return updated;
      }
      return item;
    }));
  };

  const handleImportData = (newData: Partial<MaterialRecord>[]) => {
    // In a real scenario, this would merge imported data with existing records
    // For now, we assume it refills the current view's items
    alert("Dados importados com sucesso! (Simulação)");
  };

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <>
      <InputTable 
        data={materials} 
        currentUser={currentUser}
        onUpdate={handleUpdate}
        onLogout={() => setCurrentUser(null)}
        onOpenImport={() => setImportModalOpen(true)}
      />
      <FileImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onImport={handleImportData}
      />
    </>
  );
};

// Render
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
