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
  const [pages, setPages] = useState([]); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.35);

  const [config, setConfig] = useState({
    // Estrutura
    rows: 4,
    cols: 5,
    gap: 2,
    
    // Cabeçalho
    header: true,
    headerText: 'Minha Prancha',
    headerBgColor: '#FFFFFF',
    
    // Estilo Célula
    cellBgColor: '#FFFFFF',
    cellBorderColor: '#000000',
    borderWidth: 1,
    borderStyle: 'solid',
    boardBorderColor: '#000000',
    
    // Papel
    paperSize: 'A4',
    orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    
    // Texto
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

    // Paginação
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
      
      {/* --- MENU DE CONFIGURAÇÃO --- */}
      <div className="config-panel">
        
        {/* 1. ESTRUTURA */}
        <h3>🛠️ Estrutura</h3>
        <div className="config-group">
          <label>Linhas X Colunas (p/ pág):</label>
          <div style={{display:'flex', gap:'5px', width:'100%'}}>
             <input type="number" value={config.rows} onChange={(e) => handleChange('rows', parseInt(e.target.value))} />
             <span style={{alignSelf:'center', fontWeight:'bold'}}>X</span>
             <input type="number" value={config.cols} onChange={(e) => handleChange('cols', parseInt(e.target.value))} />
          </div>
        </div>

        {/* 2. CABEÇALHO (Aqui estão as opções que sumiram!) */}
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
                    <input 
                        type="text" 
                        value={config.headerText} 
                        onChange={(e) => handleChange('headerText', e.target.value)} 
                        placeholder="Ex: Rotina da Manhã"
                    />
                </div>
                <div className="config-group">
                    <label>Cor de Fundo (Título):</label>
                    <select value={config.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)}>
                        {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
                    </select>
                </div>
            </>
        )}

        {/* 3. CORES E ESTILO */}
        <h3>🎨 Células e Bordas</h3>
        <div className="config-group">
            <label>Fundo da Célula:</label>
            <select value={config.cellBgColor} onChange={(e) => handleChange('cellBgColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>
        <div className="config-group">
            <label>Cor da Borda:</label>
            <select value={config.cellBorderColor} onChange={(e) => handleChange('cellBorderColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>
        <div className="config-group">
            <label>Espessura / Estilo:</label>
            <div style={{display:'flex', gap:'5px'}}>
                <input type="number" value={config.borderWidth} onChange={(e) => handleChange('borderWidth', e.target.value)} placeholder="px" />
                <select value={config.borderStyle} onChange={(e) => handleChange('borderStyle', e.target.value)}>
                    <option value="solid">Sólida</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                </select>
            </div>
        </div>

        {/* 4. TEXTO (Opções recuperadas!) */}
        <h3>🔤 Texto dos Cartões</h3>
        <div className="config-group">
            <label>Posição:</label>
            <select value={config.textPosition} onChange={(e) => handleChange('textPosition', e.target.value)}>
                <option value="bottom">Embaixo da Imagem</option>
                <option value="top">Em cima da Imagem</option>
                <option value="none">Sem texto (Só imagem)</option>
            </select>
        </div>
        <div className="config-group">
            <label>Tamanho e Caixa:</label>
            <div style={{display:'flex', gap:'5px'}}>
                <input 
                    type="number" 
                    value={config.fontSize} 
                    onChange={(e) => handleChange('fontSize', e.target.value)} 
                    placeholder="Tam"
                    title="Tamanho da fonte"
                />
                <select value={config.textCase} onChange={(e) => handleChange('textCase', e.target.value)}>
                    <option value="uppercase">ABC (Maiúsculas)</option>
                    <option value="lowercase">abc (Minúsculas)</option>
                </select>
            </div>
        </div>
        <div className="config-group">
            <label>Fonte:</label>
            <select value={config.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans</option>
            </select>
        </div>

        {/* 5. PAPEL */}
        <h3>📄 Papel e Margens</h3>
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
            <label>Margens (cm) [Cima-Dir-Baixo-Esq]:</label>
            <div className="margins-grid">
                <input title="Cima" type="number" step="0.5" value={config.marginTop} onChange={(e) => handleChange('marginTop', e.target.value)} />
                <input title="Direita" type="number" step="0.5" value={config.marginRight} onChange={(e) => handleChange('marginRight', e.target.value)} />
                <input title="Baixo" type="number" step="0.5" value={config.marginBottom} onChange={(e) => handleChange('marginBottom', e.target.value)} />
                <input title="Esquerda" type="number" step="0.5" value={config.marginLeft} onChange={(e) => handleChange('marginLeft', e.target.value)} />
            </div>
        </div>

      </div>

      {/* --- ÁREA DE VISUALIZAÇÃO --- */}
      <div className="preview-panel">
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea 
                    placeholder="Cole sua lista de palavras ou texto longo aqui..." 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                />
                <button onClick={handlePreview} disabled={isGenerating}>
                    {isGenerating ? '⏳ Gerando...' : '🔄 Atualizar'}
                </button>
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
                            marginBottom: '50px'
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
                    </div>
                )) : <div className="no-pages-msg">Digite palavras e clique em Atualizar</div>}
            </div>
        </div>

        <div className="action-buttons-row">
            <button className="btn-print" onClick={() => window.print()}>🖨️ Imprimir Tudo / PDF</button>
            <button className="btn-finalize" onClick={handleFinalize} disabled={pages.length === 0}>✅ Salvar no App</button>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerator;
