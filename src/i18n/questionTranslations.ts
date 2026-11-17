import { ENADE_QUESTIONS, SUBJECT_QUESTIONS, TOPIC_LABELS } from '../data/questions';

interface QuestionCopy {
  prompt: string;
  alternatives: string[];
  explanation: string;
}

const SOURCE_QUESTIONS = [...SUBJECT_QUESTIONS, ...ENADE_QUESTIONS];

function createMessageMap(copies: QuestionCopy[]) {
  const messages: Record<string, string> = {};
  SOURCE_QUESTIONS.forEach((question, index) => {
    const copy = copies[index];
    messages[question.prompt] = copy.prompt;
    messages[question.explanation] = copy.explanation;
    question.alternatives.forEach((alternative, alternativeIndex) => {
      messages[alternative] = copy.alternatives[alternativeIndex];
    });
  });
  Object.entries(TOPIC_LABELS).forEach(([topic, label]) => {
    messages[label] = topicTranslations[topic];
  });
  return messages;
}

const topicTranslations: Record<string, string> = {
  introducao: 'Introduction and OS architecture',
  processos: 'Processes and threads',
  memoria: 'Memory management',
  sincronizacao: 'Synchronization and deadlocks',
  arquivos: 'File management system',
  io: 'Input / Output (I/O)',
  seguranca: 'Security and protection',
  virtualizacao: 'Virtualization and containers',
};

