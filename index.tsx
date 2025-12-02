import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowLeft, Search, Lock, CheckCircle, CircleDashed, 
  User as UserIcon, Shield, LogOut, MapPin, Upload, 
  FileText, FileSpreadsheet, Image as ImageIcon, X,
  LayoutDashboard, Table as TableIcon, FileCheck, Loader2,
  TrendingUp, AlertCircle, ChevronDown, Download, Printer, Filter,
  Edit2, File, Calendar, Plus, Trash2, UserPlus, Eye, EyeOff
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'purple', 
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
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50",
    purple: "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/20 border border-transparent"
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
              <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#cbd5e1" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#e2e8f0' }} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ fill: '#1e293b' }} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    fill="#cbd5e1" 
                    fontSize={12} 
                    formatter={(val: number) => val.toLocaleString()} 
                  />
                </Bar>
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
                <Pie 
                  data={stats.statusData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                    if (value === 0) return null;

                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#cbd5e1" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central" 
                        fontSize={11}
                        fontWeight="500"
                      >
                        {`${name}: ${value}`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#475569' }}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
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

// 3. FILE IMPORT MODAL (Updated logic for XLSX)
const FileImportModal = ({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (data: Partial<MaterialRecord>[]) => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) setFile(null); // Reset on open
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        throw new Error("Arquivo vazio");
      }

      // Smart Header Detection
      // Look for first row that looks like a header (contains key words)
      let headerRowIndex = 0;
      let headers: string[] = [];
      const keywords = ['material', 'descrição', 'descricao', 'cód', 'cod', 'rota', 'comarca'];
      
      for(let i = 0; i < Math.min(jsonData.length, 20); i++) {
         const row = (jsonData[i] || []).map(c => String(c).toLowerCase().trim());
         // Check if row contains at least 2 keywords
         const matches = keywords.filter(k => row.some(cell => cell.includes(k)));
         if (matches.length >= 2) {
            headerRowIndex = i;
            headers = row;
            break;
         }
      }

      // Fallback if no smart header found, assume first row
      if (headers.length === 0 && jsonData.length > 0) {
         headers = (jsonData[0] || []).map(h => String(h).toLowerCase().trim());
      }
      
      const parsedRecords: Partial<MaterialRecord>[] = [];
      
      // Simple header mapping helper
      const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

      const idxCode = getIndex(['cód', 'cod', 'code']);
      const idxName = getIndex(['material', 'descri', 'name', 'descrição']);
      const idxUnit = getIndex(['unid', 'unit']);
      const idxPrev = getIndex(['previ', 'demanda', 'demand', 'meta']);
      const idxRota = getIndex(['rota']);
      const idxComarca = getIndex(['comarca', 'local', 'município']);
      const idxCat = getIndex(['cat', 'grupo', 'classe']);

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const record: Partial<MaterialRecord> = {};
        
        if (idxCode >= 0) record.code = String(row[idxCode] || '').trim();
        if (idxName >= 0) record.materialName = String(row[idxName] || '').trim();
        if (idxUnit >= 0) record.unit = String(row[idxUnit] || '').trim();
        if (idxPrev >= 0) {
           const val = row[idxPrev];
           record.predictedDemand = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }
        if (idxRota >= 0) record.rota = String(row[idxRota] || '').trim();
        if (idxComarca >= 0) record.comarca = String(row[idxComarca] || '').trim();
        if (idxCat >= 0) record.category = String(row[idxCat] || '').trim();
        
        // Basic Validation: must have at least a material name
        if (record.materialName) {
           parsedRecords.push(record);
        }
      }

      onImport(parsedRecords);
      onClose();

    } catch (error) {
      console.error("Error reading file:", error);
      alert("Erro ao ler arquivo. Verifique se é um Excel válido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Upload size={20} className="text-blue-500" /> Importar Arquivo</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white"/></button>
        </div>
        <div className="p-8">
          {!file ? (
            <div className="border-2 border-dashed border-slate-700 rounded-xl h-48 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-900/50 transition-colors">
              <Upload size={32} className="text-slate-500 mb-4"/>
              <p className="text-slate-400 mb-4 font-medium">Arraste PDF, Excel ou Imagem</p>
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.xlsx,.xls,.csv" />
                <span className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 text-white font-medium transition-colors shadow-lg border border-slate-700">Selecionar Arquivo</span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {isProcessing ? (
                <div className="flex flex-col items-center py-8"><Loader2 className="animate-spin text-blue-500 mb-4" size={40}/> <span className="text-slate-400">Processando dados...</span></div>
              ) : (
                 <div className="w-full space-y-4">
                   <div className="bg-slate-800 p-4 rounded-xl text-white text-center border border-slate-700 font-medium break-all flex flex-col items-center gap-2">
                     <FileSpreadsheet size={32} className="text-emerald-500" />
                     {file.name}
                     <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                   </div>
                   
                   <div className="flex gap-3">
                     <Button onClick={() => setFile(null)} variant="secondary" className="flex-1">Escolher Outro</Button>
                     <Button onClick={processFile} className="flex-1 shadow-blue-900/40">Confirmar Importação</Button>
                   </div>
                 </div>
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
  onOpenImport,
  onAddItem,
  onDeleteItems
}: { 
  data: MaterialRecord[], 
  currentUser: User,
  onUpdate: (id: string, field: string, val: any) => void,
  onLogout: () => void,
  onOpenImport: () => void,
  onAddItem: () => void,
  onDeleteItems: (ids: string[]) => void
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'dashboard' | 'reports'>('table');
  const isAdmin = currentUser.role === 'admin';
  const [forecastPeriod, setForecastPeriod] = useState<'semestral' | 'anual'>('semestral');
  const [isForecastMenuOpen, setIsForecastMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Filter logic: Admins see everything (filtered by filters), Users only see their comarca
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
    return d;
  }, [data, isAdmin, currentUser.region, selectedRota, selectedComarca, selectedMaterial]);

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    const allDisplayedSelected = displayedData.length > 0 && displayedData.every(d => selectedIds.has(d.id));
    if (allDisplayedSelected) {
      // Deselect all displayed
      const newSet = new Set(selectedIds);
      displayedData.forEach(d => newSet.delete(d.id));
      setSelectedIds(newSet);
    } else {
      // Select all displayed
      const newSet = new Set(selectedIds);
      displayedData.forEach(d => newSet.add(d.id));
      setSelectedIds(newSet);
    }
  };

  const confirmDelete = () => {
    onDeleteItems(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

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
                  {isAdmin && selectedIds.size > 0 && (
                    <Button onClick={() => setShowDeleteConfirm(true)} variant="danger" icon={Trash2}>
                      Excluir ({selectedIds.size})
                    </Button>
                  )}
                  {isAdmin && (
                    <Button onClick={onAddItem} variant="purple" icon={Plus} className="shadow-purple-900/20">
                      Adicionar Item
                    </Button>
                  )}
                  <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 whitespace-nowrap">
                    {displayedData.length} REGISTROS
                  </div>
               </div>
            </div>

            <div className="overflow-auto custom-scrollbar flex-1 pb-20">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 text-[11px] uppercase text-slate-400 font-bold tracking-wider shadow-sm">
                  <tr>
                    {isAdmin && (
                      <th className="p-4 border-b border-slate-800 w-10 text-center">
                        <input 
                          type="checkbox" 
                          checked={displayedData.length > 0 && displayedData.every(d => selectedIds.has(d.id))}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-4 border-b border-slate-800 text-center w-24">Cód.</th>
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
                    <tr><td colSpan={isAdmin ? 9 : 8} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Filter size={40} className="opacity-20"/>
                        <span>Nenhum registro encontrado para este filtro.</span>
                      </div>
                    </td></tr>
                  ) : displayedData.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors group ${selectedIds.has(item.id) ? 'bg-blue-900/10' : 'bg-slate-900/20'}`}>
                      
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(item.id)}
                            onChange={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <input 
                          type="text" 
                          disabled={!isAdmin}
                          value={item.code || ''}
                          onChange={(e) => onUpdate(item.id, 'code', e.target.value)}
                          className={`w-full max-w-[100px] text-sm font-bold font-mono text-center bg-transparent border rounded px-2 py-1 outline-none transition-all ${isAdmin ? 'border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-slate-200' : 'border-transparent text-slate-400 cursor-default'}`}
                          placeholder="-"
                        />
                      </td>

                      {isAdmin && (
                        <td className="p-4">
                           <input 
                            type="text"
                            disabled={!isAdmin}
                            value={item.comarca}
                            onChange={(e) => onUpdate(item.id, 'comarca', e.target.value)}
                            className="w-full text-xs bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-slate-400 rounded px-2 py-1 outline-none transition-all"
                            placeholder="Comarca"
                          />
                        </td>
                      )}
                      
                      <td className="p-4">
                        <input 
                          type="text"
                          disabled={!isAdmin}
                          value={item.materialName}
                          onChange={(e) => onUpdate(item.id, 'materialName', e.target.value)}
                          className={`w-full font-medium bg-transparent border rounded px-2 py-1 outline-none transition-all ${isAdmin ? 'border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-white' : 'border-transparent text-white cursor-default group-hover:text-blue-300'}`}
                        />
                        {/* CATEGORY EDITABLE - Increased visibility */}
                        <input 
                          type="text"
                          disabled={!isAdmin}
                          value={item.category}
                          onChange={(e) => onUpdate(item.id, 'category', e.target.value)}
                          className={`w-full text-[11px] mt-0.5 bg-transparent border rounded px-2 py-0.5 outline-none transition-all ${isAdmin ? 'border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-slate-300 focus:text-white' : 'border-transparent text-slate-500 cursor-default'}`}
                          placeholder="Categoria"
                        />
                      </td>
                      
                      <td className="p-4 text-center">
                         <input 
                            type="text"
                            disabled={!isAdmin}
                            value={item.unit}
                            onChange={(e) => onUpdate(item.id, 'unit', e.target.value)}
                            className={`w-full max-w-[60px] text-[10px] text-center bg-transparent border rounded px-1 py-1 outline-none transition-all font-mono uppercase ${isAdmin ? 'border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-slate-300' : 'border-transparent text-slate-400 cursor-default'}`}
                            placeholder="UN"
                          />
                      </td>
                      
                      {/* PREVISTO COLUMN CELL - EDITABLE FOR ADMIN & BIGGER FONT */}
                      <td className={`p-4 text-right font-mono transition-colors duration-500 ${forecastPeriod === 'anual' && !isAdmin ? 'text-blue-300 font-medium' : 'text-slate-300'}`}>
                        {isAdmin ? (
                           <input 
                            type="number"
                            value={item.predictedDemand}
                            onChange={(e) => onUpdate(item.id, 'predictedDemand', Number(e.target.value))}
                            className="w-24 bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 text-right rounded px-2 py-1 outline-none transition-all text-base font-bold text-slate-200"
                          />
                        ) : (
                          <span className="text-base font-bold">
                            {forecastPeriod === 'anual' ? (item.predictedDemand * 2).toLocaleString() : item.predictedDemand.toLocaleString()}
                          </span>
                        )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
              <h3 className="text-lg font-bold text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-400 text-sm mb-6">
                 Você está prestes a excluir <span className="text-white font-bold">{selectedIds.size}</span> item(s). 
                 Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                 <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                 <Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// 5. LOGIN SCREEN (Secure)
const LoginScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [loginType, setLoginType] = useState<'regional' | 'admin'>('regional');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  
  // Extract unique regions for dropdown
  const uniqueComarcas = useMemo(() => {
    return Array.from(new Set(ROTAS_COMARCAS.flatMap(r => r.comarcas))).sort();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'admin') {
      if (password === 'admin123') {
        onLogin({ id: 'admin', name: 'Administrador', role: 'admin' });
      } else {
        setError('Senha de administrador inválida');
      }
    } else {
      if (password === 'user123' && selectedRegion) {
        // Find the rota for the region
        const rota = ROTAS_COMARCAS.find(r => r.comarcas.includes(selectedRegion))?.rota || 'Desconhecida';
        onLogin({ id: 'user', name: selectedRegion, role: 'user', region: selectedRegion, rota });
      } else {
        setError('Credenciais inválidas ou região não selecionada');
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
         <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/20 shadow-blue-900/20 p-8 z-10 animate-fadeIn relative">
        {/* Register Button Icon */}
        <button 
          onClick={() => alert("Funcionalidade de cadastro em desenvolvimento.")}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
          title="Cadastrar Login"
        >
          <UserPlus size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Previsão de Perfil</h1>
          <p className="text-slate-500 mt-2 text-sm">Sistema de Previsão e Controle</p>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button 
            type="button"
            onClick={() => { setLoginType('regional'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginType === 'regional' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Regional
          </button>
          <button 
            type="button"
            onClick={() => { setLoginType('admin'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginType === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {loginType === 'regional' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">Região de Acesso</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <select 
                  value={selectedRegion}
                  onChange={e => setSelectedRegion(e.target.value)}
                  className="w-full bg-slate-950 text-slate-300 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="">Selecione sua Comarca...</option>
                  {uniqueComarcas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16}/>
              </div>
            </div>
          )}

          <div className="animate-fadeIn">
             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">
               {loginType === 'admin' ? 'Senha Administrativa' : 'Senha de Acesso'}
             </label>
             <div className="relative group">
              <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]">
            Entrar no Sistema
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-600">
          Versão 2.4.0 • Acesso Seguro
        </div>
      </div>
    </div>
  );
};

// 6. APP ORCHESTRATOR
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<MaterialRecord[]>(() => generateFullDataset());
  const [showImport, setShowImport] = useState(false);

  const handleUpdate = (id: string, field: string, value: any) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImport = (importedData: Partial<MaterialRecord>[]) => {
    // Merge logic: Add as new items or update existing? 
    // For simplicity, let's append as new items with generated IDs
    const newItems: MaterialRecord[] = importedData.map((d, i) => ({
       id: `imp-${Date.now()}-${i}`,
       code: d.code,
       rota: d.rota || 'Indefinida',
       comarca: d.comarca || 'Indefinida',
       materialName: d.materialName || 'Novo Material',
       category: d.category || 'Geral',
       unit: d.unit || 'UN',
       predictedDemand: d.predictedDemand || 0,
       requestedQty: 0,
       approvedQty: 0,
       status: 'pending'
    }));
    
    setData(prev => [...newItems, ...prev]);
  };

  const handleAddItem = () => {
    const newItem: MaterialRecord = {
      id: `new-${Date.now()}`,
      code: '',
      rota: 'Indefinida',
      comarca: 'Indefinida',
      materialName: 'Novo Item',
      category: 'Geral',
      unit: 'UNID',
      predictedDemand: 0,
      requestedQty: 0,
      approvedQty: 0,
      status: 'pending'
    };
    setData(prev => [newItem, ...prev]);
  };

  const handleDeleteItems = (ids: string[]) => {
    setData(prev => prev.filter(item => !ids.includes(item.id)));
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <>
      <InputTable 
        data={data} 
        currentUser={user} 
        onUpdate={handleUpdate} 
        onLogout={() => setUser(null)}
        onOpenImport={() => setShowImport(true)}
        onAddItem={handleAddItem}
        onDeleteItems={handleDeleteItems}
      />
      <FileImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onImport={handleImport}
      />
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);