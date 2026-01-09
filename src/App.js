/* src/App.js - Versão Integrada (Lógica + Novo Layout) */
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import BoardGenerator from './components/BoardGenerator'; 

// Cores Oficiais CAA
const CAA_COLORS = [
  { color: '#FDE047', label: 'Amarelo (Pessoas)' },
  { color: '#86EFAC', label: 'Verde (Verbos)' },
  { color: '#93C5FD', label: 'Azul (Adjetivos)' },
  { color: '#FDBA74', label: 'Laranja (Subst.)' },
  { color: '#F9A8D4', label: 'Rosa (Social)' },
  { color: '#FFFFFF', label: 'Branco (Outros)' },
  { color: '#C4B5FD', label: 'Roxo (Preposições)' },
  { color: '#D6B28A', label: 'Marrom (Advérbios)' }
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
  // --- ESTADOS ---
  const [data, setData] = useState(initialData);
  const [currentView, setCurrentView] = useState('board'); // 'board', 'library' ou 'generator'
  const [currentBoardId, setCurrentBoardId] = useState('root');
  const [sentence, setSentence] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  // Estados Auxiliares Modal
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState([]);
  
  const fileInputRef = useRef(null);

  // --- EFEITOS ---
  useEffect(() => {
    const savedData = localStorage.getItem('neurocaa_v8_data');
    if (savedData) setData(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    localStorage.setItem('neurocaa_v8_data', JSON.stringify(data));
  }, [data]);

  const currentBoard = data.boards[currentBoardId] || data.boards['root'];

  // --- FUNÇÕES DE NAVEGAÇÃO ---
  const navigateToBoard = (boardId) => {
    setCurrentBoardId(boardId);
    setCurrentView('board');
    setIsSidebarOpen(false);
  };

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

  // --- GERADOR DE PRANCHAS (Lógica) ---
  const handleMassGeneration = (newCards) => {
    const updatedBoard = { 
      ...currentBoard, 
      cards: [...currentBoard.cards, ...newCards] 
    };
    setData({ ...data, boards: { ...data.boards, [currentBoardId]: updatedBoard } });
    setCurrentView('board');
    alert(`Pronto! ${newCards.length} novos cartões foram criados na pasta "${currentBoard.title}".`);
  };

  // --- MODAL & CARTÕES ---
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

  const searchArasaac = async (term) => {
    if (!term) return;
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(term)}`);
      const json = await res.json();
      setModalSearchResults(json.slice(0, 6)); 
    } catch (e) {}
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

  // --- BACKUP ---
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
        if (importedData.boards) { setData(importedData); alert("Restaurado!"); setIsSidebarOpen(false); }
      } catch (err) { alert("Erro no arquivo."); }
    };
    reader.readAsText(file);
  };

  // --------------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // --------------------------------------------------------------------------------
  return (
    <div className={`App ${isEditMode ? 'mode-edit' : 'mode-play'}`}>
      
      {/* 1. BARRA DE TOPO (NOVO DESIGN) */}
      <header className="admin-bar">
        <div className="brand-group">
          {/* Botão Menu controla o estado isSidebarOpen */}
          <button 
            className={`btn-menu-toggle ${isSidebarOpen ? 'active' : ''}`} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Menu"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <span className="brand-name">NeuroCAA</span>
        </div>

        {/* Botão de Modo Edição (Só aparece no Grid) */}
        {currentView === 'board' && (
          <div className="header-actions">
            <button className={`btn-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? '🔓 Editando' : '🔒 Usar'}
            </button>
          </div>
        )}
      </header>

      {/* 2. MENU LATERAL (SIDEBAR GERAL) */}
      {/* Este menu controla a navegação entre Grid, Gerador e Biblioteca */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => { setCurrentView('board'); setCurrentBoardId('root'); setIsSidebarOpen(false); }}>
            🏠 Início
          </button>
          <button onClick={() => { setCurrentView('generator'); setIsSidebarOpen(false); }} style={{color: '#2563EB', background: '#eff6ff', fontWeight:'bold'}}>
            ✨ Gerador de PDF
          </button>
          <button onClick={() => { setCurrentView('library'); setIsSidebarOpen(false); }}>
            📚 Minhas Pastas
          </button>
          <hr />
          <button onClick={exportData}>💾 Fazer Backup</button>
          <button onClick={() => fileInputRef.current.click()}>📂 Restaurar Backup</button>
          <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={importData} accept=".json" />
        </nav>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL (Muda conforme a view) */}
      <main className="container">
        
        {/* VIEW: GRID DE CARTÕES (PÁGINA PRINCIPAL) */}
        {currentView === 'board' && (
          <>
            {/* Barra da Frase */}
            <div className="sentence-bar">
                <div className="sentence-display">
                {sentence.length === 0 ? <span className="placeholder" style={{color:'#94a3b8', paddingLeft:'10px'}}>Toque nos cartões para formar frases...</span> : 
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

            {/* Título da Pasta e Voltar */}
            <div className="nav-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0'}}>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                   {currentBoard.parentId && <button onClick={() => setCurrentBoardId(currentBoard.parentId)} className="btn-back">⬅ Voltar</button>}
                   <span className="board-title" style={{fontWeight:'bold', fontSize:'1.1rem'}}>📂 {currentBoard.title}</span>
                </div>
                {isEditMode && <button className="btn-delete" style={{padding: '5px 10px'}} onClick={() => { if(window.confirm('Limpar pasta?')) setData({...data, boards: {...data.boards, [currentBoardId]: {...currentBoard, cards: []}}}) }}>🗑️ Limpar Tudo</button>}
            </div>

            {/* Grid de Cartões */}
            <div className="grid-area">
                {currentBoard.cards.map((item) => (
                <div key={item.id} className={`card ${item.type === 'folder' ? 'is-folder' : ''}`} style={{ backgroundColor: item.bgColor || '#FFF', borderColor: item.borderColor || '#ccc' }} onClick={() => handleCardClick(item)}>
                    {isEditMode && <span className="edit-badge" style={{position:'absolute', top:'-5px', right:'-5px', background:'white', borderRadius:'50%', padding:'2px'}}>✏️</span>}
                    {item.type === 'folder' && <div className="folder-tag" style={{backgroundColor: item.borderColor || '#ccc'}}>PASTA</div>}
                    <img src={item.image} alt={item.text} className="card-img" />
                    <span className="label" style={{color: '#333'}}>{item.text}</span>
                </div>
                ))}
                {isEditMode && <button className="card add-card" onClick={addNewCard}><span className="icon">➕</span></button>}
            </div>
          </>
        )}

        {/* VIEW: GERADOR DE PDF (NOVO LAYOUT INTEGRADO) */}
        {currentView === 'generator' && (
           /* Passamos o estado do menu (isSidebarOpen) para o gerador controlar o painel dele também, se quiser, ou mantemos separado */
           /* Neste caso, o Gerador ocupa a tela toda, então ele tem seu próprio container */
           <div style={{position:'fixed', top:64, left:0, width:'100%', height:'calc(100% - 64px)', zIndex:10}}>
              <BoardGenerator 
                  onGenerate={handleMassGeneration} 
                  /* Opcional: Se quiser que o botão do topo abra o menu de config do gerador */
                  isSidebarOpen={isSidebarOpen} 
                  toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
           </div>
        )}

        {/* VIEW: BIBLIOTECA (LISTA DE PASTAS) */}
        {currentView === 'library' && (
          <div className="library-view">
             <h2>📚 Todas as Pranchas</h2>
             <div className="library-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'15px'}}>
                 {Object.values(data.boards).map(board => (
                     <div key={board.id} className="library-card" onClick={() => navigateToBoard(board.id)} style={{background:'white', padding:'20px', borderRadius:'10px', cursor:'pointer', border:'1px solid #ddd'}}>
                         <h3>{board.title}</h3>
                         <p>{board.cards.length} cartões</p>
                     </div>
                 ))}
             </div>
             <button className="btn-back-home" style={{marginTop:'20px', padding:'10px'}} onClick={() => setCurrentView('board')}>Voltar para Início</button>
          </div>
        )}

      </main>

      {/* 4. MODAL DE EDIÇÃO (Mantido Intacto) */}
      {editingCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">{editingCard.id ? '✏️ Editar Cartão' : '➕ Novo Cartão'}</h3>
            <form onSubmit={handleSaveCard}>
              <div className="modal-section preview-section">
                <div className="preview-box">
                    <img src={editingCard.image} alt="Preview" />
                    <span style={{background: editingCard.bgColor, borderColor: editingCard.borderColor}}>{editingCard.text || "Seu Texto"}</span>
                </div>
                <div className="type-selector">
                    <label className={editingCard.type === 'speak' ? 'selected' : ''}><input type="radio" name="type" value="speak" checked={editingCard.type === 'speak'} onChange={() => setEditingCard({...editingCard, type: 'speak'})} /> 🗣️ Falar</label>
                    <label className={editingCard.type === 'folder' ? 'selected' : ''}><input type="radio" name="type" value="folder" checked={editingCard.type === 'folder'} onChange={() => setEditingCard({...editingCard, type: 'folder'})} /> 📂 Pasta</label>
                </div>
              </div>

              <div className="modal-section content-section">
                <h5 className="section-label">1. O QUE ESTÁ ESCRITO?</h5>
                <input className="input-text-main" value={editingCard.text} onChange={(e) => setEditingCard({...editingCard, text: e.target.value})} required placeholder="Ex: Água..." />
                <h5 className="section-label" style={{marginTop: '15px'}}>2. IMAGEM</h5>
                <div className="image-tools-box">
                    <div className="search-row">
                        <input value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} placeholder="Buscar no ARASAAC" />
                        <button type="button" onClick={() => searchArasaac(modalSearchTerm)}>🔎</button>
                    </div>
                    {modalSearchResults.length > 0 && (
                        <div className="search-results">{modalSearchResults.map(p => (<img key={p._id} src={`https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`} onClick={() => setEditingCard({...editingCard, image: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`})} className="result-img" alt="" />))}</div>
                    )}
                    <label className="btn-upload">📁 Foto do Computador <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} /></label>
                </div>
              </div>

              <div className="modal-section style-section">
                <h5 className="section-label">3. CORES</h5>
                <div className="colors-row">
                    <div className="color-group"><label>FUNDO</label><select value={editingCard.bgColor} onChange={(e) => setEditingCard({...editingCard, bgColor: e.target.value})}><option value="#FFFFFF">Branco</option>{CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}</select></div>
                    <div className="color-group"><label>BORDA</label><select value={editingCard.borderColor} onChange={(e) => setEditingCard({...editingCard, borderColor: e.target.value})}><option value="#e2e8f0">Cinza</option>{CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}</select></div>
                </div>
              </div>

              <div className="modal-actions">
                {editingCard.id && <button type="button" onClick={handleDeleteCard} className="btn-delete">🗑️</button>}
                <button type="button" onClick={() => setEditingCard(null)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">✅ Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
