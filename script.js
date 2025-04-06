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

// Variáveis globais para a timeline e todos os itens (para acesso pelos filtros)
let timeline = null;
let allItems = [];
let livrosBiblicos = []; // Guardar os dados originais aqui

// Função principal
async function criarLinhaDoTempo() {
    livrosBiblicos = await carregarLivros(); // Preenche a variável global

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

    // Função auxiliar para formatar o ano (ex: -1500 -> "1500 a.C.")
    function formatarAno(ano) {
        if (ano < 0) { return `${Math.abs(ano)} a.C.`; }
        else if (ano === 0) { return 'c. 1 d.C.'; }
        else { return `${ano} d.C.`; }
    }

    // Mapeia os dados para o formato do Vis.js
    allItems = livrosBiblicos.map(livro => {
        // Verificações robustas
        const inicio = (livro.periodo && typeof livro.periodo.inicio === 'number') ? livro.periodo.inicio : 0;
        const fim = (livro.periodo && typeof livro.periodo.fim === 'number') ? livro.periodo.fim : inicio;
        const nome = typeof livro.nome === 'string' ? livro.nome : 'Nome Indefinido';
        const abreviacao = typeof livro.abreviacao === 'string' ? livro.abreviacao : 'ID';
        const descricao = typeof livro.descricao === 'string' ? livro.descricao : 'Sem descrição.';
        const categoria = typeof livro.categoria === 'string' ? livro.categoria : 'sem-categoria';

        // Cria objetos Date
        const startDate = new Date(0);
        startDate.setUTCFullYear(inicio);
        const endDate = new Date(0);
        endDate.setUTCFullYear(fim);

        // Define o conteúdo (sempre com datas para intervalos)
        const duracaoAnos = fim - inicio;
        let itemContent = "";
        if (duracaoAnos <= 0) {
            itemContent = `${nome}<br>${formatarAno(inicio)}`; // Data pontual sem <small>
        } else {
            itemContent = `${nome}<br><small>${formatarAno(inicio)} - ${formatarAno(fim)}</small>`; // Intervalo com <small>
        }

        return {
            id: abreviacao,
            content: itemContent,
            start: startDate,
            end: endDate,
            type: (inicio === fim) ? 'point' : 'range',
            title: `${nome} (${formatarAno(inicio)} a ${formatarAno(fim)}): ${descricao}`, // Tooltip
            className: categoria.toLowerCase().replace(/[\s:]+/g, '-'), // Gera classe CSS
            // Guarda a categoria original para facilitar a filtragem posterior se necessário
            originalCategory: categoria
        };
    }).filter(item => item !== null);


    const options = {
        timeAxis: { scale: 'year', step: 100 },
        orientation: 'top',
        showCurrentTime: false,
        showMinorLabels: true,
        format: {
            minorLabels: { year: 'YYYY' }, // Formato sem 'G'
            majorLabels: { year: 'YYYY' }  // Formato sem 'G'
        },
         margin: {
             item: {
                 vertical: 5 // Margem vertical entre itens empilhados
             }
         },
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000,
        min: new Date(0),
        max: new Date(0),
        start: new Date(0),
        end: new Date(0)
    };

    // Define as datas min/max/start/end
    options.min.setUTCFullYear(-4100);
    options.max.setUTCFullYear(100);
    options.start.setUTCFullYear(-2100);
    options.end.setUTCFullYear(-400);

    const timelineDiv = document.getElementById('timeline');
    if (!timelineDiv) {
        console.error("Elemento com id 'timeline' não encontrado no DOM.");
        return;
    }

    // Cria a linha do tempo - guarda a instância na variável global 'timeline'
    timeline = new vis.Timeline(timelineDiv, allItems, options); // Mostra todos os itens inicialmente

    // --- CONFIGURAR MODAL ---
    setupModal();

    // --- CONFIGURAR FILTROS DA LEGENDA ---
    setupLegendFilters();
}

