// Função para carregar os dados do ficheiro JSON
async function carregarLivros() {
    try {
        const response = await fetch('livros.json');
        const livros = await response.json();
        return livros;
    } catch (error) {
        console.error('Erro ao carregar os livros:', error);
        // Mostrar mensagem de erro para o utilizador (opcional)
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Erro ao carregar os dados da linha do tempo.';
        document.getElementById('timeline').appendChild(errorMessage);
        return []; // Retorna um array vazio em caso de erro
    }
}

// Função principal (async para usar await)
async function criarLinhaDoTempo() {
    const livrosBiblicos = await carregarLivros();

    // Ordena cronologicamente
    livrosBiblicos.sort((a, b) => a.periodo.inicio - b.periodo.inicio);

    // Preparar dados para o Vis.js
    const items = livrosBiblicos.map(livro => ({
        id: livro.abreviacao,
        content: `${livro.nome} (${livro.abreviacao})`,
        start: livro.periodo.inicio,
        end: livro.periodo.fim,
        type: (livro.periodo.inicio === livro.periodo.fim) ? 'point' : 'range',
        title: livro.descricao,
        className: livro.categoria.toLowerCase().replace(/\s+/g, '-') // Substitui espaços por hífens
    }));

    // Configurações da linha do tempo (ajuste conforme necessário)
    const options = {
        timeAxis: { scale: 'year', step: 100 },
        orientation: 'top',
        showCurrentTime: false,
        //zoomMin: 1000 * 60 * 60 * 24 * 30 * 12 * 10,  // zoom minimo 10 anos
        //zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,   // zoom maximo 100 anos
        // Outras opções: https://visjs.github.io/vis-timeline/docs/timeline/
    };

    // Criar a linha do tempo
    const timeline = new vis.Timeline(document.getElementById('timeline'), items, options);
      // Centraliza a linha do tempo (opcional, ajuste conforme necessário)
    timeline.setWindow(-2500, 500); //Centraliza entre 2500 AC e 500 DC
}

// Chamar a função principal
criarLinhaDoTempo();