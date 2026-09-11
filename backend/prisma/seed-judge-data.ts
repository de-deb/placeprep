/**
 * Judge data for INTERNAL problems. Every expected output below was verified
 * by executing Python reference solutions on the self-hosted Piston sandbox
 * (see prisma/verify-cases.ts — 36/36 pass). Starter code parses the
 * documented input format; the student implements the TODO.
 */

export const LANGUAGES = [
  { code: "python", name: "Python", pistonRuntime: "python" },
  { code: "cpp", name: "C++", pistonRuntime: "c++" },
  { code: "java", name: "Java", pistonRuntime: "java" },
];

export interface SeedCase {
  input: string;
  expected: string;
  sample: boolean;
}

export const TEST_CASES: Record<string, SeedCase[]> = {
  "Two Sum": [
    { input: "4\n2 7 11 15\n9", expected: "0 1", sample: true },
    { input: "3\n3 2 4\n6", expected: "1 2", sample: false },
    { input: "2\n3 3\n6", expected: "0 1", sample: false },
  ],
  "Valid Parentheses": [
    { input: "()[]{}", expected: "true", sample: true },
    { input: "(]", expected: "false", sample: false },
    { input: "([)]", expected: "false", sample: false },
  ],
  "Best Time to Buy and Sell Stock": [
    { input: "6\n7 1 5 3 6 4", expected: "5", sample: true },
    { input: "5\n7 6 4 3 1", expected: "0", sample: false },
    { input: "1\n5", expected: "0", sample: false },
  ],
  "Merge Intervals": [
    { input: "4\n1 3\n2 6\n8 10\n15 18", expected: "1 6\n8 10\n15 18", sample: true },
    { input: "2\n1 4\n4 5", expected: "1 5", sample: false },
    { input: "3\n1 2\n3 4\n5 6", expected: "1 2\n3 4\n5 6", sample: false },
  ],
  "LRU Cache": [
    { input: "2\n3\nput 1 1\nput 2 2\nget 1", expected: "1", sample: true },
    { input: "2\n5\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2", expected: "1\n-1", sample: false },
    { input: "1\n4\nput 2 1\nget 2\nput 3 2\nget 2", expected: "1\n-1", sample: false },
  ],
  "Number of Islands": [
    { input: "4 5\n11110\n11010\n11000\n00000", expected: "1", sample: true },
    { input: "3 3\n110\n110\n001", expected: "2", sample: false },
    { input: "1 1\n0", expected: "0", sample: false },
  ],
  "Reverse a Linked List": [
    { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1", sample: true },
    { input: "1\n7", expected: "7", sample: false },
    { input: "0", expected: "", sample: false },
  ],
  "Binary Tree Inorder Traversal": [
    { input: "1 null 2 3", expected: "1 3 2", sample: true },
    { input: "3 9 20 null null 15 7", expected: "9 3 15 20 7", sample: false },
    { input: "1", expected: "1", sample: false },
  ],
  "Longest Substring Without Repeating Characters": [
    { input: "abcabcbb", expected: "3", sample: true },
    { input: "bbbbb", expected: "1", sample: false },
    { input: "pwwkew", expected: "3", sample: false },
  ],
  "0/1 Knapsack": [
    { input: "3 4\n4 5 1\n1 2 3", expected: "3", sample: true },
    { input: "4 7\n1 3 4 5\n1 4 5 7", expected: "9", sample: false },
    { input: "1 10\n5\n10", expected: "10", sample: false },
  ],
  "Median of Two Sorted Arrays": [
    { input: "1 3\n2", expected: "2", sample: true },
    { input: "1 2\n3 4", expected: "2.5", sample: false },
    { input: "0\n0", expected: "0", sample: false },
  ],
  "Detect Cycle in Directed Graph": [
    { input: "2 2\n0 1\n1 0", expected: "true", sample: true },
    { input: "3 2\n0 1\n1 2", expected: "false", sample: false },
    { input: "3 3\n0 1\n1 2\n2 0", expected: "true", sample: false },
  ],
};

export const COMPLEXITY: Record<string, { time: string; space: string }> = {
  "Two Sum": { time: "O(n)", space: "O(n)" },
  "Valid Parentheses": { time: "O(n)", space: "O(n)" },
  "Best Time to Buy and Sell Stock": { time: "O(n)", space: "O(1)" },
  "Merge Intervals": { time: "O(n log n)", space: "O(n)" },
  "LRU Cache": { time: "O(1) per op", space: "O(capacity)" },
  "Number of Islands": { time: "O(m·n)", space: "O(m·n)" },
  "Reverse a Linked List": { time: "O(n)", space: "O(1)" },
  "Binary Tree Inorder Traversal": { time: "O(n)", space: "O(n)" },
  "Longest Substring Without Repeating Characters": { time: "O(n)", space: "O(min(n, alphabet))" },
  "0/1 Knapsack": { time: "O(n·W)", space: "O(W)" },
  "Median of Two Sorted Arrays": { time: "O(log(m+n))", space: "O(1)" },
  "Detect Cycle in Directed Graph": { time: "O(V+E)", space: "O(V)" },
};

const PY = (body: string) => `import sys\n\ndef solve():\n${body}\n\ndef main():\n    solve()\n\nmain()\n`;
const CPP = (body: string) =>
  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n${body}    return 0;\n}\n`;
const JAVA = (cls: string, body: string) =>
  `import java.util.*;\n\npublic class ${cls} {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n${body}        sc.close();\n    }\n}\n`;

export const STARTERS: Record<string, { python: string; cpp: string; java: string }> = {
  "Two Sum": {
    python: PY("    data = list(map(int, sys.stdin.read().split()))\n    # TODO: find two indices i, j with a[i] + a[j] == target\n    # print(f\"{i} {j}\")"),
    cpp: CPP("    // TODO: read n, array, target; print the two indices\n"),
    java: JAVA("Main", "        // TODO: read n, array, target; print the two indices\n"),
  },
  "Valid Parentheses": {
    python: PY('    s = sys.stdin.read().strip()\n    # TODO: print "true" if valid else "false"'),
    cpp: CPP('    // TODO: read string s; print "true" or "false"\n'),
    java: JAVA("Main", '        // TODO: read string s; print "true" or "false"\n'),
  },
  "Best Time to Buy and Sell Stock": {
    python: PY("    data = list(map(int, sys.stdin.read().split()))\n    # TODO: print max profit from one transaction"),
    cpp: CPP("    // TODO: read prices; print max profit\n"),
    java: JAVA("Main", "        // TODO: read prices; print max profit\n"),
  },
  "Merge Intervals": {
    python: PY("    data = list(map(int, sys.stdin.read().split()))\n    # TODO: merge overlapping intervals, print each as \"l r\""),
    cpp: CPP("    // TODO: sort by start, sweep and merge\n"),
    java: JAVA("Main", "        // TODO: sort by start, sweep and merge\n"),
  },
  "LRU Cache": {
    python: PY("    lines = sys.stdin.read().strip().split(\"\\n\")\n    # TODO: simulate the cache; print each get result"),
    cpp: CPP("    // TODO: hash map + doubly linked list for O(1) ops\n"),
    java: JAVA("Main", "        // TODO: LinkedHashMap with access order works well\n"),
  },
  "Number of Islands": {
    python: PY("    parts = sys.stdin.read().split()\n    # TODO: flood-fill each island and print the count"),
    cpp: CPP("    // TODO: DFS/BFS flood fill over the grid\n"),
    java: JAVA("Main", "        // TODO: DFS/BFS flood fill over the grid\n"),
  },
  "Reverse a Linked List": {
    python: PY("    data = sys.stdin.read().split()\n    # TODO: print the values in reverse order"),
    cpp: CPP("    // TODO: iterative reversal with three pointers\n"),
    java: JAVA("Main", "        // TODO: iterative reversal with three pointers\n"),
  },
  "Binary Tree Inorder Traversal": {
    python: PY("    arr = sys.stdin.read().split()\n    # TODO: build the tree (level order, null = missing) and print inorder"),
    cpp: CPP("    // TODO: build tree from level order, then inorder DFS\n"),
    java: JAVA("Main", "        // TODO: build tree from level order, then inorder DFS\n"),
  },
  "Longest Substring Without Repeating Characters": {
    python: PY("    s = sys.stdin.read().strip()\n    # TODO: print the max length"),
    cpp: CPP("    // TODO: sliding window with last-seen positions\n"),
    java: JAVA("Main", "        // TODO: sliding window with last-seen positions\n"),
  },
  "0/1 Knapsack": {
    python: PY("    data = list(map(int, sys.stdin.read().split()))\n    # TODO: 1D DP over capacity, print dp[W]"),
    cpp: CPP("    // TODO: dp[c] = max value for capacity c\n"),
    java: JAVA("Main", "        // TODO: dp[c] = max value for capacity c\n"),
  },
  "Median of Two Sorted Arrays": {
    python: PY("    lines = sys.stdin.read().split(\"\\n\")\n    # TODO: print the median (omit trailing .0 for whole numbers)"),
    cpp: CPP("    // TODO: binary-search the partition in O(log(m+n))\n"),
    java: JAVA("Main", "        // TODO: binary-search the partition in O(log(m+n))\n"),
  },
  "Detect Cycle in Directed Graph": {
    python: PY("    data = list(map(int, sys.stdin.read().split()))\n    # TODO: print \"true\" if a cycle exists else \"false\""),
    cpp: CPP('    // TODO: DFS colors; print "true"/"false"\n'),
    java: JAVA("Main", '        // TODO: DFS colors; print "true"/"false"\n'),
  },
};
