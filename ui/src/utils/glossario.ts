/**
 * Glossário de Termos Técnicos - Teoria dos Grafos e Redes Elétricas
 * 
 * Este arquivo centraliza as definições de termos técnicos usados no projeto
 * para garantir consistência e facilitar manutenção.
 */

export const GLOSSARIO = {
    // === TEORIA DOS GRAFOS - CONCEITOS BÁSICOS ===
    GRAFO: {
        termo: "Grafo",
        definicao: "Estrutura matemática composta por nós (vértices) conectados por arestas (links). Representa relações entre entidades.",
        exemplo: "Nesta rede elétrica, cada nó é uma estação/gerador e cada aresta é uma linha de transmissão."
    },

    NO: {
        termo: "Nó (Vértice)",
        definicao: "Elemento básico de um grafo que representa uma entidade. Também chamado de vértice.",
        exemplo: "Os 4.941 nós do dataset original representam pontos da rede elétrica do Oeste dos EUA."
    },

    ARESTA: {
        termo: "Aresta (Link)",
        definicao: "Conexão entre dois nós em um grafo. Pode ser direcionada (com sentido) ou não-direcionada.",
        exemplo: "As 6.594 arestas representam linhas de transmissão conectando estações elétricas."
    },

    GRAU: {
        termo: "Grau do Nó",
        definicao: "Número de conexões (arestas) que um nó possui. Em grafos direcionados, divide-se em grau de entrada (in-degree) e grau de saída (out-degree).",
        exemplo: "Um nó com grau 8 está diretamente conectado a 8 outros nós."
    },

    // === MÉTRICAS DE CENTRALIDADE ===
    BETWEENNESS: {
        termo: "Betweenness Centrality (Centralidade de Intermediação)",
        definicao: "Mede quantas vezes um nó aparece no caminho mais curto entre outros pares de nós. Identifica 'pontes' ou gargalos na rede.",
        exemplo: "Nó com betweenness alto (0.288) é passagem obrigatória para muitos caminhos - removê-lo fragmentaria a rede."
    },

    CLOSENESS: {
        termo: "Closeness Centrality (Centralidade de Proximidade)",
        definicao: "Mede o quão próximo um nó está de todos os outros nós na rede (baseado na soma das distâncias mais curtas).",
        exemplo: "Nós com alta closeness podem disseminar informação/energia rapidamente para toda a rede."
    },

    PAGERANK: {
        termo: "PageRank",
        definicao: "Algoritmo que mede a importância de um nó baseado na qualidade e quantidade de conexões que ele recebe (usado pelo Google para rankear páginas web).",
        exemplo: "Nó com PageRank alto (0.15) recebe muitas conexões de outros nós importantes."
    },

    // === PROPRIEDADES ESTRUTURAIS ===
    DENSIDADE: {
        termo: "Densidade do Grafo",
        definicao: "Proporção entre o número de arestas existentes e o número máximo possível de arestas. Varia de 0 (sem conexões) a 1 (grafo completo).",
        exemplo: "Densidade 0.00054 indica rede esparsa (poucas conexões); densidade 1.0 indica rede completa (todos conectados)."
    },

    CLUSTERING: {
        termo: "Coeficiente de Clusterização (Clustering Coefficient)",
        definicao: "Mede o quanto os vizinhos de um nó estão conectados entre si. Indica formação de 'grupos' ou 'comunidades' locais.",
        exemplo: "Clustering 0.08 significa que apenas 8% das conexões possíveis entre vizinhos existem."
    },

    DIAMETRO: {
        termo: "Diâmetro da Rede",
        definicao: "Maior distância (em número de arestas) entre qualquer par de nós no grafo. Indica quão 'longa' é a rede.",
        exemplo: "Diâmetro 46 significa que existem nós separados por 46 'saltos' de conexão."
    },

    CAMINHO_MEDIO: {
        termo: "Caminho Médio (Average Path Length)",
        definicao: "Distância média entre todos os pares de nós. Mede eficiência de comunicação/transporte na rede.",
        exemplo: "Caminho médio 18.99 significa que, em média, são necessários ~19 saltos para ir de um nó a qualquer outro."
    },

    // === VULNERABILIDADE E ROBUSTEZ ===
    PONTO_ARTICULACAO: {
        termo: "Ponto de Articulação (Articulation Point)",
        definicao: "Nó cuja remoção desconecta o grafo em componentes separados. Representa ponto único de falha.",
        exemplo: "Os 1.229 pontos de articulação (24.87%) são críticos - falha neles fragmenta a rede elétrica."
    },

    COMPONENTE_CONECTADO: {
        termo: "Componente Conectado",
        definicao: "Subconjunto de nós onde qualquer nó pode alcançar qualquer outro dentro do subconjunto (mas não nós fora dele).",
        exemplo: "Rede com 1 componente está totalmente conectada; múltiplos componentes indicam fragmentação."
    },

    SCALE_FREE: {
        termo: "Rede Scale-Free (Livre de Escala)",
        definicao: "Rede cuja distribuição de graus segue uma lei de potência: poucos 'hubs' com muitas conexões e muitos nós com poucas conexões.",
        exemplo: "Redes scale-free (Internet, redes sociais) são resistentes a falhas aleatórias, mas vulneráveis a ataques aos hubs."
    },

    // === REDES ELÉTRICAS ESPECÍFICAS ===
    CARGA: {
        termo: "Carga Elétrica (Load)",
        definicao: "Quantidade de energia elétrica (em Megawatts - MW) demandada ou consumida por um ponto da rede.",
        exemplo: "Carga de 275 MW indica consumo de 275.000.000 Watts naquele instante."
    },

    TENSAO: {
        termo: "Tensão (Voltage)",
        definicao: "Diferença de potencial elétrico, medida em 'por unidade' (pu). Valores normais: 0.95-1.05 pu (95%-105% do valor nominal).",
        exemplo: "Tensão 1.02 pu indica 102% do valor nominal - dentro da faixa segura."
    },

    FREQUENCIA: {
        termo: "Frequência",
        definicao: "Oscilação da corrente alternada (AC), medida em Hertz (Hz). Padrão: 50 Hz (Europa/Ásia) ou 60 Hz (Américas).",
        exemplo: "Frequência 49.8 Hz está próxima dos 50 Hz padrão - pequeno desvio aceitável."
    },

    GRID_STATUS: {
        termo: "Status da Rede (Grid Status)",
        definicao: "Indicador binário (0 ou 1) do estado operacional da rede. 0 = estável, 1 = instável (requer intervenção).",
        exemplo: "Grid status = 1 pode indicar sobrecarga, subtensão, ou outros problemas operacionais."
    },

    FLUXO_POTENCIA: {
        termo: "Fluxo de Potência (Power Flow)",
        definicao: "Quantidade de energia elétrica (em MW) fluindo de um nó para outro através de uma aresta (linha de transmissão).",
        exemplo: "Fluxo de 52.84 MW da subestação A para B indica transmissão de 52.840.000 Watts."
    },

    // === ANÁLISE TEMPORAL ===
    TIMESTAMP: {
        termo: "Timestamp (Carimbo Temporal)",
        definicao: "Marcação de data/hora de uma medição. Permite análise de evolução da rede ao longo do tempo.",
        exemplo: "1.000 timestamps cobrindo jan-fev/2024 permitem analisar variações diárias/semanais."
    },

    TAXA_FALHAS: {
        termo: "Taxa de Falhas (Fault Rate)",
        definicao: "Percentual de timestamps onde foi detectada uma falha (fault_detected = 1) no sistema.",
        exemplo: "Taxa de falhas 49% indica que metade das medições registraram alguma anormalidade."
    },

    TAXA_INSTABILIDADE: {
        termo: "Taxa de Instabilidade",
        definicao: "Percentual de timestamps onde a rede estava instável (grid_status = 1), requerendo ação corretiva.",
        exemplo: "Taxa de instabilidade 93.3% indica rede com problemas frequentes - situação crítica."
    }
};

export type GlossarioKey = keyof typeof GLOSSARIO;
