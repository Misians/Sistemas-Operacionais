import type { QuestionTopic, QuestionType } from '../types/question';

export interface QuizQuestion {
  type?: QuestionType;
  topic: QuestionTopic;
  prompt: string;
  alternatives: string[];
  answer: number;
  explanation: string;
  imageUrl?: string;
  imageAlt?: string;
  expectedAnswer?: string;
  expectedLines?: number;
}

export const TOPIC_LABELS: Record<string, string> = {
  introducao: 'Introdução e arquitetura de SO',
  processos: 'Processos e threads',
  memoria: 'Gerenciamento de memória',
  sincronizacao: 'Sincronização e deadlocks',
  arquivos: 'Sistema de gerenciamento de arquivos',
  io: 'Entrada e Saída (E/S / I/O)',
  seguranca: 'Segurança e proteção',
  virtualizacao: 'Virtualização e contêineres',
};

export function getTopicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic;
}

export const SUBJECT_QUESTIONS: QuizQuestion[] = [
  {
    topic: 'processos',
    prompt: 'Em um sistema operacional, qual é a principal função de uma troca de contexto?',
    alternatives: [
      'Substituir o sistema de arquivos por uma cópia temporária.',
      'Salvar o estado de uma tarefa e restaurar o estado de outra para permitir alternância de execução.',
      'Converter um processo em uma thread sem intervenção do sistema.',
      'Mover obrigatoriamente todo o processo da memória principal para o disco.',
      'Aumentar a frequência do processador durante operações de entrada e saída.',
    ],
    answer: 1,
    explanation: 'A troca de contexto preserva o estado da tarefa atual e restaura o da próxima, permitindo ao escalonador compartilhar a CPU entre processos ou threads.',
  },
  {
    topic: 'processos',
    prompt: 'Qual situação caracteriza uma thread bloqueada?',
    alternatives: [
      'Está usando a CPU e executando instruções normalmente.',
      'Foi encerrada e não pode mais ser escalonada.',
      'Aguarda um evento, como a conclusão de uma operação de entrada e saída.',
      'Está sempre pronta para executar, mas perdeu sua prioridade.',
      'Foi copiada para outro núcleo do processador.',
    ],
    answer: 2,
    explanation: 'Uma thread bloqueada aguarda um evento ou recurso. Quando a condição é satisfeita, ela pode voltar ao estado pronto.',
  },
  {
    topic: 'memoria',
    prompt: 'Em memória virtual paginada, o que a tabela de páginas relaciona?',
    alternatives: [
      'Cada arquivo do usuário a um dispositivo de entrada e saída.',
      'Endereços lógicos de páginas aos frames correspondentes na memória física.',
      'Cada processo a uma prioridade fixa de execução.',
      'Instruções de máquina aos respectivos registradores da CPU.',
      'Blocos livres do disco aos diretórios do sistema.',
    ],
    answer: 1,
    explanation: 'A tabela de páginas mapeia páginas do espaço de endereçamento virtual para frames da memória física, ou indica que uma página não está residente.',
  },
  {
    topic: 'memoria',
    prompt: 'O que ocorre em uma falta de página (page fault)?',
    alternatives: [
      'A CPU encerra automaticamente o processo que solicitou a página.',
      'O sistema operacional trata o acesso e pode carregar a página do armazenamento para a memória.',
      'A página é removida permanentemente do espaço virtual do processo.',
      'O processo ganha um frame exclusivo que não pode ser substituído.',
      'A tabela de páginas é apagada e reconstruída pelo compilador.',
    ],
    answer: 1,
    explanation: 'Uma falta de página acontece quando a página acessada não está na memória principal. O sistema operacional verifica o acesso e, se válido, busca a página no armazenamento.',
  },
  {
    topic: 'sincronizacao',
    prompt: 'Por que uma seção crítica deve ser protegida por mecanismos de sincronização?',
    alternatives: [
      'Para impedir que diferentes processos utilizem memória virtual.',
      'Para evitar condições de corrida ao acessar dados compartilhados.',
      'Para garantir que todas as threads executem na mesma CPU.',
      'Para eliminar toda forma de concorrência do sistema.',
      'Para converter operações assíncronas em operações de disco.',
    ],
    answer: 1,
    explanation: 'A sincronização coordena o acesso a dados compartilhados e evita resultados inconsistentes causados por interleavings não controlados.',
  },
  {
    topic: 'sincronizacao',
    prompt: 'Qual conjunto reúne as quatro condições clássicas necessárias para a ocorrência de deadlock?',
    alternatives: [
      'Exclusão mútua, posse e espera, não preempção e espera circular.',
      'Paginação, segmentação, compartilhamento e preempção.',
      'Concorrência, paralelismo, interrupção e escalonamento.',
      'Exclusão mútua, paginação, espera ocupada e fragmentação.',
      'Posse e espera, troca de contexto, preempção e starvation.',
    ],
    answer: 0,
    explanation: 'As condições de Coffman são exclusão mútua, posse e espera, não preempção e espera circular. A quebra de qualquer uma delas pode prevenir deadlocks.',
  },
  {
    topic: 'arquivos',
    prompt: 'Qual informação é normalmente mantida em uma estrutura de metadados de arquivo, como um inode?',
    alternatives: [
      'O conteúdo completo de todos os arquivos do sistema.',
      'Apenas o nome exibido no diretório.',
      'Atributos do arquivo e referências aos blocos que armazenam seus dados.',
      'O código-fonte do processo que criou o arquivo.',
      'As senhas dos usuários que já abriram o arquivo.',
    ],
    answer: 2,
    explanation: 'Em sistemas como o Unix, o inode mantém atributos e referências aos blocos de dados. O nome do arquivo é associado ao inode por entradas de diretório.',
  },
];

