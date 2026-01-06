import React, { useState } from 'react';
import './BoardGenerator.css'; // Vamos criar um CSS só para ele também!

const BoardGenerator = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsGenerating(true);
    
    // Separa por quebra de linha ou espaço para criar a lista
    const words = text.trim().split(/[\n\s]+/);
    
    const newCards = [];

    // Processa cada palavra
    const promises = words.map(async (word) => {
      try {
        // Busca no ARASAAC
        const res = await fetch(`https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(word)}`);
        const json = await res.json();
        
        let imageUrl = 'https://static.arasaac.org/pictograms/2475/2475_500.png'; // Padrão
        
        if (json && json.length > 0) {
          // Pega a primeira imagem encontrada
          imageUrl = `https://static.arasaac.org/pictograms/${json[0]._id}/${json[0]._id}_500.png`;
        }

        return {
          id: `gen_${Date.now()}_${Math.random()}`,
          text: word,
          type: 'speak',
          bgColor: '#FFFFFF',
          borderColor: '#e2e8f0',
          image: imageUrl
        };
      } catch (err) {
        console.error("Erro ao buscar imagem para", word);
        return {
          id: `err_${Date.now()}_${Math.random()}`,
          text: word,
          type: 'speak',
          bgColor: '#FFFFFF',
          borderColor: '#e2e8f0',
          image: 'https://static.arasaac.org/pictograms/2475/2475_500.png'
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Envia os cartões criados de volta para o App.js
    onGenerate(results);
    
    setText("");
    setIsGenerating(false);
  };

  return (
    <div className="board-generator-container">
      <div className="generator-header">
        <h3>✨ Gerador de Prancha em Massa</h3>
        <small>Digite várias palavras (uma por linha ou separadas por espaço) para criar cartões automaticamente.</small>
      </div>
      
      <form onSubmit={handleGenerate} className="generator-form-layout">
        <textarea 
          className="generator-input"
          placeholder="Exemplo:
Eu
Quero
Beber
Água
Feliz" 
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <button type="submit" className="btn-generate" disabled={isGenerating}>
          {isGenerating ? '⏳ Criando Pictogramas...' : '⚡ Gerar Prancha Agora'}
        </button>
      </form>
    </div>
  );
};

export default BoardGenerator;