const englishQuestionMessages = createMessageMap([
  {
    prompt: 'In an operating system, what is the main purpose of a context switch?',
    alternatives: [
      'Replace the file system with a temporary copy.',
      'Save one task’s state and restore another’s state so execution can switch between them.',
      'Convert a process into a thread without system intervention.',
      'Always move the entire process from main memory to disk.',
      'Increase the processor frequency during I/O operations.',
    ],
    explanation: 'A context switch saves the current task’s state and restores the next task’s state, allowing the scheduler to share the CPU among processes or threads.',
  },
  {
    prompt: 'Which situation describes a blocked thread?',
    alternatives: [
      'It is using the CPU and executing instructions normally.',
      'It has terminated and can no longer be scheduled.',
      'It is waiting for an event, such as an I/O operation to complete.',
      'It is always ready to run but has lost its priority.',
      'It has been copied to another processor core.',
    ],
    explanation: 'A blocked thread is waiting for an event or resource. When the condition is met, it can return to the ready state.',
  },
  {
    prompt: 'In paged virtual memory, what relationship does the page table describe?',
    alternatives: [
      'Each user file and an I/O device.',
      'Logical pages and their corresponding frames in physical memory.',
      'Each process and a fixed execution priority.',
      'Machine instructions and their CPU registers.',
      'Free disk blocks and system directories.',
    ],
    explanation: 'The page table maps pages in a virtual address space to frames in physical memory, or indicates that a page is not currently resident.',
  },
  {
    prompt: 'What happens during a page fault?',
    alternatives: [
      'The CPU automatically terminates the process that requested the page.',
      'The operating system handles the access and may load the page from storage into memory.',
      'The page is permanently removed from the process’s virtual address space.',
      'The process receives an exclusive frame that cannot be replaced.',
      'The compiler erases and rebuilds the page table.',
    ],
    explanation: 'A page fault occurs when an accessed page is not in main memory. The operating system validates the access and, if it is valid, loads the page from storage.',
  },
  {
    prompt: 'Why should a critical section be protected by synchronization mechanisms?',
    alternatives: [
      'To prevent different processes from using virtual memory.',
      'To avoid race conditions when accessing shared data.',
      'To ensure that all threads run on the same CPU.',
      'To eliminate every form of concurrency from the system.',
      'To convert asynchronous operations into disk operations.',
    ],
    explanation: 'Synchronization coordinates access to shared data and prevents inconsistent results caused by uncontrolled interleavings.',
  },
  {
    prompt: 'Which set contains the four classic conditions necessary for a deadlock to occur?',
    alternatives: [
      'Mutual exclusion, hold and wait, no preemption, and circular wait.',
      'Paging, segmentation, sharing, and preemption.',
      'Concurrency, parallelism, interruption, and scheduling.',
      'Mutual exclusion, paging, busy waiting, and fragmentation.',
      'Hold and wait, context switching, preemption, and starvation.',
    ],
    explanation: 'The Coffman conditions are mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one of them can prevent deadlocks.',
  },
  {
    prompt: 'What information is typically stored in a file metadata structure such as an inode?',
    alternatives: [
      'The complete contents of every file in the system.',
      'Only the name shown in the directory.',
      'File attributes and references to the blocks that store its data.',
      'The source code of the process that created the file.',
      'The passwords of users who have opened the file.',
    ],
    explanation: 'On systems such as Unix, an inode stores attributes and references to data blocks. A directory entry associates the file name with the inode.',
  },
  {
    prompt: 'An application runs two independent tasks. One waits for a network response while the other performs calculations. Considering threads in the same process, choose the correct statement.',
    alternatives: [
      'When one thread waits, all other threads in the process must terminate.',
      'Threads can allow another task to make progress while one waits for I/O.',
      'Threads in the same process always have completely isolated address spaces.',
      'Creating threads removes the need for CPU scheduling.',
      'A thread can run only when all other threads in the process are blocked.',
    ],
    explanation: 'Threads enable concurrency within a process. While one waits for I/O, another can be scheduled, although the actual benefit depends on available resources and workload.',
  },
  {
    prompt: 'A system with virtual memory serves several processes even though the sum of their address spaces exceeds available physical memory. This is primarily enabled by',
    alternatives: [
      'running all processes exclusively in cache.',
      'permanently allocating every virtual page to a physical frame.',
      'address translation combined with on-demand loading of parts of processes.',
      'automatically converting virtual pages into threads.',
      'removing memory protection between processes.',
    ],
    explanation: 'Virtual memory uses address translation and can keep nonresident pages in storage, bringing them into main memory when needed.',
  },
  {
    prompt: 'Two threads concurrently update a shared counter using the sequence “read, increment, write.” Even if each individual operation is atomic, the final result may be incorrect because',
    alternatives: [
      'the scheduler does not allow threads to switch.',
      'the entire sequence is not atomic and may be interleaved.',
      'shared variables are always copied to disk.',
      'the counter ceases to be a reusable resource.',
      'virtual memory prevents concurrent reads.',
    ],
    explanation: 'Atomicity of each isolated read or write does not protect the compound operation. A critical section or suitable atomic operation prevents the race condition.',
  },
  {
    prompt: 'In a hierarchical file system, a directory can be understood as a structure that',
    alternatives: [
      'stores only the binary data of all child files.',
      'maps entry names to files or other directories.',
      'replaces the operating system’s access-control mechanisms.',
      'guarantees that no file can have more than one name.',
      'always keeps a complete copy of every file.',
    ],
    explanation: 'Directories organize the namespace and map names to files and subdirectories. File data and metadata are managed by the file system’s own structures.',
  },
]);

