import React, { useState, useEffect } from 'react';
import './App.css';

// Dados Iniciais (Versão 3.0 - Com Pastas)
const initialData = {
  boards: {
    'root': {
      id: 'root',
      title: 'Início',
      cards: [
        { id: 'c1', text: 'Eu quero', type: 'speak', color: '#60A5FA', image: 'https://static.arasaac.org/pictograms/36940/36940_500.png' },
        { id: 'c2', text: 'Comer', type: 'folder', targetId: 'foods', color: '#FBBF24', image: 'https://static.arasaac.org/pictograms/5672/5672_500.png' },
        { id: 'c3', text: 'Não', type: 'speak', color: '#F87171', image: 'https://static.arasaac.org/pictograms/6156/6156_500.png' },
      ]
    },
    'foods': {
      id: 'foods',
      title: 'Comidas',
      parentId: 'root',
      cards: [
        { id: 'f1', text: 'Maçã', type: 'speak', color: '#FBBF24', image: 'https://static.arasaac.org/pictograms/5456/5456_500.png' },
        { id: 'f2', text: 'Água', type: 'speak', color: '#34D399', image: 'https://static.arasaac.org/pictograms/8687/8687_500.png' },
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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('neurocaa_v3_data');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('neurocaa_v3_data', JSON.stringify(data));
  }, [data]);

  const currentBoard = data.boards[currentBoardId] || data.boards['root'];

  const goBack = () => {
    if (currentBoard.parentId) {
      setCurrentBoardId(currentBoard.parentId);
    }
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

  const searchArasaac = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${searchTerm}`);
      const json = await res.json();
      setSearchResults(json.slice(0, 6)); 
    } catch (e) { console.error(e); } 
    finally { setIsSearching(false); }
  };

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

    newBoards[currentBoardId] = {
      ...currentBoard,
      cards: updatedCurrentBoardCards
    };

    setData({ ...data, boards: newBoards });
    setEditingCard(null);
  };

  const handleDeleteCard = () => {
    if (!editingCard.id) return;
    const newCards = currentBoard.cards.filter(c => c.id !== editingCard.id);
    setData({
      ...data,
      boards: {
        ...data.boards,
        [currentBoardId]: { ...currentBoard, cards: newCards }
      }
    });
    setEditingCard(null);
  };

  const addNewCard = () => {
    setEditingCard({ 
      id: null, text: '', type: 'speak', 
      image: 'https://static.arasaac.org/pictograms/2475/2475_500.png', 
      color: '#fbbf24' 
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className={`container ${isEditMode ? 'mode-edit' : 'mode-play'}`}>
      <div className="admin-bar">
        <div className="brand">NeuroCAA <small>v3.0</small></div>
        <button className={`btn-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? '🔓 Editando' : '🔒 Usando'}
        </button>
      </div>

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

      <div className="nav-header">
        {currentBoard.parentId && (
          <button onClick={goBack} className="btn-back">⬅ Voltar</button>
        )}
        <span className="board-title">📂 {currentBoard.title}</span>
      </div>

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
            <span className="label" style={{color: item.type === 'folder' ? '#333' : '#FFF'}}>{item.text}</span>
          </div>
        ))}
        {isEditMode && (
          <button className="card add-card" onClick={addNewCard}>
            <span className="icon">➕</span>
          </button>
        )}
      </div>

      {editingCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingCard.id ? 'Editar' : 'Criar Novo'}</h3>
            <form onSubmit={handleSaveCard}>
              <div className="type-selector">
                <label>O que este botão faz?</label>
                <div className="radio-group">
                  <label className={editingCard.type === 'speak' ? 'selected' : ''}>
                    <input type="radio" name="type" value="speak" 
                      defaultChecked={editingCard.type === 'speak'} 
                      onChange={() => setEditingCard({...editingCard, type: 'speak'})} 
                    /> 🗣️ Fala
                  </label>
                  <label className={editingCard.type === 'folder' ? 'selected' : ''}>
                    <input type="radio" name="type" value="folder" 
                      defaultChecked={editingCard.type === 'folder'}
                      onChange={() => setEditingCard({...editingCard, type: 'folder'})} 
                    /> 📂 Abre Pasta
                  </label>
                </div>
              </div>

              <label>Texto:</label>
              <input name="text" defaultValue={editingCard.text} onChange={(e) => setSearchTerm(e.target.value)} required />

              <label>Buscar Imagem (ARASAAC):</label>
              <div className="search-box">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
              
              <div className="preview-container">
                <img src={editingCard.image} className="preview-img" alt="preview"/>
              </div>

              <label>Cor do Cartão:</label>
              <div className="color-picker">
                {['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'].map(c => (
                  <label key={c} style={{backgroundColor: c}} className="color-option">
                    <input type="radio" name="color" value={c} defaultChecked={editingCard.color === c} />
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
