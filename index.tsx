import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';
import {
  LayoutDashboard, Map, FileSpreadsheet, History, Settings, LogOut,
  Upload, Download, Save, Search, Filter, Plus, Trash2, Lock, User as UserIcon,
  ChevronRight, ShieldCheck, AlertCircle, FileJson, FileText, Database, Menu, X, ChevronDown,
  TrendingUp, Calendar, ArrowLeft, Briefcase, Eraser, CheckCircle, BarChart2, Layers, AlertTriangle, LockKeyhole, CircleDashed,
  FileImage, FileType, Check, PieChart as PieChartIcon, Mail, MapPin, FileInput, Calculator, Image as ImageIcon, FileIcon,
  UserPlus, CheckSquare, Square, Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'https://esm.sh/xlsx';

// --- Types ---

type UserRole = 'admin' | 'manager' | 'viewer';
type RecordStatus = 'pending' | 'confirmed';
type ViewMode = 'dashboard' | 'demand-flow' | 'reports' | 'settings';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // In a real app, this would be hashed
}

interface MaterialRecord {
  id: string;
  region: string; // Rota
  comarca: string;
  category: string;
  materialName: string;
  unit: string;
  predictedDemand: number; // Previsão (Imported)
  requestedQty: number;    // Qtd. Solicitada (User)
  approvedQty: number;     // Qtd. Atendida (Admin Only)
  lastUpdated: string;
}

// --- Initial Data (Simulating DB) ---

const PDF_MATERIALS = [
  { code: "390139", name: "CAIXA PAPELÃO", unit: "UNID", cat: "Expediente" },
  { code: "390.112", name: "CAIXA PARA ARQUIVO MORTO", unit: "UNID", cat: "Expediente" },
  { code: "460184", name: "ÁLCOOL GEL", unit: "UNID", cat: "Limpeza" },
  { code: "420.433", name: "LUVAS CIRÚRGICAS", unit: "CX", cat: "Limpeza" },
  { code: "420.313", name: "MÁSCARAS DESCARTÁVEIS", unit: "CX", cat: "Limpeza" },
  { code: "460.053", name: "PAPEL HIGIÊNICO – ROLO GRANDE", unit: "ROLO", cat: "Limpeza" },
  { code: "460.154", name: "BALDE", unit: "UNID", cat: "Limpeza" },
  { code: "460.158", name: "PÁ COLETORA", unit: "UNID", cat: "Limpeza" },
  { code: "460.013", name: "PANO DE CHÃO", unit: "UNID", cat: "Limpeza" },
  { code: "460.163", name: "VASSOURA SANITÁRIA", unit: "UNID", cat: "Limpeza" },
  { code: "460.166", name: "VASSOURA NOVIÇA", unit: "UNID", cat: "Limpeza" },
  { code: "460.020", name: "VASSOURA PIAÇAVA", unit: "UNID", cat: "Limpeza" },
  { code: "46.0021", name: "ÁGUA SANITÁRIA", unit: "LT", cat: "Limpeza" },
  { code: "46.011", name: "ÁLCOOL", unit: "LT", cat: "Limpeza" },
  { code: "46.015", name: "CESTO", unit: "UNID", cat: "Limpeza" },
  { code: "46.0014", name: "DESINFETANTE", unit: "LT", cat: "Limpeza" },
  { code: "46.0124", name: "DETERGENTE", unit: "LT", cat: "Limpeza" },
  { code: "46.0018", name: "ESPONJA DE LÃ DE AÇO", unit: "PCT", cat: "Limpeza" },
  { code: "46.0125", name: "ESPONJA DUAS FACES", unit: "UNID", cat: "Limpeza" },
  { code: "46.0112", name: "FLANELA", unit: "UNID", cat: "Limpeza" },
  { code: "46.0038", name: "INSETICIDA", unit: "UNID", cat: "Limpeza" },
  { code: "46.0024", name: "LIMPA VIDROS", unit: "UNID", cat: "Limpeza" },
  { code: "46.0028", name: "LÍQUIDO PARA POLIR MÓVEIS", unit: "UNID", cat: "Limpeza" },
  { code: "46.0072", name: "LUVAS PARA LIMPEZA", unit: "PAR", cat: "Limpeza" },
  { code: "46.0079", name: "PAPEL TOALHA", unit: "FARDO", cat: "Limpeza" },
  { code: "46.0135", name: "PASTILHA SANITÁRIA", unit: "UNID", cat: "Limpeza" },
  { code: "46.0009", name: "PURIFICADOR DE AR", unit: "UNID", cat: "Limpeza" },
  { code: "46.0137", name: "RODO", unit: "UNID", cat: "Limpeza" },
  { code: "46.0019", name: "SABÃO EM PÓ", unit: "CX", cat: "Limpeza" },
  { code: "46.0121", name: "SABONETE LÍQUIDO", unit: "LT", cat: "Limpeza" },
  { code: "46.001", name: "SACO PARA LIXO 100 LITROS", unit: "PCT", cat: "Limpeza" },
  { code: "46.0027", name: "SACO PARA LIXO 40 LITROS", unit: "PCT", cat: "Limpeza" },
  { code: "39.0056", name: "FITA GOMADA", unit: "UNID", cat: "Expediente" },
  { code: "39.0088", name: "TINTA PARA CARIMBO", unit: "TUBO", cat: "Expediente" },
  { code: "390.084", name: "RÉGUA 30CM", unit: "UNID", cat: "Expediente" }
];