const spanishQuestionMessages = createMessageMap([
  {
    prompt: 'En un sistema operativo, ¿cuál es la función principal de un cambio de contexto?',
    alternatives: [
      'Sustituir el sistema de archivos por una copia temporal.',
      'Guardar el estado de una tarea y restaurar el de otra para alternar su ejecución.',
      'Convertir un proceso en un hilo sin intervención del sistema.',
      'Mover siempre todo el proceso de la memoria principal al disco.',
      'Aumentar la frecuencia del procesador durante operaciones de entrada/salida.',
    ],
    explanation: 'El cambio de contexto guarda el estado de la tarea actual y restaura el de la siguiente, lo que permite al planificador compartir la CPU entre procesos o hilos.',
  },
  {
    prompt: '¿Qué situación caracteriza a un hilo bloqueado?',
    alternatives: [
      'Está usando la CPU y ejecutando instrucciones normalmente.',
      'Ha terminado y ya no puede planificarse.',
      'Espera un evento, como la finalización de una operación de entrada/salida.',
      'Siempre está listo para ejecutarse, pero ha perdido prioridad.',
      'Se ha copiado a otro núcleo del procesador.',
    ],
    explanation: 'Un hilo bloqueado espera un evento o recurso. Cuando se cumple la condición, puede volver al estado preparado.',
  },
  {
    prompt: 'En la memoria virtual paginada, ¿qué relación describe la tabla de páginas?',
    alternatives: [
      'Cada archivo de usuario y un dispositivo de entrada/salida.',
      'Las páginas lógicas y sus marcos correspondientes en la memoria física.',
      'Cada proceso y una prioridad fija de ejecución.',
      'Las instrucciones de máquina y sus registros de CPU.',
      'Los bloques libres del disco y los directorios del sistema.',
    ],
    explanation: 'La tabla de páginas asigna páginas del espacio virtual a marcos de la memoria física, o indica que una página no está residente.',
  },
  {
    prompt: '¿Qué ocurre cuando se produce un fallo de página?',
    alternatives: [
      'La CPU termina automáticamente el proceso que solicitó la página.',
      'El sistema operativo atiende el acceso y puede cargar la página del almacenamiento a la memoria.',
      'La página se elimina permanentemente del espacio virtual del proceso.',
      'El proceso recibe un marco exclusivo que no puede reemplazarse.',
      'El compilador borra y reconstruye la tabla de páginas.',
    ],
    explanation: 'Un fallo de página ocurre cuando la página solicitada no está en la memoria principal. El sistema operativo valida el acceso y, si es válido, carga la página desde el almacenamiento.',
  },
  {
    prompt: '¿Por qué debe protegerse una sección crítica mediante mecanismos de sincronización?',
    alternatives: [
      'Para impedir que distintos procesos utilicen memoria virtual.',
      'Para evitar condiciones de carrera al acceder a datos compartidos.',
      'Para garantizar que todos los hilos se ejecuten en la misma CPU.',
      'Para eliminar cualquier forma de concurrencia del sistema.',
      'Para convertir operaciones asíncronas en operaciones de disco.',
    ],
    explanation: 'La sincronización coordina el acceso a datos compartidos y evita resultados incoherentes causados por intercalados no controlados.',
  },
  {
    prompt: '¿Qué conjunto reúne las cuatro condiciones clásicas necesarias para que ocurra un bloqueo mutuo (deadlock)?',
    alternatives: [
      'Exclusión mutua, retención y espera, sin expropiación y espera circular.',
      'Paginación, segmentación, compartición y expropiación.',
      'Concurrencia, paralelismo, interrupción y planificación.',
      'Exclusión mutua, paginación, espera activa y fragmentación.',
      'Retención y espera, cambio de contexto, expropiación e inanición.',
    ],
    explanation: 'Las condiciones de Coffman son exclusión mutua, retención y espera, sin expropiación y espera circular. Romper cualquiera de ellas puede prevenir bloqueos mutuos.',
  },
  {
    prompt: '¿Qué información suele almacenarse en una estructura de metadatos de archivo, como un inode?',
    alternatives: [
      'El contenido completo de todos los archivos del sistema.',
      'Solo el nombre mostrado en el directorio.',
      'Atributos del archivo y referencias a los bloques que guardan sus datos.',
      'El código fuente del proceso que creó el archivo.',
      'Las contraseñas de los usuarios que han abierto el archivo.',
    ],
    explanation: 'En sistemas como Unix, el inode guarda atributos y referencias a bloques de datos. Una entrada de directorio asocia el nombre del archivo con el inode.',
  },
  {
    prompt: 'Una aplicación ejecuta dos tareas independientes. Una espera una respuesta de red mientras la otra realiza cálculos. Considerando hilos del mismo proceso, elige la afirmación correcta.',
    alternatives: [
      'La espera de un hilo necesariamente termina todos los demás hilos del proceso.',
      'Los hilos pueden permitir que otra tarea avance mientras uno espera una operación de entrada/salida.',
      'Los hilos del mismo proceso siempre tienen espacios de direcciones completamente aislados.',
      'Crear hilos elimina la necesidad de planificación de CPU.',
      'Un hilo solo puede ejecutarse cuando todos los demás del proceso están bloqueados.',
    ],
    explanation: 'Los hilos permiten concurrencia dentro de un proceso. Mientras uno espera una operación de entrada/salida, otro puede planificarse, aunque el beneficio real depende de los recursos y la carga.',
  },
  {
    prompt: 'Un sistema con memoria virtual atiende varios procesos aunque la suma de sus espacios de direcciones supere la memoria física disponible. Esto se hace posible principalmente mediante',
    alternatives: [
      'la ejecución de todos los procesos exclusivamente en caché.',
      'la asignación permanente de cada página virtual a un marco físico.',
      'la traducción de direcciones y la carga bajo demanda de partes de los procesos.',
      'la conversión automática de páginas virtuales en hilos.',
      'la eliminación de la protección de memoria entre procesos.',
    ],
    explanation: 'La memoria virtual utiliza traducción de direcciones y puede mantener páginas no residentes en almacenamiento, cargándolas en memoria principal cuando se necesitan.',
  },
  {
    prompt: 'Dos hilos actualizan simultáneamente un contador compartido mediante la secuencia «leer, incrementar, escribir». Aunque cada operación individual sea atómica, el resultado final puede ser incorrecto porque',
    alternatives: [
      'el planificador no permite alternar entre hilos.',
      'la secuencia completa no es atómica y puede intercalarse.',
      'las variables compartidas siempre se copian al disco.',
      'el contador deja de ser un recurso reutilizable.',
      'la memoria virtual impide las lecturas simultáneas.',
    ],
    explanation: 'La atomicidad de cada lectura o escritura aislada no protege la operación compuesta. Una sección crítica u operación atómica adecuada evita la condición de carrera.',
  },
  {
    prompt: 'En un sistema de archivos jerárquico, un directorio puede entenderse como una estructura que',
    alternatives: [
      'almacena exclusivamente los datos binarios de todos los archivos hijos.',
      'asocia nombres de entradas con archivos u otros directorios.',
      'sustituye los mecanismos de control de acceso del sistema operativo.',
      'garantiza que ningún archivo pueda tener más de un nombre.',
      'mantiene necesariamente una copia completa de cada archivo.',
    ],
    explanation: 'Los directorios organizan el espacio de nombres y asocian nombres con archivos y subdirectorios. Los datos y metadatos se gestionan mediante estructuras propias del sistema de archivos.',
  },
]);

