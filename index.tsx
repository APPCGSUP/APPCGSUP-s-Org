import React, { useState } from 'react';

interface Item {
  id: string;
  unit: string;
}

export default function Index() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<Item[]>([
    { id: '1', unit: 'KG' },
    { id: '2', unit: 'PCS' },
    { id: '3', unit: 'BOX' },
  ]);

  const onUpdate = (id: string, field: keyof Item, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // If trying to enable admin mode, show password prompt
      setShowPasswordInput(true);
    } else {
      // If disabling, just turn it off
      setIsAdmin(false);
      setShowPasswordInput(false);
      setPassword('');
    }
  };

  const verifyPassword = () => {
    if (password.toLowerCase() === 'cgsup') {
      setIsAdmin(true);
      setShowPasswordInput(false);
      setPassword('');
    } else {
      alert('Incorrect Password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyPassword();
    }
  };

  const handleCancel = () => {
    setShowPasswordInput(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200 font-sans">
      <h1 className="text-xl mb-6 font-bold">Inventory Management</h1>
      
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="admin-toggle"
            checked={isAdmin}
            onChange={handleToggle}
            disabled={showPasswordInput}
            className="rounded border-slate-700 bg-slate-900 cursor-pointer disabled:opacity-50"
          />
          <label htmlFor="admin-toggle" className={`text-sm cursor-pointer select-none ${isAdmin ? 'text-blue-400 font-medium' : 'text-slate-400'}`}>
            {isAdmin ? 'Admin Mode Enabled' : 'Enable Admin Mode'}
          </label>
        </div>

        {showPasswordInput && (
          <div className="flex items-center gap-2 animate-fadeIn bg-slate-900 p-2 rounded-lg border border-slate-800 w-fit shadow-lg">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Password"
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-40 text-white"
              autoFocus
            />
            <button
              onClick={verifyPassword}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              Verify
            </button>
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-300 p-1"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <table className="w-full max-w-md border-collapse border border-slate-800">
        <thead>
          <tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
            <th className="p-3 border-r border-slate-800">ID</th>
            <th className="p-3">Unit</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-900/50">
              <td className="p-4 text-center text-slate-600 font-mono text-xs border-r border-slate-800">
                {item.id}
              </td>
              <td className="p-4 text-center">
                 <input 
                    type="text"
                    disabled={!isAdmin}
                    value={item.unit}
                    onChange={(e) => onUpdate(item.id, 'unit', e.target.value)}
                    className={`w-full max-w-[60px] text-[10px] text-center bg-transparent border rounded px-1 py-1 outline-none transition-all font-mono uppercase ${isAdmin ? 'border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:bg-slate-950 text-slate-300' : 'border-transparent text-slate-400 cursor-default'}`}
                    placeholder="UN"
                  />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}