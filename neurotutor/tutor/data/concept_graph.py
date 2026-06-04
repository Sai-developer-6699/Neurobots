"""
Concept relationship graph for NeuroTutor curriculum mapping.

Used by the ConceptMapper agent to:
- Suggest prerequisites before a topic
- Recommend what to learn next
- Find learning paths between concepts
"""

CONCEPT_GRAPH = {
    # ── Programming Fundamentals ─────────────────────────────────────────────
    "variables": {
        "prerequisites": [],
        "successors": ["operators", "data_types"],
        "related": ["memory", "assignment", "types"]
    },
    "data_types": {
        "prerequisites": ["variables"],
        "successors": ["operators", "type_conversion"],
        "related": ["int", "string", "boolean", "float"]
    },
    "operators": {
        "prerequisites": ["variables", "data_types"],
        "successors": ["conditionals", "expressions"],
        "related": ["precedence", "arithmetic", "comparison"]
    },
    "conditionals": {
        "prerequisites": ["operators"],
        "successors": ["loops", "control_flow"],
        "related": ["boolean", "logic", "if_else", "branching"]
    },
    "loops": {
        "prerequisites": ["conditionals"],
        "successors": ["arrays", "iteration", "nested_loops"],
        "related": ["while", "for", "break", "continue"]
    },
    "functions": {
        "prerequisites": ["variables", "conditionals"],
        "successors": ["recursion", "scope", "higher_order_functions"],
        "related": ["parameters", "return", "abstraction"]
    },
    "scope": {
        "prerequisites": ["functions"],
        "successors": ["closures", "namespaces"],
        "related": ["local", "global", "enclosing"]
    },
    "recursion": {
        "prerequisites": ["functions"],
        "successors": ["trees", "dynamic_programming", "divide_and_conquer"],
        "related": ["base_case", "call_stack", "memoization"]
    },

    # ── Data Structures ───────────────────────────────────────────────────────
    "arrays": {
        "prerequisites": ["loops", "variables"],
        "successors": ["lists", "searching", "sorting"],
        "related": ["indexing", "iteration", "contiguous_memory"]
    },
    "lists": {
        "prerequisites": ["arrays"],
        "successors": ["linked_lists", "stacks", "queues"],
        "related": ["dynamic", "collection", "append"]
    },
    "linked_lists": {
        "prerequisites": ["lists", "pointers"],
        "successors": ["stacks", "queues", "trees"],
        "related": ["nodes", "head", "traversal"]
    },
    "pointers": {
        "prerequisites": ["variables"],
        "successors": ["linked_lists", "dynamic_memory"],
        "related": ["memory_address", "reference", "null"]
    },
    "stacks": {
        "prerequisites": ["lists"],
        "successors": ["queues", "expression_evaluation"],
        "related": ["lifo", "push", "pop", "call_stack"]
    },
    "queues": {
        "prerequisites": ["lists"],
        "successors": ["priority_queues", "bfs"],
        "related": ["fifo", "enqueue", "dequeue"]
    },
    "hash_tables": {
        "prerequisites": ["arrays", "functions"],
        "successors": ["sets", "caching"],
        "related": ["hashing", "collision", "lookup", "dictionaries"]
    },
    "trees": {
        "prerequisites": ["recursion", "linked_lists"],
        "successors": ["binary_search_trees", "heaps", "tries"],
        "related": ["root", "nodes", "traversal", "depth"]
    },
    "binary_search_trees": {
        "prerequisites": ["trees", "searching"],
        "successors": ["avl_trees", "red_black_trees"],
        "related": ["bst_property", "inorder", "balance"]
    },
    "heaps": {
        "prerequisites": ["trees"],
        "successors": ["priority_queues", "heap_sort"],
        "related": ["min_heap", "max_heap", "heapify"]
    },
    "graphs": {
        "prerequisites": ["trees", "lists"],
        "successors": ["graph_algorithms", "networks"],
        "related": ["vertices", "edges", "directed", "weighted"]
    },

    # ── Algorithms ────────────────────────────────────────────────────────────
    "sorting": {
        "prerequisites": ["arrays", "loops"],
        "successors": ["searching", "complexity_analysis"],
        "related": ["bubble", "merge", "quick", "comparison"]
    },
    "searching": {
        "prerequisites": ["arrays", "sorting"],
        "successors": ["binary_search", "hash_tables"],
        "related": ["linear", "binary", "time_complexity"]
    },
    "binary_search": {
        "prerequisites": ["searching", "sorting"],
        "successors": ["binary_search_trees"],
        "related": ["divide_and_conquer", "logarithmic", "sorted_array"]
    },
    "complexity_analysis": {
        "prerequisites": ["algorithms"],
        "successors": ["optimization"],
        "related": ["big_o", "time", "space", "trade_offs"]
    },
    "dynamic_programming": {
        "prerequisites": ["recursion", "arrays"],
        "successors": ["optimization", "greedy_algorithms"],
        "related": ["memoization", "tabulation", "overlapping_subproblems"]
    },
    "divide_and_conquer": {
        "prerequisites": ["recursion", "sorting"],
        "successors": ["dynamic_programming"],
        "related": ["merge_sort", "quick_sort", "subproblems"]
    },
    "greedy_algorithms": {
        "prerequisites": ["arrays", "sorting"],
        "successors": ["dynamic_programming"],
        "related": ["local_optimum", "graph_algorithms", "interval_scheduling"]
    },

    # ── Graph Algorithms ──────────────────────────────────────────────────────
    "bfs": {
        "prerequisites": ["graphs", "queues"],
        "successors": ["shortest_path", "network_flow"],
        "related": ["level_order", "visited", "breadth"]
    },
    "dfs": {
        "prerequisites": ["graphs", "stacks", "recursion"],
        "successors": ["topological_sort", "cycle_detection"],
        "related": ["backtracking", "depth", "visited"]
    },
    "shortest_path": {
        "prerequisites": ["graphs", "bfs"],
        "successors": ["network_flow", "optimization"],
        "related": ["dijkstra", "bellman_ford", "weighted"]
    },

    # ── OOP ───────────────────────────────────────────────────────────────────
    "classes": {
        "prerequisites": ["functions", "variables"],
        "successors": ["inheritance", "polymorphism"],
        "related": ["objects", "attributes", "methods"]
    },
    "inheritance": {
        "prerequisites": ["classes"],
        "successors": ["polymorphism", "abstract_classes"],
        "related": ["parent", "child", "override", "extends"]
    },
    "polymorphism": {
        "prerequisites": ["inheritance"],
        "successors": ["design_patterns", "interfaces"],
        "related": ["duck_typing", "overriding", "overloading"]
    },

    # ── General ───────────────────────────────────────────────────────────────
    "algorithms": {
        "prerequisites": ["functions", "loops"],
        "successors": ["sorting", "searching", "complexity_analysis"],
        "related": ["problem_solving", "efficiency", "correctness"]
    },
}


def get_concept_info(concept: str) -> dict:
    """Get prerequisites, successors, and related concepts for a given concept."""
    normalized = concept.lower().replace(" ", "_").replace("-", "_")
    # Try exact match first, then partial
    if normalized in CONCEPT_GRAPH:
        return CONCEPT_GRAPH[normalized]
    # Fuzzy: return first key that contains the concept name
    for key in CONCEPT_GRAPH:
        if concept.lower() in key or key in concept.lower():
            return CONCEPT_GRAPH[key]
    return {"prerequisites": [], "successors": [], "related": []}


def get_learning_path(start: str, end: str) -> list:
    """BFS: find shortest concept learning path from start → end."""
    if start not in CONCEPT_GRAPH or end not in CONCEPT_GRAPH:
        return []
    from collections import deque
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        node, path = queue.popleft()
        if node == end:
            return path
        for successor in CONCEPT_GRAPH[node].get("successors", []):
            if successor not in visited and successor in CONCEPT_GRAPH:
                visited.add(successor)
                queue.append((successor, path + [successor]))
    return []


def get_all_concepts() -> list:
    """Return sorted list of all known concepts."""
    return sorted(CONCEPT_GRAPH.keys())