const chineseQuestionMessages = createMessageMap([
  {
    prompt: '在操作系统中，上下文切换的主要作用是什么？',
    alternatives: [
      '用临时副本替换文件系统。',
      '保存一个任务的状态并恢复另一个任务的状态，从而切换执行。',
      '在没有系统干预的情况下将进程转换为线程。',
      '始终将整个进程从主存移到磁盘。',
      '在输入/输出操作期间提高处理器频率。',
    ],
    explanation: '上下文切换保存当前任务的状态并恢复下一个任务的状态，使调度器能够在进程或线程之间共享 CPU。',
  },
  {
    prompt: '以下哪种情况表示线程处于阻塞状态？',
    alternatives: [
      '正在使用 CPU 并正常执行指令。',
      '已经结束，不能再被调度。',
      '正在等待某个事件，例如输入/输出操作完成。',
      '始终处于就绪状态，但优先级降低。',
      '已被复制到另一个处理器核心。',
    ],
    explanation: '阻塞线程正在等待事件或资源。条件满足后，它可以返回就绪状态。',
  },
  {
    prompt: '在分页虚拟内存中，页表描述什么对应关系？',
    alternatives: [
      '用户文件与输入/输出设备的对应关系。',
      '逻辑页与物理内存中对应页框的关系。',
      '进程与固定执行优先级的关系。',
      '机器指令与 CPU 寄存器的关系。',
      '空闲磁盘块与系统目录的关系。',
    ],
    explanation: '页表将虚拟地址空间中的页面映射到物理内存页框，或标记页面当前不在内存中。',
  },
  {
    prompt: '发生缺页异常时会怎样？',
    alternatives: [
      'CPU 自动终止请求该页面的进程。',
      '操作系统处理访问，并可能将页面从存储设备加载到内存。',
      '该页面从进程的虚拟地址空间中永久删除。',
      '进程获得一个不可替换的专用页框。',
      '编译器清除并重建页表。',
    ],
    explanation: '访问的页面不在主存中时会发生缺页。操作系统验证访问是否合法，若合法则从存储设备调入页面。',
  },
  {
    prompt: '为什么需要使用同步机制保护临界区？',
    alternatives: [
      '阻止不同进程使用虚拟内存。',
      '避免访问共享数据时发生竞争条件。',
      '确保所有线程都在同一个 CPU 上运行。',
      '消除系统中的所有并发。',
      '将异步操作转换为磁盘操作。',
    ],
    explanation: '同步机制协调对共享数据的访问，并避免无控制交错执行导致的不一致结果。',
  },
  {
    prompt: '以下哪一组选项包含死锁发生所需的四个经典条件？',
    alternatives: [
      '互斥、占有并等待、不可抢占和循环等待。',
      '分页、分段、共享和抢占。',
      '并发、并行、中断和调度。',
      '互斥、分页、忙等待和碎片。',
      '占有并等待、上下文切换、抢占和饥饿。',
    ],
    explanation: 'Coffman 条件包括互斥、占有并等待、不可抢占和循环等待。破坏其中任意一个条件都可能避免死锁。',
  },
  {
    prompt: 'inode 等文件元数据结构通常保存哪些信息？',
    alternatives: [
      '系统中所有文件的完整内容。',
      '目录中显示的文件名。',
      '文件属性以及指向其数据块的引用。',
      '创建文件的进程源代码。',
      '曾打开该文件的用户密码。',
    ],
    explanation: '在 Unix 等系统中，inode 保存文件属性和数据块引用。目录项负责将文件名关联到 inode。',
  },
  {
    prompt: '某应用运行两个独立任务。一个任务等待网络响应，另一个执行计算。对于同一进程中的线程，以下哪项正确？',
    alternatives: [
      '一个线程等待时，进程中的其他所有线程都必须终止。',
      '一个线程等待输入/输出时，其他任务可能继续推进。',
      '同一进程中的线程始终拥有完全隔离的地址空间。',
      '创建线程后不再需要 CPU 调度。',
      '只有进程中的其他所有线程都阻塞时，某个线程才能运行。',
    ],
    explanation: '线程支持进程内的并发。一个线程等待输入/输出时，另一个线程可以被调度，但实际收益取决于可用资源和工作负载。',
  },
  {
    prompt: '一个使用虚拟内存的系统可以服务多个进程，即使它们的地址空间总和超过可用物理内存。这主要通过以下方式实现：',
    alternatives: [
      '所有进程都只在缓存中运行。',
      '将每个虚拟页永久分配给一个物理页框。',
      '地址转换与按需加载进程的部分内容。',
      '自动将虚拟页转换为线程。',
      '取消进程之间的内存保护。',
    ],
    explanation: '虚拟内存通过地址转换管理内存，并可将未驻留页面保存在存储设备中，需要时再调入主存。',
  },
  {
    prompt: '两个线程同时通过“读取、递增、写入”的步骤更新共享计数器。即使每个单独操作都是原子的，最终结果仍可能错误，因为：',
    alternatives: [
      '调度器不允许线程切换。',
      '整个步骤序列不是原子的，可能发生交错执行。',
      '共享变量总是被复制到磁盘。',
      '计数器不再是可重用资源。',
      '虚拟内存阻止并发读取。',
    ],
    explanation: '单独读写操作的原子性无法保护复合操作。临界区或合适的原子操作可以避免竞争条件。',
  },
  {
    prompt: '在层次化文件系统中，目录可以理解为一种用于以下用途的结构：',
    alternatives: [
      '只存储所有子文件的二进制数据。',
      '将目录项名称映射到文件或其他目录。',
      '取代操作系统的访问控制机制。',
      '保证每个文件只能有一个名称。',
      '始终保存每个文件的完整副本。',
    ],
    explanation: '目录组织名称空间，并将名称关联到文件和子目录。文件数据及元数据由文件系统自身的结构管理。',
  },
]);

export { englishQuestionMessages, spanishQuestionMessages, chineseQuestionMessages };