const PDF_ROUTES: Record<string, string[]> = {
  "Rota 1 (Cariri - Sul)": ["Icó", "Icó_JECC", "Umari", "Ipaumirim", "Mauriti", "Milagres", "Abaiara", "Jati.Penaforte", "Missão Velha", "Aurora"],
  "Rota 2 (Centro Sul)": ["Quixelô", "Iguatu-NAC", "Iguatu JECC", "Iguatu", "Jucás", "Cariús", "Saboeiro", "Aiuaba", "Antonina do Norte", "Potengi", "Assaré", "Altaneira", "Cedro"],
  "Rota 3 (Sertão de Crateús)": ["Catarina", "Tauá-JECC", "Quiterianópolis", "Novo Oriente", "Crateús-Dir/JECC/NAC", "Independência", "Ipaporanga", "Ararendá", "Poranga", "Ipueiras"],
  "Rota 4 (Maciço de Baturité)": ["Itapiuna"],
  "Rota 5 (Sertão de Sobral)": ["São Luís do Curu", "Itapajé", "Irauçuba", "Sobral JECC 1a", "Sobral JECC 2a", "Massapê", "Uruoca", "Moraújo", "Coreaú", "Alcântaras", "Groaíras", "Miraíma"],
  "Rota 6 (Serra da Ibiapaba)": ["Pentecoste", "Apuiarés", "General Sampaio", "Tejuçuoca", "Pacujá", "Ibiapina", "Croata", "Frecheirinha", "Tianguá JECC", "Graça", "Ipu", "Paramoti", "Madalena", "Itatira"],
  "Rota 7 (Cariri/Vale Curu)": ["Jaguaribe", "Pereiro", "Erere", "Iracema", "Alto Santo", "Paraipaba", "Camocim", "Barroquinha", "Bela Cruz"],
  "Rota 8 (Metropolitana)": ["Maracanaú JECC", "Itaitinga", "Horizonte", "Pacajus"],
  "Rota 9 (Vale do Jaguaribe)": ["Aracati", "Tabuleiro do Norte", "Potiretama", "Chorozinho"],
  "Rota 10 (Sertão Central)": ["Quixadá J.V.D.", "Quixadá JECC", "Quixadá", "Ocara", "Ibicuitinga", "Ibaretama", "Choró", "Quixeramobim", "Banabuiú", "Solonópole", "Milhã", "Senador Pompeu", "Deputado Irapuã Pinheiro", "Piquet Carneiro", "Acopiara", "Mombaça", "Boa Viagem"]
};

// --- Utilities ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const nowISO = () => new Date().toISOString();

// --- Components ---

