import React, { useState, useEffect } from 'react';
import './BoardGenerator.css';

const BoardGenerator = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [cards, setCards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.35); // Zoom inicial

  const [config, setConfig] = useState({
    rows: 4,
    cols: 5,
    header: true,
    headerText: 'Minha Prancha',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000000',
    paperSize: 'A4',
    orientation: 'landscape',
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    cellHeight: 'auto',
    textPosition: 'bottom',
    fontFamily: 'Arial',
    fontSize: 12,
    textCase: 'uppercase',
    gap: 2
  });

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsGenerating(true);
    const words = text.trim().split(/[\n\s]+/);
    const maxCards = config.rows * config.cols;
    const wordsToProcess = words.slice(0, maxCards);

    const promises = wordsToProcess.map(async (word) => {
      try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
        return { id: `gen_${Date.now()}_${Math.random()}`, text: word, image: img };
      } catch (err) {
        return { id: `err`, text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' };
      }
    });

    const results = await Promise.all(promises);
    setCards(results);
    setIsGenerating(false);
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Salva no App (Grid Digital)
  const handleFinalize = () => {
    const finalCards = cards.map(c => ({
      ...c,
      type: 'speak',
      bgColor: '#FFFFFF',
      borderColor: config.borderColor
    }));
    onGenerate(finalCards);
  };

  // Imprime ou Salva PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* PAINEL DE CONFIGURAÇÕES */}
      <div className="config-panel">
        <h3>🛠️ Configuração</h3>
        
        <div className="config-group">
          <label>Linhas X Colunas:</label>
          <div style={{display:'flex', gap:'5px', width:'100%'}}>
             <input type="number" min="1" max="20" value={config.rows} onChange={(e) => handleChange('rows', e.target.value)} placeholder="L" />
             <span style={{alignSelf:'center'}}>X</span>
             <input type="number" min="1" max="20" value={config.cols} onChange={(e) => handleChange('cols', e.target.value)} placeholder="C" />
          </div>
        </div>

        <div className="config-group">
            <label>Cabeçalho:</label>
            <select value={config.header} onChange={(e) => handleChange('header', e.target.value === 'true')}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
            </select>
            {config.header && (
              <input type="text" value={config.headerText} onChange={(e) => handleChange('headerText', e.target.value)} placeholder="Título" />
            )}
        </div>

        <div className="config-group">
            <label>Bordas:</label>
            <div style={{display:'flex', gap:'5px', width:'100%'}}>
                <input type="number" value={config.borderWidth} onChange={(e) => handleChange('borderWidth', e.target.value)} />
                <select value={config.borderStyle} onChange={(e) => handleChange('borderStyle', e.target.value)}>
                    <option value="solid">Sólida</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                </select>
                <input type="color" value={config.borderColor} onChange={(e) => handleChange('borderColor', e.target.value)} style={{width:'40px', padding:'0', height:'38px'}} />
            </div>
        </div>

        <h3>📄 Papel</h3>
        <div className="config-group">
            <label>Formato:</label>
            <select value={config.paperSize} onChange={(e) => handleChange('paperSize', e.target.value)}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="A5">A5</option>
            </select>
            <select value={config.orientation} onChange={(e) => handleChange('orientation', e.target.value)}>
                <option value="landscape">Horizontal</option>
                <option value="portrait">Vertical</option>
            </select>
        </div>

        <div className="config-group">
            <label>Margens (cm):</label>
            <div className="margins-grid">
                <input placeholder="Sup" type="number" step="0.5" value={config.marginTop} onChange={(e) => handleChange('marginTop', e.target.value)} />
                <input placeholder="Inf" type="number" step="0.5" value={config.marginBottom} onChange={(e) => handleChange('marginBottom', e.target.value)} />
                <input placeholder="Esq" type="number" step="0.5" value={config.marginLeft} onChange={(e) => handleChange('marginLeft', e.target.value)} />
                <input placeholder="Dir" type="number" step="0.5" value={config.marginRight} onChange={(e) => handleChange('marginRight', e.target.value)} />
            </div>
        </div>

        <h3>🔤 Texto</h3>
        <div className="config-group">
            <label>Estilo:</label>
            <select value={config.textPosition} onChange={(e) => handleChange('textPosition', e.target.value)} style={{marginBottom: '5px'}}>
                <option value="bottom">Abaixo</option>
                <option value="top">Acima</option>
                <option value="none">Ocultar</option>
            </select>
            <div style={{display:'flex', gap:'5px'}}>
                <input type="number" value={config.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} placeholder="Tam" />
                <select value={config.textCase} onChange={(e) => handleChange('textCase', e.target.value)}>
                    <option value="uppercase">ABC</option>
                    <option value="lowercase">abc</option>
                </select>
            </div>
        </div>
      </div>

      {/* ÁREA DE PRÉVIA */}
      <div className="preview-panel">
        
        {/* BARRA DE FERRAMENTAS */}
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea 
                placeholder="Digite palavras..." 
                value={text}
                onChange={(e) => setText(e.target.value)}
                />
                <button onClick={handlePreview} disabled={isGenerating}>
                    {isGenerating ? '⏳' : 'Atualizar'}
                </button>
            </div>
            
            <div className="zoom-controls">
                <label>🔍 Zoom: {Math.round(zoomLevel * 100)}%</label>
                <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05" 
                    value={zoomLevel} 
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))} 
                />
            </div>
        </div>

        <div className="paper-preview-container">
            {/* A FOLHA DE PAPEL */}
            <div 
                className={`paper-sheet ${config.paperSize} ${config.orientation}`}
                style={{
                    paddingTop: `${config.marginTop}cm`,
                    paddingBottom: `${config.marginBottom}cm`,
                    paddingLeft: `${config.marginLeft}cm`,
                    paddingRight: `${config.marginRight}cm`,
                    transform: `translate(-50%, -50%) scale(${zoomLevel})`
                }}
            >
                <div className="paper-content-wrapper">
                    {config.header && <div className="paper-header">{config.headerText}</div>}
                    
                    <div 
                        className="paper-grid"
                        style={{
                            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                            gap: `${config.gap}px`
                        }}
                    >
                        {Array.from({ length: config.rows * config.cols }).map((_, i) => {
                            const card = cards[i];
                            return (
                                <div 
                                    key={i} 
                                    className="paper-cell"
                                    style={{
                                        borderWidth: `${config.borderWidth}px`,
                                        borderStyle: config.borderStyle,
                                        borderColor: config.borderColor
                                    }}
                                >
                                    {card ? (
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
                                    ) : <div className="empty-slot"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* ÁREA DE BOTÕES FINAIS */}
        <div className="action-buttons-row">
            <button className="btn-print" onClick={handlePrint}>
                🖨️ Imprimir / PDF
            </button>
            <button className="btn-finalize" onClick={handleFinalize} disabled={cards.length === 0}>
                ✅ Salvar no App
            </button>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerator;
