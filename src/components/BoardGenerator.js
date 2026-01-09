import React, { useState } from 'react';
import './BoardGenerator.css';
import { generateBoardPDF } from '../utils/BoardPDFGenerator';

const CAA_COLORS = [
  { color: '#FFFFFF', label: 'Branco – Artigos / Neutro' },
  { color: '#FDE047', label: 'Amarelo – Pessoas' },
  { color: '#86EFAC', label: 'Verde – Verbos' },
  { color: '#93C5FD', label: 'Azul – Adjetivos' },
  { color: '#FDBA74', label: 'Laranja – Substantivos' },
  { color: '#F9A8D4', label: 'Rosa – Social' },
  { color: '#C4B5FD', label: 'Roxo – Preposições' },
  { color: '#D6B28A', label: 'Marrom – Advérbios' },
  { color: '#000000', label: 'Preto (Borda)' }
];

// Agora recebe as props do App.js
const BoardGenerator = ({ isSidebarOpen, toggleSidebar }) => {
  const [text, setText] = useState("");
  const [pages, setPages] = useState([]); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.5); // Começa menor para caber
  const [currentPage, setCurrentPage] = useState(0);

  // Configurações padrão
  const [config, setConfig] = useState({
    rows: 4, cols: 5, gap: 2,
    header: true, headerText: 'Minha Prancha', headerBgColor: '#FFFFFF',
    cellBgColor: '#FFFFFF', cellBorderColor: '#000000', borderWidth: 1, borderStyle: 'solid', 
    boardBorderColor: '#000000',
    paperSize: 'A4', orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    textPosition: 'bottom', fontFamily: 'Arial', fontSize: 12, textCase: 'uppercase'
  });

  // (Mantenha aqui as funções handlePreview, handleChange, handleFinalize, handleDownloadClick iguais ao que você já tinha)
  // Vou resumir para focar na estrutura visual, mas você deve manter a lógica:
  
  const handleChange = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const handlePreview = async (e) => {
      e.preventDefault();
      setIsGenerating(true);
      setCurrentPage(0);
      const words = text.trim().split(/[\n\s]+/);
      const cardsPerPage = config.rows * config.cols;
      
      const allCardsPromises = words.map(async (word) => {
        if(!word) return null;
        try {
          const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
          const json = await res.json();
          const img = (json && json.length > 0) ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
          return { id: Math.random(), text: word, image: img };
        } catch { return { id: Math.random(), text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' }; }
      });
      
      const allCards = (await Promise.all(allCardsPromises)).filter(Boolean);
      const newPages = [];
      for (let i = 0; i < allCards.length; i += cardsPerPage) newPages.push(allCards.slice(i, i + cardsPerPage));
      if(newPages.length === 0) newPages.push([]); // Garante ao menos uma página vazia
      setPages(newPages);
      setIsGenerating(false);
  };

  const handleDownloadClick = async () => {
     if (pages.length === 0) return alert("Gere uma prancha primeiro!");
     await generateBoardPDF(pages, config);
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* MENU LATERAL (SÓ APARECE SE isSidebarOpen FOR TRUE) */}
      <div className={`config-panel ${isSidebarOpen ? 'open' : ''}`}>
          <div className="config-header">
              <h3>Configurações</h3>
              {/* Botão X para fechar no mobile */}
              <button className="btn-close-sidebar" onClick={toggleSidebar}>×</button>
          </div>
          
          <div className="config-body">
              {/* SEUS CAMPOS DE CONFIGURAÇÃO AQUI (Mantive resumido, copie os seus inputs) */}
              <div className="config-group">
                <label>Linhas x Colunas</label>
                <div style={{display:'flex', gap:'10px'}}>
                   <input type="number" value={config.rows} onChange={e=>handleChange('rows', parseInt(e.target.value))} />
                   <input type="number" value={config.cols} onChange={e=>handleChange('cols', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="config-group">
                  <label>Título da Prancha</label>
                  <input type="text" value={config.headerText} onChange={e=>handleChange('headerText', e.target.value)} />
              </div>
               {/* ... adicione o resto dos seus inputs aqui ... */}
               <div className="config-group">
                  <label>Cor de Fundo</label>
                  <select value={config.cellBgColor} onChange={e=>handleChange('cellBgColor', e.target.value)}>
                      {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
                  </select>
               </div>
          </div>
          
          <div className="config-footer">
               <button className="btn-print" onClick={handleDownloadClick}>Baixar PDF</button>
          </div>
      </div>

      {/* ÁREA DE PRÉVIA (OCUPA TUDO) */}
      <div className="preview-panel">
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea 
                    placeholder="Digite as palavras aqui..." 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                />
                <button onClick={handlePreview} disabled={isGenerating}>
                    {isGenerating ? 'Criando...' : 'Gerar'}
                </button>
            </div>
            <div className="zoom-controls">
                 <label>Zoom</label>
                 <input type="range" min="0.2" max="1.5" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
            </div>
        </div>

        <div className="paper-preview-container">
            {/* ... Seu código de renderização do papel (book-viewer) mantém igual ... */}
            <div className="book-viewer" style={{ transform: `scale(${zoomLevel})` }}>
                {pages.length > 0 ? pages.map((pageCards, i) => (
                    <div key={i} className={`paper-sheet ${config.paperSize} ${config.orientation}`} style={{display: i === currentPage ? 'flex' : 'none', padding: `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm` }}>
                         {/* Header do Papel */}
                         {config.header && <div className="paper-header" style={{background: config.headerBgColor}}>{config.headerText}</div>}
                         {/* Grid */}
                         <div className="paper-grid" style={{gridTemplateColumns:`repeat(${config.cols}, 1fr)`, gridTemplateRows:`repeat(${config.rows}, 1fr)`, gap:`${config.gap}px`}}>
                             {Array.from({length: config.rows * config.cols}).map((_, k) => {
                                 const card = pageCards[k];
                                 return (
                                     <div key={k} className="paper-cell" style={{background: config.cellBgColor, borderColor: config.cellBorderColor, borderWidth: config.borderWidth}}>
                                         {card && (
                                             <div className="cell-content">
                                                 {config.textPosition === 'top' && <span>{card.text}</span>}
                                                 <img src={card.image} alt="" />
                                                 {config.textPosition === 'bottom' && <span>{card.text}</span>}
                                             </div>
                                         )}
                                     </div>
                                 )
                             })}
                         </div>
                    </div>
                )) : <div className="no-pages-msg">Digite palavras acima e clique em Gerar</div>}
            </div>
        </div>
        
        {/* Paginação Flutuante */}
        {pages.length > 0 && (
            <div className="pagination-controls">
                <button onClick={()=>setCurrentPage(c => Math.max(0, c-1))} disabled={currentPage===0}>←</button>
                <span className="page-indicator">{currentPage+1} / {pages.length}</span>
                <button onClick={()=>setCurrentPage(c => Math.min(pages.length-1, c+1))} disabled={currentPage===pages.length-1}>→</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default BoardGenerator;
