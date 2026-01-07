// src/utils/BoardPDFGenerator.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './BoardPDF.css'; // Importa o CSS que acabamos de criar

export const generateBoardPDF = async (pages, config) => {
    // 1. Cria um container temporário fora da tela
    const container = document.createElement('div');
    container.id = 'pdf-generator-container';
    document.body.appendChild(container);

    try {
        const orientation = config.orientation === 'landscape' ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'mm', config.paperSize.toLowerCase());
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // 2. Loop para criar cada página HTML "limpa"
        for (let i = 0; i < pages.length; i++) {
            const pageCards = pages[i];
            
            // Cria o elemento da folha
            const sheet = document.createElement('div');
            sheet.className = `pdf-sheet ${config.paperSize} ${config.orientation}`;
            
            // Aplica margens do usuário (convertendo cm para padding style)
            sheet.style.padding = `${config.marginTop}cm ${config.marginRight}cm ${config.marginBottom}cm ${config.marginLeft}cm`;

            // HTML Interno (Estrutura idêntica à visualização, mas com classes do PDF CSS)
            sheet.innerHTML = `
                <div class="pdf-content" style="border: ${config.borderWidth}px ${config.borderStyle} ${config.boardBorderColor}">
                    ${config.header ? `
                        <div class="pdf-header" style="background-color: ${config.headerBgColor}; border-bottom: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor}">
                            ${config.headerText}
                        </div>
                    ` : ''}
                    
                    <div class="pdf-grid" style="
                        grid-template-columns: repeat(${config.cols}, 1fr);
                        grid-template-rows: repeat(${config.rows}, 1fr);
                        gap: ${config.gap}px;
                    ">
                        ${generateGridHTML(pageCards, config)}
                    </div>
                </div>
                <div class="pdf-footer">
                     Gerado via NeuroCAA - Sistema protegido por direitos autorais - Pictogramas utilizados sob licença ARASAAC (CC BY-NC-SA 4.0) - <span>Conheça a plataforma</span>
                </div>
            `;

            // Adiciona ao container temporário para renderizar
            container.appendChild(sheet);

            // 3. Tira a "foto" (Screenshot) em alta resolução
            const canvas = await html2canvas(sheet, {
                scale: 2, // Melhora a qualidade
                useCORS: true, // Permite baixar imagens do Arasaac
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // 4. Adiciona ao PDF
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Remove a folha do DOM para economizar memória
            container.removeChild(sheet);
        }

        // 5. Salva o Arquivo
        pdf.save(`Prancha_NeuroCAA_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
    } finally {
        // 6. Limpeza final
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

// Função auxiliar para gerar o HTML das células
function generateGridHTML(cards, config) {
    // Cria array vazio do tamanho total para preencher espaços
    const totalSlots = config.rows * config.cols;
    let html = '';

    for (let k = 0; k < totalSlots; k++) {
        const card = cards[k];
        
        if (card) {
            html += `
            <div class="pdf-cell" style="
                background-color: ${config.cellBgColor};
                border: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor};
            ">
                <div class="pdf-cell-inner ${config.textPosition}">
                    ${config.textPosition === 'top' ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` : ''}
                    
                    <img src="${card.image}" crossorigin="anonymous" />
                    
                    ${config.textPosition === 'bottom' ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` : ''}
                </div>
            </div>
            `;
        } else {
            html += `
            <div class="pdf-cell" style="
                background-color: ${config.cellBgColor};
                border: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor};
            ">
                </div>
            `;
        }
    }
    return html;
}
