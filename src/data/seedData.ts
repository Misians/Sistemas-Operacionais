import type { OSResource } from '../types/repository';

export const INITIAL_RESOURCES: OSResource[] = [
  {
    id: 'local-1',
    title: 'Gincana de Gerenciamento de Memória (Cadeiras e Post-its)',
    description: 'Dinâmica física em sala para demonstrar partições fixas, dinâmicas, fragmentação interna/externa, registradores base/limite, segmentação e paginação.',
    category: 'gincana',
    module: 'gerencia_memoria',
    difficulty: 'Intermediário',
    tags: ['Paginação', 'Segmentação', 'Base/Limite', 'Desplugado'],
    gameDetails: {
      materialsNeeded: [
        'Fileira de 12 a 16 cadeiras numeradas (0 a N)',
        'Post-its de cores diferentes para identificar processos (P1, P2, P3)',
        'Fita crepe para demarcar partições no chão',
        'Quadro branco e pincel para desenhar a Tabela de Páginas e Registradores'
      ],
      executionTimeMinutes: 50,
      stepByStepRules: [
        'Preparação: Posicione as cadeiras em fila única representando os endereços físicos (frames) da Memória RAM.',
        'Fase 1 (Partição Fixa): Divida a fila em blocos fixos de 4 cadeiras. Chame grupos de alunos (processos) de tamanhos variados (ex: 2 alunos, 3 alunos) para sentar. Aponte as cadeiras vazias dentro do bloco como Fragmentação Interna.',
        'Fase 2 (Partição Dinâmica e Base/Limite): Remova as divisórias fixas. Ao alocar um grupo, anote no quadro o Registrador Base (índice da primeira cadeira) e o Limite (quantidade de cadeiras). Peça para um aluno tentar sentar na cadeira seguinte ao seu limite e anuncie uma Trap de Segmentation Fault.',
        'Fase 3 (Paginação): Embaralhe cadeiras ocupadas e livres. Chame um novo grupo de 4 alunos (Páginas 0 a 3) e sente-os em cadeiras espalhadas (Frames livres). Construa a Tabela de Páginas no quadro mapeando qual Página sentou em qual Frame.'
      ]
    },
    authorName: 'Acervo Base SO',
    createdAt: Date.now()
  },
  {
    id: 'local-2',
    title: 'Dinâmica: O Jantar dos Filósofos na Prática',
    description: 'Simulação em roda com 5 alunos para provocar um deadlock real em sala e discutir as 4 condições de Coffman.',
    category: 'gincana',
    module: 'sincronizacao',
    difficulty: 'Iniciante',
    tags: ['Deadlock', 'Semáforos', 'Mutex', 'Coffman'],
    gameDetails: {
      materialsNeeded: [
        '5 cadeiras dispostas em círculo',
        '5 garfos descartáveis (ou 5 canetas/marcadores)',
        '5 pratos ou folhas identificando cada filósofo (F0 a F4)'
      ],
      executionTimeMinutes: 30,
      stepByStepRules: [
        'Posicione 5 alunos em círculo com apenas 1 garfo colocado entre cada par de alunos (total de 5 garfos).',
        'Regra de Ouro: Nenhum aluno pode conversar com o colega. Para "comer", o aluno precisa segurar os 2 garfos adjacentes simultaneamente por 3 segundos e depois devolvê-los à mesa.',
        'Rodada 1 (Provocando o Deadlock): Ao sinal do professor, instrua todos a pegarem primeiro o garfo da direita ao mesmo tempo. Observe o impasse e identifique no quadro: Exclusão Mútua, Posse e Espera, Não-Preempção e Espera Circular.',
        'Rodada 2 (Quebrando Condições): Peça que a turma proponha mudanças na regra (ex: numerar os garfos de 1 a 5 e exigir pegar sempre o de menor número primeiro, ou colocar um 6º aluno como "Garçom/Mutex").'
      ]
    },
    authorName: 'Acervo Base SO',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'local-3',
    title: 'Laboratório Prático: Criando um Mini-Shell em C',
    description: 'Roteiro guiado para implementar um interpretador de comandos POSIX usando chamadas de sistema fork(), execvp(), waitpid() e redirecionamento com dup2().',
    category: 'tarefa',
    module: 'processos_threads',
    difficulty: 'Intermediário',
    tags: ['Syscalls', 'POSIX', 'Linguagem C', 'Fork'],
    externalUrl: 'https://brennan.io/2015/01/16/write-a-shell-in-c/',
    authorName: 'Acervo Base SO',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'local-4',
    title: 'CPUlator: Simulador de Sistema Computacional e E/S',
    description: 'Simulador web completo (ARMv7, Nios II e MIPS) com dispositivos de Entrada/Saída mapeados em memória, interrupções de timer e depuração passo a passo.',
    category: 'plataforma',
    module: 'arquitetura_so',
    difficulty: 'Avançado',
    tags: ['Interrupções', 'Modo Kernel', 'Assembly', 'Simulador Web'],
    externalUrl: 'https://cpulator.01xz.net/',
    authorName: 'Acervo Base SO',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'local-5',
    title: 'Caça ao Tesouro com Inodes e Links Simbólicos',
    description: 'Desafio prático no terminal Linux onde os alunos investigam números de inode, hard links, soft links e permissões para encontrar uma chave oculta.',
    category: 'tarefa',
    module: 'sistemas_arquivos',
    difficulty: 'Iniciante',
    tags: ['Inode', 'EXT4', 'Hard Link', 'Linux CLI'],
    externalUrl: 'https://overthewire.org/wargames/bandit/',
    authorName: 'Acervo Base SO',
    createdAt: Date.now() - 14400000
  }
];