// Função para configurar o Modal (com Período e Categoria)
function setupModal() {
    const modal = document.getElementById('myModal');
    const closeButton = document.getElementsByClassName("close")[0];
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    // --- NOVOS ELEMENTOS ---
    const modalPeriod = document.getElementById('modal-period');
    const modalCategory = document.getElementById('modal-category');
    // --- FIM NOVOS ELEMENTOS ---

    // Função auxiliar para formatar o ano (já deve existir dentro de criarLinhaDoTempo ou globalmente)
    // Se não estiver acessível aqui, copie-a para cá ou defina-a fora das funções.
    function formatarAno(ano) {
        if (ano < 0) { return `${Math.abs(ano)} a.C.`; }
        else if (ano === 0) { return 'c. 1 d.C.'; }
        else { return `${ano} d.C.`; }
    }

    // Verifica se TODOS os elementos do modal existem
    if (modal && closeButton && modalTitle && modalDescription && modalPeriod && modalCategory) {

        timeline.on('select', function (properties) { // Ou 'click', conforme decidiu
            const itemId = properties.items[0]; // Ou properties.item para 'click'
            if (itemId) {
                // Procura nos dados originais (livrosBiblicos)
                const livroSelecionado = livrosBiblicos.find(livro =>
                    (typeof livro.abreviacao === 'string' ? livro.abreviacao : 'ID') === itemId
                );

                if (livroSelecionado) {
                    // Preenche Título e Descrição Curta (como antes)
                    modalTitle.textContent = typeof livroSelecionado.nome === 'string' ? livroSelecionado.nome : 'Título Indefinido';
                    modalDescription.textContent = typeof livroSelecionado.descricao === 'string' ? livroSelecionado.descricao : 'Sem descrição.';

                    // --- PREENCHER PERÍODO ---
                    const inicio = (livroSelecionado.periodo && typeof livroSelecionado.periodo.inicio === 'number') ? livroSelecionado.periodo.inicio : null;
                    const fim = (livroSelecionado.periodo && typeof livroSelecionado.periodo.fim === 'number') ? livroSelecionado.periodo.fim : inicio; // Default a inicio se fim faltar

                    if (inicio !== null) {
                        if (inicio === fim) {
                            modalPeriod.textContent = formatarAno(inicio); // Ponto no tempo
                        } else {
                            modalPeriod.textContent = `${formatarAno(inicio)} - ${formatarAno(fim)}`; // Intervalo
                        }
                    } else {
                        modalPeriod.textContent = 'Indefinido';
                    }

                    // --- PREENCHER CATEGORIA ---
                    modalCategory.textContent = typeof livroSelecionado.categoria === 'string' ? livroSelecionado.categoria : 'Indefinida';
                    // --- FIM NOVAS PARTES ---

                    modal.style.display = "block"; // Mostra o modal

                } else {
                    console.warn("Livro selecionado com ID", itemId, "não encontrado nos dados.");
                }
            }
        });

        // Função para fechar o modal
        function closeModal() {
            modal.style.display = "none";
        }

        // Listener para o botão 'X'
        closeButton.onclick = closeModal;

        // Listener para clique fora do conteúdo do modal
        modal.addEventListener('click', function(event) {
           if (event.target === modal) {
              closeModal();
           }
        });

     } else {
         console.warn("Elementos do modal (ou seus conteúdos) não encontrados. A funcionalidade do modal pode estar incompleta.");
     }
}

// Função para configurar os Filtros da Legenda (separada para organização)
function setupLegendFilters() {
    const legendItems = document.querySelectorAll('.legenda-item');
     if (legendItems.length === 0) {
         console.warn("Itens da legenda não encontrados.");
         return; // Sai se não houver legenda
     }

    // Função para atualizar a timeline com base nos filtros ativos na legenda
    function updateTimelineFilter() {
        const activeLegendItems = document.querySelectorAll('.legenda-item.active');
        const activeCategoriesClasses = new Set();

        activeLegendItems.forEach(item => {
            const categoryName = item.dataset.categoria;
            if (categoryName) {
                activeCategoriesClasses.add(categoryName.toLowerCase().replace(/[\s:]+/g, '-'));
            }
        });

        let itemsToShow;
        if (activeCategoriesClasses.size === 0) { // Se nada estiver ativo
            itemsToShow = allItems; // Mostra todos
            legendItems.forEach(item => item.classList.add('active')); // Reativa legenda visualmente
        } else {
            itemsToShow = allItems.filter(item => activeCategoriesClasses.has(item.className));
        }

        if (timeline) { // Garante que a timeline existe
             timeline.setItems(itemsToShow);
             // timeline.fit(); // Descomente se quiser ajustar o zoom automaticamente
        }
    }

    // Adiciona o event listener a cada item da legenda
    legendItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active'); // Alterna o estado ativo/inativo
            updateTimelineFilter(); // Atualiza a timeline
        });
    });
}


// Chama a função principal apenas quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarLinhaDoTempo);
} else {
    criarLinhaDoTempo();
}