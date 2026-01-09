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

  // --- TODAS AS CONFIGURAÇÕES RESTAURADAS ---
  const [config, setConfig] = useState({
    rows: 4,
    cols: 5,
    gap: 2, // Espaço entre células
    header: true,
    headerText: 'Minha Prancha',
    headerBgColor: '#FFFFFF',
    cellBgColor: '#FFFFFF',
    cellBorderColor: '#000000',
    borderWidth: 1,
    borderStyle: 'solid',
    boardBorderColor: '#000000',
    paperSize: 'A4',
    orientation: 'landscape',
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    textPosition: 'bottom', // 'top' ou 'bottom'
    fontFamily: 'Arial',
    fontSize: 12,
    textCase: 'uppercase' // 'uppercase' ou 'capitalize'
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Lógica de Prévia (Busca no Arasaac)
  const handlePreview = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setCurrentPage(0);

    const words = text.trim().split(/[\n\s]+/); // Quebra por espaços ou nova linha
    const cardsPerPage = config.rows * config.cols;

    // Busca imagens para cada palavra
    const allCardsPromises = words.map(async (word) => {
      if (!word) return null;
      try {
        // Tenta buscar no ARASAAC
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) 
          ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` 
          : 'https://static.arasaac.org/pictograms/2475/2475_500.png'; // Imagem padrão se falhar
        
        return { id: Math.random(), text: word, image: img };
      } catch (err) {
        return { id: Math.random(), text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' };
      }
    });

    const allCards = (await Promise.all(allCardsPromises)).filter(Boolean);

    // Paginação
    const newPages = [];
    for (let i = 0; i < allCards.length; i += cardsPerPage) {
      newPages.push(allCards.slice(i, i + cardsPerPage));
    }
    if (newPages.length === 0) newPages.push([]); // Garante ao menos 1 página

    setPages(newPages);
    setIsGenerating(false);
  };

  const handleDownloadClick = async () => {
    if (pages.length === 0) return alert("Gere uma prancha primeiro!");
    await generateBoardPDF(pages, config);
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* MENU LATERAL COM TODAS AS OPÇÕES */}
      <div className={`config-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div className="config-header">
          <h3>⚙️ Configuração</h3>
          {/* Botão X aparece só no celular */}
          <button className="btn-close-sidebar" onClick={toggleSidebar}>×</button>
        </div>

        <div className="config-body">
          {/* 1. ESTRUTURA */}
          <div className="config-group">
            <label>Estrutura (Linhas x Colunas)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" placeholder="Linhas" 
                value={config.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} 
              />
              <span style={{alignSelf:'center'}}>X</span>
              <input 
                type="number" placeholder="Colunas" 
                value={config.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} 
              />
            </div>
          </div>

          {/* 2. CABEÇALHO */}
          <div className="config-group">
            <label>Cabeçalho</label>
            <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'5px'}}>
               <input 
                 type="checkbox" style={{width:'auto'}}
                 checked={config.header} onChange={e => handleChange('header', e.target.checked)} 
               /> Mostrar Cabeçalho
            </div>
            {config.header && (
              <input 
                type="text" placeholder="Título da Prancha" 
                value={config.headerText} onChange={e => handleChange('headerText', e.target.value)} 
              />
            )}
          </div>

          {/* 3. CORES */}
          <div className="config-group">
            <label>Cores</label>
            <div style={{marginBottom:'5px'}}>Fundo Cabeçalho:</div>
            <select value={config.headerBgColor} onChange={e => handleChange('headerBgColor', e.target.value)}>
               {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
            </select>
            
            <div style={{margin:'5px 0'}}>Fundo Célula:</div>
            <select value={config.cellBgColor} onChange={e => handleChange('cellBgColor', e.target.value)}>
               {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
            </select>

            <div style={{margin:'5px 0'}}>Borda Célula:</div>
            <select value={config.cellBorderColor} onChange={e => handleChange('cellBorderColor', e.target.value)}>
               <option value="#000000">Preto</option>
               {CAA_COLORS.map(c => <option key={c.color} value={c.color}>{c.label}</option>)}
            </select>
          </div>

          {/* 4. TEXTO */}
          <div className="config-group">
            <label>Texto</label>
            <select value={config.textPosition} onChange={e => handleChange('textPosition', e.target.value)}>
              <option value="bottom">Embaixo da Imagem</option>
              <option value="top">Em cima da Imagem</option>
            </select>
            <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
               <select value={config.textCase} onChange={e => handleChange('textCase', e.target.value)}>
                 <option value="uppercase">MAIÚSCULA</option>
                 <option value="capitalize">Normal</option>
               </select>
               <input 
                 type="number" title="Tamanho Fonte"
                 value={config.fontSize} onChange={e => handleChange('fontSize', parseInt(e.target.value))} 
               />
            </div>
          </div>

          {/* 5. PAPEL E MARGENS */}
          <div className="config-group">
            <label>Papel</label>
            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
              <select value={config.paperSize} onChange={e => handleChange('paperSize', e.target.value)}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
              <select value={config.orientation} onChange={e => handleChange('orientation', e.target.value)}>
                <option value="landscape">Deitado (Paisagem)</option>
                <option value="portrait">Em Pé (Retrato)</option>
              </select>
            </div>
            
            <label style={{fontSize:'0.7rem'}}>Margens (cm): Topo | Dir | Baixo | Esq</label>
            <div className="margins-grid">
              <input type="number" step="0.1" value={config.marginTop} onChange={e => handleChange('marginTop', parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={config.marginRight} onChange={e => handleChange('marginRight', parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={config.marginBottom} onChange={e => handleChange('marginBottom', parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={config.marginLeft} onChange={e => handleChange('marginLeft', parseFloat(e.target.value))} />
            </div>
          </div>

        </div>

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
            <textarea 
              placeholder="Digite as palavras aqui (ex: eu quero água)..." 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
            />
            <button onClick={handlePreview} disabled={isGenerating}>
              {isGenerating ? '⏳...' : 'Gerar'}
            </button>
          </div>
          <div className="zoom-controls">
            <label>🔍</label>
            <input 
              type="range" min="0.3" max="1.5" step="0.1" 
              value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} 
            />
          </div>
        </div>

        <div className="paper-preview-container">
          <div className="book-viewer" style={{ transform: `scale(${zoomLevel})` }}>
            {pages.length > 0 ? pages.map((pageCards, i) => (
              <div 
                key={i} 
                className={`paper-sheet ${config.paperSize} ${config.orientation} ${i !== currentPage ? 'hidden-page' : ''}`}
                style={{
                   padding: `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm`
                }}
              >
                {/* Cabeçalho Visual */}
                {config.header && (
                  <div className="paper-header" style={{ backgroundColor: config.headerBgColor }}>
                    {config.headerText}
                  </div>
                )}
                
                {/* Grid Visual */}
                <div 
                   className="paper-grid" 
                   style={{
                     gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                     gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                     gap: `${config.gap}px`
                   }}
                >
                  {/* Preenche com cartões ou vazio */}
                  {Array.from({ length: config.rows * config.cols }).map((_, k) => {
                    const card = pageCards[k];
                    return (
                      <div 
                        key={k} 
                        className="paper-cell"
                        style={{
                          backgroundColor: config.cellBgColor,
                          borderColor: config.cellBorderColor,
                          borderWidth: `${config.borderWidth}px`,
                          borderStyle: config.borderStyle
                        }}
                      >
                        {card && (
                          <div className={`cell-content ${config.textPosition}`}>
                             {config.textPosition === 'top' && (
                               <span style={{
                                 fontFamily: config.fontFamily, 
                                 fontSize: `${config.fontSize}pt`,
                                 textTransform: config.textCase
                               }}>{card.text}</span>
                             )}
                             
                             <img src={card.image} alt={card.text} />
                             
                             {config.textPosition === 'bottom' && (
                               <span style={{
                                 fontFamily: config.fontFamily, 
                                 fontSize: `${config.fontSize}pt`,
                                 textTransform: config.textCase
                               }}>{card.text}</span>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="paper-footer">
                   Página {i + 1} de {pages.length} - Gerado por NeuroCAA
                </div>
              </div>
            )) : (
              <div className="no-pages-msg">
                <h3>Sua prancha aparecerá aqui</h3>
                <p>1. Configure ao lado (Linhas, Cores, Papel)</p>
                <p>2. Digite as palavras acima</p>
                <p>3. Clique em <strong>Gerar</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* Paginação */}
        {pages.length > 0 && (
          <div className="pagination-controls">
            <button onClick={() => setCurrentPage(c => Math.max(0, c - 1))} disabled={currentPage === 0}>←</button>
            <span style={{fontWeight:'bold'}}>{currentPage + 1} / {pages.length}</span>
            <button onClick={() => setCurrentPage(c => Math.min(pages.length - 1, c + 1))} disabled={currentPage === pages.length - 1}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardGenerator;
