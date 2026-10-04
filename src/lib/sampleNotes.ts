import { DocumentSource } from './types';

export const SAMPLE_DOCUMENTS: DocumentSource[] = [
  {
    id: 'sample-cs-search-algorithms',
    title: 'Computer Science: Search Algorithms & Heuristics',
    fileName: 'CS280_Lecture_04_Search_Algorithms.pdf',
    fileType: 'sample',
    fileSize: 428000,
    uploadedAt: '2026-09-28T10:15:00.000Z',
    pageCount: 3,
    wordCount: 1045,
    summary: 'Comprehensive lecture notes covering problem-solving through graph search, contrasting uninformed search strategies (BFS, DFS, Uniform Cost) with informed heuristic search (Greedy Best-First, A* Search), along with the formal requirements for admissible and consistent heuristics.',
    processingQuality: {
      status: 'clean',
      flags: ['Clean text extraction', '3 page boundaries preserved', 'All headings recognized'],
      emptyPages: [],
      ocrUsed: false,
      rawCharacterCount: 6890,
    },
    topics: [
      {
        id: 'topic-uninformed-search',
        title: 'Uninformed Search: BFS, DFS, and Uniform Cost',
        summary: 'Explores blind search strategies that have no domain knowledge about which non-goal states are most promising.',
        pageReferences: [1],
        keyTerms: ['Breadth-First Search', 'FIFO Queue', 'Completeness', 'Uniform Cost Search', 'Time Complexity'],
        chunkIds: ['chunk-cs-1', 'chunk-cs-2']
      },
      {
        id: 'topic-informed-heuristics',
        title: 'Heuristics & Informed Search',
        summary: 'Introduces domain-specific evaluation functions h(n) that estimate the cost from node n to the closest goal.',
        pageReferences: [2],
        keyTerms: ['Heuristic function h(n)', 'Greedy Best-First Search', 'Manhattan Distance', 'Euclidean Distance'],
        chunkIds: ['chunk-cs-3', 'chunk-cs-4']
      },
      {
        id: 'topic-astar-consistency',
        title: 'A* Search, Admissibility, and Consistency',
        summary: 'Details the evaluation function f(n) = g(n) + h(n) and the theoretical proofs for optimality under admissibility and consistency.',
        pageReferences: [2, 3],
        keyTerms: ['A* Algorithm', 'g(n) path cost', 'Admissible Heuristic', 'Consistent / Monotonic Heuristic', 'Triangle Inequality'],
        chunkIds: ['chunk-cs-5', 'chunk-cs-6']
      }
    ],
    pages: [
      {
        pageNumber: 1,
        wordCount: 348,
        confidence: 99,
        text: `CS280: ARTIFICIAL INTELLIGENCE & HEURISTIC SEARCH
Lecture 04: State Space Graphs and Uninformed Search

1. Search Problem Formulation
A classical search problem is defined by:
- State Space: All possible configurations in the world.
- Initial State: Where the agent begins.
- Actions and Transition Model: Available actions and the resulting next states.
- Goal Test: A boolean function checking if a given state satisfies the goal condition.
- Path Cost function g(n): Numeric cost of transitioning through a sequence of actions.

2. Uninformed (Blind) Search Strategies
In uninformed search, the search algorithm has no intuition about whether a non-goal state is closer to the objective than any other state.

- Breadth-First Search (BFS):
  - Frontier implemented as a FIFO (First-In, First-Out) queue.
  - Expands the shallowest unexpanded node first.
  - Completeness: Guaranteed to find a solution if one exists (finite branching factor b).
  - Optimality: Optimal if all step costs are equal (cost = 1 per step).
  - Time & Space Complexity: O(b^d), where b is branching factor and d is depth of shallowest goal. BFS requires massive memory because all leaf nodes must remain stored in frontier.

- Depth-First Search (DFS):
  - Frontier implemented as a LIFO (Last-In, First-Out) stack.
  - Expands the deepest node first.
  - Space Complexity: O(b * m), where m is maximum depth. Highly memory efficient compared to BFS.
  - Optimality: Not optimal; may find a deep path before exploring shallow alternatives.

- Uniform Cost Search (Dijkstra's Algorithm on graphs):
  - Frontier ordered by path cost g(n) using a Priority Queue.
  - Expands node with the lowest cumulative cost g(n).
  - Optimal for any positive step costs (step cost >= epsilon > 0).`
      },
      {
        pageNumber: 2,
        wordCount: 382,
        confidence: 98,
        text: `3. Informed (Heuristic) Search

Heuristic function h(n):
A heuristic function h(n) calculates an estimate of the cheapest path from node n to a goal state.
Properties of h(n):
- h(Goal) = 0 for any goal state.
- h(n) must be non-negative: h(n) >= 0 for all nodes.
- Designed using relaxed problems (dropping constraints from the original problem).

Example (8-puzzle):
- h1: Number of misplaced tiles.
- h2: Total Manhattan distance (sum of horizontal and vertical distances of tiles from their target positions).
Notice that h2 dominates h1: h2(n) >= h1(n) for all n, meaning h2 provides tighter lower bounds and explores fewer nodes.

4. Greedy Best-First Search
- Evaluation function: f(n) = h(n).
- Expands node estimated to be closest to the goal.
- Pitfall: Can get trapped in loops or follow false trails, because it ignores the path cost g(n) already accumulated.
- Neither complete nor optimal in general graphs.

5. A* Search Algorithm
- Evaluation function: f(n) = g(n) + h(n)
  where:
  - g(n) = actual exact cost incurred so far from start node to n.
  - h(n) = estimated cost from n to the goal.
  - f(n) = estimated total cost of the cheapest solution passing through node n.
- Priority queue ordered by ascending f(n).
- A* strikes the perfect balance: g(n) prevents wandering off on expensive paths, while h(n) directs the search toward the goal.`
      },
      {
        pageNumber: 3,
        wordCount: 315,
        confidence: 98,
        text: `6. Optimality Conditions for A*

Condition A: Admissibility (Tree Search & Graph Search)
A heuristic h(n) is admissible if it NEVER overestimates the true cost to reach the nearest goal state.
Formally:
  0 <= h(n) <= h*(n)
where h*(n) is the true optimal cost from node n to the goal.
An admissible heuristic is optimistic. If h(n) were to overestimate, A* might prematurely prune the true optimal path thinking it was too expensive.

Theorem: For Tree Search, A* is optimal if h(n) is admissible.

Condition B: Consistency / Monotonicity (Graph Search)
When applying A* to graphs (where duplicate states can be reached via different paths), admissibility alone is not always enough to prevent reopening closed nodes. We require Consistency.

A heuristic h(n) is consistent (or monotonic) if, for every node n and every successor n' generated by an action with step cost c(n, a, n'):
  h(n) <= c(n, a, n') + h(n')

This is the Triangle Inequality: the estimated cost to the goal from n cannot exceed the step cost to n' plus the estimated cost to the goal from n'.

Theorem: If h(n) is consistent, then:
1. f(n) along any path is non-decreasing: f(n') >= f(n).
2. Whenever A* selects a node for expansion, the optimal path to that node has already been found.
3. Graph-search A* is optimal and NEVER needs to re-open a previously closed node.`
      }
    ],
    chunks: [
      {
        id: 'chunk-cs-1',
        pageNumber: 1,
        topicId: 'topic-uninformed-search',
        text: 'A classical search problem is defined by State Space, Initial State, Actions/Transition Model, Goal Test, and Path Cost g(n). Breadth-First Search (BFS) uses a FIFO queue, expands shallowest nodes first, is complete and optimal when step costs are equal, but suffers from O(b^d) exponential memory consumption.',
        keywords: ['BFS', 'FIFO queue', 'path cost', 'completeness', 'memory consumption']
      },
      {
        id: 'chunk-cs-2',
        pageNumber: 1,
        topicId: 'topic-uninformed-search',
        text: 'Depth-First Search (DFS) uses a LIFO stack, expands deepest nodes first, with memory O(b*m), but is not optimal. Uniform Cost Search (Dijkstra) uses a priority queue ordered by cumulative path cost g(n) and is optimal for any positive step costs.',
        keywords: ['DFS', 'LIFO stack', 'Uniform Cost Search', 'Dijkstra', 'cumulative cost']
      },
      {
        id: 'chunk-cs-3',
        pageNumber: 2,
        topicId: 'topic-informed-heuristics',
        text: 'Heuristic function h(n) estimates cheapest cost from node n to the goal. h(Goal) = 0 and h(n) >= 0. Formulated by relaxing constraints. In 8-puzzle, Manhattan distance dominates misplaced tiles because h2(n) >= h1(n), leading to fewer node expansions.',
        keywords: ['heuristic', 'h(n)', 'relaxation', 'Manhattan distance', 'misplaced tiles']
      },
      {
        id: 'chunk-cs-4',
        pageNumber: 2,
        topicId: 'topic-informed-heuristics',
        text: 'Greedy Best-First Search uses f(n) = h(n). It expands nodes estimated closest to goal, but ignores accumulated path cost g(n), making it neither complete nor optimal.',
        keywords: ['Greedy Best-First Search', 'f(n)=h(n)', 'incomplete', 'suboptimal']
      },
      {
        id: 'chunk-cs-5',
        pageNumber: 2,
        topicId: 'topic-astar-consistency',
        text: 'A* Search evaluates f(n) = g(n) + h(n), where g(n) is exact cost from start to n, and h(n) is estimated cost from n to goal. Priority queue expands lowest f(n) first, combining Dijkstra search with heuristic direction.',
        keywords: ['A* Search', 'f(n)=g(n)+h(n)', 'priority queue', 'optimal search']
      },
      {
        id: 'chunk-cs-6',
        pageNumber: 3,
        topicId: 'topic-astar-consistency',
        text: 'Admissibility means 0 <= h(n) <= h*(n); it never overestimates true cost to goal. For graph search, Consistency requires h(n) <= c(n, a, n\') + h(n\') (Triangle Inequality). Consistency guarantees f(n) is monotonic and A* never needs to re-open closed nodes.',
        keywords: ['admissibility', 'consistency', 'monotonicity', 'triangle inequality', 'closed nodes']
      }
    ]
  },
  {
    id: 'sample-bio-neuroscience',
    title: 'Neuroscience: Action Potentials & Synaptic Transmission',
    fileName: 'BIO120_Unit_3_Neural_Communication.pdf',
    fileType: 'sample',
    fileSize: 389000,
    uploadedAt: '2026-09-29T14:20:00.000Z',
    pageCount: 3,
    wordCount: 960,
    summary: 'Study guide detailing the electrophysiological basis of neural signaling: the resting membrane potential, ion gradients maintained by Na+/K+ ATPase, voltage-gated ion channel kinetics, action potential generation, and vesicular neurotransmitter release at the chemical synapse.',
    processingQuality: {
      status: 'clean',
      flags: ['Clean text extraction', '3 page boundaries preserved', 'Equations and ions extracted cleanly'],
      emptyPages: [],
      ocrUsed: false,
      rawCharacterCount: 6150,
    },
    topics: [
      {
        id: 'topic-resting-potential',
        title: 'Resting Membrane Potential & Ion Gradients',
        summary: 'Examines the chemical and electrical forces that establish the resting potential of -70 mV in neurons.',
        pageReferences: [1],
        keyTerms: ['Resting Potential (-70mV)', 'Na+/K+ ATPase Pump', 'Potassium Leak Channels', 'Electrochemical Gradient'],
        chunkIds: ['chunk-bio-1', 'chunk-bio-2']
      },
      {
        id: 'topic-action-potential-phases',
        title: 'Action Potential: Depolarization & Repolarization',
        summary: 'Step-by-step mechanisms of voltage-gated Na+ and K+ channels during the all-or-none spike.',
        pageReferences: [2],
        keyTerms: ['Threshold (-55mV)', 'Voltage-Gated Na+ Channels', 'Depolarization', 'Repolarization', 'Refractory Periods'],
        chunkIds: ['chunk-bio-3', 'chunk-bio-4']
      },
      {
        id: 'topic-chemical-synapse',
        title: 'Synaptic Transmission & Neurotransmitter Release',
        summary: 'How an electrical action potential triggers calcium influx and exocytosis of neurotransmitters into the synaptic cleft.',
        pageReferences: [3],
        keyTerms: ['Voltage-Gated Ca2+ Channels', 'SNARE Proteins', 'Exocytosis', 'Synaptic Cleft', 'EPSP vs IPSP'],
        chunkIds: ['chunk-bio-5', 'chunk-bio-6']
      }
    ],
    pages: [
      {
        pageNumber: 1,
        wordCount: 310,
        confidence: 99,
        text: `NEUROBIOLOGY 120: NEURAL COMMUNICATION
Module 3: Bioelectricity and Membrane Dynamics

1. The Resting Membrane Potential (RMP)
In an unstimulated neuron, the interior of the cell membrane is negatively charged relative to the extracellular fluid. The typical resting membrane potential is approximately -70 millivolts (-70 mV).

Key Factors Establishing RMP:
- Unequal Distribution of Ions:
  - Intracellular: High concentration of Potassium ions (K+) and large non-permeable negatively charged proteins (A-).
  - Extracellular: High concentration of Sodium ions (Na+) and Chloride ions (Cl-).
- Differential Membrane Permeability:
  - The resting membrane possesses abundant open non-gated Potassium leak channels. It is roughly 25 to 30 times more permeable to K+ than to Na+.
  - K+ diffuses outward down its concentration gradient until the growing electrical negativity inside pulls it back, reaching equilibrium near -90 mV.
- The Sodium-Potassium Pump (Na+/K+ ATPase):
  - Actively transports 3 Na+ ions OUT of the neuron for every 2 K+ ions pumped IN.
  - Consumes ATP (hydrolyzes 1 ATP per cycle).
  - Electrogenic: contributes ~3-5 mV directly to negativity, but primarily maintains the steep concentration gradients required for signaling.`
      },
      {
        pageNumber: 2,
        wordCount: 345,
        confidence: 98,
        text: `2. The Action Potential: All-or-None Event
An action potential is a rapid, transient reversal of membrane polarity from -70 mV to approximately +30 mV, propagating without decrement.

Phases of the Action Potential:
A. Threshold of Excitation:
- Stimulus-induced graded potentials summate at the axon hillock.
- When depolarization reaches threshold (typically -55 mV), voltage-gated Na+ channels rapidly open.

B. Depolarization Phase (Upstroke):
- Influx of Na+ ions down both chemical and electrical gradients.
- Positive feedback loop (Hodgkin cycle): Depolarization opens more Na+ channels -> increased Na+ influx -> further depolarization.
- Membrane potential peaks at +30 mV.

C. Repolarization Phase:
- At peak (+30 mV), the inactivation gates of voltage-gated Na+ channels close (channel enters inactive state).
- Voltage-gated K+ channels slowly open.
- Efflux of K+ ions rushes out of the cell, restoring the negative internal potential.

D. Hyperpolarization (Undershoot):
- Voltage-gated K+ channels close slowly, causing membrane potential to briefly dip to ~ -80 mV before leak channels and Na+/K+ pump restore RMP.

3. Refractory Periods:
- Absolute Refractory Period: Na+ channels are inactivated; impossible to fire another action potential. Enforces one-way propagation.
- Relative Refractory Period: Na+ channels have reset to closed resting state, but K+ channels remain open; requires a stronger suprathreshold stimulus to fire.`
      },
      {
        pageNumber: 3,
        wordCount: 305,
        confidence: 99,
        text: `4. Synaptic Transmission at the Chemical Synapse

When the action potential arrives at the axon terminal, electrical signaling is converted into chemical signaling:

Step 1: Depolarization of the presynaptic terminal triggers the opening of Voltage-Gated Calcium Channels (VGCCs).
Step 2: Ca2+ rushes INTO the presynaptic terminal down its steep electrochemical gradient (extracellular Ca2+ is ~1-2 mM; intracellular is ~100 nM).
Step 3: Ca2+ binds to synaptotagmin, activating SNARE complex proteins (v-SNARE synaptobrevin and t-SNAREs syntaxin / SNAP-25).
Step 4: Vesicle fusion and Exocytosis: Synaptic vesicles fuse with the presynaptic plasma membrane, releasing neurotransmitter molecules into the synaptic cleft (~20-40 nm wide).
Step 5: Diffusion: Neurotransmitters diffuse across the cleft and bind to specific postsynaptic receptors.
  - Ionotropic receptors (ligand-gated ion channels): fast, direct response. E.g., Nicotinic ACh receptors allow Na+ influx -> EPSP.
  - Metabotropic receptors (G-protein coupled receptors): slower, prolonged second-messenger cascades.
Step 6: Termination of Signal: Neurotransmitter is cleared by reuptake transporters, enzymatic breakdown (e.g., Acetylcholinesterase), or diffusion away from the cleft.`
      }
    ],
    chunks: [
      {
        id: 'chunk-bio-1',
        pageNumber: 1,
        topicId: 'topic-resting-potential',
        text: 'The resting membrane potential (RMP) is approximately -70 mV. Intracellular fluid has high K+ and negative proteins; extracellular has high Na+ and Cl-. The membrane is 25-30x more permeable to K+ via potassium leak channels.',
        keywords: ['resting membrane potential', '-70mV', 'potassium leak channels', 'intracellular', 'permeability']
      },
      {
        id: 'chunk-bio-2',
        pageNumber: 1,
        topicId: 'topic-resting-potential',
        text: 'The Na+/K+ ATPase pump actively exports 3 Na+ ions for every 2 K+ ions imported, consuming 1 ATP molecule. It maintains the ion concentration gradients essential for electrical excitability.',
        keywords: ['Na+/K+ ATPase', 'sodium potassium pump', '3 Na+ out', '2 K+ in', 'ATP consumption']
      },
      {
        id: 'chunk-bio-3',
        pageNumber: 2,
        topicId: 'topic-action-potential-phases',
        text: 'When depolarization reaches threshold (-55 mV) at the axon hillock, voltage-gated Na+ channels rapidly open. Sodium influx drives membrane potential to +30 mV in an all-or-none Hodgkin cycle.',
        keywords: ['threshold', '-55mV', 'depolarization', 'voltage-gated Na+ channels', '+30mV']
      },
      {
        id: 'chunk-bio-4',
        pageNumber: 2,
        topicId: 'topic-action-potential-phases',
        text: 'At +30 mV, Na+ channel inactivation gates close and voltage-gated K+ channels open. K+ efflux repolarizes the membrane. Delayed closing of K+ channels creates hyperpolarization undershoot (~ -80 mV). The absolute refractory period prevents retrograde propagation.',
        keywords: ['repolarization', 'hyperpolarization', 'refractory period', 'K+ efflux', 'Na+ inactivation']
      },
      {
        id: 'chunk-bio-5',
        pageNumber: 3,
        topicId: 'topic-chemical-synapse',
        text: 'Arrival of action potential at presynaptic terminal opens voltage-gated Ca2+ channels. Inward Ca2+ flux triggers synaptotagmin and SNARE complexes (syntaxin, SNAP-25, synaptobrevin) to mediate vesicle exocytosis into synaptic cleft.',
        keywords: ['voltage-gated Ca2+ channels', 'synaptotagmin', 'SNARE proteins', 'exocytosis', 'synaptic cleft']
      },
      {
        id: 'chunk-bio-6',
        pageNumber: 3,
        topicId: 'topic-chemical-synapse',
        text: 'Released neurotransmitters diffuse across the 20-40 nm cleft and bind ionotropic (ligand-gated) or metabotropic (GPCR) receptors. Signals terminate via reuptake, enzymatic degradation (e.g. acetylcholinesterase), or diffusion.',
        keywords: ['ionotropic receptors', 'metabotropic receptors', 'acetylcholinesterase', 'reuptake', 'postsynaptic']
      }
    ]
  },
  {
    id: 'sample-econ-market-structures',
    title: 'Economics: Market Structures & Price Elasticity',
    fileName: 'ECON101_Micro_Revision_Notes.pdf',
    fileType: 'sample',
    fileSize: 310000,
    uploadedAt: '2026-09-30T09:00:00.000Z',
    pageCount: 2,
    wordCount: 780,
    summary: 'Core microeconomics revision notes analyzing market models: Perfect Competition vs. Pure Monopoly, profit maximization conditions (MR = MC), Price Elasticity of Demand (PED), consumer/producer surplus, and allocative inefficiency (Deadweight Loss).',
    processingQuality: {
      status: 'clean',
      flags: ['Clean text extraction', '2 page boundaries preserved'],
      emptyPages: [],
      ocrUsed: false,
      rawCharacterCount: 5120,
    },
    topics: [
      {
        id: 'topic-market-models',
        title: 'Perfect Competition vs Monopoly',
        summary: 'Contrasts price-taker firms in competitive markets with single price-maker monopolists.',
        pageReferences: [1],
        keyTerms: ['Price Taker', 'Price Maker', 'MR = MC', 'Barriers to Entry', 'Allocative Efficiency P = MC'],
        chunkIds: ['chunk-econ-1', 'chunk-econ-2']
      },
      {
        id: 'topic-elasticity-surplus',
        title: 'Price Elasticity of Demand & Deadweight Loss',
        summary: 'Formulas for PED, the total revenue test, and why monopoly pricing creates a deadweight welfare loss.',
        pageReferences: [2],
        keyTerms: ['Price Elasticity of Demand (PED)', 'Elastic vs Inelastic', 'Consumer Surplus', 'Deadweight Loss'],
        chunkIds: ['chunk-econ-3', 'chunk-econ-4']
      }
    ],
    pages: [
      {
        pageNumber: 1,
        wordCount: 410,
        confidence: 99,
        text: `ECONOMICS 101: MICROECONOMIC PRINCIPLES
Revision Unit: Market Structures and Pricing Decisions

1. Perfect Competition Characteristics:
- Large number of small buyers and sellers; no individual firm can influence market price.
- Firms are Price Takers: Demand curve faced by individual firm is perfectly horizontal (infinitely elastic, P = MR = AR).
- Homogeneous / identical products.
- Zero barriers to entry and exit in the long run.
- Long-run equilibrium: Firms earn zero economic profit (normal profit where P = min ATC).
- Efficiency:
  - Allocative Efficiency: P = MC (value to buyers equals marginal opportunity cost).
  - Productive Efficiency: P = minimum ATC.

2. Pure Monopoly Characteristics:
- Single seller commanding 100% of market share.
- High barriers to entry (patents, economies of scale, control of essential resources).
- Firm is a Price Maker: Faces the downward-sloping market demand curve.
- Because demand slopes downward, Marginal Revenue (MR) lies strictly below Price (MR < P).
- Profit Maximization Rule:
  Any firm maximizes profit by producing where Marginal Revenue equals Marginal Cost:
    MR = MC
- Setting the Monopoly Price:
  The monopolist finds quantity Q* where MR = MC, then looks straight up to the Demand Curve to determine price P*.
  Since P* > MC, monopolies are allocatively inefficient.`
      },
      {
        pageNumber: 2,
        wordCount: 370,
        confidence: 98,
        text: `3. Price Elasticity of Demand (PED)

Definition:
Measures the responsiveness of quantity demanded to a change in price.
Formula:
  PED = (% Change in Quantity Demanded) / (% Change in Price)
  Using midpoint formula: [(Q2 - Q1) / ((Q1 + Q2)/2)] / [(P2 - P1) / ((P1 + P2)/2)]

Interpretation (using absolute value |PED|):
- |PED| > 1: Elastic demand (consumers are sensitive to price changes; luxury goods or goods with close substitutes).
- |PED| = 1: Unit elastic.
- |PED| < 1: Inelastic demand (necessities, addictive goods, few substitutes).

Total Revenue (TR = P * Q) Relationship:
- Inelastic region (|PED| < 1): Price and Total Revenue move in the SAME direction. Raising price increases revenue.
- Elastic region (|PED| > 1): Price and Total Revenue move in OPPOSITE directions. Raising price decreases revenue.
- A profit-maximizing monopolist will ALWAYS operate on the elastic portion of its demand curve, where MR > 0.

4. Welfare and Deadweight Loss:
- Consumer Surplus (CS): Difference between what consumers are willing to pay and what they actually pay.
- Producer Surplus (PS): Difference between price received and marginal cost of production.
- Under monopoly: Output is restricted below the competitive equilibrium (Qm < Qc) and price is inflated (Pm > Pc).
- Deadweight Loss (DWL): The net loss of total economic surplus (triangle between demand and marginal cost curves from Qm to Qc) that benefits neither consumer nor producer.`
      }
    ],
    chunks: [
      {
        id: 'chunk-econ-1',
        pageNumber: 1,
        topicId: 'topic-market-models',
        text: 'In Perfect Competition, firms are price takers with horizontal demand (P = MR = AR), zero barriers to entry, and zero economic profit in the long run. They achieve allocative efficiency (P = MC) and productive efficiency (P = min ATC).',
        keywords: ['perfect competition', 'price taker', 'allocative efficiency', 'P=MC', 'zero barriers']
      },
      {
        id: 'chunk-econ-2',
        pageNumber: 1,
        topicId: 'topic-market-models',
        text: 'Monopoly firms face downward-sloping demand with MR < P. Profit maximization occurs where MR = MC. Monopolists set price P* from the demand curve above MC, resulting in allocative inefficiency because P > MC.',
        keywords: ['monopoly', 'price maker', 'MR=MC', 'P > MC', 'allocative inefficiency']
      },
      {
        id: 'chunk-econ-3',
        pageNumber: 2,
        topicId: 'topic-elasticity-surplus',
        text: 'Price Elasticity of Demand (PED) = (% change in Q) / (% change in P). When |PED| > 1 (elastic), raising price lowers Total Revenue. When |PED| < 1 (inelastic), raising price increases Total Revenue. Monopolists always produce where MR > 0 in the elastic range.',
        keywords: ['PED', 'price elasticity of demand', 'elastic', 'inelastic', 'total revenue test']
      },
      {
        id: 'chunk-econ-4',
        pageNumber: 2,
        topicId: 'topic-elasticity-surplus',
        text: 'Monopolies restrict output below competitive level (Qm < Qc) and elevate prices (Pm > Pc). This transfers consumer surplus to monopoly profit and generates Deadweight Loss (DWL)—surplus lost to society.',
        keywords: ['deadweight loss', 'consumer surplus', 'producer surplus', 'allocative loss', 'output restriction']
      }
    ]
  }
];
