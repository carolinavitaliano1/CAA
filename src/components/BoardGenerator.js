import React, { useState } from 'react';
import './BoardGenerator.css';

const CAA_COLORS = [
  { color: '#FFFFFF', label: 'Branco – Artigos / Neutro' },
  { color: '#FDE047', label: 'Amarelo – Pessoas / Pronomes' },
  { color: '#86EFAC', label: 'Verde – Verbos / Ações' },
  { color: '#93C5FD', label: 'Azul – Adjetivos' },
  { color: '#FDBA74', label: 'Laranja – Substantivos' },
  { color: '#F9A8D4', label: 'Rosa – Expressões sociais' },
  { color: '#C4B5FD', label: 'Roxo – Preposições' },
  { color: '#D6B28A', label: 'Marrom – Advérbios' },
  { color: '#000000', label: 'Preto (Apenas Borda)' }
];

const BoardGenerator = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [pages, setPages] = useState([]); // Agora armazenamos páginas de cartões
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.35);

  const [config, setConfig] = useState({
    rows: 4,
    cols: 5,
    gap: 2,
    header: true,
    headerText: 'Minha Prancha',
    headerBgColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    cellBgColor: '#FFFFFF',
    cellBorderColor: '#000000',
    boardBorderColor: '#FFFFFF',
    paperSize: 'A4',
    orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    textPosition: 'bottom',
    fontFamily: 'Arial',
    fontSize: 12,
    textCase: 'uppercase',
  });

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsGenerating(true);
    const words = text.trim().split(/[\n\s]+/);
    const cardsPerPage = config.rows * config.cols;
    
    // Busca todas as imagens primeiro
    const allCardsPromises = words.map(async (word) => {
      try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
        return { id: `gen_${Math.random()}`, text: word, image: img };
      } catch (err) {
        return { id: `err`, text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' };
      }
    });

    const allCards = await Promise.all(allCardsPromises);

    // Divisão em Páginas
    const newPages = [];
    for (let i = 0; i < allCards.length; i += cardsPerPage) {
      newPages.push(allCards.slice(i, i + cardsPerPage));
    }
    
    setPages(newPages);
    setIsGenerating(false);
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalize = () => {
    const allFlattenedCards = pages.flat().map(c => ({
      ...c,
      type: 'speak',
      bgColor: config.cellBgColor,
      borderColor: config.cellBorderColor
    }));
    onGenerate(allFlattenedCards);
  };

  return (
    <div className="board-generator-wrapper">
      <div className="config-panel">
        <h3>🛠️ Estrutura</h3>
        <div className="config-group">
          <label>Linhas X Colunas (Por Página):</label>
          <div style={{display:'flex', gap:'5px', width:'100%'}}>
             <input type="number" value={config.rows} onChange={(e) => handleChange('rows', parseInt(e.target.value))} />
             <span>X</span>
             <input type="number" value={config.cols} onChange={(e) => handleChange('cols', parseInt(e.target.value))} />
          </div>
        </div>

        <h3>🎨 Cores (CAA)</h3>
        <div className="config-group">
            <label>Cabeçalho:</label>
            <select value={config.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>
        <div className="config-group">
            <label>Fundo Células:</label>
            <select value={config.cellBgColor} onChange={(e) => handleChange('cellBgColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>
        <div className="config-group">
            <label>Borda Células:</label>
            <select value={config.cellBorderColor} onChange={(e) => handleChange('cellBorderColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>

        <h3>⚙️ Detalhes</h3>
        <div className="config-group">
            <label>Papel e Orientação:</label>
            <select value={config.paperSize} onChange={(e) => handleChange('paperSize', e.target.value)}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
            </select>
            <select value={config.orientation} onChange={(e) => handleChange('orientation', e.target.value)}>
                <option value="landscape">Horizontal</option>
                <option value="portrait">Vertical</option>
            </select>
        </div>

        <div className="config-group">
            <label>Posição Texto:</label>
            <select value={config.textPosition} onChange={(e) => handleChange('textPosition', e.target.value)}>
                <option value="bottom">Abaixo</option>
                <option value="top">Acima</option>
                <option value="none">Ocultar</option>
            </select>
        </div>
      </div>

      <div className="preview-panel">
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea placeholder="Cole sua música ou texto aqui..." value={text} onChange={(e) => setText(e.target.value)} />
                <button onClick={handlePreview} disabled={isGenerating}>{isGenerating ? '⏳' : 'Atualizar'}</button>
            </div>
            <div className="zoom-controls">
                <label>🔍 Zoom: {Math.round(zoomLevel * 100)}%</label>
                <input type="range" min="0.1" max="1.0" step="0.05" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
            </div>
        </div>

        <div className="paper-preview-container">
            <div className="pages-stack" style={{ transform: `scale(${zoomLevel})` }}>
                {pages.length > 0 ? pages.map((pageCards, pageIdx) => (
                    <div 
                        key={pageIdx}
                        className={`paper-sheet ${config.paperSize} ${config.orientation}`}
                        style={{
                            padding: `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm`,
                            marginBottom: '50px' // Espaço entre páginas na tela
                        }}
                    >
                        <div className="paper-content-wrapper" style={{ border: `${config.borderWidth}px ${config.borderStyle} ${config.boardBorderColor}` }}>
                            {config.header && (
                                <div className="paper-header" style={{ backgroundColor: config.headerBgColor, borderBottom: `${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor}` }}>
                                    {config.headerText} {pages.length > 1 ? `- Pág ${pageIdx + 1}` : ''}
                                </div>
                            )}
                            <div className="paper-grid" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)`, gridTemplateRows: `repeat(${config.rows}, 1fr)`, gap: `${config.gap}px` }}>
                                {Array.from({ length: config.rows * config.cols }).map((_, i) => {
                                    const card = pageCards[i];
                                    return (
                                        <div key={i} className="paper-cell" style={{ borderWidth: `${config.borderWidth}px`, borderStyle: config.borderStyle, borderColor: config.cellBorderColor, backgroundColor: config.cellBgColor }}>
                                            {card ? (
                                                <div className={`cell-content ${config.textPosition}`}>
                                                    {config.textPosition === 'top' && <span style={{ fontSize: `${config.fontSize}pt`, textTransform: config.textCase }}>{card.text}</span>}
                                                    <img src={card.image} alt="" />
                                                    {config.textPosition === 'bottom' && <span style={{ fontSize: `${config.fontSize}pt`, textTransform: config.textCase }}>{card.text}</span>}
                                                </div>
                                            ) : <div className="empty-slot"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )) : <div className="no-pages-msg">Digite um texto e clique em Atualizar para ver as páginas.</div>}
            </div>
        </div>

        <div className="action-buttons-row">
            <button className="btn-print" onClick={() => window.print()}>🖨️ Imprimir Tudo (PDF)</button>
            <button className="btn-finalize" onClick={handleFinalize} disabled={pages.length === 0}>✅ Salvar no App</button>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerator;
