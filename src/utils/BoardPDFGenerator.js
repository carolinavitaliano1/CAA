import React, { useState } from 'react';
import './BoardGenerator.css';
// IMPORTA A NOVA FUNÇÃO
import { generateBoardPDF } from '../utils/BoardPDFGenerator';

// ... (Mantenha a constante CAA_COLORS igual) ...
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
  // ... (Mantenha os states iguais) ...
  const [text, setText] = useState("");
  const [pages, setPages] = useState([]); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.35);
  const [currentPage, setCurrentPage] = useState(0);

  const [config, setConfig] = useState({
    rows: 4, cols: 5, gap: 2,
    header: true, headerText: 'Minha Prancha', headerBgColor: '#FFFFFF',
    cellBgColor: '#FFFFFF', cellBorderColor: '#000000', borderWidth: 1, borderStyle: 'solid', boardBorderColor: '#000000',
    paperSize: 'A4', orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    textPosition: 'bottom', fontFamily: 'Arial', fontSize: 12, textCase: 'uppercase',
  });

  // ... (Mantenha handlePreview, handleChange, handleFinalize, next/prevPage iguais) ...
  const handlePreview = async (e) => { /* ...seu código atual... */
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
  const handleFinalize = () => { /* ...seu código atual... */ };
  const nextPage = () => { if (currentPage < pages.length - 1) setCurrentPage(prev => prev + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };


  // --- AQUI A NOVA CHAMADA SIMPLIFICADA ---
  const handleDownloadClick = async () => {
      setIsDownloading(true);
      // Chama a função externa passando os dados e configurações
      await generateBoardPDF(pages, config);
      setIsDownloading(false);
  };

  return (
    <div className="board-generator-wrapper">
      {/* ... (Todo o seu JSX do Menu Lateral e Toolbar continua igual) ... */}
      <div className="config-panel">
         {/* ...inputs... */}
         {/* (Vou abreviar aqui para não ficar gigante, mantenha o seu JSX do menu) */}
          <h3>🛠️ Estrutura</h3>
          <div className="config-group">
            <label>Linhas X Colunas:</label>
            <div style={{display:'flex', gap:'5px'}}>
                <input type="number" value={config.rows} onChange={(e)=>handleChange('rows', parseInt(e.target.value))} />
                <span>X</span>
                <input type="number" value={config.cols} onChange={(e)=>handleChange('cols', parseInt(e.target.value))} />
            </div>
          </div>
          {/* ...etc (todas as configs)... */}
      </div>

      <div className="preview-panel">
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea placeholder="Texto..." value={text} onChange={(e) => setText(e.target.value)} />
                <button onClick={handlePreview} disabled={isGenerating}>Actualizar</button>
            </div>
            <div className="zoom-controls">
                 <input type="range" min="0.2" max="1.5" step="0.05" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
            </div>
        </div>

        {/* ÁREA DE VISUALIZAÇÃO (Sem lógica de exportação misturada) */}
        <div className="paper-preview-container">
            <div className="book-viewer">
                {pages.length > 0 ? pages.map((pageCards, pageIdx) => (
                    <div 
                        key={pageIdx}
                        // SÓ MOSTRA A PÁGINA ATUAL NA TELA
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
                                                    <img src={card.image} alt="" />
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

            {/* Navegação */}
            {pages.length > 0 && (
                <div className="pagination-controls">
                    <button onClick={prevPage} disabled={currentPage === 0}>⬅</button>
                    <span className="page-indicator">Pág {currentPage + 1} / {pages.length}</span>
                    <button onClick={nextPage} disabled={currentPage === pages.length - 1}>➡</button>
                </div>
            )}
        </div>

        <div className="action-buttons-row">
            {/* O BOTÃO AGORA CHAMA O GERADOR EXTERNO */}
            <button className="btn-print" onClick={handleDownloadClick} disabled={pages.length === 0 || isDownloading}>
                {isDownloading ? '⏳ Gerando...' : '📥 Baixar PDF'}
            </button>
            <button className="btn-finalize" onClick={handleFinalize} disabled={pages.length === 0}>✅ Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerator;
