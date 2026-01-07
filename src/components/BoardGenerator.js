import React, { useState } from 'react';
import './BoardGenerator.css';

// CORES OFICIAIS CAA (Com as legendas solicitadas)
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
  const [cards, setCards] = useState([]);
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
    headerBgColor: '#FFFFFF', // NOVO
    
    // Bordas e Estilo
    borderWidth: 1,
    borderStyle: 'solid',
    
    // CORES NOVAS
    cellBgColor: '#FFFFFF',     // Fundo das células
    cellBorderColor: '#000000', // Borda das células
    boardBorderColor: '#FFFFFF',// Borda da prancha
    
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

  const handleFinalize = () => {
    const finalCards = cards.map(c => ({
      ...c,
      type: 'speak',
      bgColor: config.cellBgColor, // Usa a cor configurada
      borderColor: config.cellBorderColor
    }));
    onGenerate(finalCards);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* PAINEL DE CONFIGURAÇÕES */}
      <div className="config-panel">
        <h3>🛠️ Estrutura</h3>
        <div className="config-group">
          <label>Linhas X Colunas:</label>
          <div style={{display:'flex', gap:'5px', width:'100%'}}>
             <input type="number" min="1" max="20" value={config.rows} onChange={(e) => handleChange('rows', e.target.value)} placeholder="L" />
             <span style={{alignSelf:'center'}}>X</span>
             <input type="number" min="1" max="20" value={config.cols} onChange={(e) => handleChange('cols', e.target.value)} placeholder="C" />
          </div>
        </div>

        <h3>🎨 Cores (CAA)</h3>
        
        {/* COR DO CABEÇALHO */}
        <div className="config-group">
            <label>Cor do Cabeçalho (CAA):</label>
            <select value={config.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>

        {/* COR DO FUNDO DAS CÉLULAS */}
        <div className="config-group">
            <label>Cor de Fundo das Células (CAA):</label>
            <select value={config.cellBgColor} onChange={(e) => handleChange('cellBgColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>

        {/* COR DA BORDA DAS CÉLULAS */}
        <div className="config-group">
            <label>Cor da Borda das Células (CAA):</label>
            <select value={config.cellBorderColor} onChange={(e) => handleChange('cellBorderColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>

        {/* COR DA BORDA DA PRANCHA */}
        <div className="config-group">
            <label>Cor da Borda da Prancha (CAA):</label>
            <select value={config.boardBorderColor} onChange={(e) => handleChange('boardBorderColor', e.target.value)}>
                {CAA_COLORS.map(c => <option key={c.color} value={c.color} style={{backgroundColor: c.color}}>{c.label}</option>)}
            </select>
        </div>

        <h3>⚙️ Detalhes</h3>
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
            <label>Espessura Borda:</label>
            <div style={{display:'flex', gap:'5px', width:'100%'}}>
                <input type="number" value={config.borderWidth} onChange={(e) => handleChange('borderWidth', e.target.value)} placeholder="px" />
                <select value={config.borderStyle} onChange={(e) => handleChange('borderStyle', e.target.value)}>
                    <option value="solid">Sólida</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                </select>
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
        
        <div className="preview-toolbar">
            <div className="input-area-mini">
                <textarea 
                placeholder="Digite palavras (uma por linha)..." 
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
                    // Aqui aplicamos a Borda da Prancha escolhida:
                    border: `1px solid #ddd`, // Borda suave para visualização do papel
                    transform: `translate(-50%, -50%) scale(${zoomLevel})`
                }}
            >
                {/* O CONTEÚDO AGORA TEM A BORDA DA PRANCHA APLICADA NELE */}
                <div 
                    className="paper-content-wrapper"
                    style={{
                        // Aplica a COR DA BORDA DA PRANCHA escolhida aqui:
                        border: `${config.borderWidth}px ${config.borderStyle} ${config.boardBorderColor}`
                    }}
                >
                    {config.header && (
                        <div 
                            className="paper-header" 
                            style={{ 
                                backgroundColor: config.headerBgColor,
                                borderBottom: `${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor}`
                            }}
                        >
                            {config.headerText}
                        </div>
                    )}
                    
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
                                        borderColor: config.cellBorderColor, // COR BORDA CÉLULA
                                        backgroundColor: config.cellBgColor  // COR FUNDO CÉLULA
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
