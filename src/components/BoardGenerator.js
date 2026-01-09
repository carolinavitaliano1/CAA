import React, { useState } from 'react';
import './BoardGenerator.css';
import { generateBoardPDF } from '../utils/BoardPDFGenerator';

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
  const [pages, setPages] = useState([]); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.35);
  const [currentPage, setCurrentPage] = useState(0);

  const [config, setConfig] = useState({
    rows: 4, cols: 5, gap: 2,
    header: true, headerText: 'Minha Prancha', headerBgColor: '#FFFFFF',
    cellBgColor: '#FFFFFF', cellBorderColor: '#000000', borderWidth: 1, borderStyle: 'solid', 
    boardBorderColor: '#000000', // GARANTIDO: Cor da Borda da Prancha
    paperSize: 'A4', orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    textPosition: 'bottom', fontFamily: 'Arial', fontSize: 12, 
    textCase: 'uppercase', // GARANTIDO: Maiúscula/Minúscula
  });

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsGenerating(true);
    setCurrentPage(0);

    const words = text.trim().split(/[\n\s]+/);
    const cardsPerPage = config.rows * config.cols;
    
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
    const newPages = [];
    for (let i = 0; i < allCards.length; i += cardsPerPage) {
      newPages.push(allCards.slice(i, i + cardsPerPage));
    }
    setPages(newPages);
    setIsGenerating(false);
  };

  const handleChange = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));
  
  const handleFinalize = () => {
    const allFlattenedCards = pages.flat().map(c => ({
      ...c, type: 'speak', bgColor: config.cellBgColor, borderColor: config.cellBorderColor
    }));
    onGenerate(allFlattenedCards);
  };

  const nextPage = () => { if (currentPage < pages.length - 1) setCurrentPage(prev => prev + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };

  const handleDownloadClick = async (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (pages.length === 0) {
        alert("Gere uma prancha antes de baixar.");
        return;
    }

    setIsDownloading(true);
    
    try {
        await generateBoardPDF(pages, config);
    } catch (error) {
        console.error("Erro no download:", error);
        alert("Erro ao gerar o PDF. Tente novamente.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="board-generator-wrapper">
      <div className="config-panel">
          <h3>🛠️ Estrutura</h3>
          <div className="config-group">
            <label>Linhas X Colunas:</label>
            <div style={{display:'flex', gap:'5px'}}>
                <input type="number" value={config.rows} onChange={(e)=>handleChange('rows', parseInt(e.target.value))} />
                <span>X</span>
                <input type="number" value={config.cols} onChange={(e)=>handleChange('cols', parseInt(e.target.value))} />
            </div>
          </div>
          
          <h3>🏷️ Cabeçalho</h3>
          <div className="config-group">
              <label>Mostrar Cabeçalho:</label>
              <select value={config.header} onChange={(e) => handleChange('header', e.target.value === 'true')}>
                  <option value="true">Sim, mostrar</option>
                  <option value="false">Não, esconder</option>
              </select>
          </div>
          {config.header && (
            <>
                <div className="config-group">
                    <label>Texto do Título:</label>
                    <input type="text" value={config.headerText} onChange={(e) => handleChange('headerText', e.target.value)} />
                </div>
                <div className="config-group">
                    <label>Cor de Fundo:</label>
                    <select value={config.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)}>
                        {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
                    </select>
                </div>
            </>
          )}

          <h3>🎨 Estilo</h3>
          <div className="config-group">
              <label>Fundo da Célula:</label>
              <select value={config.cellBgColor} onChange={(e) => handleChange('cellBgColor', e.target.value)}>
                  {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
              </select>
          </div>
          <div className="config-group">
              <label>Cor da Borda (Célula):</label>
              <select value={config.cellBorderColor} onChange={(e) => handleChange('cellBorderColor', e.target.value)}>
                  {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
              </select>
          </div>
          <div className="config-group">
              <label>Cor da Borda (Prancha):</label>
              <select value={config.boardBorderColor} onChange={(e) => handleChange('boardBorderColor', e.target.value)}>
                  {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
              </select>
          </div>
          <div className="config-group">
              <label>Espessura:</label>
              <input type="number" value={config.borderWidth} onChange={(e) => handleChange('borderWidth', e.target.value)} />
          </div>

          <h3>🔤 Texto</h3>
          <div className="config-group">
              <label>Posição:</label>
              <select value={config.textPosition} onChange={(e) => handleChange('textPosition', e.target.value)}>
                  <option value="bottom">Embaixo</option>
                  <option value="top">Em cima</option>
                  <option value="none">Ocultar</option>
              </select>
          </div>
          <div className="config-group">
              <label>Tamanho e Caixa:</label>
              <div style={{display:'flex', gap:'5px'}}>
                  <input type="number" value={config.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} placeholder="pt" />
                  <select value={config.textCase} onChange={(e) => handleChange('textCase', e.target.value)}>
                      <option value="uppercase">MAIÚSCULA</option>
                      <option value="lowercase">minúscula</option>
                  </select>
              </div>
          </div>
          <div className="config-group">
              <label>Fonte:</label>
              <select value={config.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Comic Sans MS">Comic Sans</option>
              </select>
          </div>

          <h3>📄 Papel</h3>
          <div className="config-group">
              <label>Formato:</label>
              <div style={{display:'flex', gap:'5px'}}>
                  <select value={config.paperSize} onChange={(e) => handleChange('paperSize', e.target.value)}>
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                  </select>
                  <select value={config.orientation} onChange={(e) => handleChange('orientation', e.target.value)}>
                      <option value="landscape">Deitado</option>
                      <option value="portrait">Em Pé</option>
                  </select>
              </div>
          </div>
          <div className="config-group">
              <label>Margens (cm):</label>
              <div className="margins-grid">
                  <input title="Cima" type="number" step="0.5" value={config.marginTop} onChange={(e) => handleChange('marginTop', e.target.value)} />
                  <input title="Direita" type="number" step="0.5" value={config.marginRight} onChange={(e) => handleChange('marginRight', e.target.value)} />
                  <input title="Baixo" type="number" step="0.5" value={config.marginBottom} onChange={(e) => handleChange('marginBottom', e.target.value)} />
                  <input title="Esquerda" type="number" step="0.5" value={config.marginLeft} onChange={(e) => handleChange('marginLeft', e.target.value)} />
              </div>
          </div>
      </div>

      <div className="preview-panel">
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea placeholder="Texto..." value={text} onChange={(e) => setText(e.target.value)} />
                <button onClick={handlePreview} disabled={isGenerating}>Atualizar</button>
            </div>
            <div className="zoom-controls">
                 <label>🔍</label>
                 <input type="range" min="0.2" max="1.5" step="0.05" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
            </div>
        </div>

        <div className="paper-preview-container">
            <div className="book-viewer">
                {pages.length > 0 ? pages.map((pageCards, pageIdx) => (
                    <div 
                        key={pageIdx}
                        className={`paper-sheet ${config.paperSize} ${config.orientation} ${pageIdx !== currentPage ? 'hidden-page' : ''}`}
                        style={{
                            padding: `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm`,
                            transform: `scale(${zoomLevel})`
                        }}
                    >
                        <div className="paper-content-wrapper" style={{ border: `${config.borderWidth}px ${config.borderStyle} ${config.boardBorderColor}` }}>
                            {config.header && (
                                <div className="paper-header" style={{ backgroundColor: config.headerBgColor, borderBottom: `${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor}` }}>
                                    {config.headerText}
                                </div>
                            )}
                            <div className="paper-grid" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)`, gridTemplateRows: `repeat(${config.rows}, 1fr)`, gap: `${config.gap}px` }}>
                                {Array.from({ length: config.rows * config.cols }).map((_, i) => {
                                    const card = pageCards[i];
                                    return (
                                        <div key={i} className="paper-cell" style={{ borderWidth: `${config.borderWidth}px`, borderStyle: config.borderStyle, borderColor: config.cellBorderColor, backgroundColor: config.cellBgColor }}>
                                            {card ? (
                                                <div className={`cell-content ${config.textPosition}`}>
                                                    {config.textPosition === 'top' && <span style={{ fontFamily: config.fontFamily, fontSize: `${config.fontSize}pt`, textTransform: config.textCase }}>{card.text}</span>}
                                                    <img src={card.image} alt="" style={{ maxWidth: '100%', maxHeight: config.textPosition === 'none' ? '100%' : '70%', objectFit: 'contain' }} />
                                                    {config.textPosition === 'bottom' && <span style={{ fontFamily: config.fontFamily, fontSize: `${config.fontSize}pt`, textTransform: config.textCase }}>{card.text}</span>}
                                                </div>
                                            ) : <div className="empty-slot"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="paper-footer">
                            Gerado via NeuroCAA - <a href="#">Conheça a plataforma</a>
                        </div>
                    </div>
                )) : <div className="no-pages-msg">Digite palavras e clique em Atualizar</div>}
            </div>

            {pages.length > 0 && (
                <div className="pagination-controls">
                    <button onClick={prevPage} disabled={currentPage === 0}>⬅</button>
                    <span className="page-indicator">Pág {currentPage + 1} / {pages.length}</span>
                    <button onClick={nextPage} disabled={currentPage === pages.length - 1}>➡</button>
                </div>
            )}
        </div>

        <div className="action-buttons-row">
            <button 
                className="btn-print" 
                type="button" 
                onClick={handleDownloadClick} 
                disabled={pages.length === 0 || isDownloading}
            >
                {isDownloading ? '⏳ Gerando Arquivo...' : '📥 Baixar PDF'}
            </button>
            <button className="btn-finalize" onClick={handleFinalize} disabled={pages.length === 0}>✅ Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerator;
