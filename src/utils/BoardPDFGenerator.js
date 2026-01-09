import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './BoardPDF.css';

export const generateBoardPDF = async (pages, config) => {
    // 1. Rola para o topo (Essencial)
    window.scrollTo(0, 0);

    // 2. Cria o container na frente de tudo
    const container = document.createElement('div');
    container.id = 'pdf-generator-container';
    document.body.appendChild(container);

    try {
        const orientation = config.orientation === 'landscape' ? 'l' : 'p';
        const format = config.paperSize.toLowerCase();
        
        const pdf = new jsPDF(orientation, 'mm', format);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pages.length; i++) {
            const pageCards = pages[i];
            
            const sheet = document.createElement('div');
            sheet.className = `pdf-sheet ${config.paperSize} ${config.orientation}`;
            
            sheet.style.paddingTop = `${config.marginTop}cm`;
            sheet.style.paddingRight = `${config.marginRight}cm`;
            sheet.style.paddingBottom = `${config.marginBottom}cm`;
            sheet.style.paddingLeft = `${config.marginLeft}cm`;

            sheet.innerHTML = `
                <div class="pdf-content" style="
                    border: ${config.borderWidth}px ${config.borderStyle} ${config.boardBorderColor};
                    background-color: white; 
                ">
                    ${config.header ? `
                        <div class="pdf-header" style="
                            background-color: ${config.headerBgColor}; 
                            border-bottom: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor};
                            -webkit-print-color-adjust: exact;
                        ">
                            ${config.headerText}
                        </div>
                    ` : ''}
                    
                    <div class="pdf-grid" style="
                        /* Grid simples para a estrutura macro */
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

            container.appendChild(sheet);

            // Pausa de 500ms para carregar imagens
            await new Promise(resolve => setTimeout(resolve, 500));

            // Captura
            const canvas = await html2canvas(sheet, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // Garante fundo branco
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            if (i > 0) pdf.addPage(format, orientation);
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            container.removeChild(sheet);
        }

        pdf.save(`Prancha_NeuroCAA_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

function generateGridHTML(cards, config) {
    const totalSlots = config.rows * config.cols;
    let html = '';

    for (let k = 0; k < totalSlots; k++) {
        const card = cards[k];
        
        if (card) {
            const cellStyle = `
                background-color: ${config.cellBgColor};
                border: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor};
                -webkit-print-color-adjust: exact;
            `;

            const textTop = config.textPosition === 'top' 
                ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` 
                : '';
            
            const textBottom = config.textPosition === 'bottom' 
                ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` 
                : '';

            const imgTag = `<img src="${card.image}" crossorigin="anonymous" />`;

            html += `
            <div class="pdf-cell" style="${cellStyle}">
                <div class="pdf-cell-inner">
                    ${textTop}
                    ${imgTag}
                    ${textBottom}
                </div>
            </div>
            `;
        } else {
            html += `
            <div class="pdf-cell" style="background: transparent; border: none; opacity: 0;"></div>
            `;
        }
    }
    return html;
}
