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
            content: `<span class="math-inline">\{livro\.nome\} \(</span>{livro.abreviacao})`,
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
            showCurrentTime: false, // Já estava, mantenha
            // Adicione essas opções:
            showMinorLabels: true,  // Mostrar rótulos menores (anos intermediários)
            format: {
                minorLabels: {
                    year: 'YYYY'   // Formato para os rótulos menores (só o ano)
                },
                majorLabels: {
                    year: 'YYYY'  // Formato para os rótulos maiores (só o ano)
                }
            },
            // Ajustar zoom (opcional, mas recomendado):
            zoomMin: 1000 * 60 * 60 * 24 * 365 * 10, // Zoom mínimo: 10 anos (em milissegundos)
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000, // Zoom máximo: 5000 anos
    
        };
    
        // Criar a linha do tempo
        const timeline = new vis.Timeline(document.getElementById('timeline'), items, options);
    
    }
    
    // Chamar a função principal
    criarLinhaDoTempo();