export const ENADE_QUESTIONS: QuizQuestion[] = [
  {
    topic: 'processos',
    prompt: 'Uma aplicação executa duas tarefas independentes. Uma delas aguarda uma resposta de rede enquanto a outra realiza cálculos. Considerando threads de um mesmo processo, assinale a alternativa correta.',
    alternatives: [
      'A espera de uma thread necessariamente encerra todas as demais threads do processo.',
      'O uso de threads pode permitir que outra tarefa progrida enquanto uma delas aguarda entrada e saída.',
      'Threads do mesmo processo sempre possuem espaços de endereçamento completamente isolados.',
      'A criação de threads elimina a necessidade de escalonamento pela CPU.',
      'Uma thread só pode executar quando todas as demais do processo estão bloqueadas.',
    ],
    answer: 1,
    explanation: 'Threads permitem concorrência dentro de um processo. Enquanto uma aguarda entrada e saída, outra pode ser escalonada, embora o ganho efetivo dependa dos recursos e da carga.',
  },
  {
    topic: 'memoria',
    prompt: 'Um sistema com memória virtual atende a vários processos, embora a soma de seus espaços de endereçamento seja maior que a memória física disponível. Esse comportamento é viabilizado principalmente por',
    alternatives: [
      'a execução de todos os processos exclusivamente em cache.',
      'a alocação permanente de toda página virtual em um frame físico.',
      'a combinação de mapeamento de endereços e carregamento sob demanda de partes dos processos.',
      'a conversão automática de páginas virtuais em threads.',
      'a remoção da proteção de memória entre processos.',
    ],
    answer: 2,
    explanation: 'A memória virtual usa mecanismos de tradução e pode manter páginas não residentes no armazenamento, trazendo-as à memória principal quando necessárias.',
  },
  {
    topic: 'sincronizacao',
    prompt: 'Duas threads atualizam simultaneamente um contador compartilhado por meio da sequência “ler, incrementar, gravar”. Mesmo que cada operação individual seja atômica, o resultado final pode ser incorreto porque',
    alternatives: [
      'o escalonador não permite alternância entre threads.',
      'a sequência completa não é atômica e pode sofrer interleaving.',
      'variáveis compartilhadas são sempre copiadas para o disco.',
      'o contador deixa de ser um recurso reutilizável.',
      'a memória virtual impede leituras concorrentes.',
    ],
    answer: 1,
    explanation: 'A atomicidade de cada leitura ou gravação isolada não protege a operação composta. Uma seção crítica ou operação atômica apropriada evita a condição de corrida.',
  },
  {
    topic: 'arquivos',
    prompt: 'Em um sistema de arquivos hierárquico, um diretório pode ser compreendido como uma estrutura que',
    alternatives: [
      'armazena exclusivamente os dados binários de todos os arquivos filhos.',
      'associa nomes de entradas a arquivos ou a outros diretórios.',
      'substitui os mecanismos de controle de acesso do sistema operacional.',
      'garante que nenhum arquivo possa possuir mais de um nome.',
      'mantém obrigatoriamente uma cópia integral de cada arquivo.',
    ],
    answer: 1,
    explanation: 'Diretórios organizam o espaço de nomes e associam nomes a arquivos e subdiretórios. Os dados e metadados são gerenciados por estruturas próprias do sistema de arquivos.',
  },
];

export const DISCURSIVE_QUESTIONS: QuizQuestion[] = [
  {
    type: 'discursiva',
    topic: 'processos',
    prompt: 'Explique a diferença fundamental entre um processo e uma thread no contexto de compartilhamento de memória e custo de troca de contexto.',
    alternatives: [],
    answer: -1,
    expectedAnswer: 'Um processo possui seu próprio espaço de endereçamento isolado e recursos alocados pelo sistema operacional, tornando a troca de contexto mais custosa (envolve troca de tabela de páginas/TLB). Já threads pertencentes a um mesmo processo compartilham o espaço de endereçamento, código, dados e descritores de arquivos, mantendo apenas registradores e pilha próprios, o que torna a troca de contexto entre threads do mesmo processo mais rápida.',
    expectedLines: 6,
    explanation: 'Espera-se que o estudante destaque o isolamento de memória entre processos versus o compartilhamento do espaço de endereçamento entre threads de um mesmo processo, bem como o impacto na troca de contexto.',
  },
  {
    type: 'discursiva',
    topic: 'sincronizacao',
    prompt: 'Um sistema apresenta quatro recursos não preemptíveis disputados em ciclo por quatro processos. Como a quebra da condição de "posse e espera" ou "espera circular" pode evitar o deadlock nesse cenário?',
    alternatives: [],
    answer: -1,
    expectedAnswer: 'Para quebrar "posse e espera", pode-se exigir que cada processo solicite todos os recursos necessários de uma só vez antes de iniciar, ou libere os recursos já alocados antes de pedir novos. Para quebrar "espera circular", impõe-se uma ordenação numérica global dos recursos, obrigando os processos a solicitá-los sempre em ordem crescente.',
    expectedLines: 6,
    explanation: 'A resposta deve relacionar as condições de Coffman a estratégias práticas de prevenção de deadlock.',
  },
];
