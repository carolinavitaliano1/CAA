import React, { useState, useEffect } from 'react';
import './App.css';

// Cores Oficiais CAA (Baseado no seu data.js)
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
  const [data, setData] = useState(initialData);
  const [currentBoardId, setCurrentBoardId] = useState('root');
  const [sentence, setSentence] = useState([]);
  
  // Estados de Edição e Modal
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  // Estados do Modal Avançado
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados do Gerador Mágico
  const [generatorText, setGeneratorText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Carregar/Salvar Dados ---
  useEffect(() => {
    const savedData = localStorage.getItem('neurocaa_v5_data');
    if (savedData) setData(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    localStorage.setItem('neurocaa_v5_data', JSON.stringify(data));
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

  // --- Abrir Modal de Edição ---
  const handleCardClick = (card) => {
    if (isEditMode) {
      setEditingCard({ ...card }); // Clona para não editar direto
      setModalSearchTerm(card.text); // Preenche busca com o nome atual
      setModalSearchResults([]); // Limpa buscas anteriores
      // Carrega imagens iniciais baseadas no nome
      searchArasaac(card.text); 
    } else {
      if (card.type === 'folder' && card.targetId) {
        setCurrentBoardId(card.targetId);
      } else {
        speak(card.text);
        setSentence([...sentence, card]);
      }
    }
  };

  const addNewCard = () => {
    const newCard = { 
      id: null, 
      text: '', 
      type: 'speak', 
      image: 'https://static.arasaac.org/pictograms/2475/2475_500.png', 
      bgColor: '#FFFFFF',
      borderColor: '#e2e8f0' 
    };
    setEditingCard(newCard);
    setModalSearchTerm("");
    setModalSearchResults([]);
  };

  // --- Lógica do Gerador Mágico (Texto -> Prancha) ---
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
        let imageUrl = null;
        if (json && json.length > 0) {
          imageUrl = `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png`;
        }
        return {
          id: `gen_${Date.now()}_${Math.random()}`,
          text: word,
          type: 'speak',
          bgColor: '#FFFFFF',
          borderColor: '#e2e8f0',
          image: imageUrl || 'https://static.arasaac.org/pictograms/2475/2475_500.png'
        };
      } catch (err) {
        return {
          id: `err_${Date.now()}_${Math.random()}`, text: word, type: 'speak', bgColor: '#FFFFFF', borderColor: '#e2e8f0',
          image: 'https://static.arasaac.org/pictograms/2475/2475_500.png'
        };
      }
    });

    const results = await Promise.all(promises);
    
    const updatedBoard = {
      ...currentBoard,
      cards: [...currentBoard.cards, ...results]
    };

    const newBoards = { ...data.boards, [currentBoardId]: updatedBoard };
    setData({ ...data, boards: newBoards });
    setGeneratorText("");
    setIsGenerating(false);
  };

  // --- Busca ARASAAC (Modal) ---
  const searchArasaac = async (term) => {
    const query = term || modalSearchTerm;
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(query)}`);
      const json = await res.json();
      setModalSearchResults(json.slice(0, 9)); // Limita a 9 resultados
    } catch (e) {} finally { setIsSearching(false); }
  };

  // --- Upload de Imagem (Do PC) ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditingCard({ ...editingCard, image: reader.result }); // Salva como Base64 temporário
    };
    reader.readAsDataURL(file);
  };

  // --- Salvar Card (Final) ---
  const handleSaveCard = (e) => {
    e.preventDefault();
    
    // Verifica se é pasta e cria estrutura se necessário
    let newTargetId = editingCard.targetId;
    let newBoards = { ...data.boards };

    if (editingCard.type === 'folder' && !newTargetId) {
      newTargetId = `board_${Date.now()}`;
      newBoards[newTargetId] = {
        id: newTargetId,
        title: editingCard.text,
        parentId: currentBoardId,
        cards: []
      };
    }

    const newCard = {
      ...editingCard,
      id: editingCard.id || `card_${Date.now()}`,
      targetId: newTargetId
    };

    const updatedCurrentBoardCards = editingCard.id 
      ? currentBoard.cards.map(c => c.id === newCard.id ? newCard : c)
      : [...currentBoard.cards, newCard];

    newBoards[currentBoardId] = { ...currentBoard, cards: updatedCurrentBoardCards };
    setData({ ...data, boards: newBoards });
    setEditingCard(null);
  };

  const handleDeleteCard = () => {
    if (!editingCard.id) return;
    const newCards = currentBoard.cards.filter(c => c.id !== editingCard.id);
    setData({ ...data, boards: { ...data.boards, [currentBoardId]: { ...currentBoard, cards: newCards } } });
    setEditingCard(null);
  };

  return (
    <div className={`container ${isEditMode ? 'mode-edit' : 'mode-play'}`}>
      
      {/* Topo */}
      <div className="admin-bar">
        <div className="brand">NeuroCAA <small>v5.0</small></div>
        <button className={`btn-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? '🔓 Editando' : '🔒 Usando'}
        </button>
      </div>

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

      {/* Gerador Mágico (Só Editando) */}
      {isEditMode && (
        <div className="magic-generator">
          <h3>✨ Criar Prancha Automática</h3>
          <form onSubmit={generateBoardFromText} className="generator-form">
            <textarea 
              placeholder="Ex: Bom dia eu quero comer pão" 
              value={generatorText}
              onChange={(e) => setGeneratorText(e.target.value)}
            />
            <button type="submit" disabled={isGenerating}>
              {isGenerating ? '⏳...' : '⚡ Gerar'}
            </button>
          </form>
        </div>
      )}

      {/* Navegação */}
      <div className="nav-header">
        {currentBoard.parentId && <button onClick={goBack} className="btn-back">⬅ Voltar</button>}
        <span className="board-title">📂 {currentBoard.title}</span>
        {isEditMode && <button className="btn-clear-board" onClick={() => {
           if(window.confirm('Apagar tudo nesta pasta?')) {
             setData({...data, boards: {...data.boards, [currentBoardId]: {...currentBoard, cards: []}}});
           }
        }}>🗑️ Limpar</button>}
      </div>

      {/* Grid */}
      <div className="grid-area">
        {currentBoard.cards.map((item) => (
          <div
            key={item.id}
            className={`card ${item.type === 'folder' ? 'is-folder' : ''}`}
            style={{ 
              backgroundColor: item.bgColor || '#FFF', 
              borderColor: item.borderColor || '#ccc' 
            }}
            onClick={() => handleCardClick(item)}
          >
            {isEditMode && <span className="edit-badge">✏️</span>}
            {item.type === 'folder' && <div className="folder-tag" style={{backgroundColor: item.borderColor}}>PASTA</div>}
            <img src={item.image} alt={item.text} className="card-img" />
            <span className="label" style={{color: '#333'}}>{item.text}</span>
          </div>
        ))}
        {isEditMode && (
          <button className="card add-card" onClick={addNewCard}>
            <span className="icon">➕</span>
          </button>
        )}
      </div>

      {/* ================= MODAL AVANÇADO ================= */}
      {editingCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✏️ Editar Pictograma</h3>
            <form onSubmit={handleSaveCard}>
              
              {/* Preview */}
              <div className="preview-box">
                <img src={editingCard.image} alt="Preview" />
                <span style={{background: editingCard.bgColor, borderColor: editingCard.borderColor}}>
                  {editingCard.text || "Texto"}
                </span>
              </div>

              {/* Tipo */}
              <div className="type-selector">
                <label className={editingCard.type === 'speak' ? 'selected' : ''}>
                  <input type="radio" name="type" value="speak" 
                    checked={editingCard.type === 'speak'} 
                    onChange={() => setEditingCard({...editingCard, type: 'speak'})} 
                  /> 🗣️ Fala
                </label>
                <label className={editingCard.type === 'folder' ? 'selected' : ''}>
                  <input type="radio" name="type" value="folder" 
                    checked={editingCard.type === 'folder'}
                    onChange={() => setEditingCard({...editingCard, type: 'folder'})} 
                  /> 📂 Pasta
                </label>
              </div>

              {/* Texto */}
              <label>Texto da célula:</label>
              <input 
                value={editingCard.text} 
                onChange={(e) => setEditingCard({...editingCard, text: e.target.value})} 
                required 
              />

              {/* Upload PC */}
              <label>📎 Anexar imagem do computador:</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />

              <hr />

              {/* Busca ARASAAC */}
              <label>🔄 Buscar no ARASAAC:</label>
              <div className="search-box">
                <input 
                  value={modalSearchTerm} 
                  onChange={(e) => setModalSearchTerm(e.target.value)} 
                  placeholder="Digite para buscar..."
                />
                <button type="button" onClick={() => searchArasaac(modalSearchTerm)} className="btn-search">🔎</button>
              </div>

              <div className="search-results">
                 {isSearching ? <p>⏳ Carregando...</p> : modalSearchResults.map(p => (
                    <img 
                      key={p._id} 
                      src={`https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`} 
                      onClick={() => setEditingCard({...editingCard, image: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`})}
                      className="result-img" 
                      alt=""
                    />
                 ))}
              </div>

              <hr />

              {/* Cores Individuais */}
              <div className="colors-section">
                <div>
                  <label>Cor de Fundo:</label>
                  <select 
                    value={editingCard.bgColor} 
                    onChange={(e) => setEditingCard({...editingCard, bgColor: e.target.value})}
                  >
                    <option value="#FFFFFF">Branco (Padrão)</option>
                    {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label>Cor da Borda:</label>
                  <select 
                    value={editingCard.borderColor} 
                    onChange={(e) => setEditingCard({...editingCard, borderColor: e.target.value})}
                  >
                     <option value="#e2e8f0">Cinza (Padrão)</option>
                    {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Botões Finais */}
              <div className="modal-actions">
                {editingCard.id && <button type="button" onClick={handleDeleteCard} className="btn-delete">Excluir</button>}
                <button type="button" onClick={() => setEditingCard(null)} className="btn-cancel">Fechar</button>
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
