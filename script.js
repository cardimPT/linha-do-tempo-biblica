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
        return [];
    }
}

async function criarLinhaDoTempo() {
    const livrosBiblicos = await carregarLivros();

    livrosBiblicos.sort((a, b) => a.periodo.inicio - b.periodo.inicio);

    const items = livrosBiblicos.map(livro => ({
        id: livro.abreviacao,
        content: `${livro.nome} (${livro.abreviacao})`,
        start: livro.periodo.inicio,
        end: livro.periodo.fim,
        type: (livro.periodo.inicio === livro.periodo.fim) ? 'point' : 'range',
        title: livro.descricao,
        className: livro.categoria.toLowerCase().replace(/\s+/g, '-')
    }));

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
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000,
    };

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