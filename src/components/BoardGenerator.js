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

const BoardGenerator = ({ isSidebarOpen, toggleSidebar }) => {
  const [text, setText] = useState("");
  const [pages, setPages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [currentPage, setCurrentPage] = useState(0);

  const [config, setConfig] = useState({
    rows: 4, cols: 5, gap: 2,
    header: true, headerText: 'Minha Prancha', headerBgColor: '#FFFFFF',
    cellBgColor: '#FFFFFF', cellBorderColor: '#000000', borderWidth: 1, borderStyle: 'solid',
    paperSize: 'A4', orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    textPosition: 'bottom',
    fontFamily: 'Arial', // Fonte padrão
    fontSize: 12,
    textCase: 'uppercase'
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setCurrentPage(0);
    const words = text.trim().split(/[\n\s]+/);
    const cardsPerPage = config.rows * config.cols;

    const allCardsPromises = words.map(async (word) => {
      if (!word) return null;
      try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) 
          ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` 
          : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
        return { id: Math.random(), text: word, image: img };
      } catch (err) {
        return { id: Math.random(), text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' };
      }
    });

    const allCards = (await Promise.all(allCardsPromises)).filter(Boolean);
    const newPages = [];
    for (let i = 0; i < allCards.length; i += cardsPerPage) {
      newPages.push(allCards.slice(i, i + cardsPerPage));
    }
    if (newPages.length === 0) newPages.push([]);
    setPages(newPages);
    setIsGenerating(false);
  };

  const handleDownloadClick = async () => {
    if (pages.length === 0) return alert("Gere uma prancha primeiro!");
    await generateBoardPDF(pages, config);
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* MENU LATERAL */}
      <div className={`config-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div className="config-header">
          <h3>⚙️ Configuração</h3>
          <button className="btn-close-sidebar" onClick={toggleSidebar}>×</button>
        </div>

        <div className="config-body">
          
          {/* GRUPO 1: ESTRUTURA */}
          <div className="config-card">
            <div className="config-card-header">Estrutura (Linhas x Colunas)</div>
            <div className="config-card-content">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="number" value={config.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} placeholder="Linhas" />
                <span>X</span>
                <input type="number" value={config.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} placeholder="Cols" />
              </div>
            </div>
          </div>

          {/* GRUPO 2: CABEÇALHO */}
          <div className="config-card">
            <div className="config-card-header">Cabeçalho</div>
            <div className="config-card-content">
              <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                <input type="checkbox" checked={config.header} onChange={e => handleChange('header', e.target.checked)} />
                Mostrar Título
              </label>
              {config.header && (
                <input type="text" value={config.headerText} onChange={e => handleChange('headerText', e.target.value)} placeholder="Título..." style={{marginTop: '10px'}} />
              )}
            </div>
          </div>

          {/* GRUPO 3: TEXTO & FONTE (AQUI ESTÁ A CORREÇÃO DA FONTE) */}
          <div className="config-card">
            <div className="config-card-header">Texto e Fonte</div>
            <div className="config-card-content">
              <label>Posição do Texto</label>
              <select value={config.textPosition} onChange={e => handleChange('textPosition', e.target.value)}>
                <option value="bottom">Embaixo</option>
                <option value="top">Em cima</option>
              </select>

              <label style={{marginTop: '10px'}}>Tipo de Fonte</label>
              <select value={config.fontFamily} onChange={e => handleChange('fontFamily', e.target.value)}>
                <option value="Arial">Arial (Padrão)</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
              </select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div style={{flex:1}}>
                  <label>Tamanho</label>
                  <input type="number" value={config.fontSize} onChange={e => handleChange('fontSize', parseInt(e.target.value))} />
                </div>
                <div style={{flex:1}}>
                  <label>Estilo</label>
                  <select value={config.textCase} onChange={e => handleChange('textCase', e.target.value)}>
                    <option value="uppercase">MAIÚSCULA</option>
                    <option value="capitalize">Normal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* GRUPO 4: CORES */}
          <div className="config-card">
            <div className="config-card-header">Cores</div>
            <div className="config-card-content">
              <label>Fundo do Cabeçalho</label>
              <select value={config.headerBgColor} onChange={e => handleChange('headerBgColor', e.target.value)}>
                 {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
              </select>
              
              <label style={{marginTop:'10px'}}>Fundo da Célula</label>
              <select value={config.cellBgColor} onChange={e => handleChange('cellBgColor', e.target.value)}>
                 {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
              </select>

              <label style={{marginTop:'10px'}}>Cor da Borda</label>
              <select value={config.cellBorderColor} onChange={e => handleChange('cellBorderColor', e.target.value)}>
                 <option value="#000000">Preto</option>
                 {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* GRUPO 5: PAPEL */}
          <div className="config-card">
            <div className="config-card-header">Papel e Margens</div>
            <div className="config-card-content">
              <div style={{display:'flex', gap:'10px'}}>
                <select value={config.paperSize} onChange={e => handleChange('paperSize', e.target.value)}>
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                </select>
                <select value={config.orientation} onChange={e => handleChange('orientation', e.target.value)}>
                  <option value="landscape">Paisagem</option>
                  <option value="portrait">Retrato</option>
                </select>
              </div>
              
              <label style={{marginTop:'10px', fontSize:'0.75rem'}}>Margens (cm): Top | Dir | Base | Esq</label>
              <div className="margins-grid">
                <input type="number" step="0.5" value={config.marginTop} onChange={e => handleChange('marginTop', parseFloat(e.target.value))} />
                <input type="number" step="0.5" value={config.marginRight} onChange={e => handleChange('marginRight', parseFloat(e.target.value))} />
                <input type="number" step="0.5" value={config.marginBottom} onChange={e => handleChange('marginBottom', parseFloat(e.target.value))} />
                <input type="number" step="0.5" value={config.marginLeft} onChange={e => handleChange('marginLeft', parseFloat(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO COM O BOTÃO DE SALVAR */}
        <div className="config-footer">
          <button className="btn-print" onClick={handleDownloadClick}>
            💾 Baixar PDF
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÉVIA */}
      <div className="preview-panel">
        <div className="preview-toolbar">
          <div className="input-area-mini">
            <textarea placeholder="Digite as palavras aqui..." value={text} onChange={(e) => setText(e.target.value)} />
            <button onClick={handlePreview} disabled={isGenerating}>{isGenerating ? '...' : 'Gerar'}</button>
          </div>
          <div className="zoom-controls">
            <label>🔍</label>
            <input type="range" min="0.3" max="1.5" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="paper-preview-container">
          <div className="book-viewer" style={{ transform: `scale(${zoomLevel})` }}>
            {pages.length > 0 ? pages.map((pageCards, i) => (
              <div key={i} className={`paper-sheet ${config.paperSize} ${config.orientation} ${i !== currentPage ? 'hidden-page' : ''}`}
                style={{ padding: `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm` }}>
                
                {config.header && <div className="paper-header" style={{ backgroundColor: config.headerBgColor, fontFamily: config.fontFamily }}>{config.headerText}</div>}
                
                <div className="paper-grid" style={{
                     gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                     gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                     gap: `${config.gap}px`
                   }}>
                  {Array.from({ length: config.rows * config.cols }).map((_, k) => {
                    const card = pageCards[k];
                    return (
                      <div key={k} className="paper-cell" style={{
                          backgroundColor: config.cellBgColor,
                          borderColor: config.cellBorderColor,
                          borderWidth: `${config.borderWidth}px`,
                          borderStyle: config.borderStyle
                        }}>
                        {card && (
                          <div className={`cell-content ${config.textPosition}`}>
                             {config.textPosition === 'top' && <span style={{fontFamily: config.fontFamily, fontSize: `${config.fontSize}pt`, textTransform: config.textCase}}>{card.text}</span>}
                             <img src={card.image} alt={card.text} />
                             {config.textPosition === 'bottom' && <span style={{fontFamily: config.fontFamily, fontSize: `${config.fontSize}pt`, textTransform: config.textCase}}>{card.text}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="paper-footer">Página {i + 1} de {pages.length}</div>
              </div>
            )) : (
              <div className="no-pages-msg">
                <h3>Sua prancha aparecerá aqui</h3>
                <p>Use o menu lateral para configurar</p>
              </div>
            )}
          </div>
        </div>
        
        {pages.length > 0 && (
          <div className="pagination-controls">
            <button onClick={() => setCurrentPage(c => Math.max(0, c - 1))} disabled={currentPage === 0}>←</button>
            <span>{currentPage + 1} / {pages.length}</span>
            <button onClick={() => setCurrentPage(c => Math.min(pages.length - 1, c + 1))} disabled={currentPage === pages.length - 1}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardGenerator;
