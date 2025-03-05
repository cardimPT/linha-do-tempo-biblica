// Função para carregar os dados do ficheiro JSON
async function carregarLivros() {
    try {
        const response = await fetch('livros.json');
        const livros = await response.json();
        return livros;
    } catch (error) {
        console.error('Erro ao carregar os livros:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Erro ao carregar os dados da linha do tempo.';
        document.getElementById('timeline').appendChild(errorMessage);
        return []; // Retorna um array vazio em caso de erro
    }
}

async function criarLinhaDoTempo() {
    const livrosBiblicos = await carregarLivros();

    livrosBiblicos.sort((a, b) => a.periodo.inicio - b.periodo.inicio);

    const items = livrosBiblicos.map(livro => {
        // Cria objetos Date a partir dos anos (negativos)
        const startDate = new Date(0); // Cria uma data em 0 (1970-01-01T00:00:00.000Z)
        startDate.setUTCFullYear(livro.periodo.inicio); // Define o ano (corretamente para anos negativos)
        const endDate = new Date(0);
        endDate.setUTCFullYear(livro.periodo.fim);

        return {
            id: livro.abreviacao,
            content: `${livro.nome} (${livro.abreviacao})`,
            start: startDate,  // Usa o objeto Date
            end: endDate,      // Usa o objeto Date
            type: (livro.periodo.inicio === livro.periodo.fim) ? 'point' : 'range',
            title: livro.descricao,  // Tooltip
            className: livro.categoria.toLowerCase().replace(/\s+/g, '-')
        };
    });

    const options = {
        timeAxis: { scale: 'year', step: 100 },
        orientation: 'top',
        showCurrentTime: false,
        showMinorLabels: true,
        format: {
            minorLabels: {
                year: 'YYYY'
            },
            majorLabels: {
                year: 'YYYY'
            }
        },
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10, // Zoom mínimo: 10 anos
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000, // Zoom máximo: 5000 anos

        // Definir min e max para cobrir o Antigo Testamento.
        min: new Date(0),
        max: new Date(0),
        start: new Date(0), //data inicial de vizualização
        end: new Date(0) //data final de visualização
    };

    //datas min e max
    options.min.setUTCFullYear(-4100);
    options.max.setUTCFullYear(100);
    options.start.setUTCFullYear(-2000);
    options.end.setUTCFullYear(-100);

    const timeline = new vis.Timeline(document.getElementById('timeline'), items, options);

    // --- MODAL ---
    timeline.on('select', function (properties) {
        const itemId = properties.items[0];
        if (itemId) {
            const livroSelecionado = livrosBiblicos.find(livro => livro.abreviacao === itemId);

            if (livroSelecionado) {
                document.getElementById('modal-title').textContent = livroSelecionado.nome;
                document.getElementById('modal-description').textContent = livroSelecionado.descricao;
                document.getElementById('myModal').style.display = "block";
            }
        }
    });

    document.getElementsByClassName("close")[0].onclick = function() {
        document.getElementById('myModal').style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == document.getElementById('myModal')) {
            document.getElementById('myModal').style.display = "none";
        }
    }
    // --- FIM MODAL ---
}

criarLinhaDoTempo();