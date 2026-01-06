import React, { useState, useEffect } from 'react';
import './BoardGenerator.css';

const BoardGenerator = ({ onGenerate }) => {
  // --- ESTADOS DE CONFIGURAÇÃO ---
  const [text, setText] = useState("");
  const [cards, setCards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Configurações inspiradas no ARASAAC
  const [config, setConfig] = useState({
    rows: 3,
    cols: 4,
    header: false,
    borderWidth: 1,
    borderStyle: 'solid', // solid, dotted, dashed
    paperSize: 'A4', // A4, A3, A5
    orientation: 'landscape', // portrait, landscape
    marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1,
    cellHeight: 'auto',
    textPosition: 'bottom', // top, bottom, none
    fontFamily: 'Arial',
    fontStyle: 'normal', // normal, bold, italic
    fontSize: 12,
    textCase: 'uppercase', // uppercase, lowercase
    imageSize: 100, // %
    gap: 2
  });

  // Gera os cartões (busca imagens) mas NÃO envia pro App principal ainda
  // Envia apenas para o Preview interno deste componente
  const handlePreview = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsGenerating(true);
    const words = text.trim().split(/[\n\s]+/);
    
    // Limita a quantidade de cartões baseado nas Linhas x Colunas
    const maxCards = config.rows * config.cols;
    const wordsToProcess = words.slice(0, maxCards);

    const promises = wordsToProcess.map(async (word) => {
      try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        const img = (json && json.length > 0) ? `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png` : 'https://static.arasaac.org/pictograms/2475/2475_500.png';
        
        return {
          id: `gen_${Date.now()}_${Math.random()}`,
          text: word,
          image: img
        };
      } catch (err) {
        return { id: `err`, text: word, image: 'https://static.arasaac.org/pictograms/2475/2475_500.png' };
      }
    });

    const results = await Promise.all(promises);
    setCards(results);
    setIsGenerating(false);
  };

  // Envia para o App principal (Salvar Definitivo)
  const handleFinalize = () => {
    // Adiciona as configurações de estilo a cada cartão para manter o padrão
    const finalCards = cards.map(c => ({
      ...c,
      type: 'speak',
      bgColor: '#FFFFFF',
      borderColor: '#000000',
      // Você pode salvar as configs extras no objeto se quiser usar depois
    }));
    onGenerate(finalCards);
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="board-generator-wrapper">
      
      {/* --- COLUNA DA ESQUERDA: CONFIGURAÇÕES --- */}
      <div className="config-panel">
        <h3>🛠️ Configuração de Planilha</h3>
        
        {/* Seção 1: Estrutura */}
        <div className="config-group">
          <label>Linhas:</label>
          <input type="number" min="1" max="10" value={config.rows} onChange={(e) => handleChange('rows', e.target.value)} />
          <label>Colunas:</label>
          <input type="number" min="1" max="10" value={config.cols} onChange={(e) => handleChange('cols', e.target.value)} />
        </div>

        <div className="config-group">
            <label>Cabeçalho:</label>
            <select value={config.header} onChange={(e) => handleChange('header', e.target.value === 'true')}>
                <option value="false">Sem cabeçalho</option>
                <option value="true">Com cabeçalho</option>
            </select>
        </div>

        <div className="config-group">
            <label>Borda:</label>
            <input type="number" value={config.borderWidth} onChange={(e) => handleChange('borderWidth', e.target.value)} /> px
            <select value={config.borderStyle} onChange={(e) => handleChange('borderStyle', e.target.value)}>
                <option value="solid">Simples (Sólida)</option>
                <option value="dashed">Linha descontínua</option>
                <option value="dotted">Pontilhado</option>
            </select>
        </div>

        <h3>📄 Configuração Geral</h3>
        <div className="config-group">
            <label>Papel:</label>
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
                <input placeholder="Sup" type="number" step="0.1" value={config.marginTop} onChange={(e) => handleChange('marginTop', e.target.value)} />
                <input placeholder="Inf" type="number" step="0.1" value={config.marginBottom} onChange={(e) => handleChange('marginBottom', e.target.value)} />
                <input placeholder="Esq" type="number" step="0.1" value={config.marginLeft} onChange={(e) => handleChange('marginLeft', e.target.value)} />
                <input placeholder="Dir" type="number" step="0.1" value={config.marginRight} onChange={(e) => handleChange('marginRight', e.target.value)} />
            </div>
        </div>

        <h3>🔤 Texto e Imagem</h3>
        <div className="config-group">
            <label>Posição Texto:</label>
            <select value={config.textPosition} onChange={(e) => handleChange('textPosition', e.target.value)}>
                <option value="top">Superior</option>
                <option value="bottom">Inferior</option>
                <option value="none">Sem texto</option>
            </select>
        </div>

        <div className="config-group">
            <label>Fonte:</label>
            <select value={config.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans</option>
            </select>
            <select value={config.textCase} onChange={(e) => handleChange('textCase', e.target.value)}>
                <option value="uppercase">MAIÚSCULAS</option>
                <option value="lowercase">minúsculas</option>
            </select>
        </div>

        <div className="config-group">
             <label>Tamanho Fonte:</label>
             <input type="number" value={config.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} />
        </div>
      </div>

      {/* --- COLUNA DA DIREITA: PREVIEW --- */}
      <div className="preview-panel">
        <div className="input-area">
            <textarea 
            placeholder="Digite as palavras aqui (uma por linha)..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            />
            <button onClick={handlePreview} disabled={isGenerating}>
                {isGenerating ? '🔄 Buscando...' : '👁️ Atualizar Prévia'}
            </button>
        </div>

        <div className="paper-preview-container">
            {/* SIMULAÇÃO DA FOLHA DE PAPEL */}
            <div 
                className={`paper-sheet ${config.paperSize} ${config.orientation}`}
                style={{
                    paddingTop: `${config.marginTop}cm`,
                    paddingBottom: `${config.marginBottom}cm`,
                    paddingLeft: `${config.marginLeft}cm`,
                    paddingRight: `${config.marginRight}cm`,
                }}
            >
                {config.header && <div className="paper-header">Título da Prancha</div>}
                
                <div 
                    className="paper-grid"
                    style={{
                        gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                        gap: `${config.gap}px`
                    }}
                >
                    {/* Renderiza os cartões ou espaços vazios */}
                    {Array.from({ length: config.rows * config.cols }).map((_, i) => {
                        const card = cards[i];
                        return (
                            <div 
                                key={i} 
                                className="paper-cell"
                                style={{
                                    borderWidth: `${config.borderWidth}px`,
                                    borderStyle: config.borderStyle,
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
                                        
                                        <img src={card.image} alt={card.text} style={{width: `${config.imageSize}%`}} />

                                        {config.textPosition === 'bottom' && (
                                            <span style={{
                                                fontFamily: config.fontFamily, 
                                                fontSize: `${config.fontSize}pt`,
                                                textTransform: config.textCase
                                            }}>{card.text}</span>
                                        )}
                                    </div>
                                ) : <span className="empty-slot"></span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <button className="btn-finalize" onClick={handleFinalize} disabled={cards.length === 0}>
            ✅ Usar esta Prancha no App
        </button>
      </div>
    </div>
  );
};

export default BoardGenerator;
