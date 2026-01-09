import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './BoardPDF.css';

export const generateBoardPDF = async (pages, config) => {
    // 1. Cria container temporário
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

            // Cria a folha
            const sheet = document.createElement('div');
            sheet.className = `pdf-sheet ${config.paperSize} ${config.orientation}`;

            // Margens
            sheet.style.paddingTop = `${config.marginTop}cm`;
            sheet.style.paddingRight = `${config.marginRight}cm`;
            sheet.style.paddingBottom = `${config.marginBottom}cm`;
            sheet.style.paddingLeft = `${config.marginLeft}cm`;

            // HTML
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

            // FOTO
            const canvas = await html2canvas(sheet, {
                scale: 2.5, // Equilíbrio entre qualidade e velocidade
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 3000, // IMPORTANTE: Simula tela larga para não cortar
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('pdf-generator-container');
                    if (el) {
                        el.style.visibility = 'visible'; // Torna visível apenas na "foto"
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            if (i > 0) {
                pdf.addPage(format, orientation); // Garante orientação correta nas novas páginas
            }

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
            // Célula PREENCHIDA
            const cellStyle = `
                background-color: ${config.cellBgColor};
                border: ${config.borderWidth}px ${config.borderStyle} ${config.cellBorderColor};
                -webkit-print-color-adjust: exact;
            `;

            html += `
            <div class="pdf-cell" style="${cellStyle}">
                <div class="pdf-cell-inner ${config.textPosition}">
                    ${config.textPosition === 'top' ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` : ''}
                    <img src="${card.image}" crossorigin="anonymous" />
                    ${config.textPosition === 'bottom' ? `<span style="font-family:${config.fontFamily}; font-size:${config.fontSize}pt; text-transform:${config.textCase}">${card.text}</span>` : ''}
                </div>
            </div>
            `;
        } else {
            // Célula VAZIA (Invisível)
            html += `
            <div class="pdf-cell" style="background: transparent; border: none; opacity: 0;"></div>
            `;
        }
    }
    return html;
}