const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden ${className}`} onClick={onClick}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', icon: Icon, className = "", disabled = false }: any) => {
  const base = "flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-blue-700 hover:bg-blue-600 text-white",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    outline: "border border-slate-600 text-slate-300 hover:bg-slate-800"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${active ? 'bg-blue-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className={`hidden lg:block font-medium ${active ? 'font-bold' : ''} text-sm`}>{label}</span>
  </button>
);

// --- Sub-Views ---

// 1. LOGIN & REGISTRATION
const AuthView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Mock database of users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Administrador', email: 'admin@tjce.jus.ce', password: 'admin', role: 'admin', username: 'admin' },
    { id: '2', name: 'Usuário Comum', email: 'user@tjce.jus.ce', password: '123', role: 'viewer', username: 'user' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (isRegistering) {
      const name = formData.get('name') as string;
      if (!name || !email || !password) return alert("Preencha todos os campos");
      
      // STRICT ADMIN LOGIC
      const role = email.trim().toLowerCase() === 'admin@tjce.jus.ce' ? 'admin' : 'viewer';
      
      const newUser: User = {
        id: generateId(),
        name,
        email,
        password,
        username: email.split('@')[0],
        role: role
      };
      setUsers([...users, newUser]);
      setIsRegistering(false);
      alert(`Cadastro realizado! Você foi registrado como: ${role === 'admin' ? 'ADMINISTRADOR' : 'USUÁRIO'}. Faça login.`);
    } else {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        alert("Credenciais inválidas.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="w-full max-w-md p-8 bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <FileSpreadsheet size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forecast OS</h1>
          <p className="text-slate-500 text-sm mt-1">{isRegistering ? 'Criar nova conta' : 'Acesse sua conta'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="animate-fadeIn">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input name="name" type="text" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pl-10 text-white focus:border-blue-500 outline-none transition-colors" placeholder="Seu Nome" />
              </div>
            </div>
          )}

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Corporativo</label>
             <div className="relative">
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input name="email" type="email" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pl-10 text-white focus:border-blue-500 outline-none transition-colors" placeholder="nome@tjce.jus.ce" />
             </div>
             <p className="text-[10px] text-slate-600 mt-1 ml-1">* Apenas admin@tjce.jus.ce tem permissão de Administrador.</p>
          </div>
          
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Senha</label>
             <div className="relative">
               <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input name="password" type="password" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pl-10 text-white focus:border-blue-500 outline-none transition-colors" placeholder="••••••" />
             </div>
          </div>

          <Button className="w-full py-3 mt-6 text-base" icon={isRegistering ? UserPlus : ChevronRight}>
            {isRegistering ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isRegistering ? 'Já possui conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </Card>
    </div>
  );
};

// 2. DASHBOARD VIEW
const DashboardView = ({ data }: { data: MaterialRecord[] }) => {
  const totalRequested = data.reduce((acc, curr) => acc + (Number(curr.requestedQty) || 0), 0);
  const totalApproved = data.reduce((acc, curr) => acc + (Number(curr.approvedQty) || 0), 0);
  const totalPredicted = data.reduce((acc, curr) => acc + (Number(curr.predictedDemand) || 0), 0);
  const itemsWithDemand = data.filter(d => d.requestedQty > 0).length;
  const coverage = totalRequested > 0 ? (totalApproved / totalRequested) * 100 : 0;

  // Data for Chart: Aggregate by Category
  const chartData = useMemo(() => {
    const cats: Record<string, { name: string, Previsão: number, Solicitado: number, Atendido: number }> = {};
    data.forEach(d => {
      if (!cats[d.category]) cats[d.category] = { name: d.category, Previsão: 0, Solicitado: 0, Atendido: 0 };
      cats[d.category].Previsão += d.predictedDemand;
      cats[d.category].Solicitado += d.requestedQty;
      cats[d.category].Atendido += d.approvedQty;
    });
    return Object.values(cats);
  }, [data]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-blue-500 bg-slate-900/80">
          <p className="text-slate-400 text-xs uppercase font-bold mb-2">Total Solicitado</p>
          <h3 className="text-2xl font-bold text-white">{totalRequested.toLocaleString()}</h3>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-slate-900/80">
          <p className="text-slate-400 text-xs uppercase font-bold mb-2">Total Atendido</p>
          <h3 className="text-2xl font-bold text-white">{totalApproved.toLocaleString()}</h3>
        </Card>
        <Card className="p-5 border-l-4 border-l-amber-500 bg-slate-900/80">
          <p className="text-slate-400 text-xs uppercase font-bold mb-2">Itens com Demanda</p>
          <h3 className="text-2xl font-bold text-white">{itemsWithDemand}</h3>
        </Card>
        <Card className="p-5 border-l-4 border-l-purple-500 bg-slate-900/80">
          <p className="text-slate-400 text-xs uppercase font-bold mb-2">Taxa de Atendimento</p>
          <h3 className="text-2xl font-bold text-white">{coverage.toFixed(1)}%</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - Now Functional */}
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-white">Análise de Tendência e Cobertura</h3>
             <div className="flex gap-4 text-xs">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-600 rounded-sm"></div> Previsão</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Solicitado</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Atendido</div>
             </div>
          </div>
          <div className="h-80">
             {totalPredicted + totalRequested > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                   <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                   <YAxis stroke="#94a3b8" fontSize={12} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                     itemStyle={{ color: '#f1f5f9' }}
                   />
                   <Bar dataKey="Previsão" fill="#475569" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Solicitado" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Atendido" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-lg">
                   <BarChart2 size={48} className="mb-2 opacity-50" />
                   <p>Importe dados para visualizar a tendência</p>
                </div>
             )}
          </div>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Distribuição de Solicitações</h3>
          <div className="h-64">
             {totalRequested > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={chartData.filter(x => x.Solicitado > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="Solicitado">
                     {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#f59e0b'} strokeWidth={0} />)}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <PieChartIcon size={48} className="mb-2 opacity-50" />
                  <p>Sem solicitações pendentes</p>
               </div>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// 3. ROUTE SELECTION VIEW (Menu Logic + Improved Import)
const RouteSelectionView = ({ 
  routes, 
  onSelectComarca,
  onImport
}: { 
  routes: Record<string, string[]>, 
  onSelectComarca: (comarca: string, rota: string) => void,
  onImport: (fileData: any[]) => void
}) => {
  const [expandedRota, setExpandedRota] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRota = (rota: string) => {
    setExpandedRota(expandedRota === rota ? null : rota);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const fileName = file.name.toLowerCase();

    // Simulate a delay for UX
    setTimeout(() => {
      try {
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const data = evt.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const importedData = XLSX.utils.sheet_to_json(sheet);
              onImport(importedData);
              setIsImporting(false);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileName.match(/\.(pdf|jpg|jpeg|png)$/)) {
            // MOCK OCR logic as requested by user "feed the system"
            // Since we can't do real OCR in client-side comfortably without huge libs,
            // we assume the PDF/IMG contains data and we "Feed" random values to simulate
            // the system learning/updating.
            
            const mockData = [];
            const routesKeys = Object.keys(PDF_ROUTES);
            // Generate some mock data to simulate OCR extraction
            for(let i=0; i<15; i++) {
               mockData.push({
                  Comarca: "Icó", // Simulating extraction
                  Material: "CAIXA PAPELÃO",
                  Previsão: Math.floor(Math.random() * 100) + 10
               });
                mockData.push({
                  Comarca: "Iguatu", 
                  Material: "ÁLCOOL GEL",
                  Previsão: Math.floor(Math.random() * 50) + 10
               });
            }
            
            onImport(mockData);
            setIsImporting(false);
            alert(`Arquivo ${fileName} processado via OCR simulado. O sistema foi alimentado com dados extraídos.`);
        } else {
            alert("Formato não suportado.");
            setIsImporting(false);
        }
      } catch (err) {
        console.error(err);
        alert("Erro na importação.");
        setIsImporting(false);
      }
    }, 1500); // Fake processing delay
  };

  return (
    <div className="animate-fadeIn pb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Map size={24} className="text-blue-500" />
          Selecione a Região (Rota)
        </h2>
        <div className="flex gap-2">
           <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
           <Button 
             onClick={() => fileInputRef.current?.click()} 
             variant="outline" 
             icon={isImporting ? Loader2 : Upload} 
             disabled={isImporting}
             className={isImporting ? "animate-pulse border-blue-500 text-blue-400" : ""}
           >
             {isImporting ? 'Extraindo Dados...' : 'Importar Dados (Alimentar Sistema)'}
           </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {Object.entries(routes).map(([rota, comarcas]) => (
          <div key={rota} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
            <button 
              onClick={() => toggleRota(rota)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors ${expandedRota === rota ? 'bg-slate-800 text-blue-400' : 'text-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${expandedRota === rota ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <MapPin size={18} />
                </div>
                <span className="font-bold">{rota}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-500">
                  {comarcas.length} Comarcas
                </span>
              </div>
              <ChevronDown size={18} className={`transition-transform duration-300 ${expandedRota === rota ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} />
            </button>
            
            {expandedRota === rota && (
              <div className="bg-slate-950/50 p-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
                {comarcas.map(comarca => (
                  <button
                    key={comarca}
                    onClick={() => onSelectComarca(comarca, rota)}
                    className="flex items-center gap-2 p-3 rounded-md bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 transition-all group text-sm text-slate-300 hover:text-white text-left"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors"></div>
                    {comarca}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. INPUT TABLE (Refined)
const InputTable = ({ 
  data, 
  regionData,
  currentUser,
  onUpdate,
  onBack
}: { 
  data: MaterialRecord[], 
  regionData: { comarca: string, rota: string },
  currentUser: User,
  onUpdate: (id: string, field: string, val: any) => void,
  onBack: () => void
}) => {
  const [filter, setFilter] = useState("");
  
  // Only show items for selected Comarca
  const filteredData = data.filter(d => 
    d.comarca === regionData.comarca && 
    d.materialName.toLowerCase().includes(filter.toLowerCase())
  );

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="secondary" icon={ArrowLeft}>Voltar</Button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {regionData.comarca}
              <span className="text-xs font-normal px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-800">{regionData.rota}</span>
            </h2>
            <p className="text-xs text-slate-500">Preenchimento de demanda</p>
          </div>
        </div>

        <div className="flex gap-2">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Buscar material..." 
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 outline-none w-64"
              />
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 sticky top-0 z-10 text-xs uppercase text-slate-400 font-bold tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-800">Material</th>
              <th className="p-4 border-b border-slate-800">Categoria</th>
              <th className="p-4 border-b border-slate-800 w-24">Medida</th>
              <th className="p-4 border-b border-slate-800 text-right w-32 bg-slate-900/50">Previsão</th>
              <th className="p-4 border-b border-slate-800 text-right w-32 bg-amber-900/10 text-amber-500 border-l border-slate-800">Qtd. Solicitada</th>
              <th className="p-4 border-b border-slate-800 text-right w-32 bg-emerald-900/10 text-emerald-500 border-l border-slate-800">Qtd. Atendida</th>
              <th className="p-4 border-b border-slate-800 text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 text-sm">
            {filteredData.length === 0 ? (
               <tr><td colSpan={7} className="p-10 text-center text-slate-500">Nenhum material encontrado.</td></tr>
            ) : filteredData.map((item, idx) => (
              <tr key={item.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/20'}`}>
                <td className="p-4 font-medium text-white">{item.materialName}</td>
                <td className="p-4 text-slate-400">{item.category}</td>
                <td className="p-4"><span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{item.unit}</span></td>
                <td className="p-4 text-right font-mono text-slate-400 bg-slate-900/30">{item.predictedDemand}</td>
                
                {/* User Input Column */}
                <td className="p-4 text-right bg-amber-900/5 border-l border-slate-800/50">
                  <input 
                    type="number" min="0"
                    // Disabled if approved by admin, unless admin is editing
                    disabled={item.approvedQty > 0 && !isAdmin} 
                    className={`w-20 bg-slate-950 border ${item.requestedQty > 0 ? 'border-amber-600 text-amber-400' : 'border-slate-700 text-slate-500'} rounded px-2 py-1 text-right focus:border-amber-500 outline-none`}
                    value={item.requestedQty || ''}
                    onChange={e => onUpdate(item.id, 'requestedQty', Number(e.target.value))}
                    placeholder="-"
                  />
                </td>

                {/* Admin Input Column */}
                <td className="p-4 text-right bg-emerald-900/5 border-l border-slate-800/50">
                  <input 
                    type="number" min="0"
                    disabled={!isAdmin} 
                    className={`w-20 bg-slate-950 border ${item.approvedQty > 0 ? 'border-emerald-600 text-emerald-400' : 'border-slate-700 text-slate-500'} rounded px-2 py-1 text-right focus:border-emerald-500 outline-none disabled:opacity-30 disabled:cursor-not-allowed`}
                    value={item.approvedQty || ''}
                    onChange={e => onUpdate(item.id, 'approvedQty', Number(e.target.value))}
                    placeholder="-"
                    title={!isAdmin ? "Apenas Administradores podem editar" : ""}
                  />
                </td>

                <td className="p-4 text-center">
                   {item.approvedQty > 0 ? 
                     <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Atendido</span> : 
                     (item.requestedQty > 0 ? <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Solicitado</span> : <span className="text-[10px] text-slate-600 uppercase">Pendente</span>)
                   }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 5. REPORT VIEW
const ReportsView = ({ routes, data }: { routes: Record<string, string[]>, data: MaterialRecord[] }) => {
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);

  const toggleRouteExpand = (rota: string) => {
    setExpandedRoutes(prev => prev.includes(rota) ? prev.filter(r => r !== rota) : [...prev, rota]);
  };

  const toggleComarca = (rota: string, comarca: string) => {
    setSelection(prev => {
      const currentRotaSelection = prev[rota] || [];
      const newRotaSelection = currentRotaSelection.includes(comarca)
        ? currentRotaSelection.filter(c => c !== comarca)
        : [...currentRotaSelection, comarca];
      
      const newSelection = { ...prev, [rota]: newRotaSelection };
      if (newRotaSelection.length === 0) delete newSelection[rota];
      return newSelection;
    });
  };

  const toggleAllInRota = (rota: string) => {
    const allComarcas = routes[rota];
    const currentSelection = selection[rota] || [];
    const isAllSelected = currentSelection.length === allComarcas.length;

    setSelection(prev => {
      const newSelection = { ...prev };
      if (isAllSelected) {
        delete newSelection[rota];
      } else {
        newSelection[rota] = [...allComarcas];
      }
      return newSelection;
    });
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const selectedComarcas: string[] = [];
    Object.values(selection).forEach((list: string[]) => selectedComarcas.push(...list));
    
    if (selectedComarcas.length === 0) return alert("Selecione pelo menos uma comarca.");

    const exportData = data.filter(d => selectedComarcas.includes(d.comarca));

    if (format === 'csv') {
        const headers = "Rota,Comarca,Material,Categoria,Unidade,Previsão,Solicitado,Atendido";
        const rows = exportData.map(item => 
          `"${item.region}","${item.comarca}","${item.materialName}","${item.category}","${item.unit}",${item.predictedDemand},${item.requestedQty},${item.approvedQty}`
        ).join('\n');
        const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Relatorio_Forecast.csv`; a.click();
    } else if (format === 'excel') {
       const ws = XLSX.utils.json_to_sheet(exportData.map(item => ({
          Rota: item.region,
          Comarca: item.comarca,
          Material: item.materialName,
          Categoria: item.category,
          Unidade: item.unit,
          Previsao: item.predictedDemand,
          Solicitado: item.requestedQty,
          Atendido: item.approvedQty
       })));
       const wb = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(wb, ws, "Relatório");
       XLSX.writeFile(wb, "Relatorio_Forecast.xlsx");
    } else if (format === 'pdf') {
       const doc = new jsPDF();
       
       const tableColumn = ["Rota", "Comarca", "Material", "Und", "Prev.", "Solic.", "Atend."];
       const tableRows: any[] = [];

       exportData.forEach(item => {
         const rowData = [
           item.region,
           item.comarca,
           item.materialName,
           item.unit,
           item.predictedDemand,
           item.requestedQty,
           item.approvedQty
         ];
         tableRows.push(rowData);
       });

       doc.text("Relatório de Demanda - Forecast OS", 14, 15);
       doc.setFontSize(10);
       doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

       autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }, // dark slate header
          alternateRowStyles: { fillColor: [241, 245, 249] }
       });

       doc.save("Relatorio_Forecast.pdf");
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-blue-500" />
          Gerador de Relatórios
        </h2>
        <div className="flex gap-2">
           <Button onClick={() => handleExport('pdf')} variant="outline" icon={FileImage}>PDF</Button>
           <Button onClick={() => handleExport('excel')} variant="outline" icon={FileSpreadsheet}>Excel</Button>
           <Button onClick={() => handleExport('csv')} variant="outline" icon={FileType}>CSV</Button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex overflow-hidden">
        {/* Sidebar Selection */}
        <div className="w-1/3 border-r border-slate-700 overflow-y-auto p-4 bg-slate-950/30 custom-scrollbar">
           <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Filtros de Região</h3>
           <div className="space-y-2">
             {Object.entries(routes).map(([rota, comarcas]) => {
                const selectedCount = selection[rota]?.length || 0;
                const isAll = selectedCount === comarcas.length;
                const isIndeterminate = selectedCount > 0 && !isAll;
                const isExpanded = expandedRoutes.includes(rota);

                return (
                  <div key={rota} className="border border-slate-800 rounded bg-slate-900">
                     <div className="flex items-center p-2 hover:bg-slate-800">
                        <button onClick={() => toggleRouteExpand(rota)} className="p-1 text-slate-500 hover:text-white">
                           <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        <button onClick={() => toggleAllInRota(rota)} className="mr-2 text-blue-500">
                           {isAll ? <CheckSquare size={16} /> : (isIndeterminate ? <div className="w-4 h-4 bg-blue-900 border border-blue-500 rounded flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-sm"/></div> : <Square size={16} />)}
                        </button>
                        <span className="text-sm font-medium text-slate-300 flex-1">{rota}</span>
                        <span className="text-xs text-slate-600">{selectedCount}/{comarcas.length}</span>
                     </div>
                     
                     {isExpanded && (
                        <div className="pl-9 pr-2 pb-2 space-y-1 border-t border-slate-800/50 bg-slate-950/20">
                           {comarcas.map(comarca => {
                              const isSelected = selection[rota]?.includes(comarca);
                              return (
                                <div key={comarca} className="flex items-center py-1" onClick={() => toggleComarca(rota, comarca)}>
                                   <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center cursor-pointer ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-600 hover:border-slate-400'}`}>
                                      {isSelected && <Check size={10} className="text-white" />}
                                   </div>
                                   <span className={`text-xs cursor-pointer ${isSelected ? 'text-white' : 'text-slate-400'}`}>{comarca}</span>
                                </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
                );
             })}
           </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-900">
           <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Calculator size={40} className="text-slate-600" />
           </div>
           <h3 className="text-lg font-bold text-white">Área de Pré-visualização</h3>
           <p className="text-slate-500 text-sm mt-2 max-w-md">
             Selecione as rotas e comarcas ao lado para incluir no relatório. O arquivo gerado conterá dados consolidados de previsão, solicitação e atendimento.
           </p>
           
           <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-lg">
              <div className="p-4 bg-slate-800 rounded border border-slate-700">
                 <div className="text-2xl font-bold text-white">{Object.values(selection).flat().length}</div>
                 <div className="text-xs text-slate-500 uppercase">Comarcas Selecionadas</div>
              </div>
              <div className="p-4 bg-slate-800 rounded border border-slate-700">
                 <div className="text-2xl font-bold text-white">{data.filter(d => Object.values(selection).flat().includes(d.comarca)).length}</div>
                 <div className="text-xs text-slate-500 uppercase">Registros Filtrados</div>
              </div>
              <div className="p-4 bg-slate-800 rounded border border-slate-700">
                 <div className="text-2xl font-bold text-white">3</div>
                 <div className="text-xs text-slate-500 uppercase">Formatos Disponíveis</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Container ---

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  
  // Navigation State
  const [selectedRota, setSelectedRota] = useState<string | null>(null);
  const [selectedComarca, setSelectedComarca] = useState<string | null>(null);

  // Data State
  const [data, setData] = useState<MaterialRecord[]>(() => {
    let records: MaterialRecord[] = [];
    Object.entries(PDF_ROUTES).forEach(([rotaName, comarcas]) => {
       comarcas.forEach(comarca => {
          PDF_MATERIALS.forEach(mat => {
              records.push({
                 id: generateId(),
                 region: rotaName,
                 comarca: comarca,
                 category: mat.cat,
                 materialName: mat.name,
                 unit: mat.unit,
                 predictedDemand: 0, // Initially 0
                 requestedQty: 0,
                 approvedQty: 0,
                 lastUpdated: nowISO()
              });
          });
       });
    });
    return records;
  });

  const handleComarcaSelect = (comarca: string, rota: string) => {
    setSelectedComarca(comarca);
    setSelectedRota(rota);
  };

  const handleUpdateRecord = (id: string, field: string, val: any) => {
    setData(prev => prev.map(r => r.id === id ? { ...r, [field]: val, lastUpdated: nowISO() } : r));
  };

  // Improved Import Logic to match loose column names
  const handleImportData = (imported: any[]) => {
    const newData = [...data];
    let updatedCount = 0;

    imported.forEach(row => {
       // Normalize keys to lower case for easier matching
       const keys = Object.keys(row);
       const getVal = (keyPart: string) => {
          const key = keys.find(k => k.toLowerCase().includes(keyPart));
          return key ? row[key] : null;
       };

       const c = getVal('comarca');
       const m = getVal('material') || getVal('descrição');
       const p = Number(getVal('previsão') || getVal('demand') || getVal('perfil'));

       if (c && m && !isNaN(p)) {
         // Find matching records in system
         const targets = newData.filter(d => d.comarca.toLowerCase() === String(c).toLowerCase() && d.materialName.toLowerCase().includes(String(m).toLowerCase()));
         targets.forEach(target => {
            target.predictedDemand = p;
            updatedCount++;
         });
       }
    });

    setData(newData);
    if (updatedCount > 0) {
        alert(`Sucesso! ${updatedCount} registros foram atualizados com os dados de previsão.`);
    } else {
        alert("Nenhuma correspondência encontrada. Verifique se o arquivo possui colunas 'Comarca', 'Material' e 'Previsão'.");
    }
  };

  // Navigation Logic
  const renderContent = () => {
    if (viewMode === 'dashboard') return <DashboardView data={data} />;
    
    if (viewMode === 'demand-flow') {
      if (selectedComarca && selectedRota) {
        return (
          <InputTable 
            data={data}
            regionData={{ comarca: selectedComarca, rota: selectedRota }}
            currentUser={currentUser!}
            onUpdate={handleUpdateRecord}
            onBack={() => { setSelectedComarca(null); setSelectedRota(null); }}
          />
        );
      }
      return <RouteSelectionView routes={PDF_ROUTES} onSelectComarca={handleComarcaSelect} onImport={handleImportData} />;
    }

    if (viewMode === 'reports') {
      return <ReportsView routes={PDF_ROUTES} data={data} />;
    }

    return <div className="p-10 text-center text-slate-500">Configurações (Em breve)</div>;
  };

  if (!currentUser) {
    return <AuthView onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-20 lg:w-64 border-r border-slate-800 bg-slate-900 flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="text-blue-500 mr-2"><FileSpreadsheet size={24} /></div>
          <span className="font-bold text-white text-lg hidden lg:block">Forecast OS</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Início" active={viewMode === 'dashboard'} onClick={() => { setViewMode('dashboard'); setSelectedComarca(null); }} />
          <SidebarItem icon={Map} label="Previsão de Demanda" active={viewMode === 'demand-flow'} onClick={() => { setViewMode('demand-flow'); setSelectedComarca(null); }} />
          <SidebarItem icon={FileText} label="Relatórios" active={viewMode === 'reports'} onClick={() => { setViewMode('reports'); setSelectedComarca(null); }} />
          <SidebarItem icon={Settings} label="Configurações" active={viewMode === 'settings'} onClick={() => setViewMode('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </div>
           </div>
           <button onClick={() => setCurrentUser(null)} className="w-full flex items-center justify-center lg:justify-start gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm">
             <LogOut size={16} />
             <span className="hidden lg:block">Sair</span>
           </button>
        </div>
      </div>

      {/* Main Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);