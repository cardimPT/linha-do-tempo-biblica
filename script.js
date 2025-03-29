// Função para carregar os dados do ficheiro JSON
async function carregarLivros() {
    try {
        const response = await fetch('livros.json');
        // Verifica se a resposta da rede foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const livros = await response.json();
        return livros;
    } catch (error) {
        console.error('Erro ao carregar ou processar livros.json:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Erro ao carregar os dados da linha do tempo. Verifique o console para detalhes.';
        // Garante que o elemento 'timeline' existe antes de adicionar a mensagem
        const timelineDiv = document.getElementById('timeline');
        if (timelineDiv) {
            timelineDiv.appendChild(errorMessage);
        }
        return []; // Retorna um array vazio em caso de erro
    }
}

async function criarLinhaDoTempo() {
    const livrosBiblicos = await carregarLivros();

    // Verifica se livrosBiblicos é um array e não está vazio
    if (!Array.isArray(livrosBiblicos) || livrosBiblicos.length === 0) {
        console.error("Não foi possível carregar ou processar os dados dos livros.");
        const timelineDiv = document.getElementById('timeline');
        if (timelineDiv && timelineDiv.children.length === 0) {
             const errorMessage = document.createElement('p');
             errorMessage.textContent = 'Não foi possível carregar os dados para a linha do tempo.';
             timelineDiv.appendChild(errorMessage);
        }
        return;
    }

    // Ordena apenas se for um array válido
    livrosBiblicos.sort((a, b) => {
        const inicioA = (a.periodo && typeof a.periodo.inicio === 'number') ? a.periodo.inicio : 0;
        const inicioB = (b.periodo && typeof b.periodo.inicio === 'number') ? b.periodo.inicio : 0;
        return inicioA - inicioB;
    });


    const items = livrosBiblicos.map(livro => {
        // Verificações robustas para garantir que os dados existem e são do tipo esperado
        const inicio = (livro.periodo && typeof livro.periodo.inicio === 'number') ? livro.periodo.inicio : 0;
        const fim = (livro.periodo && typeof livro.periodo.fim === 'number') ? livro.periodo.fim : inicio;
        const nome = typeof livro.nome === 'string' ? livro.nome : 'Nome Indefinido';
        const abreviacao = typeof livro.abreviacao === 'string' ? livro.abreviacao : 'ID';
        const descricao = typeof livro.descricao === 'string' ? livro.descricao : 'Sem descrição.';
        const categoria = typeof livro.categoria === 'string' ? livro.categoria : 'sem-categoria';


        // Cria objetos Date a partir dos anos (negativos)
        const startDate = new Date(0);
        startDate.setUTCFullYear(inicio);
        const endDate = new Date(0);
        endDate.setUTCFullYear(fim);

        // --- LÓGICA SIMPLIFICADA PARA O CONTEÚDO (SEMPRE COM DATAS) ---
        const duracaoAnos = fim - inicio;

        function formatarAno(ano) {
            if (ano < 0) { return `${Math.abs(ano)} a.C.`; }
            else if (ano === 0) { return 'c. 1 d.C.'; }
            else { return `${ano} d.C.`; }
        }

        let itemContent = "";

        if (duracaoAnos <= 0) { // Se for um ponto no tempo
            itemContent = `${nome}<br><small>${formatarAno(inicio)}</small>`;
        } else { // Se for um intervalo (qualquer duração > 0)
            itemContent = `${nome}<br><small>${formatarAno(inicio)} - ${formatarAno(fim)}</small>`;
        }
        // --- FIM DA LÓGICA SIMPLIFICADA ---

        return {
            id: abreviacao,
            content: itemContent, // Usa o conteúdo calculado (sempre com datas para intervalos)
            start: startDate,
            end: endDate,
            type: (inicio === fim) ? 'point' : 'range',
            title: `${nome} (${formatarAno(inicio)} a ${formatarAno(fim)}): ${descricao}`, // Tooltip melhorado com datas formatadas
            className: categoria.toLowerCase().replace(/[\s:]+/g, '-') // Substitui espaços E dois-pontos por hífens
        };
    }).filter(item => item !== null); // Filtra itens que podem ter tido erro


    const options = {
        timeAxis: { scale: 'year', step: 100 },
        orientation: 'top',
        showCurrentTime: false,
        showMinorLabels: true,
        format: {
            minorLabels: { year: 'YYYY' }, // Formato sem 'G'
            majorLabels: { year: 'YYYY' }  // Formato sem 'G'
        },
         margin: { // Manter a margem vertical pode ajudar
             item: {
                 vertical: 5
             }
         },
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10, // Zoom mínimo: 10 anos
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000, // Zoom máximo: 5000 anos
        min: new Date(0),
        max: new Date(0),
        start: new Date(0), // Data inicial de visualização
        end: new Date(0)   // Data final de visualização
    };

    // Define as datas min/max/start/end nas opções
    options.min.setUTCFullYear(-4100); // Um pouco antes da data mais antiga no PDF
    options.max.setUTCFullYear(100);   // Um pouco depois de 0 AD
    options.start.setUTCFullYear(-2100); // Ajustado para melhor visualização inicial
    options.end.setUTCFullYear(-400);    // Ajustado

    const timelineDiv = document.getElementById('timeline');
    if (!timelineDiv) {
        console.error("Elemento com id 'timeline' não encontrado no DOM.");
        return;
    }

    // Cria a linha do tempo
    const timeline = new vis.Timeline(timelineDiv, items, options);

    // --- MODAL ---
     const modal = document.getElementById('myModal');
     const closeButton = document.getElementsByClassName("close")[0];
     const modalTitle = document.getElementById('modal-title');
     const modalDescription = document.getElementById('modal-description');

     if (modal && closeButton && modalTitle && modalDescription) {
        timeline.on('select', function (properties) {
            const itemId = properties.items[0];
            if (itemId) {
                const livroSelecionado = livrosBiblicos.find(livro =>
                    (typeof livro.abreviacao === 'string' ? livro.abreviacao : 'ID') === itemId
                );
                if (livroSelecionado) {
                    modalTitle.textContent = typeof livroSelecionado.nome === 'string' ? livroSelecionado.nome : 'Título Indefinido';
                    modalDescription.textContent = typeof livroSelecionado.descricao === 'string' ? livroSelecionado.descricao : 'Sem descrição.';
                    modal.style.display = "block";
                } else {
                    console.warn("Livro selecionado com ID", itemId, "não encontrado nos dados.");
                }
            }
        });
        closeButton.onclick = function() { modal.style.display = "none"; }
        window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
     } else {
         console.warn("Elementos do modal não encontrados. A funcionalidade do modal não funcionará.");
     }
    // --- FIM MODAL ---
}

// Chama a função principal apenas quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarLinhaDoTempo);
} else {
    criarLinhaDoTempo();
}