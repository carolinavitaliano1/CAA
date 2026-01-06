import React, { useState, useEffect } from 'react';
import './App.css';

// Cores Oficiais CAA (Baseado no seu data.js)
const CAA_COLORS = [
  { color: '#FDE047', label: 'Pessoas (Amarelo)' },    // Amarelo
  { color: '#86EFAC', label: 'Verbos (Verde)' },       // Verde
  { color: '#93C5FD', label: 'Adjetivos (Azul)' },     // Azul
  { color: '#FDBA74', label: 'Substantivos (Laranja)' }, // Laranja
  { color: '#F9A8D4', label: 'Social (Rosa)' },        // Rosa
  { color: '#FFFFFF', label: 'Artigos (Branco)' },     // Branco
  { color: '#C4B5FD', label: 'Preposições (Roxo)' },   // Roxo
  { color: '#D6B28A', label: 'Advérbios (Marrom)' }    // Marrom
];

const initialData = {
  boards: {
    'root': {
      id: 'root',
      title: 'Início',
      cards: [
        { id: 'c1', text: 'Eu', type: 'speak', color: '#FDE047', image: 'https://static.arasaac.org/pictograms/36940/36940_500.png' },
        { id: 'c2', text: 'Quero', type: 'speak', color: '#86EFAC', image: 'https://static.arasaac.org/pictograms/5672/5672_500.png' },
      ]
    }
  }
};

