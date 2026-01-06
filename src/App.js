import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Cores Oficiais CAA
const CAA_COLORS = [
  { color: '#FDE047', label: 'Pessoas (Amarelo)' },
  { color: '#86EFAC', label: 'Verbos (Verde)' },
  { color: '#93C5FD', label: 'Adjetivos (Azul)' },
  { color: '#FDBA74', label: 'Substantivos (Laranja)' },
  { color: '#F9A8D4', label: 'Social (Rosa)' },
  { color: '#FFFFFF', label: 'Artigos/Outros (Branco)' },
  { color: '#C4B5FD', label: 'Preposições (Roxo)' },
  { color: '#D6B28A', label: 'Advérbios (Marrom)' }
];

const initialData = {
  boards: {
    'root': {
      id: 'root',
      title: 'Início',
      cards: [
        { id: 'c1', text: 'Eu', type: 'speak', bgColor: '#FDE047', borderColor: '#FDE047', image: 'https://static.arasaac.org/pictograms/36940/36940_500.png' },
        { id: 'c2', text: 'Quero', type: 'speak', bgColor: '#86EFAC', borderColor: '#86EFAC', image: 'https://static.arasaac.org/pictograms/5672/5672_500.png' },
      ]
    }
  }
};

function App() {
  // --- ESTADOS GERAIS ---
  const [data, setData] = useState(initialData);
  const [currentView, setCurrentView] = useState('board'); // 'board' ou 'library'
  const [currentBoardId, setCurrentBoardId] = useState('root');
  const [sentence, setSentence] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Menu Lateral
  
  // Estados de Edição e Modal
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  // Estados Auxiliares
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [generatorText, setGeneratorText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Referência para upload de backup
  const fileInputRef = useRef(null);

  // --- Carregar/Salvar ---
  useEffect(() => {
    const savedData = localStorage.getItem('neurocaa_v6_data');
    if (savedData) setData(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    localStorage.setItem('neurocaa_v6_data', JSON.stringify(data));
  }, [data]);

  const currentBoard = data.boards[currentBoardId] || data.boards['root'];

  // --- Voz ---
  const speak = (text) => {
    if (isEditMode) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const speakSentence = () => {
    const fullText = sentence.map(s => s.text).join(" ");
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  // --- Navegação ---
  const navigateToBoard = (boardId) => {
    setCurrentBoardId(boardId);
    setCurrentView('board');
    setIsSidebarOpen(false);
  };

  // --- Lógica do Backup (Importar/Exportar) ---
  const exportData = () => {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_neurocaa_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.boards) {
          setData(importedData);
          alert("Backup restaurado com sucesso!");
          setIsSidebarOpen(false);
        } else {
          alert("Arquivo inválido.");
        }
      } catch (err) { alert("Erro ao ler arquivo."); }
    };
    reader.readAsText(file);
  };

  // --- Lógica do Grid ---
  const handleCardClick = (card) => {
    if (isEditMode) {
      setEditingCard({ ...card });
      setModalSearchTerm(card.text);
      setModalSearchResults([]);
      searchArasaac(card.text);
    } else {
      if (card.type === 'folder' && card.targetId) {
        navigateToBoard(card.targetId);
      } else {
        speak(card.text);
        setSentence([...sentence, card]);
      }
    }
  };

  // --- Gerador e Editor (Mantidos da V5) ---
  const generateBoardFromText = async (e) => {
    e.preventDefault();
    if (!generatorText.trim()) return;
    setIsGenerating(true);
    const words = generatorText.trim().split(/\s+/);
    const newCards = [];
    const promises = words.map(async (word) => {
      try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
        return { id: `gen_${Date.now()}_${Math.random()}`, text: word, type: 'speak', bgColor: '#FFFFFF', borderColor: '#e2e8f0', image: img };
      } catch (err) { return { id: `err_${Date.now()}_${Math.random()}`, text: word, type: 'speak', bgColor: '#FFFFFF', borderColor: '#e2e8f0', image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' }; }
    });
    const results = await Promise.all(promises);
    const updatedBoard = { ...currentBoard, cards: [...currentBoard.cards, ...results] };
    setData({ ...data, boards: { ...data.boards, [currentBoardId]: updatedBoard } });
    setGeneratorText("");
    setIsGenerating(false);
  };

  const searchArasaac = async (term) => {
    if (!term) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(term)}`);
      const json = await res.json();
      setModalSearchResults(json.slice(0, 9));
    } catch (e) {} finally { setIsSearching(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditingCard({ ...editingCard, image: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    let newTargetId = editingCard.targetId;
    let newBoards = { ...data.boards };

    if (editingCard.type === 'folder' && !newTargetId) {
      newTargetId = `board_${Date.now()}`;
      newBoards[newTargetId] = { id: newTargetId, title: editingCard.text, parentId: currentBoardId, cards: [] };
    }

    const newCard = { ...editingCard, id: editingCard.id || `card_${Date.now()}`, targetId: newTargetId };
    const updatedCards = editingCard.id ? currentBoard.cards.map(c => c.id === newCard.id ? newCard : c) : [...currentBoard.cards, newCard];
    
    newBoards[currentBoardId] = { ...currentBoard, cards: updatedCards };
    setData({ ...data, boards: newBoards });
    setEditingCard(null);
  };

  const handleDeleteCard = () => {
    const newCards = currentBoard.cards.filter(c => c.id !== editingCard.id);
    setData({ ...data, boards: { ...data.boards, [currentBoardId]: { ...currentBoard, cards: newCards } } });
    setEditingCard(null);
  };

  const addNewCard = () => {
    setEditingCard({ id: null, text: '', type: 'speak', image: 'https://static.arasaac.org/pictograms/2475/2475_500.png', bgColor: '#FFFFFF', borderColor: '#e2e8f0' });
    setModalSearchTerm(""); setModalSearchResults([]);
  };

  return (
    <div className={`container ${isEditMode ? 'mode-edit' : 'mode-play'}`}>
      
      {/* MENU LATERAL (SIDEBAR) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => { setCurrentView('board'); setCurrentBoardId('root'); setIsSidebarOpen(false); }}>🏠 Início</button>
          <button onClick={() => { setCurrentView('library'); setIsSidebarOpen(false); }}>📚 Minhas Pranchas</button>
          <hr />
          <button onClick={exportData}>💾 Fazer Backup (Baixar)</button>
          <button onClick={() => fileInputRef.current.click()}>📂 Restaurar Backup</button>
          <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={importData} accept=".json" />
        </nav>
        <div className="sidebar-footer">
          <small>NeuroCAA v6.0</small>
        </div>
      </div>

      {/* BARRA TOPO */}
      <div className="admin-bar">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button className="btn-menu" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div className="brand">NeuroCAA</div>
        </div>
        <button className={`btn-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? '🔓 Editando' : '🔒 Usando'}
        </button>
      </div>

      {/* VIEW: BIBLIOTECA (Minhas Pranchas) */}
      {currentView === 'library' && (
        <div className="library-view">
            <h2>📚 Todas as Pranchas</h2>
            <div className="library-grid">
                {Object.values(data.boards).map(board => (
                    <div key={board.id} className="library-card" onClick={() => navigateToBoard(board.id)}>
                        <h3>{board.title}</h3>
                        <p>{board.cards.length} cartões</p>
                        {board.id === 'root' && <span className="tag-home">Principal</span>}
                    </div>
                ))}
            </div>
            <button className="btn-back-home" onClick={() => setCurrentView('board')}>Voltar para o Grid</button>
        </div>
      )}

      {/* VIEW: GRID (Prancha Atual) */}
      {currentView === 'board' && (
        <>
            {/* Frase */}
            <div className="sentence-bar">
                <div className="sentence-display">
                {sentence.length === 0 ? <span className="placeholder">Toque nos cartões...</span> : 
                    sentence.map((item, idx) => (
                    <div key={idx} className="sentence-item">
                        <img src={item.image} alt="" className="mini-img" />
                        <span style={{ borderColor: item.borderColor || 'transparent' }}>{item.text}</span>
                    </div>
                    ))
                }
                </div>
                <div className="controls">
                <button onClick={() => setSentence([])} className="btn-clear">❌</button>
                <button onClick={speakSentence} className="btn-play">🔊</button>
                </div>
            </div>

            {/* Gerador Mágico */}
            {isEditMode && (
                <div className="magic-generator">
                <h3>✨ Criar Prancha Automática</h3>
                <form onSubmit={generateBoardFromText} className="generator-form">
                    <textarea placeholder="Ex: Bom dia eu quero comer pão" value={generatorText} onChange={(e) => setGeneratorText(e.target.value)}/>
                    <button type="submit" disabled={isGenerating}>{isGenerating ? '⏳...' : '⚡ Gerar'}</button>
                </form>
                </div>
            )}

            {/* Navegação Prancha */}
            <div className="nav-header">
                {currentBoard.parentId && <button onClick={() => setCurrentBoardId(currentBoard.parentId)} className="btn-back">⬅ Voltar</button>}
                <span className="board-title">📂 {currentBoard.title}</span>
                {isEditMode && <button className="btn-clear-board" onClick={() => { if(window.confirm('Limpar?')) setData({...data, boards: {...data.boards, [currentBoardId]: {...currentBoard, cards: []}}}) }}>🗑️</button>}
            </div>

            {/* Grid Area */}
            <div className="grid-area">
                {currentBoard.cards.map((item) => (
                <div key={item.id} className={`card ${item.type === 'folder' ? 'is-folder' : ''}`} style={{ backgroundColor: item.bgColor || '#FFF', borderColor: item.borderColor || '#ccc' }} onClick={() => handleCardClick(item)}>
                    {isEditMode && <span className="edit-badge">✏️</span>}
                    {item.type === 'folder' && <div className="folder-tag" style={{backgroundColor: item.borderColor}}>PASTA</div>}
                    <img src={item.image} alt={item.text} className="card-img" />
                    <span className="label" style={{color: '#333'}}>{item.text}</span>
                </div>
                ))}
                {isEditMode && <button className="card add-card" onClick={addNewCard}><span className="icon">➕</span></button>}
            </div>
        </>
      )}

      {/* MODAL EDITOR */}
      {editingCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✏️ Editar</h3>
            <form onSubmit={handleSaveCard}>
              <div className="preview-box">
                <img src={editingCard.image} alt="Preview" />
                <span style={{background: editingCard.bgColor, borderColor: editingCard.borderColor}}>{editingCard.text || "Texto"}</span>
              </div>
              <div className="type-selector">
                <label className={editingCard.type === 'speak' ? 'selected' : ''}><input type="radio" name="type" value="speak" checked={editingCard.type === 'speak'} onChange={() => setEditingCard({...editingCard, type: 'speak'})} /> 🗣️ Fala</label>
                <label className={editingCard.type === 'folder' ? 'selected' : ''}><input type="radio" name="type" value="folder" checked={editingCard.type === 'folder'} onChange={() => setEditingCard({...editingCard, type: 'folder'})} /> 📂 Pasta</label>
              </div>
              <input value={editingCard.text} onChange={(e) => setEditingCard({...editingCard, text: e.target.value})} required placeholder="Texto" />
              <div className="search-box">
                <input value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} placeholder="Buscar ARASAAC..." />
                <button type="button" onClick={() => searchArasaac(modalSearchTerm)} className="btn-search">🔎</button>
              </div>
              <div className="search-results">
                 {isSearching ? <p>⏳...</p> : modalSearchResults.map(p => (<img key={p._id} src={`https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`} onClick={() => setEditingCard({...editingCard, image: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`})} className="result-img" alt="" />))}
              </div>
              <label>Ou envie foto: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
              <div className="colors-section">
                <select value={editingCard.bgColor} onChange={(e) => setEditingCard({...editingCard, bgColor: e.target.value})}>{CAA_COLORS.map(c => <option key={c.color} value={c.color}>Fundo {c.label}</option>)}</select>
                <select value={editingCard.borderColor} onChange={(e) => setEditingCard({...editingCard, borderColor: e.target.value})}>{CAA_COLORS.map(c => <option key={c.color} value={c.color}>Borda {c.label}</option>)}</select>
              </div>
              <div className="modal-actions">
                {editingCard.id && <button type="button" onClick={handleDeleteCard} className="btn-delete">Excluir</button>}
                <button type="button" onClick={() => setEditingCard(null)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