function App() {
  const [data, setData] = useState(initialData);
  const [currentBoardId, setCurrentBoardId] = useState('root');
  const [sentence, setSentence] = useState([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  // Estados do Gerador Mágico
  const [generatorText, setGeneratorText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados da Busca Manual
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Carregar/Salvar
  useEffect(() => {
    const savedData = localStorage.getItem('neurocaa_v4_data');
    if (savedData) setData(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    localStorage.setItem('neurocaa_v4_data', JSON.stringify(data));
  }, [data]);

  const currentBoard = data.boards[currentBoardId] || data.boards['root'];

  // --- Navegação e Voz ---
  const goBack = () => {
    if (currentBoard.parentId) setCurrentBoardId(currentBoard.parentId);
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

  // --- Ações de Cartão ---
  const handleCardClick = (card) => {
    if (isEditMode) {
      setSearchTerm(card.text);
      setSearchResults([]);
      setEditingCard(card);
    } else {
      if (card.type === 'folder' && card.targetId) {
        setCurrentBoardId(card.targetId);
      } else {
        speak(card.text);
        setSentence([...sentence, card]);
      }
    }
  };

  // --- O "CÉREBRO" DO GERADOR MÁGICO ---
  const generateBoardFromText = async (e) => {
    e.preventDefault();
    if (!generatorText.trim()) return;

    setIsGenerating(true);
    const words = generatorText.trim().split(/\s+/); // Separa por espaço
    const newCards = [];

    // Processa todas as palavras em paralelo (muito mais rápido)
    const promises = words.map(async (word) => {
      try {
        // Busca exata no ARASAAC
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        
        let imageUrl = null;
        if (json && json.length > 0) {
          // Pega a primeira imagem encontrada
          imageUrl = `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png`;
        }

        return {
          id: `gen_${Date.now()}_${Math.random()}`,
          text: word,
          type: 'speak',
          color: '#FFFFFF', // Padrão branco, usuário muda depois
          image: imageUrl || 'https://static.arasaac.org/pictograms/2475/2475_500.png' // Interrogação se não achar
        };
      } catch (err) {
        console.error(err);
        return {
          id: `err_${Date.now()}`, text: word, type: 'speak', color: '#FFFFFF',
          image: 'https://static.arasaac.org/pictograms/2475/2475_500.png'
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Atualiza a prancha atual com os novos cartões
    const updatedBoard = {
      ...currentBoard,
      cards: [...currentBoard.cards, ...results]
    };

    const newBoards = { ...data.boards, [currentBoardId]: updatedBoard };
    setData({ ...data, boards: newBoards });
    
    setGeneratorText(""); // Limpa o campo
    setIsGenerating(false);
    alert(`Prancha gerada com ${results.length} novos cartões!`);
  };

  // --- Salvar Edição Manual ---
  const handleSaveCard = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const cardType = formData.get('type');
    
    let newTargetId = editingCard.targetId;
    let newBoards = { ...data.boards };

    if (cardType === 'folder' && !newTargetId) {
      newTargetId = `board_${Date.now()}`;
      newBoards[newTargetId] = {
        id: newTargetId,
        title: formData.get('text'),
        parentId: currentBoardId,
        cards: []
      };
    }

    const newCard = {
      id: editingCard.id || `card_${Date.now()}`,
      text: formData.get('text'),
      image: editingCard.image,
      color: formData.get('color'),
      type: cardType,
      targetId: newTargetId
    };

    const updatedCurrentBoardCards = editingCard.id 
      ? currentBoard.cards.map(c => c.id === newCard.id ? newCard : c)
      : [...currentBoard.cards, newCard];

    newBoards[currentBoardId] = { ...currentBoard, cards: updatedCurrentBoardCards };
    setData({ ...data, boards: newBoards });
    setEditingCard(null);
  };

  // --- Deletar e Adicionar Manual ---
  const handleDeleteCard = () => {
    const newCards = currentBoard.cards.filter(c => c.id !== editingCard.id);
    setData({ ...data, boards: { ...data.boards, [currentBoardId]: { ...currentBoard, cards: newCards } } });
    setEditingCard(null);
  };

  const addNewCard = () => {
    setEditingCard({ id: null, text: '', type: 'speak', image: 'https://static.arasaac.org/pictograms/2475/2475_500.png', color: '#FFFFFF' });
    setSearchTerm(""); setSearchResults([]);
  };

  const searchArasaac = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${searchTerm}`);
      const json = await res.json();
      setSearchResults(json.slice(0, 6)); 
    } catch (e) {} finally { setIsSearching(false); }
  };

  return (
    <div className={`container ${isEditMode ? 'mode-edit' : 'mode-play'}`}>
      
      {/* Topo */}
      <div className="admin-bar">
        <div className="brand">NeuroCAA <small>v4.0 IA</small></div>
        <button className={`btn-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? '🔓 Modo Edição' : '🔒 Modo Uso'}
        </button>
      </div>

      {/* Frase Montada */}
      <div className="sentence-bar">
        <div className="sentence-display">
          {sentence.length === 0 ? <span className="placeholder">A frase aparece aqui...</span> : 
            sentence.map((item, idx) => (
              <div key={idx} className="sentence-item">
                <img src={item.image} alt="" className="mini-img" />
                <span style={{ borderColor: item.color }}>{item.text}</span>
              </div>
            ))
          }
        </div>
        <div className="controls">
          <button onClick={() => setSentence([])} className="btn-clear">❌</button>
          <button onClick={speakSentence} className="btn-play">🔊</button>
        </div>
      </div>

      {/* ÁREA DO GERADOR MÁGICO (Só aparece na Edição) */}
      {isEditMode && (
        <div className="magic-generator">
          <h3>✨ Gerador Automático de Prancha</h3>
          <form onSubmit={generateBoardFromText} className="generator-form">
            <textarea 
              placeholder="Digite uma frase, letra de música ou diálogo e clique em Gerar..." 
              value={generatorText}
              onChange={(e) => setGeneratorText(e.target.value)}
            />
            <button type="submit" disabled={isGenerating}>
              {isGenerating ? '⏳ Criando...' : '⚡ Gerar Prancha Agora'}
            </button>
          </form>
          <small>Isso vai buscar imagens automaticamente para cada palavra e adicionar abaixo.</small>
        </div>
      )}

      {/* Navegação */}
      <div className="nav-header">
        {currentBoard.parentId && <button onClick={goBack} className="btn-back">⬅ Voltar</button>}
        <span className="board-title">📂 {currentBoard.title}</span>
        {isEditMode && <button className="btn-clear-board" onClick={() => {
           if(window.confirm('Limpar toda esta prancha?')) {
             setData({...data, boards: {...data.boards, [currentBoardId]: {...currentBoard, cards: []}}});
           }
        }}>🗑️ Limpar Prancha</button>}
      </div>

      {/* Grid */}
      <div className="grid-area">
        {currentBoard.cards.map((item) => (
          <div
            key={item.id}
            className={`card ${item.type === 'folder' ? 'is-folder' : ''}`}
            style={{ backgroundColor: item.type === 'folder' ? '#FFF' : item.color, borderColor: item.color }}
            onClick={() => handleCardClick(item)}
          >
            {isEditMode && <span className="edit-badge">✏️</span>}
            {item.type === 'folder' && <div className="folder-tag" style={{backgroundColor: item.color}}>PASTA</div>}
            <img src={item.image} alt={item.text} className="card-img" />
            <span className="label" style={{color: (item.type === 'folder' || item.color === '#FFFFFF') ? '#333' : '#FFF'}}>{item.text}</span>
          </div>
        ))}
        {isEditMode && (
          <button className="card add-card" onClick={addNewCard}>
            <span className="icon">➕</span>
          </button>
        )}
      </div>

      {/* Modal Editor Manual */}
      {editingCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingCard.id ? 'Editar' : 'Novo'}</h3>
            <form onSubmit={handleSaveCard}>
              <div className="type-selector">
                <label className={editingCard.type === 'speak' ? 'selected' : ''}>
                  <input type="radio" name="type" value="speak" defaultChecked={editingCard.type === 'speak'} onChange={() => setEditingCard({...editingCard, type: 'speak'})}/> 🗣️ Fala
                </label>
                <label className={editingCard.type === 'folder' ? 'selected' : ''}>
                  <input type="radio" name="type" value="folder" defaultChecked={editingCard.type === 'folder'} onChange={() => setEditingCard({...editingCard, type: 'folder'})}/> 📂 Pasta
                </label>
              </div>

              <input name="text" defaultValue={editingCard.text} onChange={(e) => setSearchTerm(e.target.value)} required placeholder="Texto do cartão" />

              <div className="search-box">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar no ARASAAC..." />
                <button type="button" onClick={searchArasaac} className="btn-search">🔎</button>
              </div>

              {isSearching ? <small>Buscando...</small> : (
                <div className="search-results">
                  {searchResults.map(p => (
                    <img key={p._id} src={`https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`} 
                      onClick={() => setEditingCard({...editingCard, image: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`})}
                      className="result-img" alt="" />
                  ))}
                </div>
              )}
              
              <div className="preview-container"><img src={editingCard.image} className="preview-img" alt="preview"/></div>

              <label>Cor CAA:</label>
              <div className="color-grid">
                {CAA_COLORS.map(c => (
                  <label key={c.color} style={{backgroundColor: c.color}} className="color-option" title={c.label}>
                    <input type="radio" name="color" value={c.color} defaultChecked={editingCard.color === c.color} />
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                {editingCard.id && <button type="button" onClick={handleDeleteCard} className="btn-delete">🗑️</button>}
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
